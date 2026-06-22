import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'
const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': [appUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'].includes(origin || '') ? origin! : appUrl,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
})
const reply = (body: unknown, status = 200, origin: string | null = null) => new Response(JSON.stringify(body), { status, headers: { ...cors(origin), 'Content-Type': 'application/json' } })
const categories = new Set(['departamento', 'area_profesional', 'puesto', 'ubicacion', 'pais', 'departamento_geografico', 'municipio', 'modalidad', 'tipo_contrato', 'jornada', 'nivel_academico', 'profesion_oficio', 'fuente_reclutamiento', 'tipo_documento', 'etiqueta_candidato'])
const parentCategory: Record<string, string | null> = { departamento_geografico: 'pais', municipio: 'departamento_geografico' }
const cleanText = (value: unknown) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''

serve(async (request: Request) => {
  const origin = request.headers.get('Origin')
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) })
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return reply({ error: 'Sesión requerida.' }, 401, origin)
    const db = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '', { auth: { persistSession: false } })
    const { data: { user }, error: authError } = await db.auth.getUser(token)
    if (authError || !user) return reply({ error: 'Sesión inválida.' }, 401, origin)
    const { data: profile } = await db.from('profiles').select('estado, roles!inner(code)').eq('id', user.id).single()
    if (!profile || profile.estado !== 'activo' || profile.roles?.code !== 'administrador') return reply({ error: 'Solo un administrador puede gestionar catálogos.' }, 403, origin)

    const { action, payload = {} } = await request.json()
    const audit = (event: string, id: string, metadata = {}) => db.from('audit_log').insert({ actor_id: user.id, event_type: event, entity_type: 'catalogo', entity_id: id, metadata })
    if (action === 'list') {
      const { data, error } = await db.from('catalog_items').select('id,categoria,nombre,descripcion,activo,parent_id,created_at,updated_at,parent:parent_id(nombre,categoria)').order('categoria').order('nombre')
      if (error) throw error
      return reply({ data }, 200, origin)
    }

    const categoria = cleanText(payload.categoria)
    const nombre = cleanText(payload.nombre)
    const descripcion = cleanText(payload.descripcion) || null
    const parentId = payload.parentId || null
    if (!categories.has(categoria)) return reply({ error: 'Categoría de catálogo no válida.' }, 400, origin)
    if (nombre.length < 2 || nombre.length > 120) return reply({ error: 'El nombre debe tener entre 2 y 120 caracteres.' }, 400, origin)
    const requiredParentCategory = parentCategory[categoria] || null
    if (requiredParentCategory && !parentId) return reply({ error: `Debes seleccionar un ${requiredParentCategory === 'pais' ? 'país' : 'departamento geográfico'}.` }, 400, origin)
    if (!requiredParentCategory && parentId) return reply({ error: 'Esta categoría no admite un catálogo padre.' }, 400, origin)
    if (parentId) {
      const { data: parent, error } = await db.from('catalog_items').select('id,categoria').eq('id', parentId).single()
      if (error || !parent || parent.categoria !== requiredParentCategory) return reply({ error: 'El catálogo padre seleccionado no es válido.' }, 400, origin)
    }
    const duplicate = await db.from('catalog_items').select('id').eq('categoria', categoria).ilike('nombre', nombre).neq('id', payload.id || '00000000-0000-0000-0000-000000000000').maybeSingle()
    if (duplicate.data) return reply({ error: 'Ya existe un catálogo con ese nombre en esta categoría.' }, 409, origin)

    if (action === 'create') {
      const { data, error } = await db.from('catalog_items').insert({ categoria, nombre, descripcion, parent_id: parentId, activo: true }).select('id,categoria,nombre,descripcion,activo,parent_id,created_at,updated_at,parent:parent_id(nombre,categoria)').single()
      if (error) throw error
      await audit('catalogo_creado', data.id, { categoria, nombre })
      return reply({ data }, 201, origin)
    }
    if (action === 'update') {
      if (!payload.id) return reply({ error: 'Identificador de catálogo requerido.' }, 400, origin)
      const { data, error } = await db.from('catalog_items').update({ nombre, descripcion, parent_id: parentId }).eq('id', payload.id).select('id,categoria,nombre,descripcion,activo,parent_id,created_at,updated_at,parent:parent_id(nombre,categoria)').single()
      if (error) throw error
      await audit('catalogo_actualizado', data.id, { categoria, nombre })
      return reply({ data }, 200, origin)
    }
    if (action === 'toggle') {
      if (!payload.id || typeof payload.activo !== 'boolean') return reply({ error: 'Estado de catálogo inválido.' }, 400, origin)
      const { data, error } = await db.from('catalog_items').update({ activo: payload.activo }).eq('id', payload.id).select('id,categoria,nombre,descripcion,activo,parent_id,created_at,updated_at,parent:parent_id(nombre,categoria)').single()
      if (error) throw error
      await audit(payload.activo ? 'catalogo_activado' : 'catalogo_desactivado', data.id, { categoria: data.categoria, nombre: data.nombre })
      return reply({ data }, 200, origin)
    }
    return reply({ error: 'Operación no reconocida.' }, 400, origin)
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : 'Error interno.' }, 400, origin)
  }
})
