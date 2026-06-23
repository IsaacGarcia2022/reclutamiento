import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') || 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, 'Content-Type': 'application/json' }
})

const select = '*, departamento:departamento_empresa_id(nombre), area:area_profesional_id(nombre), ubicacion:ubicacion_id(nombre), modalidad:modalidad_id(nombre), contrato:tipo_contrato_id(nombre), jornada:jornada_id(nombre), nivel:nivel_academico_id(nombre)'

const text = (v: unknown) => typeof v === 'string' ? (v.trim() || null) : null
const number = (v: unknown) => v === '' || v === null || v === undefined ? null : Number(v)

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  
  try {
    const h = req.headers.get('Authorization')
    if (!h?.startsWith('Bearer ')) return reply({ error: 'Sesión requerida.' }, 401)
    
    const db = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )
    
    const { data: { user }, error: ae } = await db.auth.getUser(h.slice(7))
    if (ae || !user) return reply({ error: 'Sesión no válida.' }, 401)
    
    const { data: p } = await db.from('profiles').select('estado,roles!inner(code)').eq('id', user.id).single()
    if (!p || p.estado !== 'activo' || !['administrador', 'recursos_humanos'].includes((p.roles as unknown as { code: string })?.code)) {
      return reply({ error: 'No tienes permiso para gestionar vacantes.' }, 403)
    }
    
    const { action, payload = {} } = await req.json()
    const audit = async (event: string, id: string) => { await db.from('audit_log').insert({ actor_id: user.id, event_type: event, entity_type: 'vacante', entity_id: id }) }
    
    if (action === 'list') {
      const { data, error } = await db.from('vacancies').select(select).order('created_at', { ascending: false })
      if (error) throw error
      return reply({ data })
    }
    
    if (action === 'get') {
      const { data, error } = await db.from('vacancies').select(select).eq('id', payload.id).single()
      if (error) throw error
      return reply({ data })
    }
    
    const normalize = () => {
      const min = number(payload.salarioMinimo)
      const max = number(payload.salarioMaximo)
      if (min !== null && max !== null && min > max) throw new Error('El salario mínimo no puede ser mayor que el máximo.')
      if (payload.fechaCierre && payload.fechaPublicacion && payload.fechaCierre < payload.fechaPublicacion) throw new Error('La fecha de cierre no puede ser anterior a la publicación.')
      
      return {
        codigo: text(payload.codigo),
        titulo: text(payload.titulo),
        departamento_empresa_id: payload.departamentoEmpresaId || null,
        area_profesional_id: payload.areaProfesionalId || null,
        ubicacion_id: payload.ubicacionId || null,
        modalidad_id: payload.modalidadId || null,
        tipo_contrato_id: payload.tipoContratoId || null,
        jornada_id: payload.jornadaId || null,
        numero_plazas: Number(payload.numeroPlazas || 1),
        descripcion: text(payload.descripcion),
        funciones: text(payload.funciones),
        requisitos: text(payload.requisitos),
        nivel_academico_id: payload.nivelAcademicoId || null,
        experiencia_minima: text(payload.experienciaMinima),
        habilidades_deseadas: text(payload.habilidadesDeseadas),
        salario_minimo: min,
        salario_maximo: max,
        mostrar_salario: Boolean(payload.mostrarSalario),
        fecha_publicacion: payload.fechaPublicacion || null,
        fecha_cierre: payload.fechaCierre || null,
        responsable_id: payload.responsableId || user.id,
        imagen_url: text(payload.imagenUrl),
        updated_at: new Date().toISOString()
      }
    }
    
    if (action === 'create') {
      const row = normalize()
      if (!row.titulo || !row.descripcion || !row.requisitos) throw new Error('Título, descripción y requisitos son obligatorios.')
      const estado = payload.estado === 'publicada' ? 'publicada' : 'borrador'
      if (estado === 'publicada' && !row.fecha_publicacion) row.fecha_publicacion = new Date().toISOString().slice(0, 10)
      
      const { data, error } = await db.from('vacancies').insert({ ...row, estado, creado_por: user.id }).select().single()
      if (error) throw error
      await audit(estado === 'publicada' ? 'vacante_publicada' : 'vacante_borrador_creado', data.id)
      return reply({ data }, 201)
    }
    
    if (action === 'update') {
      const row = normalize()
      const { data, error } = await db.from('vacancies').update(row).eq('id', payload.id).select().single()
      if (error) throw error
      await audit('vacante_actualizada', data.id)
      return reply({ data })
    }
    
    if (action === 'transition') {
      const allowed: Record<string, string[]> = {
        borrador: ['publicada', 'archivada'],
        publicada: ['pausada', 'cerrada', 'archivada'],
        pausada: ['publicada', 'cerrada', 'archivada'],
        cerrada: ['archivada'],
        archivada: []
      }
      
      const { data: old, error: oe } = await db.from('vacancies').select('estado').eq('id', payload.id).single()
      if (oe || !old) throw new Error('Vacante no encontrada.')
      if (!allowed[old.estado].includes(payload.estado)) throw new Error('Cambio de estado no permitido.')
      
      const update: { estado: string; updated_at: string; fecha_publicacion?: string } = {
        estado: payload.estado,
        updated_at: new Date().toISOString()
      }
      if (payload.estado === 'publicada') update.fecha_publicacion = new Date().toISOString().slice(0, 10)
      
      const { data, error } = await db.from('vacancies').update(update).eq('id', payload.id).select().single()
      if (error) throw error
      await audit(`vacante_${payload.estado}`, data.id)
      return reply({ data })
    }
    
    if (action === 'duplicate') {
      const { data: source, error } = await db.from('vacancies').select('*').eq('id', payload.id).single()
      if (error || !source) throw new Error('Vacante no encontrada.')
      
      delete source.id
      delete source.codigo
      delete source.created_at
      delete source.updated_at
      
      const { data, error: ie } = await db.from('vacancies').insert({
        ...source,
        titulo: `${source.titulo} (copia)`,
        estado: 'borrador',
        fecha_publicacion: null,
        cantidad_postulaciones: 0,
        creado_por: user.id
      }).select().single()
      if (ie) throw ie
      await audit('vacante_duplicada', data.id)
      return reply({ data }, 201)
    }
    
    if (action === 'delete') {
      const { error } = await db.from('vacancies').delete().eq('id', payload.id)
      if (error) throw error
      await audit('vacante_eliminada', payload.id)
      return reply({ success: true })
    }
    
    return reply({ error: 'Operación no reconocida.' }, 400)
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : 'Error interno.' }, 400)
  }
})
