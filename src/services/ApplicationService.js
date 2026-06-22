import { getSupabaseClient } from './supabase'

function mapApplication (app) {
  if (!app) return null
  return {
    id: app.id,
    vacancyId: app.vacante_id,
    candidateId: app.candidato_id,
    name: `${app.nombres} ${app.apellidos}`.trim(),
    firstName: app.nombres,
    lastName: app.apellidos,
    email: app.correo,
    phone: app.telefono,
    location: app.ubicacion,
    academicLevelId: app.nivel_academico_id,
    academicLevel: app.nivel_academico?.nombre || '',
    profession: app.profesion_oficio,
    cv: app.curriculum_url, // path inside the storage bucket
    cvFileName: app.curriculum_url.split('/').pop() || 'cv',
    privacyConsent: app.consentimiento_privacidad,
    identityDocument: app.documento_identidad,
    yearsExperience: app.anios_experiencia ? parseFloat(app.anios_experiencia) : null,
    lastPosition: app.ultimo_puesto,
    availability: app.disponibilidad,
    salaryExpectation: app.expectativa_salarial ? parseFloat(app.expectativa_salarial) : null,
    message: app.mensaje_presentacion,
    portfolioUrl: app.portafolio_url,
    linkedinUrl: app.linkedin_url,
    recruitmentSourceId: app.fuente_reclutamiento_id,
    recruitmentSource: app.fuente_reclutamiento?.nombre || '',
    administrativeStatus: app.estado_administrativo,
    internalObservation: app.observacion_interna,
    reviewedBy: app.revisado_por,
    reviewDate: app.fecha_revision,
    ipAddress: app.direccion_ip,
    browser: app.navegador,
    createdAt: app.created_at,
    updatedAt: app.updated_at
  }
}

export default {
  async getByVacancy (vacancyId) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('applications')
      .select('*, nivel_academico:nivel_academico_id(nombre), fuente_reclutamiento:fuente_reclutamiento_id(nombre)')
      .eq('vacante_id', vacancyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(mapApplication)
  },

  async getAll () {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('applications')
      .select('*, nivel_academico:nivel_academico_id(nombre), fuente_reclutamiento:fuente_reclutamiento_id(nombre)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(mapApplication)
  },

  async create (data, answers) {
    const client = getSupabaseClient()
    const applicationId = crypto.randomUUID()
    const payload = {
      id: applicationId,
      vacante_id: data.vacancyId,
      candidato_id: data.candidateId || null,
      nombres: data.firstName,
      apellidos: data.lastName,
      correo: data.email,
      telefono: data.phone,
      ubicacion: data.location,
      nivel_academico_id: data.academicLevelId,
      profesion_oficio: data.profession,
      curriculum_url: data.cv,
      consentimiento_privacidad: data.privacyConsent,
      documento_identidad: data.identityDocument || null,
      anios_experiencia: data.yearsExperience ? parseFloat(data.yearsExperience) : null,
      ultimo_puesto: data.lastPosition || null,
      disponibilidad: data.disponibilidad || null,
      expectativa_salarial: data.salaryExpectation ? parseFloat(data.salaryExpectation) : null,
      mensaje_presentacion: data.message || null,
      portafolio_url: data.portfolioUrl || null,
      linkedin_url: data.linkedinUrl || null,
      fuente_reclutamiento_id: data.recruitmentSourceId || null
    }

    const { error } = await client
      .from('applications')
      .insert(payload)

    if (error) throw error

    if (answers && answers.length > 0) {
      const answersPayload = answers.map(ans => ({
        application_id: applicationId,
        question_id: ans.questionId,
        respuesta: ans.value
      }))
      const { error: ansError } = await client
        .from('application_answers')
        .insert(answersPayload)
      if (ansError) throw ansError
    }

    return { id: applicationId, vacancyId: data.vacancyId }
  },

  async updateStatus (id, status, reviewerId) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('applications')
      .update({
        estado_administrativo: status,
        revisado_por: reviewerId,
        fecha_revision: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, nivel_academico:nivel_academico_id(nombre), fuente_reclutamiento:fuente_reclutamiento_id(nombre)')
      .single()

    if (error) throw error
    return mapApplication(data)
  },

  async addObservation (id, observation, reviewerId) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('applications')
      .update({
        observacion_interna: observation,
        revisado_por: reviewerId,
        fecha_revision: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, nivel_academico:nivel_academico_id(nombre), fuente_reclutamiento:fuente_reclutamiento_id(nombre)')
      .single()

    if (error) throw error
    return mapApplication(data)
  },

  async uploadCv (file) {
    if (!file) return null
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
    const path = `${crypto.randomUUID()}.${ext}`
    const client = getSupabaseClient()
    const { error } = await client.storage
      .from('candidate-cvs')
      .upload(path, file, { contentType: file.type })

    if (error) throw error
    return path
  },

  async getCvSignedUrl (path) {
    if (!path) return null
    const client = getSupabaseClient()
    const { data, error } = await client.storage
      .from('candidate-cvs')
      .createSignedUrl(path, 60)

    if (error) throw error
    return data.signedUrl
  },

  async getAnswers (applicationId) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('application_answers')
      .select('*, question:question_id(pregunta, tipo_respuesta, opciones)')
      .eq('application_id', applicationId)

    if (error) throw error
    return data.map(ans => ({
      id: ans.id,
      questionId: ans.question_id,
      question: ans.question?.pregunta || '',
      type: ans.question?.tipo_respuesta || '',
      options: ans.question?.opciones || null,
      value: ans.respuesta
    }))
  }
}
