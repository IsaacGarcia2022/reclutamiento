import { getSupabaseClient } from './supabase'

export default {
  async getByVacancy (vacancyId) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('vacancy_questions')
      .select('*')
      .eq('vacante_id', vacancyId)
      .order('orden', { ascending: true })

    if (error) throw error
    return data
  },

  async saveQuestions (vacancyId, questions) {
    const client = getSupabaseClient()

    // 1. Eliminar preguntas que ya no existen en la lista enviada
    const existingIds = questions.filter(q => q.id).map(q => q.id)
    if (existingIds.length > 0) {
      const { error: delError } = await client
        .from('vacancy_questions')
        .delete()
        .eq('vacante_id', vacancyId)
        .not('id', 'in', `(${existingIds.join(',')})`)
      if (delError) throw delError
    } else {
      const { error: delError } = await client
        .from('vacancy_questions')
        .delete()
        .eq('vacante_id', vacancyId)
      if (delError) throw delError
    }

    // 2. Realizar upsert de las preguntas actuales
    if (questions.length > 0) {
      const payload = questions.map((q, idx) => ({
        id: q.id || crypto.randomUUID(),
        vacante_id: vacancyId,
        pregunta: q.pregunta,
        tipo_respuesta: q.tipo_respuesta,
        opciones: q.opciones || null,
        obligatoria: q.obligatoria || false,
        orden: q.orden !== undefined ? q.orden : idx,
        activo: q.activo !== undefined ? q.activo : true
      }))

      const { error: upsertError } = await client
        .from('vacancy_questions')
        .upsert(payload)

      if (upsertError) throw upsertError
    }
  }
}
