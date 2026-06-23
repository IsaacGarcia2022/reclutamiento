<script setup>
import { ref, onMounted, computed } from 'vue'
import CandidateService from '../../services/CandidateService'
import VacancyService from '../../services/VacancyService'
import ApplicationService from '../../services/ApplicationService'
import DocumentService from '../../services/DocumentService'
import NotificationService from '../../services/NotificationService'

const candidates = ref([])
const loading = ref(false)
const error = ref(null)

// Catálogos para filtros
const academicLevels = ref([])
const professionalAreas = ref([])

// Filtros de búsqueda
const search = ref('')
const professionFilter = ref('')
const areaFilter = ref('')
const academicLevelFilter = ref('')
const experienceFilter = ref('todas') // todas, sin_exp, menos_1, 1_3, 3_5, mas_5
const statusFilter = ref('activo') // activo, archivado

// Candidato seleccionado para detalles
const selectedCandidate = ref(null)
const history = ref([])
const loadingHistory = ref(false)
const tagInput = ref('')
const observationText = ref('')
const savingObservation = ref(false)
const previewCvUrl = ref(null)

// Documentos del candidato
const candidateDocuments = ref([])
const loadingDocs = ref(false)
const uploadingDoc = ref(false)
const newDocFile = ref(null)
const newDocFileName = ref('')
const newDocType = ref('curriculum')
const newDocError = ref('')

// Notificaciones y correos del candidato
const candidateNotifications = ref([])
const loadingNotifications = ref(false)

// Cargar catálogo e información de candidatos
onMounted(async () => {
  await loadData()
})

