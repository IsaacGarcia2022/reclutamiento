import { getSupabaseClient } from './supabase'

async function call (action, payload = {}) {
  const { data, error } = await getSupabaseClient().functions.invoke('catalogs-admin', { body: { action, payload } })
  if (error) {
    let detail = null
    try { detail = await error.context?.json() } catch {}
    throw new Error(detail?.error || error.message)
  }
  if (data?.error) throw new Error(data.error)
  return data.data
}

export default {
  list: () => call('list'),
  create: payload => call('create', payload),
  update: payload => call('update', payload),
  toggle: (id, activo) => call('toggle', { id, activo })
}
