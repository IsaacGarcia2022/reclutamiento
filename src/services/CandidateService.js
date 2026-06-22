import { getSupabaseClient } from './supabase'

function mapCandidate (c) {
  if (!c) return null
  return {
    id: c.id,
    firstName: c.nombres,
    lastName: c.apellidos,
    name: `${c.nombres} ${c.apellidos}`.trim(),
    email: c.correo,
    phone: c.telefono,
    identityDocument: c.documento_identidad,
    locationId: c.ubicacion_id,
    locationText: c.ubicacion_texto,
    location: c.ubicacion?.nombre || c.ubicacion_texto || '',
    academicLevelId: c.nivel_academico_id,
    academicLevel: c.nivel_academico?.nombre || '',
    profession: c.profesion_oficio,
    yearsExperience: c.anios_experiencia ? parseFloat(c.anios_experiencia) : null,
    lastPosition: c.ultimo_puesto,
    availability: c.disponibilidad,
    salaryExpectation: c.expectativa_salarial ? parseFloat(c.expectativa_salarial) : null,
    linkedinUrl: c.linkedin_url,
    portafolio_url: c.portafolio_url,
    status: c.estado,
    tags: c.etiquetas || [],
    internalObservations: c.observaciones_internas,
    appliedAreas: (c.applications || []).map(a => a.vacante?.area_profesional_id).filter(Boolean),
    createdAt: c.created_at,
    updatedAt: c.updated_at
  }
}

export default {
  async list () {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('candidates')
      .select('*, ubicacion:ubicacion_id(nombre), nivel_academico:nivel_academico_id(nombre), applications(vacante_id, vacante:vacante_id(area_profesional_id))')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(mapCandidate)
  },

  async get (id) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('candidates')
      .select('*, ubicacion:ubicacion_id(nombre), nivel_academico:nivel_academico_id(nombre)')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return mapCandidate(data)
  },

  async getHistory (candidateId) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('applications')
      .select('*, vacante:vacante_id(titulo, codigo, responsable_id)')
      .eq('candidato_id', candidateId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(app => ({
      id: app.id,
      vacancyId: app.vacante_id,
      vacancyCode: app.vacante?.codigo || '',
      vacancyTitle: app.vacante?.titulo || '',
      cv: app.curriculum_url,
      administrativeStatus: app.estado_administrativo,
      internalObservation: app.observacion_interna,
      createdAt: app.created_at
    }))
  },

  async updateTags (id, tags) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('candidates')
      .update({ etiquetas: tags })
      .eq('id', id)
      .select('*, ubicacion:ubicacion_id(nombre), nivel_academico:nivel_academico_id(nombre)')
      .single()

    if (error) throw error
    return mapCandidate(data)
  },

  async updateObservation (id, observation) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('candidates')
      .update({ observaciones_internas: observation })
      .eq('id', id)
      .select('*, ubicacion:ubicacion_id(nombre), nivel_academico:nivel_academico_id(nombre)')
      .single()

    if (error) throw error
    return mapCandidate(data)
  },

  async archive (id) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('candidates')
      .update({ estado: 'archivado' })
      .eq('id', id)
      .select('*, ubicacion:ubicacion_id(nombre), nivel_academico:nivel_academico_id(nombre)')
      .single()

    if (error) throw error
    return mapCandidate(data)
  },

  async restore (id) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('candidates')
      .update({ estado: 'activo' })
      .eq('id', id)
      .select('*, ubicacion:ubicacion_id(nombre), nivel_academico:nivel_academico_id(nombre)')
      .single()

    if (error) throw error
    return mapCandidate(data)
  },

  async delete (id) {
    const client = getSupabaseClient()
    const { error } = await client
      .from('candidates')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }
}
