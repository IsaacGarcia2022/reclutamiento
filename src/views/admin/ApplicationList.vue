<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useVacanciesStore } from '../../stores/vacancies'
import { useApplicationsStore } from '../../stores/applications'
import ApplicationService from '../../services/ApplicationService'
import DocumentService from '../../services/DocumentService'
import AuditService from '../../services/AuditService'

const route = useRoute()
const vacancies = useVacanciesStore()
const applications = useApplicationsStore()

const v = computed(() => vacancies.current)
const apps = computed(() => applications.getByVacancyId(route.params.id))

const activeFilter = ref('nueva')
const selectedApp = ref(null)
const previewCvUrl = ref(null)
const observationText = ref('')
const savingObservation = ref(false)
const candidateAnswers = ref([])
const loadingAnswers = ref(false)

const applicationDocuments = ref([])
const loadingDocs = ref(false)

const counts = computed(() => {
  const list = apps.value || []
  return {
    nueva: list.filter(a => a.administrativeStatus === 'nueva').length,
    revisada: list.filter(a => a.administrativeStatus === 'revisada').length,
    archivada: list.filter(a => a.administrativeStatus === 'archivada').length,
    descartada: list.filter(a => a.administrativeStatus === 'descartada').length,
    todas: list.length
  }
})

const filteredApps = computed(() => {
  const list = apps.value || []
  if (activeFilter.value === 'todas') return list
  return list.filter(a => a.administrativeStatus === activeFilter.value)
})

onMounted(async () => {
  await vacancies.fetchById(route.params.id)
  await applications.fetchByVacancy(route.params.id)
})

async function loadApplicationDocuments (applicationId) {
  loadingDocs.value = true
  applicationDocuments.value = []
  try {
    applicationDocuments.value = await DocumentService.listByApplication(applicationId)
  } catch (e) {
    console.error('Error al cargar documentos de la postulación:', e)
  } finally {
    loadingDocs.value = false
  }
}

async function viewDetails (app) {
  selectedApp.value = app
  observationText.value = app.internalObservation || ''
  AuditService.record({ accion: 'consulta_postulacion', modulo: 'postulaciones', entidad: 'postulacion', entidadId: app.id, descripcion: `Consulta de postulación de ${app.name || app.email || 'candidato'}` }).catch(() => {})
  
  candidateAnswers.value = []
  loadingAnswers.value = true
  try {
    candidateAnswers.value = await ApplicationService.getAnswers(app.id)
    await loadApplicationDocuments(app.id)
  } catch (e) {
    console.error('Error cargando respuestas complementarias:', e)
  } finally {
    loadingAnswers.value = false
  }
}

async function previewCv (app) {
  const doc = applicationDocuments.value.find(d => d.tipo_documento === 'curriculum')
  if (doc) {
    try {
      const res = await DocumentService.downloadDocument(doc.id)
      previewCvUrl.value = res.signedUrl
    } catch (e) {
      alert('No fue posible previsualizar el currículum: ' + e.message)
    }
  } else {
    // Fallback
    try {
      const url = await ApplicationService.getCvSignedUrl(app.cv)
      previewCvUrl.value = url
    } catch (e) {
      alert('No fue posible cargar el currículum: ' + e.message)
    }
  }
}

async function downloadCv (app) {
  const doc = applicationDocuments.value.find(d => d.tipo_documento === 'curriculum')
  if (doc) {
    try {
      const res = await DocumentService.downloadDocument(doc.id)
      const link = document.createElement('a')
      link.href = res.signedUrl
      link.download = res.nombreOriginal
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      alert('No fue posible descargar el archivo: ' + e.message)
    }
  } else {
    // Fallback
    try {
      const url = await ApplicationService.getCvSignedUrl(app.cv)
      const link = document.createElement('a')
      link.href = url
      link.download = app.cvFileName || 'curriculum'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      alert('No fue posible descargar el archivo: ' + e.message)
    }
  }
}

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

