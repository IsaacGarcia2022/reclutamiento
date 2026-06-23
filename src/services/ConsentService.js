import { getSupabaseClient } from './supabase'

export default {
  async registerConsents (consentsList) {
    const client = getSupabaseClient()
    const { data, error } = await client.from('consents').insert(consentsList)
    if (error) {
      console.error('Error registering consents:', error)
      throw new Error('No fue posible registrar el consentimiento de privacidad.')
    }
    return data
  },
  async requestDataDeletion (payload) {
    const client = getSupabaseClient()
    const { data, error } = await client.from('data_deletion_requests').insert({
      correo: payload.correo,
      motivo: payload.motivo
    })
    if (error) {
      console.error('Error requesting data deletion:', error)
      throw new Error('No fue posible enviar la solicitud de eliminación.')
    }
    return data
  },
  async getDeletionRequests () {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('data_deletion_requests')
      .select(`
        *,
        candidato:candidato_id (nombres, apellidos, correo),
        perfil_procesador:procesado_por (nombres, apellidos)
      `)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error loading deletion requests:', error)
      throw new Error('No fue posible cargar las solicitudes de eliminación.')
    }
    return data
  },
  async updateDeletionRequestStatus (id, { estado, observacion }) {
    const client = getSupabaseClient()
    const { data: { user } } = await client.auth.getUser()
    const { data, error } = await client
      .from('data_deletion_requests')
      .update({
        estado,
        observacion,
        procesado_por: user?.id || null,
        fecha_procesamiento: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('Error updating deletion request:', error)
      throw new Error('No fue posible actualizar la solicitud.')
    }
    return data
  },
  async getExpiredCandidates (months) {
    const client = getSupabaseClient()
    const { data, error } = await client.rpc('get_expired_candidates', { p_months: months })
    if (error) {
      console.error('Error fetching expired candidates:', error)
      throw new Error('No fue posible cargar la lista de candidatos expirados.')
    }
    return data
  },
  async purgeExpiredCandidates (months) {
    const client = getSupabaseClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('Usuario administrador no autenticado.')
    const { data, error } = await client.rpc('purge_expired_candidates', {
      p_months: months,
      p_processed_by: user.id
    })
    if (error) {
      console.error('Error purging expired candidates:', error)
      throw new Error('No fue posible realizar la purga de candidatos.')
    }
    return data
  }
}
