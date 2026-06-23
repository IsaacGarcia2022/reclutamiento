import { getSupabaseClient } from './supabase'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

const BLOCKED_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'sh', 'bash', 'msi', 'com', 'vbs', 'scr',
  'pif', 'reg', 'ps1', 'jar', 'bin', 'dll', 'sys', 'elf', 'so',
  'dmg', 'app', 'ipa', 'apk', 'php', 'js', 'html', 'css', 'asp', 'aspx'
]

const BLOCKED_MIME_TYPES = [
  'application/x-msdownload',
  'application/x-sh',
  'application/x-bash',
  'application/javascript',
  'text/javascript',
  'text/html',
  'text/css',
  'application/x-httpd-php'
]

const ALLOWED_EXT_BY_TYPE = {
  curriculum: ['pdf', 'doc', 'docx'],
  carta_presentacion: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp'],
  certificado: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp'],
  portafolio: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp'],
  otro: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp']
}

export default {
  /**
   * Valida un archivo según tipo, extensión, MIME y tamaño.
   * Retorna null si es válido, o un mensaje de error string en español.
   */
  validateFile (file, type) {
    if (!file) return 'No se ha seleccionado ningún archivo'

    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    
    // 1. Validar extensión ejecutable / peligrosa
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return 'Archivo potencialmente peligroso bloqueado.'
    }

    // 2. Validar tipo MIME potencialmente peligroso
    const mime = file.type?.toLowerCase() || ''
    const isDangerousMime = BLOCKED_MIME_TYPES.some(t => mime.includes(t))
    if (isDangerousMime) {
      return 'El formato MIME del archivo no está permitido por seguridad.'
    }

    // 3. Validar extensión permitida por tipo de documento
    const allowedExts = ALLOWED_EXT_BY_TYPE[type] || ALLOWED_EXT_BY_TYPE.otro
    if (!allowedExts.includes(ext)) {
      if (type === 'curriculum') {
        return 'Para el currículum solo se permiten formatos PDF o Word (.doc, .docx).'
      }
      return `Formato de archivo no válido. Se permiten: ${allowedExts.join(', ')}.`
    }

    // 4. Validar tamaño máximo
    if (file.size > MAX_SIZE) {
      return 'El tamaño del archivo no puede superar los 10 MB.'
    }

    return null
  },

  /**
   * Sube el archivo físico al bucket privado de almacenamiento.
   * Retorna metadatos del archivo subido.
   */
  async uploadFile (file, type) {
    const validationError = this.validateFile(file, type)
    if (validationError) {
      throw new Error(validationError)
    }

    const client = getSupabaseClient()
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
    const secureName = `${crypto.randomUUID()}.${ext}`
    
    // Subir al bucket privado
    const { error: uploadError } = await client.storage
      .from('candidate-documents')
      .upload(secureName, file, { contentType: file.type })

    if (uploadError) throw uploadError

    return {
      nombreOriginal: file.name,
      nombreInterno: secureName,
      ruta: `candidate-documents/${secureName}`,
      mimeType: file.type || `application/${ext}`,
      tamanio: file.size
    }
  },

  /**
   * Crea un registro en la tabla public.documents.
   */
  async createRecord (docData) {
    const client = getSupabaseClient()
    const session = await client.auth.getSession()
    const isAuthenticated = !!session.data.session?.user

    const payload = {
      candidato_id: docData.candidateId || null,
      postulacion_id: docData.applicationId,
      tipo_documento: docData.type,
      nombre_original: docData.nombreOriginal,
      nombre_interno: docData.nombreInterno,
      ruta: docData.ruta,
      mime_type: docData.mimeType,
      tamanio: docData.tamanio,
      estado: 'activo'
    }

    if (isAuthenticated) {
      const { data, error: dbError } = await client
        .from('documents')
        .insert(payload)
        .select()
        .single()

      if (dbError) throw dbError
      return data
    } else {
      const { error: dbError } = await client
        .from('documents')
        .insert(payload)

      if (dbError) throw dbError
      return {
        ...payload,
        id: crypto.randomUUID(),
        fecha_carga: new Date().toISOString()
      }
    }
  },

  /**
   * Sube el archivo y registra la información en la base de datos de una vez (para uso administrativo).
   */
  async uploadAndCreate (file, type, candidateId, applicationId = null) {
    const uploaded = await this.uploadFile(file, type)
    return await this.createRecord({
      ...uploaded,
      candidateId,
      applicationId,
      type
    })
  },

  /**
   * Obtiene los documentos activos de un candidato.
   */
  async listByCandidate (candidateId) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('documents')
      .select('*')
      .eq('candidato_id', candidateId)
      .eq('estado', 'activo')
      .order('fecha_carga', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Obtiene los documentos activos asociados a una postulación específica.
   */
  async listByApplication (applicationId) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('documents')
      .select('*')
      .eq('postulacion_id', applicationId)
      .eq('estado', 'activo')
      .order('fecha_carga', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Inhabilita un documento (borrado lógico).
   */
  async deleteDocument (documentId) {
    const client = getSupabaseClient()
    const { error } = await client
      .from('documents')
      .update({ estado: 'eliminado' })
      .eq('id', documentId)

    if (error) throw error
    return true
  },

  /**
   * Descarga segura y auditada de un documento.
   * Llama al RPC para auditar la descarga, y luego genera la URL temporal firmada.
   */
  async downloadDocument (documentId) {
    const client = getSupabaseClient()

    // 1. Invocar el RPC de auditoría en base de datos
    const { data: auditData, error: auditError } = await client
      .rpc('log_document_download', { p_document_id: documentId })

    if (auditError) throw auditError

    const fullPath = auditData.ruta // Formato: "bucket-name/file-uuid.ext"
    const parts = fullPath.split('/')
    const bucket = parts[0]
    const filePath = parts.slice(1).join('/')

    // 2. Generar URL firmada del almacenamiento
    const { data: signedData, error: signedError } = await client.storage
      .from(bucket)
      .createSignedUrl(filePath, 60)

    if (signedError) throw signedError

    return {
      signedUrl: signedData.signedUrl,
      nombreOriginal: auditData.nombre_original
    }
  }
}
