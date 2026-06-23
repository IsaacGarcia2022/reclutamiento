import { getSupabaseClient } from './supabase'

async function invoke (action, payload = {}) {
  const client = getSupabaseClient()
  const { data, error } = await client.functions.invoke('users-admin', { body: { action, payload } })
  if (error) throw new Error(error.message || 'No fue posible completar la operación de usuarios.')
  if (data?.error) throw new Error(data.error)
  return data?.data
}

export default {
  list: () => invoke('list'),
  get: (id) => invoke('get', { id }),
  create: (payload) => invoke('create', payload),
  update: (payload) => invoke('update', payload),
  setStatus: (id, estado) => invoke('set-status', { id, estado }),
  resetPassword: (id) => invoke('reset-password', { id }),
  activity: (id) => invoke('activity', { id }),

  async roles () {
    const client = getSupabaseClient()
    const { data, error } = await client.from('roles').select('id, code, name').order('name')
    if (error) throw new Error('No fue posible cargar los roles.')
    return data
  }
}
