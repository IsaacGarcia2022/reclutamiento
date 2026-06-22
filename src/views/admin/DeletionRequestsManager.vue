<script setup>
import { ref, onMounted, computed } from 'vue'
import ConsentService from '../../services/ConsentService'
import CandidateService from '../../services/CandidateService'
import CompanyService from '../../services/CompanyService'

const requests = ref([])
const expiredCandidates = ref([])
const retentionMonths = ref(12)
const activeTab = ref('requests') // 'requests' or 'purge'

const loading = ref(false)
const processing = ref(false)
const error = ref(null)
const successMessage = ref(null)

// Modal de Procesamiento de Solicitudes
const selectedRequest = ref(null)
const noteText = ref('')
const processingError = ref(null)

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  error.value = null
  try {
    // 1. Cargar solicitudes de eliminación
    requests.value = await ConsentService.getDeletionRequests()
    
    // 2. Cargar configuración de conservación
    const settings = await CompanyService.get()
    retentionMonths.value = settings.periodoConservacionMeses || 12
    
    // 3. Cargar candidatos expirados
    expiredCandidates.value = await ConsentService.getExpiredCandidates(retentionMonths.value)
  } catch (e) {
    console.error('Error cargando datos de privacidad:', e)
    error.value = 'No fue posible cargar la información de privacidad.'
  } finally {
    loading.value = false
  }
}

function openProcessModal(req) {
  selectedRequest.value = req
  noteText.value = req.observacion || ''
  processingError.value = null
}

function closeProcessModal() {
  selectedRequest.value = null
  noteText.value = ''
  processingError.value = null
}

async function updateRequestStatus(newStatus) {
  if (!selectedRequest.value) return
  
  processing.value = true
  processingError.value = null
  successMessage.value = null
  try {
    await ConsentService.updateDeletionRequestStatus(selectedRequest.value.id, {
      estado: newStatus,
      observacion: noteText.value.trim()
    })
    
    await loadData()
    closeProcessModal()
    successMessage.value = `La solicitud ha sido marcada como '${newStatus}' con éxito.`
  } catch (e) {
    processingError.value = e.message || 'Error al actualizar el estado de la solicitud.'
  } finally {
    processing.value = false
  }
}

async function processAndPurgeData() {
  if (!selectedRequest.value) return
  
  const confirmMsg = '¿Está seguro de que desea eliminar permanentemente a este candidato? Esta acción borrará físicamente sus datos personales, postulaciones, respuestas a cuestionarios y archivos adjuntos (CV). Es irreversible.'
  if (!confirm(confirmMsg)) return
  
  processing.value = true
  processingError.value = null
  successMessage.value = null
  
  try {
    const candidateId = selectedRequest.value.candidato_id
    
    // 1. Si existe vinculación a un candidato en el sistema, realizar borrado físico.
    if (candidateId) {
      await CandidateService.delete(candidateId)
    }
    
    // 2. Actualizar el estado de la solicitud a 'completada' registrando quién y cuándo procesó.
    await ConsentService.updateDeletionRequestStatus(selectedRequest.value.id, {
      estado: 'completada',
      observacion: noteText.value.trim()
    })
    
    await loadData()
    closeProcessModal()
    successMessage.value = 'Expediente del candidato purgado físicamente y solicitud registrada como completada.'
  } catch (e) {
    processingError.value = e.message || 'Error durante el procesamiento del borrado de datos.'
  } finally {
    processing.value = false
  }
}

