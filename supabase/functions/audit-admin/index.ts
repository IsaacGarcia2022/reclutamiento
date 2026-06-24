import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
}
const reply = (body: unknown, status = 200, _origin: string | null = null) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const allowedClientActions = new Set(['consulta_postulacion', 'exportacion_reporte'])

serve(async (request: Request) => {
  const origin = request.headers.get('Origin')
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return reply({ error: 'Sesión requerida.' }, 401, origin)
    const db = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '', { auth: { persistSession: false } })
    const { data: { user }, error: authError } = await db.auth.getUser(token)
    if (authError || !user) return reply({ error: 'Sesión inválida.' }, 401, origin)
    const { data: profile } = await db.from('profiles').select('estado,roles!inner(code)').eq('id', user.id).single()
    if (!profile || profile.estado !== 'activo') return reply({ error: 'Usuario sin acceso activo.' }, 403, origin)
    const { action, payload = {} } = await request.json()

    if (action === 'record') {
      if (!allowedClientActions.has(payload.accion)) return reply({ error: 'Acción de auditoría no permitida.' }, 400, origin)
      if (!['administrador', 'recursos_humanos', 'consulta'].includes((profile.roles as unknown as { code: string })?.code)) return reply({ error: 'Sin permiso para registrar este evento.' }, 403, origin)
      const { error } = await db.from('audit_log').insert({ actor_id: user.id, event_type: payload.accion, entity_type: payload.entidad || null, entity_id: payload.entidadId || null, metadata: payload.valorNuevo || {}, accion: payload.accion, modulo: payload.modulo || 'sistema', entidad: payload.entidad || null, descripcion: payload.descripcion || null, valor_anterior: payload.valorAnterior || null, valor_nuevo: payload.valorNuevo || null })
      if (error) throw error
      return reply({ data: true }, 201, origin)
    }

    if (action === 'list') {
      if ((profile.roles as unknown as { code: string })?.code !== 'administrador') return reply({ error: 'Solo un administrador puede consultar la auditoría.' }, 403, origin)
      const page = Math.max(Number(payload.page) || 1, 1)
      const pageSize = Math.min(Math.max(Number(payload.pageSize) || 25, 1), 100)
      let query = db.from('audit_log').select('id,actor_id,accion,modulo,entidad,entity_id,descripcion,valor_anterior,valor_nuevo,direccion_ip,user_agent,fecha_hora,metadata,actor:actor_id(nombres,apellidos,email)', { count: 'exact' }).order('fecha_hora', { ascending: false })
      if (payload.usuarioId) query = query.eq('actor_id', payload.usuarioId)
      if (payload.modulo) query = query.eq('modulo', payload.modulo)
      if (payload.accion) query = query.eq('accion', payload.accion)
      if (payload.fechaDesde) query = query.gte('fecha_hora', `${payload.fechaDesde}T00:00:00`)
      if (payload.fechaHasta) query = query.lte('fecha_hora', `${payload.fechaHasta}T23:59:59.999`)
      const { data, count, error } = await query.range((page - 1) * pageSize, page * pageSize - 1)
      if (error) throw error
      const { data: users, error: usersError } = await db.from('profiles').select('id,nombres,apellidos,email').order('nombres')
      if (usersError) throw usersError
      return reply({ data: { rows: data || [], total: count || 0, users: users || [] } }, 200, origin)
    }
    return reply({ error: 'Operación no reconocida.' }, 400, origin)
  } catch (error) { return reply({ error: error instanceof Error ? error.message : 'Error interno.' }, 400, origin) }
})
