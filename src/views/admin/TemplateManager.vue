<script setup>
import { ref, onMounted, computed } from 'vue'
import NotificationService from '../../services/NotificationService'

const templates = ref([])
const selectedTemplate = ref(null)
const loading = ref(false)
const saving = ref(false)
const activeTab = ref('edit') // 'edit' or 'preview'

const editingForm = ref({
  id: '',
  nombre: '',
  asunto: '',
  contenido_html: '',
  contenido_texto: '',
  estado: 'activo',
  variables_disponibles: []
})

// Fake candidate data for compiling preview
const mockVariables = {
  nombre_candidato: 'Sofía Rodríguez',
  nombre_vacante: 'Ingeniero de Software Senior (Full Stack)',
  codigo_vacante: 'VAC-2026-089',
  nombre_empresa: 'Megasoft Solutions El Salvador',
  fecha_postulacion: '22/06/2026'
}

onMounted(async () => {
  await loadTemplates()
})

async function loadTemplates () {
  loading.value = true
  try {
    templates.value = await NotificationService.listTemplates()
    if (templates.value.length > 0 && !selectedTemplate.value) {
      selectTemplate(templates.value[0])
    }
  } catch (e) {
    console.error('Error al cargar plantillas:', e)
    alert('Error al cargar plantillas: ' + e.message)
  } finally {
    loading.value = false
  }
}

function selectTemplate (tpl) {
  selectedTemplate.value = tpl
  editingForm.value = {
    id: tpl.id,
    nombre: tpl.nombre,
    asunto: tpl.asunto,
    contenido_html: tpl.contenido_html,
    contenido_texto: tpl.contenido_texto,
    estado: tpl.estado,
    variables_disponibles: tpl.variables_disponibles || []
  }
}

async function saveTemplate () {
  if (!editingForm.value.asunto.trim()) {
    alert('El asunto es requerido.')
    return
  }
  if (!editingForm.value.contenido_html.trim()) {
    alert('El contenido HTML es requerido.')
    return
  }
  if (!editingForm.value.contenido_texto.trim()) {
    alert('El contenido de texto plano es requerido.')
    return
  }

  saving.value = true
  try {
    const updated = await NotificationService.updateTemplate(editingForm.value.id, editingForm.value)
    if (updated) {
      // Actualizar en la lista local
      const idx = templates.value.findIndex(t => t.id === updated.id)
      if (idx !== -1) {
        templates.value[idx] = updated
      }
      selectedTemplate.value = updated
      alert('Plantilla guardada y actualizada con éxito.')
    }
  } catch (e) {
    console.error('Error al guardar la plantilla:', e)
    alert('Error al guardar la plantilla: ' + e.message)
  } finally {
    saving.value = false
  }
}

function getFriendlyName (nombre) {
  switch (nombre) {
    case 'confirmacion_postulacion':
      return 'Confirmación de postulación'
    case 'recepcion_cv':
      return 'Recepción de Currículum'
    case 'eliminacion_datos':
      return 'Eliminación de datos (GDPR)'
    default:
      return nombre
  }
}

// Live compilation computed properties
const compiledSubject = computed(() => {
  let text = editingForm.value.asunto || ''
  Object.keys(mockVariables).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    text = text.replace(regex, mockVariables[key])
  })
  return text
})

const compiledHtml = computed(() => {
  let text = editingForm.value.contenido_html || ''
  Object.keys(mockVariables).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    text = text.replace(regex, mockVariables[key])
  })
  return text
})

const compiledText = computed(() => {
  let text = editingForm.value.contenido_texto || ''
  Object.keys(mockVariables).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    text = text.replace(regex, mockVariables[key])
  })
  return text
})

// Helper to insert variables into subject or content textareas
const lastFocusedInput = ref('html') // 'subject', 'html', or 'text'
const subjectRef = ref(null)
const htmlRef = ref(null)
const textRef = ref(null)

