import { getSupabaseClient } from './supabase'

function toForm (data = {}) {
  return {
    nombreLegal: data.nombre_legal || '', nombreComercial: data.nombre_comercial || '', descripcion: data.descripcion || '', logoUrl: data.logo_url || '', sector: data.sector || '', direccion: data.direccion || '', telefono: data.telefono || '', correoRecursosHumanos: data.correo_recursos_humanos || '', sitioWeb: data.sitio_web || '', facebook: data.facebook || '', instagram: data.instagram || '', linkedin: data.linkedin || '', mision: data.mision || '', vision: data.vision || '', valores: data.valores || '', beneficiosLaborales: data.beneficios_laborales || '', colorPrincipal: data.color_principal || '#18566B', colorSecundario: data.color_secundario || '#638579', politicaPrivacidad: data.politica_privacidad || '', versionPoliticaPrivacidad: data.version_politica_privacidad || '', terminosPostulacion: data.terminos_postulacion || '', versionTerminos: data.version_terminos || '', periodoConservacionMeses: data.periodo_conservacion_meses !== undefined ? data.periodo_conservacion_meses : 12
  }
}

export default {
  async get () {
    const client = getSupabaseClient()
    const { data, error } = await client.from('company_settings').select('*').eq('id', true).maybeSingle()
    if (error) throw new Error('No fue posible cargar la configuración de la empresa.')
    return toForm(data)
  },
  async update (payload) {
    const client = getSupabaseClient()
    const { data, error } = await client.functions.invoke('company-admin', { body: { action: 'update', payload } })
    if (error) throw new Error(error.message || 'No fue posible actualizar la empresa.')
    if (data?.error) throw new Error(data.error)
    return toForm(data.data)
  },
  async uploadLogo (file) {
    if (!file) return null
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) throw new Error('El logo debe ser PNG, JPG, WebP o SVG.')
    if (file.size > 2 * 1024 * 1024) throw new Error('El logo no puede superar 2 MB.')
    const client = getSupabaseClient()
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `logo/institucional.${extension}`
    const { error } = await client.storage.from('company-assets').upload(path, file, { upsert: true, contentType: file.type })
    if (error) throw new Error('No fue posible cargar el logo.')
    const { data } = client.storage.from('company-assets').getPublicUrl(path)
    return `${data.publicUrl}?v=${Date.now()}`
  }
}
