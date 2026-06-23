import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') || 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
})

function requiredText (value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} es obligatorio.`)
  return value.trim()
}

serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization?.startsWith('Bearer ')) return json({ error: 'Sesión requerida.' }, 401)

    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const token = authorization.slice(7)
    const { data: { user: actor }, error: authError } = await client.auth.getUser(token)
    if (authError || !actor) return json({ error: 'Sesión no válida.' }, 401)

    const { data: actorProfile, error: actorError } = await client
      .from('profiles')
      .select('id, estado, roles!inner(code)')
      .eq('id', actor.id)
      .single()
    if (actorError || actorProfile?.estado !== 'activo' || (actorProfile.roles as unknown as { code: string })?.code !== 'administrador') {
      return json({ error: 'No tienes permiso para administrar usuarios.' }, 403)
    }

    const body = await request.json()
    const action = body.action
    const payload = body.payload || {}
    const writeAudit = async (eventType: string, entityId: string, metadata = {}) => {
      await client.from('audit_log').insert({
        actor_id: actor.id,
        event_type: eventType,
        entity_type: 'usuario',
        entity_id: entityId,
        metadata
      })
    }

    if (action === 'list') {
      const { data, error } = await client
        .from('profiles')
        .select('id, nombres, apellidos, email, telefono, cargo, estado, ultimo_acceso, created_at, updated_at, role_id, roles(id, code, name), creador:creado_por(nombres, apellidos)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return json({ data })
    }

    if (action === 'get') {
      const id = requiredText(payload.id, 'El usuario')
      const { data, error } = await client
        .from('profiles')
        .select('id, nombres, apellidos, email, telefono, cargo, estado, ultimo_acceso, created_at, updated_at, role_id, roles(id, code, name)')
        .eq('id', id)
        .single()
      if (error) throw error
      return json({ data })
    }

    if (action === 'create') {
      const nombres = requiredText(payload.nombres, 'Nombres')
      const apellidos = requiredText(payload.apellidos, 'Apellidos')
      const email = requiredText(payload.email, 'Correo').toLowerCase()
      const password = requiredText(payload.password, 'Contraseña')
      const roleId = requiredText(payload.roleId, 'Rol')
      if (password.length < 10) throw new Error('La contraseña temporal debe tener al menos 10 caracteres.')

      const { data: role } = await client.from('roles').select('id').eq('id', roleId).single()
      if (!role) throw new Error('El rol seleccionado no existe.')

      const { data: created, error: createError } = await client.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nombres, apellidos, full_name: `${nombres} ${apellidos}` }
      })
      if (createError || !created.user) throw createError || new Error('No fue posible crear el usuario.')

      const profile = {
        nombres,
        apellidos,
        full_name: `${nombres} ${apellidos}`,
        email,
        telefono: typeof payload.telefono === 'string' ? payload.telefono.trim() : null,
        cargo: typeof payload.cargo === 'string' ? payload.cargo.trim() : null,
        role_id: roleId,
        estado: 'activo',
        creado_por: actor.id,
        updated_at: new Date().toISOString()
      }
      const { error: profileError } = await client.from('profiles').update(profile).eq('id', created.user.id)
      if (profileError) throw profileError
      await writeAudit('usuario_creado', created.user.id, { email, role_id: roleId })
      return json({ data: { id: created.user.id } }, 201)
    }

    if (action === 'update') {
      const id = requiredText(payload.id, 'El usuario')
      const nombres = requiredText(payload.nombres, 'Nombres')
      const apellidos = requiredText(payload.apellidos, 'Apellidos')
      const email = requiredText(payload.email, 'Correo').toLowerCase()
      const roleId = requiredText(payload.roleId, 'Rol')
      if (id === actor.id && payload.estado && payload.estado !== 'activo') throw new Error('No puedes desactivar tu propio usuario.')

      const { error: authUpdateError } = await client.auth.admin.updateUserById(id, { email })
      if (authUpdateError) throw authUpdateError
      const { error } = await client.from('profiles').update({
        nombres,
        apellidos,
        full_name: `${nombres} ${apellidos}`,
        email,
        telefono: typeof payload.telefono === 'string' ? payload.telefono.trim() : null,
        cargo: typeof payload.cargo === 'string' ? payload.cargo.trim() : null,
        role_id: roleId,
        updated_at: new Date().toISOString()
      }).eq('id', id)
      if (error) throw error
      await writeAudit('usuario_actualizado', id, { role_id: roleId })
      return json({ data: { id } })
    }

    if (action === 'set-status') {
      const id = requiredText(payload.id, 'El usuario')
      const estado = requiredText(payload.estado, 'Estado')
      if (!['activo', 'inactivo', 'bloqueado'].includes(estado)) throw new Error('Estado no válido.')
      if (id === actor.id && estado !== 'activo') throw new Error('No puedes desactivar o bloquear tu propio usuario.')

      const { error: authUpdateError } = await client.auth.admin.updateUserById(id, {
        ban_duration: estado === 'activo' ? 'none' : '876000h'
      })
      if (authUpdateError) throw authUpdateError
      const { error } = await client.from('profiles').update({ estado, is_active: estado === 'activo', updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      await writeAudit(`usuario_${estado}`, id)
      return json({ data: { id, estado } })
    }

    if (action === 'reset-password') {
      const id = requiredText(payload.id, 'El usuario')
      const { data: profile, error: profileError } = await client.from('profiles').select('email').eq('id', id).single()
      if (profileError || !profile) throw new Error('Usuario no encontrado.')
      const { error } = await client.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${Deno.env.get('APP_URL') || 'http://localhost:5173'}/restablecer-contrasena`
      })
      if (error) throw error
      await writeAudit('restablecimiento_contrasena_solicitado', id)
      return json({ data: { id } })
    }

    if (action === 'activity') {
      const id = requiredText(payload.id, 'El usuario')
      const { data, error } = await client
        .from('audit_log')
        .select('id, event_type, metadata, created_at, actor:actor_id(nombres, apellidos)')
        .eq('entity_type', 'usuario')
        .eq('entity_id', id)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return json({ data })
    }

    return json({ error: 'Operación no reconocida.' }, 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor.'
    return json({ error: message }, 400)
  }
})
