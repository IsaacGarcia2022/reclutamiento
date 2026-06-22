import { getSupabaseClient, isSupabaseConfigured } from './supabase'

function formatProfile (profile, user) {
  return {
    id: user.id,
    email: user.email,
    name: `${profile.nombres} ${profile.apellidos}`.trim(),
    role: profile.roles?.code,
    active: profile.estado === 'activo',
    status: profile.estado
  }
}

function loginErrorMessage (error) {
  const message = error?.message?.toLowerCase() || ''

  if (message.includes('email not confirmed')) return 'Debes confirmar tu correo antes de iniciar sesión.'
  if (message.includes('invalid api key') || message.includes('api key')) return 'La clave pública de Supabase no es válida para este proyecto.'
  if (message.includes('email logins are disabled') || message.includes('provider is not enabled')) return 'El inicio de sesión con correo y contraseña no está habilitado en Supabase.'
  if (message.includes('rate limit') || message.includes('too many requests')) return 'Hay demasiados intentos de inicio de sesión. Espera unos minutos.'
  if (message.includes('network') || message.includes('fetch')) return 'No fue posible conectar con el servicio de autenticación.'

  return 'Correo o contraseña incorrectos.'
}

async function getProfile (user) {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('profiles')
    .select('id, nombres, apellidos, estado, roles ( code, name )')
    .eq('id', user.id)
    .single()

  if (error) throw new Error('No fue posible obtener el perfil de acceso.')
  if (data.estado !== 'activo') {
    await client.auth.signOut()
    throw new Error(data.estado === 'bloqueado'
      ? 'Tu usuario está bloqueado temporalmente. Contacta al administrador.'
      : 'Tu usuario está desactivado. Contacta al administrador.')
  }

  return formatProfile(data, user)
}

export default {
  isConfigured: isSupabaseConfigured,

  async login (email, password) {
    const client = getSupabaseClient()
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (error || !data.user) throw new Error(loginErrorMessage(error))

    const profile = await getProfile(data.user)
    await client.rpc('register_auth_event', { p_event_type: 'inicio_sesion' })
    return profile
  },

  async getCurrentUser () {
    const client = getSupabaseClient()
    const { data: { user }, error } = await client.auth.getUser()
    if (error || !user) return null
    return getProfile(user)
  },

  async logout () {
    const client = getSupabaseClient()
    await client.rpc('register_auth_event', { p_event_type: 'cierre_sesion' })
    const { error } = await client.auth.signOut()
    if (error) throw new Error('No fue posible cerrar la sesión.')
  },

  async requestPasswordReset (email) {
    const client = getSupabaseClient()
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/restablecer-contrasena` })
    if (error) throw new Error('No fue posible enviar el correo de recuperación.')
  },

  async updatePassword (password) {
    const client = getSupabaseClient()
    const { error } = await client.auth.updateUser({ password })
    if (error) throw new Error('No fue posible actualizar la contraseña.')
  },

  async register () {
    throw new Error('El registro público de usuarios internos no está habilitado. Solicita tu acceso al administrador.')
  }
}