async function runConservationPurge() {
  const count = expiredCandidates.value.length
  if (count === 0) return
  
  const confirmMsg = `¿Está seguro de que desea purgar permanentemente a los ${count} candidatos que excedieron el límite de ${retentionMonths.value} meses de conservación? Se eliminarán físicamente todos sus datos personales y archivos, conservando el registro inmutable en la bitácora de auditoría. Esta acción es irreversible.`
  if (!confirm(confirmMsg)) return
  
  processing.value = true
  error.value = null
  successMessage.value = null
  
  try {
    const purgedCount = await ConsentService.purgeExpiredCandidates(retentionMonths.value)
    successMessage.value = `Limpieza completada con éxito. Se purgaron permanentemente ${purgedCount} expedientes de candidatos expirados.`
    await loadData()
  } catch (e) {
    error.value = e.message || 'Error durante la purga por política de conservación.'
  } finally {
    processing.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado de la página -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="font-display text-xl font-bold text-stone-900">Privacidad y Consentimiento de Datos</h2>
        <p class="mt-1 text-sm text-stone-500 font-body">Cumplimiento regulatorio, derecho al olvido y políticas de conservación de información.</p>
      </div>
    </div>

    <!-- Mensajes Generales -->
    <div v-if="error" class="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl text-sm font-body">
      <strong>Error:</strong> {{ error }}
    </div>
    <div v-if="successMessage" class="bg-green-50 border border-green-150 text-green-800 p-4 rounded-xl text-sm font-body flex items-center justify-between">
      <span>{{ successMessage }}</span>
      <button @click="successMessage = null" class="text-green-600 hover:text-green-800 font-bold ml-2">×</button>
    </div>

    <!-- Pestañas de control -->
    <div class="border-b border-stone-200">
      <nav class="flex gap-6 -mb-px">
        <button 
          @click="activeTab = 'requests'"
          class="pb-4 text-sm font-semibold border-b-2 transition"
          :class="activeTab === 'requests' ? 'border-brand-600 text-brand-700' : 'border-transparent text-stone-500 hover:text-stone-700'"
        >
          Solicitudes de Eliminación ({{ requests.length }})
        </button>
        <button 
          @click="activeTab = 'purge'"
          class="pb-4 text-sm font-semibold border-b-2 transition flex items-center gap-1.5"
          :class="activeTab === 'purge' ? 'border-brand-600 text-brand-700' : 'border-transparent text-stone-500 hover:text-stone-700'"
        >
          Limpieza de Conservación (GDPR)
          <span v-if="expiredCandidates.length > 0" class="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
            {{ expiredCandidates.length }}
          </span>
        </button>
      </nav>
    </div>

    <!-- CONTENIDO: SOLICITUDES DE ELIMINACIÓN -->
    <div v-if="activeTab === 'requests'" class="space-y-4">
      <div v-if="loading" class="text-center py-16 text-stone-400 font-body text-sm">
        <div class="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
        Cargando solicitudes de eliminación...
      </div>

      <div v-else-if="requests.length === 0" class="card border border-stone-200 p-8 text-center text-stone-400 font-body text-sm">
        No se han registrado solicitudes de eliminación de datos de candidatos.
      </div>

      <div v-else class="card border border-stone-200/80 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-stone-50 text-stone-400 text-[11px] font-bold uppercase tracking-wider border-b border-stone-100">
                <th class="px-6 py-4">Solicitante / Candidato</th>
                <th class="px-6 py-4">Motivo de Solicitud</th>
                <th class="px-6 py-4">Fecha Solicitud</th>
                <th class="px-6 py-4">Estado</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100 text-sm font-body text-stone-750">
              <tr v-for="req in requests" :key="req.id" class="hover:bg-stone-50/50 transition">
                <td class="px-6 py-4.5">
                  <div class="font-semibold text-stone-850">
                    {{ req.candidato ? `${req.candidato.nombres} ${req.candidato.apellidos}` : 'No encontrado / Eliminado' }}
                  </div>
                  <div class="text-xs text-stone-400 mt-0.5">{{ req.correo }}</div>
                </td>
                <td class="px-6 py-4.5">
                  <p class="line-clamp-2 max-w-xs text-xs text-stone-600" :title="req.motivo">{{ req.motivo }}</p>
                </td>
                <td class="px-6 py-4.5 text-xs text-stone-500">
                  {{ formatDate(req.fecha_solicitud) }}
                </td>
                <td class="px-6 py-4.5">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    :class="{
                      'bg-stone-100 text-stone-700': req.estado === 'recibida',
                      'bg-blue-50 text-blue-700 border border-blue-100': req.estado === 'en_revision',
                      'bg-green-50 text-green-700 border border-green-100': req.estado === 'completada',
                      'bg-red-50 text-red-700 border border-red-100': req.estado === 'rechazada',
                    }"
                  >
                    {{ req.estado }}
                  </span>
                </td>
                <td class="px-6 py-4.5 text-right">
                  <button 
                    @click="openProcessModal(req)"
                    class="btn btn-secondary px-3.5 py-1.5 text-xs font-semibold"
                  >
                    Gestionar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- CONTENIDO: LIMPIEZA DE CONSERVACIÓN -->
    <div v-if="activeTab === 'purge'" class="space-y-6">
      <div class="bg-stone-50 rounded-2xl p-5 border border-stone-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1.5 max-w-2xl">
          <h4 class="font-display font-semibold text-stone-850 text-base flex items-center gap-1.5">
            <svg class="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            Política de Conservación: {{ retentionMonths }} Meses
          </h4>
          <p class="text-xs text-stone-500 font-body leading-relaxed">
            De acuerdo con tu configuración actual, se considera candidato inactivo a cualquier perfil cuya postulación o creación sea mayor a <strong>{{ retentionMonths }} meses</strong>. Se recomienda realizar una purga periódica de estos expedientes para cumplir con la legislación.
          </p>
        </div>
        <div class="shrink-0">
          <button 
            @click="runConservationPurge"
            :disabled="expiredCandidates.length === 0 || processing"
            class="bg-amber-600 hover:bg-amber-700 text-white font-bold font-display px-5 py-3 rounded-xl text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-2"
          >
            <svg v-if="processing" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Purgar {{ expiredCandidates.length }} Candidatos Expirados
          </button>
        </div>
      </div>

      <div v-if="loading" class="text-center py-16 text-stone-400 font-body text-sm">
        <div class="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
        Calculando candidatos expirados...
      </div>

      <div v-else-if="expiredCandidates.length === 0" class="card border border-stone-200 p-8 text-center text-stone-400 font-body text-sm">
        Excelente. No se encontraron perfiles de candidatos activos que excedan el límite de conservación establecido.
      </div>

      <div v-else class="card border border-stone-200/80 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-stone-50 text-stone-400 text-[11px] font-bold uppercase tracking-wider border-b border-stone-100">
                <th class="px-6 py-4">Candidato</th>
                <th class="px-6 py-4">Correo</th>
                <th class="px-6 py-4">Fecha de Registro</th>
                <th class="px-6 py-4">Última Actividad</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100 text-sm font-body text-stone-750">
              <tr v-for="cand in expiredCandidates" :key="cand.id" class="hover:bg-stone-50/50 transition">
                <td class="px-6 py-4">
                  <div class="font-semibold text-stone-850">
                    {{ cand.nombres }} {{ cand.apellidos }}
                  </div>
                </td>
                <td class="px-6 py-4 text-stone-600">{{ cand.correo }}</td>
                <td class="px-6 py-4 text-xs text-stone-500">
                  {{ formatDate(cand.created_at) }}
                </td>
                <td class="px-6 py-4 text-xs text-stone-500 font-medium">
                  {{ formatDate(cand.ultima_actividad) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL DE GESTIÓN DE SOLICITUD -->
    <div v-if="selectedRequest" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-stone-900 bg-opacity-75 transition-opacity" @click="closeProcessModal"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div class="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full border border-stone-150">
          
          <div class="bg-white px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
            <div class="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
              <div>
                <h3 class="text-lg font-bold font-display text-stone-900" id="modal-title">
                  Gestionar Solicitud de Borrado
                </h3>
                <p class="text-xs text-stone-400 font-body mt-0.5">ID: {{ selectedRequest.id }}</p>
              </div>
              <button @click="closeProcessModal" class="text-stone-400 hover:text-stone-600 text-xl font-bold">×</button>
            </div>

            <!-- Error de Modal -->
            <div v-if="processingError" class="bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-xs font-body mb-4">
              {{ processingError }}
            </div>

            <!-- Información General -->
            <div class="space-y-4 font-body text-sm">
              <div class="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-150 text-xs">
                <div>
                  <span class="block text-stone-400 font-semibold uppercase tracking-wider text-[10px]">Candidato</span>
                  <strong class="text-stone-800 text-sm">
                    {{ selectedRequest.candidato ? `${selectedRequest.candidato.nombres} ${selectedRequest.candidato.apellidos}` : 'No vinculado' }}
                  </strong>
                </div>
                <div>
                  <span class="block text-stone-400 font-semibold uppercase tracking-wider text-[10px]">Correo Registrado</span>
                  <strong class="text-stone-800 text-sm">{{ selectedRequest.correo }}</strong>
                </div>
                <div class="col-span-2">
                  <span class="block text-stone-400 font-semibold uppercase tracking-wider text-[10px]">Motivo de Solicitud</span>
                  <p class="text-stone-700 mt-1 whitespace-pre-line leading-relaxed">{{ selectedRequest.motivo }}</p>
                </div>
              </div>

              <!-- Registro de observaciones -->
              <div class="space-y-1.5">
                <label for="observations" class="block text-xs font-bold text-stone-500 uppercase tracking-wider font-body">Observaciones del Reclutador</label>
                <textarea 
                  id="observations" 
                  v-model="noteText" 
                  rows="3" 
                  placeholder="Detalla los avances, llamadas de verificación realizadas o motivos de rechazo..."
                  class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition text-sm text-[#17282d]"
                ></textarea>
              </div>

              <!-- Detalles de procesamiento si ya fue modificada antes -->
              <div v-if="selectedRequest.fecha_procesamiento" class="text-xs bg-stone-50 p-3 rounded-lg border text-stone-500 space-y-1">
                <div><strong>Último procesamiento:</strong> {{ formatDate(selectedRequest.fecha_procesamiento) }}</div>
                <div v-if="selectedRequest.perfil_procesador">
                  <strong>Responsable:</strong> {{ selectedRequest.perfil_procesador.nombres }} {{ selectedRequest.perfil_procesador.apellidos }}
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones de gestión -->
          <div class="bg-stone-50 px-6 py-4 sm:px-8 border-t border-stone-150 flex flex-wrap gap-2.5 justify-between items-center">
            <div>
              <button 
                type="button" 
                @click="processAndPurgeData"
                :disabled="processing || selectedRequest.estado === 'completada'"
                class="bg-red-650 hover:bg-red-700 text-white font-bold font-display px-4 py-2.5 rounded-xl text-xs shadow-sm transition disabled:opacity-50"
              >
                Procesar y Purgar Candidato
              </button>
            </div>
            
            <div class="flex gap-2.5">
              <button 
                type="button" 
                @click="updateRequestStatus('en_revision')"
                :disabled="processing || selectedRequest.estado === 'completada'"
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold font-display px-3 py-2.5 rounded-xl text-xs shadow-sm transition disabled:opacity-50"
              >
                En Revisión
              </button>
              <button 
                type="button" 
                @click="updateRequestStatus('rechazada')"
                :disabled="processing || selectedRequest.estado === 'completada'"
                class="bg-stone-600 hover:bg-stone-750 text-white font-bold font-display px-3 py-2.5 rounded-xl text-xs shadow-sm transition disabled:opacity-50"
              >
                Rechazar
              </button>
              <button 
                type="button" 
                @click="closeProcessModal" 
                class="btn btn-secondary px-4 py-2.5 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>