async function previewDocument (docId) {
  try {
    const res = await DocumentService.downloadDocument(docId)
    previewCvUrl.value = res.signedUrl
  } catch (e) {
    alert('Error al previsualizar el documento: ' + e.message)
  }
}

async function updateStatus (app, newStatus) {
  try {
    const updated = await applications.updateStatus(app.id, v.value.id, newStatus)
    if (updated) {
      selectedApp.value = updated
      // Si se cambia de estado y ya no aplica al filtro activo, cerramos modal o mantenemos detalles
    }
  } catch (e) {
    alert('Error al actualizar el estado: ' + e.message)
  }
}

async function saveObservation () {
  if (!selectedApp.value) return
  savingObservation.value = true
  try {
    const updated = await applications.addObservation(selectedApp.value.id, v.value.id, observationText.value)
    if (updated) {
      selectedApp.value = updated
      alert('Observación guardada correctamente.')
    }
  } catch (e) {
    alert('Error al guardar la observación: ' + e.message)
  } finally {
    savingObservation.value = false
  }
}

function restoreStatus (app) {
  // Restaurar: si tiene observaciones o fue revisada previamente, la pasamos a 'revisada', sino a 'nueva'
  const targetStatus = (app.internalObservation || app.reviewDate) ? 'revisada' : 'nueva'
  updateStatus(app, targetStatus)
}