function insertVariable (varName) {
  const token = `{{${varName}}}`
  if (lastFocusedInput.value === 'subject') {
    editingForm.value.asunto += token
  } else if (lastFocusedInput.value === 'html') {
    editingForm.value.contenido_html += token
  } else if (lastFocusedInput.value === 'text') {
    editingForm.value.contenido_texto += token
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between border-b border-stone-150 pb-4">
      <div>
        <h2 class="font-display text-xl font-bold text-stone-900">Plantillas de Notificación</h2>
        <p class="text-sm text-stone-500 font-body mt-0.5">Edita y previsualiza los correos automáticos enviados a los candidatos.</p>
      </div>
    </div>

    <div v-if="loading" class="text-center py-16 card border border-stone-200 shadow-sm">
      <div class="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
      <p class="mt-4 text-sm text-stone-400 font-body">Cargando plantillas de correo...</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Selector de Plantilla (Col 1-4) -->
      <div class="lg:col-span-4 space-y-4">
        <h3 class="text-xs font-bold text-stone-400 uppercase tracking-wider pl-1">Seleccionar Plantilla</h3>
        <div class="space-y-2">
          <button v-for="tpl in templates" :key="tpl.id"
            @click="selectTemplate(tpl)"
            class="w-full text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-1.5 focus:outline-none"
            :class="[
              selectedTemplate?.id === tpl.id 
                ? 'border-brand-600 bg-brand-50/20 shadow-md ring-1 ring-brand-500/10' 
                : 'border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50'
            ]">
            <div class="flex items-center justify-between w-full">
              <span class="font-display font-bold text-sm" :class="selectedTemplate?.id === tpl.id ? 'text-brand-800' : 'text-stone-850'">
                {{ getFriendlyName(tpl.nombre) }}
              </span>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
                :class="tpl.estado === 'activo' ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'">
                {{ tpl.estado }}
              </span>
            </div>
            <span class="text-xs font-mono text-stone-450 leading-tight">
              De: {{ tpl.nombre }}
            </span>
          </button>
        </div>
      </div>

      <!-- Editor y Previsualización (Col 5-12) -->
      <div class="lg:col-span-8">
        <div v-if="selectedTemplate" class="card border border-stone-200 shadow-sm overflow-hidden bg-white">
          <!-- Pestañas y Header -->
          <div class="flex items-center justify-between border-b border-stone-150 px-6 py-4 bg-stone-50">
            <div class="flex items-center gap-1.5 bg-stone-150/60 p-0.5 rounded-xl">
              <button @click="activeTab = 'edit'"
                class="px-4 py-1.5 rounded-lg text-xs font-bold font-display transition-all duration-200 focus:outline-none"
                :class="activeTab === 'edit' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-550 hover:text-stone-900'">
                Editor de Plantilla
              </button>
              <button @click="activeTab = 'preview'"
                class="px-4 py-1.5 rounded-lg text-xs font-bold font-display transition-all duration-200 focus:outline-none"
                :class="activeTab === 'preview' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-550 hover:text-stone-900'">
                Vista Previa Simulada
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button @click="saveTemplate" :disabled="saving"
                class="btn-accent px-4 py-1.5 text-xs font-bold flex items-center gap-1.5">
                <svg v-if="saving" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </div>

          <!-- PESTAÑA: Editor -->
          <div v-show="activeTab === 'edit'" class="p-6 space-y-5">
            <!-- Selector de Estado -->
            <div class="flex items-center justify-between bg-stone-50 rounded-xl p-3.5 border border-stone-100">
              <div>
                <p class="text-sm font-bold text-stone-800 font-display">Estado de la plantilla</p>
                <p class="text-xs text-stone-500 font-body mt-0.5">Define si esta plantilla se enviará automáticamente en los eventos del sistema.</p>
              </div>
              <div class="flex items-center gap-2 bg-stone-150/40 p-1 rounded-lg">
                <button type="button" @click="editingForm.estado = 'activo'"
                  class="px-3 py-1 rounded-md text-xs font-bold transition-all duration-200"
                  :class="editingForm.estado === 'activo' ? 'bg-green-500 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'">
                  Activo
                </button>
                <button type="button" @click="editingForm.estado = 'inactivo'"
                  class="px-3 py-1 rounded-md text-xs font-bold transition-all duration-200"
                  :class="editingForm.estado === 'inactivo' ? 'bg-stone-500 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'">
                  Inactivo
                </button>
              </div>
            </div>

            <!-- Variables Disponibles / Insertador -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-stone-400 uppercase tracking-wider">Variables Dinámicas Disponibles</label>
              <div class="bg-stone-50 rounded-xl p-4 border border-stone-150 space-y-2">
                <p class="text-xs text-stone-500 font-body">Haz clic en una variable para insertarla al final del campo activo:</p>
                <div class="flex flex-wrap gap-1.5 pt-1">
                  <button v-for="variable in editingForm.variables_disponibles" :key="variable"
                    @click="insertVariable(variable)"
                    type="button"
                    class="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-white border border-stone-200 text-stone-700 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50/30 transition-all duration-200 shadow-sm"
                    title="Insertar en el editor">
                    &#123;&#123;{{ variable }}&#125;&#125;
                  </button>
                </div>
              </div>
            </div>

            <!-- Asunto -->
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-stone-700 font-body">Asunto del Correo</label>
              <input ref="subjectRef" 
                @focus="lastFocusedInput = 'subject'"
                type="text" 
                v-model="editingForm.asunto"
                class="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-body focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors"
                placeholder="Escribe el asunto del correo..." />
            </div>

            <!-- Contenido HTML -->
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-stone-700 font-body">Contenido HTML</label>
              <textarea ref="htmlRef"
                @focus="lastFocusedInput = 'html'"
                v-model="editingForm.contenido_html"
                rows="10"
                class="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-xs font-mono focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors"
                placeholder="Cuerpo del correo en HTML..."></textarea>
            </div>

            <!-- Contenido Texto -->
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-stone-700 font-body">Cuerpo en Texto Plano (Respaldo)</label>
              <textarea ref="textRef"
                @focus="lastFocusedInput = 'text'"
                v-model="editingForm.contenido_texto"
                rows="6"
                class="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-xs font-mono focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors"
                placeholder="Cuerpo del correo en texto plano..."></textarea>
            </div>
          </div>

          <!-- PESTAÑA: Vista Previa -->
          <div v-show="activeTab === 'preview'" class="p-6 space-y-6">
            <!-- Simulated Mailbox Frame -->
            <div class="border border-stone-200 rounded-2xl overflow-hidden shadow-inner bg-stone-50">
              <!-- Mail Header -->
              <div class="bg-white border-b border-stone-150 p-4 space-y-2">
                <div class="flex items-center justify-between text-xs text-stone-400 font-body border-b border-stone-100 pb-2">
                  <span>✉️ Simulador de Correo Electrónico</span>
                  <span class="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Bandeja de Entrada del Candidato</span>
                </div>
                <div class="grid grid-cols-12 gap-1 text-xs font-body">
                  <span class="col-span-2 text-stone-450 font-semibold">De:</span>
                  <span class="col-span-10 text-stone-800 font-medium">reclutamiento@rrhh.corporativo</span>
                  
                  <span class="col-span-2 text-stone-450 font-semibold">Para:</span>
                  <span class="col-span-10 text-stone-800 font-medium">{{ mockVariables.nombre_candidato }} &lt;sofia.rod@example.com&gt;</span>
                  
                  <span class="col-span-2 text-stone-450 font-semibold">Asunto:</span>
                  <span class="col-span-10 text-stone-900 font-bold font-display text-sm">{{ compiledSubject }}</span>
                </div>
              </div>

              <!-- Mail HTML Content Rendering -->
              <div class="bg-white p-6 min-h-[300px] border-b border-stone-150">
                <div class="prose max-w-none text-stone-800 font-body email-preview-container" v-html="compiledHtml"></div>
              </div>

              <!-- Plain Text Respaldo Panel -->
              <div class="p-4 bg-stone-100/50">
                <p class="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Versión en Texto Plano (Móviles/Respaldo)</p>
                <pre class="text-xs text-stone-600 font-mono whitespace-pre-wrap leading-relaxed">{{ compiledText }}</pre>
              </div>
            </div>

            <!-- Banner Informativo -->
            <div class="bg-brand-50/30 text-brand-850 p-4 rounded-xl text-xs font-body border border-brand-100/60 leading-relaxed">
              <strong>💡 Nota de Simulación:</strong> Las variables dinámicas enmarcadas con doble llave como <code>&#123;&#123;nombre_candidato&#125;&#125;</code> han sido reemplazadas en tiempo real con datos de prueba estructurados para validar la composición exacta de los correos automáticos.
            </div>
          </div>
        </div>

        <div v-else class="text-center py-20 card border border-stone-200 shadow-sm bg-white">
          <svg class="w-12 h-12 text-stone-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p class="text-stone-500 font-medium font-display text-base">No hay ninguna plantilla seleccionada.</p>
          <p class="text-xs text-stone-400 font-body mt-1">Por favor elige una plantilla en el panel lateral para iniciar la edición.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Clean typography and structure inside email preview compiledHtml */
.email-preview-container h2 {
  font-family: ui-sans-serif, system-ui, sans-serif;
  color: #1c1917;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
}
.email-preview-container p {
  margin-bottom: 0.85rem;
  line-height: 1.6;
}
.email-preview-container strong {
  font-weight: 600;
  color: #0c0a09;
}
</style>
