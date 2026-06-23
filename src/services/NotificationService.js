import { getSupabaseClient } from './supabase'

export default {
  /**
   * Obtiene la lista completa de plantillas de correo.
   */
  async listTemplates () {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('notification_templates')
      .select('*')
      .order('nombre')

    if (error) throw error
    return data
  },

  /**
   * Actualiza los datos de una plantilla (solo administradores).
   */
  async updateTemplate (id, data) {
    const client = getSupabaseClient()
    const { data: updated, error } = await client
      .from('notification_templates')
      .update({
        asunto: data.asunto,
        contenido_html: data.contenido_html,
        contenido_texto: data.contenido_texto,
        estado: data.estado,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  },

  /**
   * Obtiene la lista de alertas internas dirigidas al usuario actual.
   */
  async listInternal () {
    const client = getSupabaseClient()
    const session = await client.auth.getSession()
    const userId = session.data.session?.user?.id

    if (!userId) return []

    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('tipo', 'internal')
      .or(`usuario_id.eq.${userId},usuario_id.is.null`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Marca una notificación interna como leída.
   */
  async markAsRead (id) {
    const client = getSupabaseClient()
    const { error } = await client
      .from('notifications')
      .update({ leida: true })
      .eq('id', id)

    if (error) throw error
    return true
  },

  /**
   * Invoca el chequeo en tiempo real de vacantes (vencimiento/sin postulaciones).
   */
  async checkVacancyAlerts () {
    const client = getSupabaseClient()
    const { data, error } = await client
      .rpc('check_vacancies_status')

    if (error) {
      console.error('Error al ejecutar chequeo de vacantes:', error)
      return null
    }
    return data
  },

  /**
   * Obtiene la lista de correos simulados enviados a un candidato.
   */
  async listByCandidate (candidateId) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('tipo', 'email')
      .eq('candidato_id', candidateId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Simula el envío de un correo electrónico al candidato, compilando variables e insertando el registro.
   */
  async sendEmailNotification (templateCode, candidateId, applicationId, variables = {}) {
    const client = getSupabaseClient()

    // 1. Obtener la plantilla activa
    const { data: template, error: tempError } = await client
      .from('notification_templates')
      .select('*')
      .eq('nombre', templateCode)
      .eq('estado', 'activo')
      .maybeSingle()

    if (tempError) throw tempError
    if (!template) {
      console.warn(`Plantilla de notificación inactiva o no encontrada: ${templateCode}`)
      return null
    }

    // 2. Reemplazar variables dinámicas
    let subject = template.asunto
    let html = template.contenido_html
    let text = template.contenido_texto

    const keys = [
      'nombre_candidato',
      'nombre_vacante',
      'codigo_vacante',
      'nombre_empresa',
      'fecha_postulacion'
    ]

    keys.forEach(key => {
      const value = variables[key] || ''
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      subject = subject.replace(regex, value)
      html = html.replace(regex, value)
      text = text.replace(regex, value)
    })

    // 3. Registrar en la tabla public.notifications para auditoría e historial
    const { data: notification, error: insertError } = await client
      .from('notifications')
      .insert({
        tipo: 'email',
        candidato_id: candidateId,
        postulacion_id: applicationId,
        titulo: subject,
        mensaje: text,
        metadata: {
          template: templateCode,
          html_content: html,
          variables_used: variables
        }
      })
      .select()
      .single()

    if (insertError) throw insertError

    // 4. Simulación visual del correo en la consola de desarrollo
    console.log(
      `%c✉️ SIMULACIÓN DE CORREO ENVIADO [Plantilla: ${templateCode}] ✉️\n` +
      `De: reclutamiento@rrhh.corporativo\n` +
      `Asunto: ${subject}\n` +
      `--------------------------------------------------\n` +
      `${text}\n` +
      `--------------------------------------------------`,
      'color: #0d9488; font-weight: bold;'
    )

    return notification
  }
}