function exportToCsv () {
  const data = apps.value
  if (!data || data.length === 0) {
    alert('No hay postulaciones para exportar.')
    return
  }
  
  const headers = [
    'ID', 'Fecha Postulacion', 'Nombres', 'Apellidos', 'Correo', 'Telefono', 'Ubicacion',
    'Nivel Academico', 'Profesion Oficio', 'Documento Identidad', 'Anios Experiencia',
    'Ultimo Puesto', 'Disponibilidad', 'Expectativa Salarial', 'LinkedIn', 'Portafolio',
    'Fuente Reclutamiento', 'Estado Administrativo', 'Observacion Interna',
    'Direccion IP', 'Navegador'
  ]
  
  const rows = data.map(app => [
    app.id,
    new Date(app.createdAt).toLocaleString('es-ES'),
    app.firstName,
    app.lastName,
    app.email,
    app.phone,
    app.location,
    app.academicLevel,
    app.profession,
    app.identityDocument || '',
    app.yearsExperience || '',
    app.lastPosition || '',
    app.availability || '',
    app.salaryExpectation || '',
    app.linkedinUrl || '',
    app.portfolioUrl || '',
    app.recruitmentSource || '',
    app.administrativeStatus,
    app.internalObservation || '',
    app.ipAddress || '',
    app.browser || ''
  ])
  
  // Agregar BOM de UTF-8 para compatibilidad directa con Excel en Español
  const csvContent = "\uFEFF" + [
    headers.join(','),
    ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `Postulaciones_${v.value?.codigo || 'Vacante'}_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div>
    <!-- Encabezado de la página -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <router-link to="/admin/vacantes" class="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-brand-600 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Volver a vacantes
        </router-link>
        <h2 class="font-display text-xl font-bold text-stone-900 mt-3" v-if="v">Postulaciones: {{ v.title }}</h2>
        <p v-if="v" class="text-sm text-stone-500 font-body mt-0.5">{{ v.codigo }} &middot; {{ v.company }}</p>
      </div>

      <!-- Acción Exportar -->
      <button @click="exportToCsv" :disabled="!apps || apps.length === 0"
        class="btn btn-secondary px-4 py-2 text-sm flex items-center gap-2 hover:bg-stone-50">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        Exportar Resultados (CSV)
      </button>
    </div>

    <!-- Pestañas Filtros de Estados -->
    <div class="flex border-b border-stone-200 mb-6 overflow-x-auto gap-2">
      <button 
        v-for="tab in ['nueva', 'revisada', 'archivada', 'descartada', 'todas']" 
        :key="tab"
        @click="activeFilter = tab"
        class="px-4 py-2.5 text-sm font-semibold border-b-2 capitalize transition-all whitespace-nowrap flex items-center gap-1.5"
        :class="activeFilter === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-stone-500 hover:text-stone-700'"
      >
        <span>{{ tab === 'todas' ? 'Todas' : tab }}</span>
        <span class="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-full font-mono font-medium">
          {{ counts[tab] }}
        </span>
      </button>
    </div>

    <!-- Cargando -->
    <div v-if="applications.loading" class="text-center py-12">
      <div class="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
      <p class="mt-4 text-sm text-stone-400">Cargando postulaciones desde el servidor...</p>
    </div>

    <!-- Listado vacío -->
    <div v-else-if="filteredApps.length === 0" class="card border border-stone-100 p-10 text-center">
      <div class="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto">
        <svg class="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
      </div>
      <p class="mt-4 text-stone-500 font-medium font-display">No hay postulaciones en este estado</p>
      <p class="text-sm text-stone-400 mt-1">Las candidaturas en estado "{{ activeFilter }}" aparecerán aquí.</p>
    </div>

    <!-- Lista de postulaciones -->
    <div v-else class="grid grid-cols-1 gap-3">
      <div v-for="app in filteredApps" :key="app.id" class="card border border-stone-150 p-5 hover:shadow-md transition-shadow">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="font-display font-bold text-stone-900">{{ app.name }}</h3>
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                :class="{
                  'bg-blue-50 text-blue-700 border border-blue-100': app.administrativeStatus === 'nueva',
                  'bg-green-50 text-green-700 border border-green-100': app.administrativeStatus === 'revisada',
                  'bg-stone-100 text-stone-600': app.administrativeStatus === 'archivada',
                  'bg-red-50 text-red-600 border border-red-100': app.administrativeStatus === 'descartada'
                }">
                {{ app.administrativeStatus }}
              </span>
            </div>
            <p class="text-sm text-stone-500 font-body mt-1">
              {{ app.profession }} &middot; {{ app.academicLevel }}
            </p>
            <p class="text-xs text-stone-400 font-body mt-1">
              {{ app.email }} &middot; {{ app.phone }} &middot; {{ app.location }}
            </p>
          </div>
          
          <div class="flex flex-row sm:flex-col items-end gap-2 shrink-0">
            <span class="text-xs text-stone-400 font-mono">{{ new Date(app.createdAt).toLocaleDateString('es-ES') }}</span>
            <button @click="viewDetails(app)"
              class="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition-all">
              Ver Detalles / Gestionar
            </button>
          </div>
        </div>

        <div v-if="app.internalObservation" class="mt-3 bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-xs text-stone-700 leading-relaxed font-body">
          <strong>Observación interna:</strong> "{{ app.internalObservation }}"
        </div>
      </div>
    </div>

    <!-- MODAL 1: Detalle Completo de Postulación -->
    <div v-if="selectedApp" class="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-45 p-4 overflow-y-auto" @click.self="selectedApp = null">
      <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col my-8">
        <!-- Cabecera -->
        <div class="flex items-center justify-between p-5 border-b border-stone-200 bg-stone-50">
          <div>
            <h3 class="font-display font-bold text-lg text-stone-900">{{ selectedApp.name }}</h3>
            <p class="text-xs text-stone-500 font-body mt-0.5">Postulante para la oferta laboral</p>
          </div>
          <button @click="selectedApp = null" class="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 transition-all flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Contenido (Scrollable) -->
        <div class="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-stone-800">
          
          <!-- Ficha de Datos Personales y Profesionales -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 class="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Datos de Contacto</h4>
              <ul class="space-y-1.5 font-body">
                <li><strong class="text-stone-700">Correo:</strong> {{ selectedApp.email }}</li>
                <li><strong class="text-stone-700">Teléfono:</strong> {{ selectedApp.phone }}</li>
                <li><strong class="text-stone-700">Ubicación:</strong> {{ selectedApp.location }}</li>
                <li v-if="selectedApp.identityDocument"><strong class="text-stone-700">Documento:</strong> {{ selectedApp.identityDocument }}</li>
              </ul>
            </div>
            <div>
              <h4 class="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Perfil Académico y Laboral</h4>
              <ul class="space-y-1.5 font-body">
                <li><strong class="text-stone-700">Profesión:</strong> {{ selectedApp.profession }}</li>
                <li><strong class="text-stone-700">Nivel Académico:</strong> {{ selectedApp.academicLevel }}</li>
                <li v-if="selectedApp.yearsExperience"><strong class="text-stone-700">Experiencia:</strong> {{ selectedApp.yearsExperience }} años</li>
                <li v-if="selectedApp.ultimoPuesto"><strong class="text-stone-700">Último puesto:</strong> {{ selectedApp.lastPosition }}</li>
              </ul>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-100 pt-4" v-if="selectedApp.availability || selectedApp.salaryExpectation || selectedApp.linkedinUrl || selectedApp.portfolioUrl">
            <div>
              <h4 class="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Condiciones</h4>
              <ul class="space-y-1.5 font-body">
                <li v-if="selectedApp.availability"><strong class="text-stone-700">Disponibilidad:</strong> {{ selectedApp.availability }}</li>
                <li v-if="selectedApp.salaryExpectation"><strong class="text-stone-700">Expectativa Salarial:</strong> ${{ selectedApp.salaryExpectation }}</li>
              </ul>
            </div>
            <div>
              <h4 class="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Enlaces</h4>
              <div class="flex flex-wrap gap-2 mt-1">
                <a v-if="selectedApp.linkedinUrl" :href="selectedApp.linkedinUrl" target="_blank"
                  class="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-lg border border-blue-100">
                  LinkedIn
                </a>
                <a v-if="selectedApp.portfolioUrl" :href="selectedApp.portfolioUrl" target="_blank"
                  class="inline-flex items-center gap-1 text-xs bg-stone-50 text-stone-700 font-semibold px-2.5 py-1 rounded-lg border border-stone-200">
                  Portafolio
                </a>
              </div>
            </div>
          </div>

          <!-- Mensaje de presentación -->
          <div v-if="selectedApp.message" class="border-t border-stone-100 pt-4">
            <h4 class="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Mensaje del Candidato</h4>
            <p class="text-stone-600 bg-stone-50 rounded-xl p-4 leading-relaxed font-body italic">
              "{{ selectedApp.message }}"
            </p>
          </div>

          <!-- Carga de respuestas a preguntas adicionales -->
          <div v-if="loadingAnswers" class="border-t border-stone-100 pt-4 py-4 text-center">
            <div class="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
            <p class="text-xs text-stone-400 mt-2 font-body">Cargando respuestas complementarias...</p>
          </div>

          <div v-else-if="candidateAnswers.length > 0" class="border-t border-stone-100 pt-4 space-y-3">
            <h4 class="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Respuestas a Preguntas de la Oferta</h4>
            <div class="space-y-2.5 font-body">
              <div v-for="ans in candidateAnswers" :key="ans.id" class="bg-stone-50 border border-stone-150 rounded-xl p-3">
                <p class="text-xs font-semibold text-stone-700 leading-normal">{{ ans.question }}</p>
                <p class="text-sm text-stone-600 mt-1.5 font-medium leading-relaxed">
                  <template v-if="ans.type === 'si_no'">
                    <span class="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full" 
                      :class="ans.value ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'">
                      {{ ans.value ? 'Sí' : 'No' }}
                    </span>
                  </template>
                  <template v-else-if="ans.type === 'seleccion_multiple' && Array.isArray(ans.value)">
                    {{ ans.value.join(', ') }}
                  </template>
                  <template v-else>
                    {{ ans.value }}
                  </template>
                </p>
              </div>
            </div>
          </div>

          <!-- Currículum -->
          <div class="border-t border-stone-100 pt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 class="text-xs font-bold text-stone-400 uppercase tracking-wider">Currículum Vitae</h4>
              <p class="text-xs text-stone-500 font-body mt-0.5">Archivo privado guardado de forma segura</p>
            </div>
            <div class="flex gap-2">
              <button @click="previewCv(selectedApp)"
                class="text-xs bg-brand-50 text-brand-600 px-3.5 py-2 rounded-xl hover:bg-brand-100 transition-all font-semibold">
                Ver Currículum (Previsualizar)
              </button>
              <button @click="downloadCv(selectedApp)"
                class="text-xs bg-stone-100 text-stone-600 px-3.5 py-2 rounded-xl hover:bg-stone-200 transition-all font-semibold">
                Descargar Archivo
              </button>
            </div>
          </div>

          <!-- Documentos Complementarios de Postulación (2.9 Documentos) -->
          <div v-if="applicationDocuments && applicationDocuments.some(d => d.tipo_documento !== 'curriculum')" class="border-t border-stone-100 pt-4 space-y-3">
            <div>
              <h4 class="text-xs font-bold text-stone-400 uppercase tracking-wider">Documentos Complementarios de la Postulación</h4>
              <p class="text-xs text-stone-500 font-body mt-0.5">Archivos adicionales cargados por el postulante</p>
            </div>
            
            <div class="space-y-2">
              <div v-for="doc in applicationDocuments.filter(d => d.tipo_documento !== 'curriculum')" :key="doc.id" 
                class="bg-stone-50/50 border border-stone-150 rounded-xl p-3 flex items-center justify-between gap-4 text-xs font-body">
                <div class="min-w-0 flex items-start gap-2.5">
                  <!-- Icono según tipo de documento -->
                  <div class="p-2 bg-brand-50 text-brand-700 rounded-lg shrink-0 mt-0.5">
                    <svg v-if="doc.tipo_documento === 'carta_presentacion'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <svg v-else-if="doc.tipo_documento === 'certificado'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z"/></svg>
                    <svg v-else-if="doc.tipo_documento === 'portafolio'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold text-stone-850 truncate" :title="doc.nombre_original">{{ doc.nombre_original }}</p>
                    <p class="text-[10px] text-stone-400 font-mono mt-0.5">
                      <span class="capitalize font-semibold text-brand-700">{{ doc.tipo_documento.replace('_', ' ') }}</span>
                      &middot; {{ (doc.tamanio / (1024 * 1024)).toFixed(2) }} MB
                    </p>
                  </div>
                </div>
                <div class="flex gap-1.5 shrink-0 items-center">
                  <button @click="previewDocument(doc.id)"
                    class="text-[10px] bg-white border border-stone-200 hover:bg-stone-100 font-bold text-stone-600 py-1.5 px-2.5 rounded-lg transition-colors">
                    Ver
                  </button>
                  <button @click="downloadDocument(doc.id)"
                    class="text-[10px] bg-white border border-stone-200 hover:bg-stone-100 font-bold text-stone-600 py-1.5 px-2.5 rounded-lg transition-colors">
                    Descargar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Datos de Auditoría e IP del sistema -->
          <div class="border-t border-stone-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-400 font-mono">
            <div>
              <p>Fuente: {{ selectedApp.recruitmentSource || 'No especificada' }}</p>
              <p>IP: {{ selectedApp.ipAddress || '127.0.0.1' }}</p>
            </div>
            <div class="sm:text-right">
              <p>Fecha Postulación: {{ new Date(selectedApp.createdAt).toLocaleString('es-ES') }}</p>
              <p class="truncate" :title="selectedApp.browser">Navegador: {{ selectedApp.browser || 'Desconocido' }}</p>
            </div>
          </div>

          <!-- Sección Observación Interna -->
          <div class="border-t border-amber-100 bg-amber-50/20 p-4 rounded-2xl space-y-3">
            <h4 class="text-xs font-bold text-amber-800 uppercase tracking-wider">Observaciones de Selección</h4>
            <p class="text-[10px] text-amber-600 font-body -mt-1">Estas anotaciones son estrictamente internas y nunca serán visibles para el candidato.</p>
            <textarea v-model="observationText" rows="3" placeholder="Añade comentarios técnicos, anotaciones de descarte o notas internas sobre el candidato..."
              class="w-full text-xs rounded-xl border border-stone-200 p-2.5 outline-none focus:border-brand-500 bg-white"></textarea>
            <button @click="saveObservation" :disabled="savingObservation"
              class="text-xs bg-brand-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-all">
              {{ savingObservation ? 'Guardando...' : 'Guardar Observación Interna' }}
            </button>
          </div>
        </div>

        <!-- Footer / Panel de Acciones de Estado -->
        <div class="p-5 border-t border-stone-200 bg-stone-50 flex flex-wrap justify-between items-center gap-3">
          <div>
            <span class="text-xs text-stone-400 uppercase font-bold font-mono">Estado Actual:</span>
            <span class="ml-1.5 text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
              :class="{
                'bg-blue-50 text-blue-700 border border-blue-100': selectedApp.administrativeStatus === 'nueva',
                'bg-green-50 text-green-700 border border-green-100': selectedApp.administrativeStatus === 'revisada',
                'bg-stone-100 text-stone-600': selectedApp.administrativeStatus === 'archivada',
                'bg-red-50 text-red-600 border border-red-100': selectedApp.administrativeStatus === 'descartada'
              }">
              {{ selectedApp.administrativeStatus }}
            </span>
          </div>

          <!-- Operaciones Administrativas según estado -->
          <div class="flex gap-2">
            <!-- Caso: Nueva -->
            <template v-if="selectedApp.administrativeStatus === 'nueva'">
              <button @click="updateStatus(selectedApp, 'revisada')" class="text-xs bg-green-600 text-white font-semibold px-3 py-2 rounded-xl hover:bg-green-700 transition-colors">
                Marcar como Revisada
              </button>
              <button @click="updateStatus(selectedApp, 'archivada')" class="text-xs bg-stone-200 text-stone-700 font-semibold px-3 py-2 rounded-xl hover:bg-stone-300 transition-colors">
                Archivar
              </button>
              <button @click="updateStatus(selectedApp, 'descartada')" class="text-xs bg-red-500 text-white font-semibold px-3 py-2 rounded-xl hover:bg-red-600 transition-colors">
                Descartar Candidato
              </button>
            </template>

            <!-- Caso: Revisada -->
            <template v-else-if="selectedApp.administrativeStatus === 'revisada'">
              <button @click="updateStatus(selectedApp, 'archivada')" class="text-xs bg-stone-200 text-stone-700 font-semibold px-3 py-2 rounded-xl hover:bg-stone-300 transition-colors">
                Archivar
              </button>
              <button @click="updateStatus(selectedApp, 'descartada')" class="text-xs bg-red-500 text-white font-semibold px-3 py-2 rounded-xl hover:bg-red-600 transition-colors">
                Descartar Candidato
              </button>
            </template>

            <!-- Caso: Archivada o Descartada -->
            <template v-else-if="selectedApp.administrativeStatus === 'archivada' || selectedApp.administrativeStatus === 'descartada'">
              <button @click="restoreStatus(selectedApp)" class="text-xs bg-brand-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors">
                Restaurar Postulación
              </button>
            </template>
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
          <!-- Si el enlace contiene firma de imagen, cargarlo como img -->
          <img v-if="previewCvUrl.toLowerCase().includes('.jpg') || previewCvUrl.toLowerCase().includes('.png') || previewCvUrl.toLowerCase().includes('.jpeg')" 
            :src="previewCvUrl" alt="Curriculum Vitae" class="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
          <iframe v-else :src="previewCvUrl" class="w-full h-full rounded-lg border-0 bg-white"></iframe>
        </div>
      </div>
    </div>
  </div>
</template>
