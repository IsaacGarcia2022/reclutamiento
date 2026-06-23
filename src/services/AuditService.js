import { getSupabaseClient } from './supabase'

async function call (action, payload = {}) {
  const { data, error } = await getSupabaseClient().functions.invoke('audit-admin', { body: { action, payload } })
  if (error) { let detail = null; try { detail = await error.context?.json() } catch {}; throw new Error(detail?.error || error.message) }
  if (data?.error) throw new Error(data.error)
  return data.data
}
export default { list: filters => call('list', filters), record: payload => call('record', payload) }