async function loadData () {
  loading.value = true
  try {
    candidates.value = await CandidateService.list()
    
    // Cargar catálogos
    const cats = await VacancyService.catalogs()
    academicLevels.value = cats.filter(c => c.categoria === 'nivel_academico' && c.activo)
    professionalAreas.value = cats.filter(c => c.categoria === 'area_profesional' && c.activo)
    
    error.value = null
  } catch (e) {
    error.value = 'No fue posible cargar el banco de candidatos.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

// Filtros en memoria de candidatos
const filteredCandidates = computed(() => {
  return candidates.value.filter(c => {
    // 1. Filtro de Estado
    if (c.status !== statusFilter.value) return false

    // 2. Búsqueda por Nombre / Correo
    const term = search.value.trim().toLowerCase()
    if (term) {
      const matchName = c.name.toLowerCase().includes(term)
      const matchEmail = c.email.toLowerCase().includes(term)
      if (!matchName && !matchEmail) return false
    }

    // 3. Filtro por Profesión (texto)
    if (professionFilter.value.trim()) {
      const profTerm = professionFilter.value.trim().toLowerCase()
      if (!c.profession.toLowerCase().includes(profTerm)) return false
    }

    // 4. Filtro por Nivel Académico
    if (academicLevelFilter.value && c.academicLevelId !== academicLevelFilter.value) return false

    // 5. Filtro por Área Profesional de las vacantes postuladas
    if (areaFilter.value) {
      if (!c.appliedAreas || !c.appliedAreas.includes(areaFilter.value)) return false
    }

    // 6. Filtro por Años de Experiencia
    const exp = c.yearsExperience
    if (experienceFilter.value === 'sin_exp') {
      if (exp !== null && exp > 0) return false
    } else if (experienceFilter.value === 'menos_1') {
      if (exp === null || exp <= 0 || exp >= 1) return false
    } else if (experienceFilter.value === '1_3') {
      if (exp === null || exp < 1 || exp > 3) return false
    } else if (experienceFilter.value === '3_5') {
      if (exp === null || exp < 3 || exp > 5) return false
    } else if (experienceFilter.value === 'mas_5') {
      if (exp === null || exp < 5) return false
    }

    return true
  })
})

// Abrir detalle del candidato
async function selectCandidate (candidate) {
  selectedCandidate.value = candidate
  observationText.value = candidate.internalObservations || ''
  
  // Cargar historial y currículum
  loadingHistory.value = true
  history.value = []
  try {
    history.value = await CandidateService.getHistory(candidate.id)
    await loadCandidateDocuments(candidate.id)
    await loadCandidateNotifications(candidate.id)
  } catch (e) {
    console.error('Error cargando historial de postulaciones:', e)
  } finally {
    loadingHistory.value = false
  }
}

// Agregar etiqueta al candidato
async function addTag () {
  if (!tagInput.value.trim() || !selectedCandidate.value) return
  const tag = tagInput.value.trim()
  
  if (selectedCandidate.value.tags.includes(tag)) {
    tagInput.value = ''
    return
  }

  const updatedTags = [...selectedCandidate.value.tags, tag]
  try {
    const updated = await CandidateService.updateTags(selectedCandidate.value.id, updatedTags)
    if (updated) {
      selectedCandidate.value.tags = updated.tags
      updateLocalCandidate(updated)
      tagInput.value = ''
    }
  } catch (e) {
    alert('Error al agregar la etiqueta: ' + e.message)
  }
}

// Remover etiqueta
async function removeTag (tag) {
  if (!selectedCandidate.value) return
  const updatedTags = selectedCandidate.value.tags.filter(t => t !== tag)
  try {
    const updated = await CandidateService.updateTags(selectedCandidate.value.id, updatedTags)
    if (updated) {
      selectedCandidate.value.tags = updated.tags
      updateLocalCandidate(updated)
    }
  } catch (e) {
    alert('Error al eliminar la etiqueta: ' + e.message)
  }
}

// Guardar observación interna
async function saveObservation () {
  if (!selectedCandidate.value) return
  savingObservation.value = true
  try {
    const updated = await CandidateService.updateObservation(selectedCandidate.value.id, observationText.value)
    if (updated) {
      selectedCandidate.value.internalObservations = updated.internalObservations
      updateLocalCandidate(updated)
      alert('Observaciones internas actualizadas con éxito.')
    }
  } catch (e) {
    alert('Error al guardar las observaciones: ' + e.message)
  } finally {
    savingObservation.value = false
  }
}

// Archivar candidato
async function archiveCandidate () {
  if (!selectedCandidate.value) return
  if (!confirm('¿Estás seguro de que deseas archivar este candidato? El perfil se moverá a la lista de archivados.')) return
  try {
    const updated = await CandidateService.archive(selectedCandidate.value.id)
    if (updated) {
      updateLocalCandidate(updated)
      selectedCandidate.value = null
    }
  } catch (e) {
    alert('Error al archivar el candidato: ' + e.message)
  }
}

// Restaurar candidato
async function restoreCandidate () {
  if (!selectedCandidate.value) return
  try {
    const updated = await CandidateService.restore(selectedCandidate.value.id)
    if (updated) {
      updateLocalCandidate(updated)
      selectedCandidate.value = null
    }
  } catch (e) {
    alert('Error al restaurar el candidato: ' + e.message)
  }
}

// Eliminar candidato (GDPR / Derecho al olvido)
async function deleteCandidate () {
  if (!selectedCandidate.value) return
  const confirmed = confirm(
    'ADVERTENCIA CRÍTICA: Cumplimiento de Privacidad.\n\n' +
    'Esta acción eliminará de forma irreversible al candidato y todas las postulaciones asociadas del sistema.\n' +
    '¿Estás completamente seguro de que deseas borrar los datos del candidato?'
  )
  if (!confirmed) return

  // Simular envío de notificación de eliminación (GDPR)
  try {
    const variables = {
      nombre_candidato: `${selectedCandidate.value.firstName} ${selectedCandidate.value.lastName}`.trim(),
      nombre_empresa: selectedCandidate.value.company || 'Empresa de Empleo'
    }
    await NotificationService.sendEmailNotification(
      'eliminacion_datos',
      selectedCandidate.value.id,
      null,
      variables
    )
  } catch (err) {
    console.error('Error al simular envío de eliminación de datos:', err)
  }

  try {
    await CandidateService.delete(selectedCandidate.value.id)
    candidates.value = candidates.value.filter(c => c.id !== selectedCandidate.value.id)
    selectedCandidate.value = null
    alert('Candidato y postulaciones eliminadas permanentemente. Correo de confirmación de eliminación enviado al candidato (simulado).')
  } catch (e) {
    alert('Error al eliminar los datos: ' + e.message)
  }
}

// Previsualizar CV
async function previewCv (path) {
  try {
    const url = await ApplicationService.getCvSignedUrl(path)
    previewCvUrl.value = url
  } catch (e) {
    alert('Error al generar enlace temporal del CV: ' + e.message)
  }
}

// Descargar CV
async function downloadCv (path, fileName) {
  try {
    const url = await ApplicationService.getCvSignedUrl(path)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || 'curriculum'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (e) {
    alert('Error al descargar el CV: ' + e.message)
  }
}

// Cargar documentos del candidato
async function loadCandidateDocuments (candidateId) {
  loadingDocs.value = true
  candidateDocuments.value = []
  try {
    candidateDocuments.value = await DocumentService.listByCandidate(candidateId)
  } catch (e) {
    console.error('Error al cargar documentos del candidato:', e)
  } finally {
    loadingDocs.value = false
  }
}

// Cargar notificaciones/correos del candidato
async function loadCandidateNotifications (candidateId) {
  loadingNotifications.value = true
  candidateNotifications.value = []
  try {
    candidateNotifications.value = await NotificationService.listByCandidate(candidateId)
  } catch (e) {
    console.error('Error al cargar notificaciones del candidato:', e)
  } finally {
    loadingNotifications.value = false
  }
}

// Validar y guardar archivo seleccionado para nuevo documento
function handleNewDocFile (e) {
  const file = e.target.files[0]
  if (!file) return
  const error = DocumentService.validateFile(file, newDocType.value)
  if (error) {
    newDocError.value = error
    newDocFile.value = null
    newDocFileName.value = ''
    return
  }
  newDocFile.value = file
  newDocFileName.value = file.name
  newDocError.value = ''
}

// Subir nuevo documento directamente a la ficha del candidato
async function uploadNewDocument () {
  if (!newDocFile.value || !selectedCandidate.value) return
  uploadingDoc.value = true
  try {
    const newDoc = await DocumentService.uploadAndCreate(
      newDocFile.value,
      newDocType.value,
      selectedCandidate.value.id
    )
    if (newDoc) {
      candidateDocuments.value.unshift(newDoc)
      newDocFile.value = null
      newDocFileName.value = ''
      newDocError.value = ''
      alert('Documento cargado con éxito en el expediente.')
    }
  } catch (e) {
    alert('Error al subir el documento: ' + e.message)
  } finally {
    uploadingDoc.value = false
  }
}

// Eliminar documento (borrado lógico)
async function deleteDocument (docId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este documento del expediente?')) return
  try {
    await DocumentService.deleteDocument(docId)
    candidateDocuments.value = candidateDocuments.value.filter(d => d.id !== docId)
    alert('Documento eliminado con éxito.')
  } catch (e) {
    alert('Error al eliminar el documento: ' + e.message)
  }
}

// Descargar documento de forma segura y auditada
async function downloadDocument (docId) {
  try {
    const res = await DocumentService.downloadDocument(docId)
    const link = document.createElement('a')
    link.href = res.signedUrl
    link.download = res.nombreOriginal
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (e) {
    alert('Error al descargar el documento: ' + e.message)
  }
}

// Previsualizar documento de forma segura y auditada
async function previewDocument (docId) {
  try {
    const res = await DocumentService.downloadDocument(docId)
    previewCvUrl.value = res.signedUrl
  } catch (e) {
    alert('Error al previsualizar el documento: ' + e.message)
  }
}

// Redireccionar visualización del historial al flujo auditado si existe el documento registrado
async function previewHistoryCv (historyItem) {
  const doc = candidateDocuments.value.find(d => d.postulacion_id === historyItem.id && d.tipo_documento === 'curriculum')
  if (doc) {
    await previewDocument(doc.id)
  } else {
    await previewCv(historyItem.cv)
  }
}

// Redireccionar descarga del historial al flujo auditado si existe el documento registrado
async function downloadHistoryCv (historyItem) {
  const doc = candidateDocuments.value.find(d => d.postulacion_id === historyItem.id && d.tipo_documento === 'curriculum')
  if (doc) {
    await downloadDocument(doc.id)
  } else {
    await downloadCv(historyItem.cv, historyItem.vacancyTitle + '_CV')
  }
}

// Utilidad para sincronizar la lista local reactiva
function updateLocalCandidate (updated) {
  const idx = candidates.value.findIndex(c => c.id === updated.id)
  if (idx !== -1) {
    candidates.value[idx] = updated
  }
}

// Detector de posibles duplicados en base a documento o nombre
const potentialDuplicates = computed(() => {
  if (!selectedCandidate.value) return []
  const current = selectedCandidate.value
  return candidates.value.filter(c => {
    if (c.id === current.id) return false
    
    // Duplicado por DUI/Documento
    if (current.identityDocument && c.identityDocument === current.identityDocument) return true
    
    // Duplicado por Nombres y Apellidos idénticos
    if (c.firstName.toLowerCase() === current.firstName.toLowerCase() && 
        c.lastName.toLowerCase() === current.lastName.toLowerCase()) return true
        
    return false
  })
})
</script>

<template>
  <div>
    <!-- Encabezado -->
    <div class="mb-6">
      <h1 class="font-display text-2xl font-bold text-stone-900">Banco de Candidatos</h1>
      <p class="text-sm text-stone-500 font-body mt-0.5">Historial global de candidatos y postulantes del portal de empleo.</p>
    </div>

    <!-- Layout Principal -->
    <div class="flex flex-col lg:flex-row gap-6">
      
      <!-- Panel de Filtros a la izquierda -->
      <aside class="w-full lg:w-64 shrink-0 space-y-5">
        <div class="card border border-stone-200 p-5 bg-white space-y-4 shadow-sm">
          <h3 class="font-display font-semibold text-stone-800 text-sm border-b border-stone-100 pb-2">Filtros de Búsqueda</h3>

          <!-- Buscar por Nombre / Correo -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-stone-500 font-body">Nombre o Correo</label>
            <input v-model="search" type="text" placeholder="Ej. Juan Pérez" 
              class="w-full text-xs rounded-lg border border-stone-200 p-2.5 outline-none focus:border-brand-500 font-body" />
          </div>

          <!-- Buscar por Profesión -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-stone-500 font-body">Profesión / Oficio</label>
            <input v-model="professionFilter" type="text" placeholder="Ej. Programador" 
              class="w-full text-xs rounded-lg border border-stone-200 p-2.5 outline-none focus:border-brand-500 font-body" />
          </div>

          <!-- Filtrar por Área Profesional -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-stone-500 font-body">Área Profesional de Vacante</label>
            <select v-model="areaFilter" 
              class="w-full text-xs rounded-lg border border-stone-200 p-2 bg-white outline-none focus:border-brand-500 font-body">
              <option value="">Todas las áreas</option>
              <option v-for="area in professionalAreas" :key="area.id" :value="area.id">{{ area.nombre }}</option>
            </select>
          </div>

          <!-- Filtrar por Nivel Académico -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-stone-500 font-body">Nivel Académico</label>
            <select v-model="academicLevelFilter" 
              class="w-full text-xs rounded-lg border border-stone-200 p-2 bg-white outline-none focus:border-brand-500 font-body">
              <option value="">Todos los niveles</option>
              <option v-for="level in academicLevels" :key="level.id" :value="level.id">{{ level.nombre }}</option>
            </select>
          </div>

          <!-- Filtrar por Experiencia -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-stone-500 font-body">Años de Experiencia</label>
            <div class="flex flex-col gap-1.5 pt-1">
              <label v-for="opt in [
                { value: 'todas', label: 'Cualquiera' },
                { value: 'sin_exp', label: 'Sin experiencia' },
                { value: 'menos_1', label: 'Menos de 1 año' },
                { value: '1_3', label: '1 a 3 años' },
                { value: '3_5', label: '3 a 5 años' },
                { value: 'mas_5', label: 'Más de 5 años' }
              ]" :key="opt.value" class="flex items-center gap-2 text-xs text-stone-600 font-body cursor-pointer select-none">
                <input type="radio" :value="opt.value" v-model="experienceFilter" class="text-brand-600 focus:ring-brand-500" />
                {{ opt.label }}
              </label>
            </div>
          </div>

          <!-- Filtro de Estado: Activo / Archivado -->
          <div class="space-y-1 pt-2 border-t border-stone-100">
            <label class="text-xs font-semibold text-stone-500 font-body">Estado de Candidato</label>
            <div class="flex gap-2 mt-1">
              <button @click="statusFilter = 'activo'" 
                class="flex-1 text-center py-1.5 px-3 text-xs rounded-lg font-semibold transition-all"
                :class="statusFilter === 'activo' ? 'bg-brand-600 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'">
                Activos
              </button>
              <button @click="statusFilter = 'archivado'" 
                class="flex-1 text-center py-1.5 px-3 text-xs rounded-lg font-semibold transition-all"
                :class="statusFilter === 'archivado' ? 'bg-brand-600 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'">
                Archivados
              </button>
            </div>
          </div>

        </div>
      </aside>

      <!-- Panel de Resultados a la derecha -->
      <div class="flex-1 min-w-0">
        
        <!-- Cargando -->
        <div v-if="loading" class="text-center py-16 bg-white rounded-2xl border border-stone-200 shadow-sm">
          <div class="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
          <p class="mt-4 text-sm text-stone-400 font-body">Cargando candidatos del banco corporativo...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center font-body shadow-sm">
          {{ error }}
          <button @click="loadData" class="mt-3 block mx-auto text-xs bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 font-semibold transition-colors">Reintentar</button>
        </div>

        <!-- Lista vacía -->
        <div v-else-if="filteredCandidates.length === 0" class="card border border-stone-200 p-12 text-center shadow-sm">
          <div class="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto">
            <svg class="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <p class="mt-4 text-stone-500 font-medium font-display text-base">No se encontraron candidatos</p>
          <p class="text-sm text-stone-400 mt-1 font-body">Prueba a limpiar o ajustar tus filtros de búsqueda.</p>
        </div>

        <!-- Grid de Candidatos -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="cand in filteredCandidates" :key="cand.id" 
            class="card border border-stone-200 p-5 hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
            <div>
              <div class="flex items-start justify-between gap-2">
                <div>
                  <router-link :to="'/admin/candidatos/' + cand.id" class="font-display font-bold text-base text-stone-900 hover:text-brand-600 transition-colors leading-tight block">
                    {{ cand.name }}
                  </router-link>
                  <p class="text-xs text-stone-500 mt-1 font-body">{{ cand.profession }}</p>
                </div>
                <span class="text-[10px] bg-stone-100 text-stone-500 font-mono px-2 py-0.5 rounded-full shrink-0">
                  {{ cand.yearsExperience ? cand.yearsExperience + ' años exp.' : 'Sin exp.' }}
                </span>
              </div>

              <div class="mt-3 space-y-1 font-body text-xs text-stone-500">
                <p class="flex items-center gap-1.5"><strong class="text-stone-700">Correo:</strong> {{ cand.email }}</p>
                <p class="flex items-center gap-1.5"><strong class="text-stone-700">Teléfono:</strong> {{ cand.phone }}</p>
                <p class="flex items-center gap-1.5"><strong class="text-stone-700">Ubicación:</strong> {{ cand.location }}</p>
              </div>

              <!-- Etiquetas -->
              <div v-if="cand.tags.length > 0" class="flex flex-wrap gap-1.5 mt-4">
                <span v-for="tag in cand.tags" :key="tag" 
                  class="text-[10px] bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded-lg border border-brand-100">
                  {{ tag }}
                </span>
              </div>
            </div>

            <div class="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
              <span class="text-[10px] text-stone-400 font-mono">Registrado: {{ new Date(cand.createdAt).toLocaleDateString('es-ES') }}</span>
              <button @click="selectCandidate(cand)"
                class="text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 px-3.5 py-1.5 rounded-xl transition-colors">
                Ver Ficha Completa
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- MODAL 1: Ficha del Candidato y Acciones -->
    <div v-if="selectedCandidate" class="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-45 p-4 overflow-y-auto" @click.self="selectedCandidate = null">
      <div class="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col my-8">
        
        <!-- Cabecera -->
        <div class="flex items-center justify-between p-5 border-b border-stone-200 bg-stone-50">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="font-display font-bold text-lg text-stone-900 leading-tight">{{ selectedCandidate.name }}</h3>
              <span class="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                :class="selectedCandidate.status === 'activo' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-stone-100 text-stone-600'">
                {{ selectedCandidate.status }}
              </span>
            </div>
            <p class="text-xs text-stone-500 font-body mt-0.5">Ficha Unificada de Candidatura</p>
          </div>
          <button @click="selectedCandidate = null" class="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 transition-all flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Contenido (Scrollable) -->
        <div class="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-stone-800">

          <!-- ALERTA DE DUPLICADOS -->
          <div v-if="potentialDuplicates.length > 0" class="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl space-y-1.5 font-body">
            <h5 class="font-semibold text-xs flex items-center gap-1.5 text-amber-800">
              <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Posible duplicado detectado
            </h5>
            <p class="text-xs text-stone-600">
              Se detectaron otros perfiles de candidato que coinciden con los nombres/apellidos o documento de identidad:
            </p>
            <ul class="list-disc list-inside text-xs font-semibold text-amber-900 mt-1">
              <li v-for="dup in potentialDuplicates" :key="dup.id">
                {{ dup.name }} &middot; {{ dup.email }} &middot; Documento: {{ dup.identityDocument || 'No indicado' }}
              </li>
            </ul>
            <p class="text-[10px] text-stone-400 mt-1 leading-normal italic">
              * Nota: De acuerdo a las políticas del sistema, no realizamos fusiones de perfiles automáticas. Para unificar la información, solicita la confirmación de datos al candidato.
            </p>
          </div>

          <!-- Información General -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h4 class="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Información Personal</h4>
              <ul class="space-y-1.5 font-body">
                <li><strong class="text-stone-700">Nombres:</strong> {{ selectedCandidate.firstName }}</li>
                <li><strong class="text-stone-700">Apellidos:</strong> {{ selectedCandidate.lastName }}</li>
                <li><strong class="text-stone-700">DUI / Documento:</strong> {{ selectedCandidate.identityDocument || 'No provisto' }}</li>
                <li><strong class="text-stone-700">Ubicación:</strong> {{ selectedCandidate.location }}</li>
              </ul>
            </div>
            <div>
              <h4 class="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Información de Contacto</h4>
              <ul class="space-y-1.5 font-body">
                <li><strong class="text-stone-700">Correo electrónico:</strong> {{ selectedCandidate.email }}</li>
                <li><strong class="text-stone-700">Teléfono / Celular:</strong> {{ selectedCandidate.phone }}</li>
                <li class="flex items-center gap-2 mt-2">
                  <a v-if="selectedCandidate.linkedinUrl" :href="selectedCandidate.linkedinUrl" target="_blank"
                    class="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2 py-1 rounded-lg border border-blue-100 transition-colors">
                    LinkedIn
                  </a>
                  <a v-if="selectedCandidate.portafolio_url" :href="selectedCandidate.portafolio_url" target="_blank"
                    class="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold px-2 py-1 rounded-lg border border-stone-200 transition-colors">
                    Portafolio
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <!-- Información Profesional -->
          <div class="border-t border-stone-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h4 class="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Perfil Vocacional</h4>
              <ul class="space-y-1.5 font-body">
                <li><strong class="text-stone-700">Profesión u Oficio:</strong> {{ selectedCandidate.profession }}</li>
                <li><strong class="text-stone-700">Nivel Académico:</strong> {{ selectedCandidate.academicLevel }}</li>
                <li><strong class="text-stone-700">Experiencia Laboral:</strong> {{ selectedCandidate.yearsExperience ? selectedCandidate.yearsExperience + ' años' : 'Sin experiencia laboral' }}</li>
              </ul>
            </div>
            <div>
              <h4 class="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Expectativas y Disponibilidad</h4>
              <ul class="space-y-1.5 font-body">
                <li v-if="selectedCandidate.ultimoPuesto"><strong class="text-stone-700">Último puesto:</strong> {{ selectedCandidate.lastPosition }}</li>
                <li><strong class="text-stone-700">Disponibilidad de inicio:</strong> {{ selectedCandidate.availability || 'No provista' }}</li>
                <li><strong class="text-stone-700">Expectativa Salarial:</strong> {{ selectedCandidate.salaryExpectation ? '$' + selectedCandidate.salaryExpectation : 'No indicada' }}</li>
              </ul>
            </div>
          </div>

          <!-- Gestor de Etiquetas (Tags) -->
          <div class="border-t border-stone-100 pt-4 space-y-3">
            <h4 class="text-xs font-bold text-stone-400 uppercase tracking-wider">Etiquetas Organizativas</h4>
            <div class="flex flex-wrap gap-2 items-center">
              <span v-for="tag in selectedCandidate.tags" :key="tag" 
                class="inline-flex items-center gap-1 text-xs bg-brand-50 text-brand-700 border border-brand-100 font-semibold px-2.5 py-1 rounded-xl">
                {{ tag }}
                <button @click="removeTag(tag)" class="text-brand-400 hover:text-brand-700 transition-colors focus:outline-none">&times;</button>
              </span>
              <form @submit.prevent="addTag" class="flex gap-1.5">
                <input v-model="tagInput" type="text" placeholder="Nueva etiqueta..." 
                  class="text-xs rounded-lg border border-stone-200 py-1.5 px-3.5 outline-none focus:border-brand-500 font-body w-36" />
                <button type="submit" class="text-xs bg-stone-900 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors">
                  Agregar
                </button>
              </form>
            </div>
          </div>

          <!-- Expediente de Documentos (2.9 Documentos) -->
          <div class="border-t border-stone-100 pt-4 space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-stone-400 uppercase tracking-wider">Expediente de Documentos</h4>
              <span class="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-mono">
                {{ candidateDocuments.length }} archivos
              </span>
            </div>

            <!-- Listado de documentos del expediente -->
            <div v-if="loadingDocs" class="text-center py-4 bg-stone-50 rounded-xl">
              <div class="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
              <p class="text-xs text-stone-400 mt-2 font-body">Cargando expediente...</p>
            </div>

            <div v-else-if="candidateDocuments.length === 0" class="bg-stone-50 border border-stone-150 rounded-xl p-4 text-center text-xs text-stone-400 font-body">
              No hay documentos cargados en el expediente de este candidato.
            </div>

            <div v-else class="space-y-2">
              <div v-for="doc in candidateDocuments" :key="doc.id" 
                class="bg-stone-50/50 border border-stone-150 rounded-xl p-3 flex items-center justify-between gap-4">
                <div class="min-w-0 flex items-start gap-2.5">
                  <!-- Icono según tipo de documento -->
                  <div class="p-2 bg-brand-50 text-brand-700 rounded-lg shrink-0 mt-0.5">
                    <svg v-if="doc.tipo_documento === 'curriculum'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <svg v-else-if="doc.tipo_documento === 'carta_presentacion'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <svg v-else-if="doc.tipo_documento === 'certificado'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                    <svg v-else-if="doc.tipo_documento === 'portafolio'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-stone-800 truncate" :title="doc.nombre_original">{{ doc.nombre_original }}</p>
                    <div class="flex items-center gap-2 text-[10px] text-stone-400 font-mono mt-0.5">
                      <span class="capitalize font-semibold text-brand-700">{{ doc.tipo_documento.replace('_', ' ') }}</span>
                      <span>&middot;</span>
                      <span>{{ (doc.tamanio / (1024 * 1024)).toFixed(2) }} MB</span>
                      <span>&middot;</span>
                      <span>{{ new Date(doc.fecha_carga).toLocaleDateString('es-ES') }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Acciones sobre el documento -->
                <div class="flex gap-1.5 shrink-0 items-center">
                  <button @click="previewDocument(doc.id)"
                    class="text-[10px] bg-white border border-stone-200 hover:bg-stone-100 font-bold text-stone-600 py-1.5 px-2.5 rounded-lg transition-colors">
                    Ver
                  </button>
                  <button @click="downloadDocument(doc.id)"
                    class="text-[10px] bg-white border border-stone-200 hover:bg-stone-100 font-bold text-stone-600 py-1.5 px-2.5 rounded-lg transition-colors">
                    Descargar
                  </button>
                  <button @click="deleteDocument(doc.id)"
                    class="text-[10px] bg-red-50 hover:bg-red-100 border border-red-100 font-bold text-red-600 py-1.5 px-2.5 rounded-lg transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>

            <!-- Formulario para subir nuevo documento directamente -->
            <div class="bg-stone-50 border border-stone-200 rounded-xl p-3.5 mt-2 space-y-3">
              <h5 class="text-xs font-semibold text-stone-700">Subir nuevo documento al expediente</h5>
              <div class="flex flex-col sm:flex-row gap-2.5 items-end">
                <div class="flex-1 w-full space-y-1">
                  <label class="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Tipo de Documento</label>
                  <select v-model="newDocType" 
                    class="w-full text-xs rounded-lg border border-stone-200 p-2 bg-white outline-none focus:border-brand-500 font-body">
                    <option value="curriculum">Currículum</option>
                    <option value="carta_presentacion">Carta de Presentación</option>
                    <option value="certificado">Certificado</option>
                    <option value="portafolio">Portafolio</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                
                <div class="flex-1 w-full space-y-1">
                  <label class="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Archivo</label>
                  <div class="relative border border-stone-250 hover:border-brand-400 rounded-lg p-2 text-center bg-white cursor-pointer h-[38px] flex items-center justify-center">
                    <input type="file" @change="handleNewDocFile" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <span class="text-xs text-stone-500 font-body block truncate max-w-xs">
                      {{ newDocFileName || 'Seleccionar archivo...' }}
                    </span>
                  </div>
                </div>

                <button @click="uploadNewDocument" :disabled="uploadingDoc || !newDocFile"
                  class="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs py-2.5 px-4 rounded-lg transition-all h-[38px] flex items-center justify-center gap-1.5 shrink-0 w-full sm:w-auto disabled:opacity-50">
                  <svg v-if="uploadingDoc" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Subir</span>
                </button>
              </div>
              <p v-if="newDocError" class="text-[10px] text-red-500 font-body mt-0.5">{{ newDocError }}</p>
            </div>
          </div>

          <!-- Notificaciones y Correos Enviados (2.10 Notificaciones) -->
          <div class="border-t border-stone-100 pt-4 space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-stone-400 uppercase tracking-wider">Historial de Notificaciones y Correos</h4>
              <span class="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-mono">
                {{ candidateNotifications.length }} enviados
              </span>
            </div>

            <!-- Listado de notificaciones/correos del candidato -->
            <div v-if="loadingNotifications" class="text-center py-4 bg-stone-50 rounded-xl">
              <div class="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
              <p class="text-xs text-stone-400 mt-2 font-body">Cargando historial de correos...</p>
            </div>

            <div v-else-if="candidateNotifications.length === 0" class="bg-stone-50 border border-stone-150 rounded-xl p-4 text-center text-xs text-stone-400 font-body">
              No se han registrado correos ni notificaciones enviadas a este candidato.
            </div>

            <div v-else class="space-y-2 max-h-60 overflow-y-auto pr-1">
              <div v-for="notif in candidateNotifications" :key="notif.id" 
                class="bg-stone-50 border border-stone-150 rounded-xl p-3 space-y-1.5 text-xs font-body">
                <div class="flex items-start justify-between gap-2">
                  <span class="font-bold text-stone-850">{{ notif.titulo }}</span>
                  <span class="text-[9px] text-stone-400 font-mono shrink-0">{{ new Date(notif.created_at).toLocaleString('es-ES') }}</span>
                </div>
                <p class="text-stone-600 leading-normal whitespace-pre-line text-[11px]">{{ notif.mensaje }}</p>
                <div v-if="notif.metadata && notif.metadata.template" class="text-[9px] text-brand-600 font-semibold font-mono uppercase bg-brand-50 rounded px-1.5 py-0.5 w-fit">
                  Plantilla: {{ notif.metadata.template }}
                </div>
              </div>
            </div>
          </div>

          <!-- Historial de Postulaciones (History) -->
          <div class="border-t border-stone-100 pt-4 space-y-3">
            <h4 class="text-xs font-bold text-stone-400 uppercase tracking-wider">Historial de Postulaciones</h4>
            
            <div v-if="loadingHistory" class="text-center py-4 bg-stone-50 rounded-xl">
              <div class="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
              <p class="text-xs text-stone-400 mt-2 font-body">Cargando historial...</p>
            </div>

            <div v-else-if="history.length === 0" class="bg-stone-50 border border-stone-150 rounded-xl p-6 text-center text-xs text-stone-400 font-body">
              El candidato no posee postulaciones registradas en el sistema.
            </div>

            <div v-else class="space-y-2">
              <div v-for="h in history" :key="h.id" 
                class="bg-stone-50/50 border border-stone-150 rounded-xl p-3 flex items-center justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-stone-800 truncate">{{ h.vacancyTitle }}</p>
                  <p class="text-[10px] text-stone-400 font-mono mt-0.5">
                    {{ h.vacancyCode }} &middot; Postulado: {{ new Date(h.createdAt).toLocaleDateString('es-ES') }}
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                    :class="{
                      'bg-blue-50 text-blue-700 border border-blue-100': h.administrativeStatus === 'nueva',
                      'bg-green-50 text-green-700 border border-green-100': h.administrativeStatus === 'revisada',
                      'bg-stone-100 text-stone-600': h.administrativeStatus === 'archivada',
                      'bg-red-50 text-red-600 border border-red-100': h.administrativeStatus === 'descartada'
                    }">
                    {{ h.administrativeStatus }}
                  </span>
                  
                  <div class="flex gap-1.5 shrink-0">
                    <button @click="previewHistoryCv(h)"
                      class="text-[10px] bg-white border border-stone-200 hover:bg-stone-100 font-bold text-stone-600 py-1.5 px-2.5 rounded-lg transition-colors">
                      Ver CV
                    </button>
                    <button @click="downloadHistoryCv(h)"
                      class="text-[10px] bg-white border border-stone-200 hover:bg-stone-100 font-bold text-stone-600 py-1.5 px-2.5 rounded-lg transition-colors">
                      Descargar CV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Observaciones Internas Confidenciales -->
          <div class="border-t border-amber-100 bg-amber-50/20 p-4 rounded-2xl space-y-3">
            <h4 class="text-xs font-bold text-amber-800 uppercase tracking-wider">Anotaciones y Observaciones Internas</h4>
            <p class="text-[10px] text-amber-600 font-body -mt-1">Historial confidencial de evaluación de talento corporativo.</p>
            <textarea v-model="observationText" rows="3" placeholder="Añade observaciones generales sobre el perfil del candidato para futuros procesos de selección..."
              class="w-full text-xs rounded-xl border border-stone-200 p-2.5 outline-none focus:border-brand-500 bg-white"></textarea>
            <button @click="saveObservation" :disabled="savingObservation"
              class="text-xs bg-brand-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-all">
              {{ savingObservation ? 'Guardando anotaciones...' : 'Guardar Anotaciones del Candidato' }}
            </button>
          </div>

        </div>

        <!-- Footer / Panel de Acciones -->
        <div class="p-5 border-t border-stone-200 bg-stone-50 flex flex-wrap justify-between items-center gap-3">
          
          <!-- Acción Derecho al Olvido (Eliminar) -->
          <button @click="deleteCandidate" 
            class="text-xs bg-red-50 border border-red-200 text-red-600 font-semibold px-4 py-2 rounded-xl hover:bg-red-100 transition-colors">
            Derecho al Olvido (Borrar Candidato)
          </button>

          <!-- Acción Archivo -->
          <div class="flex gap-2">
            <button v-if="selectedCandidate.status === 'activo'" @click="archiveCandidate"
              class="text-xs bg-stone-200 text-stone-700 font-semibold px-4 py-2 rounded-xl hover:bg-stone-300 transition-colors">
              Archivar Expediente
            </button>
            <button v-else @click="restoreCandidate"
              class="text-xs bg-brand-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors">
              Restaurar Expediente Activo
            </button>
          </div>

        </div>

      </div>
    </div>

    <!-- MODAL 2: Visor de PDF/Imagen de Currículum -->
    <div v-if="previewCvUrl" class="fixed inset-0 bg-stone-950/80 flex items-center justify-center z-50 p-4" @click.self="previewCvUrl = null">
      <div class="bg-white rounded-2xl w-full max-w-4xl h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div class="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50">
          <h3 class="font-display font-semibold text-stone-900">Previsualización del Currículum Vitae</h3>
          <button @click="previewCvUrl = null" class="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-all flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="p-2 bg-stone-100 flex-1 flex justify-center items-center overflow-auto">
          <img v-if="previewCvUrl.toLowerCase().includes('.jpg') || previewCvUrl.toLowerCase().includes('.png') || previewCvUrl.toLowerCase().includes('.jpeg')" 
            :src="previewCvUrl" alt="Curriculum Vitae" class="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
          <iframe v-else :src="previewCvUrl" class="w-full h-full rounded-lg border-0 bg-white"></iframe>
        </div>
      </div>
    </div>

  </div>
</template>
