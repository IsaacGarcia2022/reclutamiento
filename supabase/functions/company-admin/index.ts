import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') || 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const optionalText = (value: unknown) => typeof value === 'string' ? value.trim() || null : null
const color = (value: unknown, field: string) => {
  const result = optionalText(value)
  if (result && !/^#[0-9A-Fa-f]{6}$/.test(result)) throw new Error(`${field} debe usar formato hexadecimal, por ejemplo #18566B.`)
  return result
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization?.startsWith('Bearer ')) return json({ error: 'Sesión requerida.' }, 401)

    const client = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: { user }, error: authError } = await client.auth.getUser(authorization.slice(7))
    if (authError || !user) return json({ error: 'Sesión no válida.' }, 401)

    const { data: profile, error: profileError } = await client.from('profiles').select('estado, roles!inner(code)').eq('id', user.id).single()
    if (profileError || profile?.estado !== 'activo' || profile.roles?.code !== 'administrador') return json({ error: 'No tienes permiso para modificar la empresa.' }, 403)

    const { action, payload = {} } = await request.json()
    if (action !== 'update') return json({ error: 'Operación no reconocida.' }, 400)

    const update = {
      nombre_legal: optionalText(payload.nombreLegal),
      nombre_comercial: optionalText(payload.nombreComercial),
      descripcion: optionalText(payload.descripcion),
      logo_url: optionalText(payload.logoUrl),
      sector: optionalText(payload.sector),
      direccion: optionalText(payload.direccion),
      telefono: optionalText(payload.telefono),
      correo_recursos_humanos: optionalText(payload.correoRecursosHumanos),
      sitio_web: optionalText(payload.sitioWeb),
      facebook: optionalText(payload.facebook),
      instagram: optionalText(payload.instagram),
      linkedin: optionalText(payload.linkedin),
      mision: optionalText(payload.mision),
      vision: optionalText(payload.vision),
      valores: optionalText(payload.valores),
      beneficios_laborales: optionalText(payload.beneficiosLaborales),
      color_principal: color(payload.colorPrincipal, 'El color principal') || '#18566B',
      color_secundario: color(payload.colorSecundario, 'El color secundario') || '#638579',
      politica_privacidad: optionalText(payload.politicaPrivacidad),
      version_politica_privacidad: optionalText(payload.versionPoliticaPrivacidad),
      terminos_postulacion: optionalText(payload.terminosPostulacion),
      version_terminos: optionalText(payload.versionTerminos),
      actualizado_por: user.id,
      updated_at: new Date().toISOString()
    }
    const { data, error } = await client.from('company_settings').upsert({ id: true, ...update }).select().single()
    if (error) throw error

    await client.from('audit_log').insert({ actor_id: user.id, event_type: 'empresa_configuracion_actualizada', entity_type: 'empresa', metadata: { color_principal: update.color_principal, color_secundario: update.color_secundario } })
    return json({ data })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Error interno del servidor.' }, 400)
  }
})
