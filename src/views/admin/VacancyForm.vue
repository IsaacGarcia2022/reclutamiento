<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVacanciesStore } from '../../stores/vacancies'
import AppInput from '../../components/AppInput.vue'
import AppTextarea from '../../components/AppTextarea.vue'
import AppSelect from '../../components/AppSelect.vue'
import VacancyQuestionsService from '../../services/VacancyQuestionsService'

const route = useRoute()
const router = useRouter()
const store = useVacanciesStore()

const edit = computed(() => !!route.params.id)
const loading = ref(false)
const image = ref(null)

const form = ref({
  codigo: '',
  titulo: '',
  departamentoEmpresaId: '',
  areaProfesionalId: '',
  ubicacionId: '',
  modalidadId: '',
  tipoContratoId: '',
  jornadaId: '',
  numeroPlazas: 1,
  descripcion: '',
  funciones: '',
  requisitos: '',
  nivelAcademicoId: '',
  experienciaMinima: '',
  habilidadesDeseadas: '',
  salarioMinimo: '',
  salarioMaximo: '',
  mostrarSalario: false,
  fechaPublicacion: '',
  fechaCierre: '',
  imagenUrl: ''
})

const questions = ref([])

const questionTypes = [
  { value: 'texto_corto', label: 'Texto Corto' },
  { value: 'texto_largo', label: 'Texto Largo' },
  { value: 'si_no', label: 'Sí / No' },
  { value: 'seleccion_unica', label: 'Selección Única' },
  { value: 'seleccion_multiple', label: 'Selección Múltiple' },
  { value: 'numero', label: 'Número' },
  { value: 'fecha', label: 'Fecha' }
]

const options = (category) => store.catalogs
  .filter(x => x.categoria === category)
  .map(x => ({ value: x.id, label: x.nombre }))

onMounted(async () => {
  await store.fetchCatalogs()
  if (edit.value) {
    await store.fetchById(route.params.id, true)
    const v = store.current
    if (v) {
      Object.assign(form.value, {
        codigo: v.codigo,
        titulo: v.titulo,
        departamentoEmpresaId: v.departamento_empresa_id || '',
        areaProfesionalId: v.area_profesional_id || '',
        ubicacionId: v.ubicacion_id || '',
        modalidadId: v.modalidad_id || '',
        tipoContratoId: v.tipo_contrato_id || '',
        jornadaId: v.jornada_id || '',
        numeroPlazas: v.numero_plazas,
        descripcion: v.descripcion,
        funciones: v.funciones || '',
        requisitos: v.requisitos,
        nivelAcademicoId: v.nivel_academico_id || '',
        experienciaMinima: v.experiencia_minima || '',
        habilidadesDeseadas: v.habilidades_deseadas || '',
        salarioMinimo: v.salario_minimo || '',
        salarioMaximo: v.salario_maximo || '',
        mostrarSalario: v.mostrar_salario,
        fechaPublicacion: v.fecha_publicacion || '',
        fechaCierre: v.fecha_cierre || '',
        imagenUrl: v.imagen_url || ''
      })
      
      try {
        const dbQs = await VacancyQuestionsService.getByVacancy(route.params.id)
        questions.value = dbQs.map(q => ({
          id: q.id,
          pregunta: q.pregunta,
          tipo_respuesta: q.tipo_respuesta,
          opciones: Array.isArray(q.opciones) ? q.opciones.join(', ') : '',
          obligatoria: q.obligatoria,
          activo: q.activo
        }))
      } catch (e) {
        console.error('Error cargando preguntas de la vacante:', e)
      }
    }
  }
})

function addQuestion () {
  questions.value.push({
    pregunta: '',
    tipo_respuesta: 'texto_corto',
    opciones: '',
    obligatoria: false,
    activo: true
  })
}

function removeQuestion (index) {
  questions.value.splice(index, 1)
}

function moveUp (index) {
  if (index === 0) return
  const temp = questions.value[index]
  questions.value[index] = questions.value[index - 1]
  questions.value[index - 1] = temp
}

function moveDown (index) {
  if (index === questions.value.length - 1) return
  const temp = questions.value[index]
  questions.value[index] = questions.value[index + 1]
  questions.value[index + 1] = temp
}

async function save (estado = 'borrador') {
  loading.value = true
  let imagenUrl = form.value.imagenUrl
  try {
    if (image.value) {
      imagenUrl = await (await import('../../services/VacancyService')).default.uploadImage(image.value)
    }
    const codigo = form.value.codigo.trim() || `VAC-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const payload = { ...form.value, codigo, imagenUrl, estado, id: route.params.id }
    const result = edit.value ? await store.update(payload) : await store.create(payload)
    
    if (result) {
      const targetId = edit.value ? route.params.id : result.id
      
      // Mapear opciones de string separado por comas a array JSON
      const processedQuestions = questions.value.map((q, idx) => {
        let opts = null
        if (['seleccion_unica', 'seleccion_multiple'].includes(q.tipo_respuesta)) {
          if (typeof q.opciones === 'string') {
            opts = q.opciones.split(',').map(s => s.trim()).filter(Boolean)
          } else if (Array.isArray(q.opciones)) {
            opts = q.opciones
          }
        }
        return {
          id: q.id || undefined,
          pregunta: q.pregunta,
          tipo_respuesta: q.tipo_respuesta,
          opciones: opts,
          obligatoria: q.obligatoria,
          activo: q.activo,
          orden: idx
        }
      })
      
      await VacancyQuestionsService.saveQuestions(targetId, processedQuestions)
      router.push('/admin/vacantes')
    }
  } catch (e) {
    console.error('Error al guardar la vacante y sus preguntas:', e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="mb-6 font-display text-xl font-bold">{{ edit ? 'Editar vacante' : 'Nueva vacante' }}</h2>
    <form @submit.prevent="save('borrador')" class="card space-y-6 border border-stone-100 p-6">
      
      <!-- Campos básicos -->
      <div class="grid gap-5 sm:grid-cols-2">
        <AppInput v-model="form.codigo" label="Código (opcional)" placeholder="Se genera automáticamente" />
        <AppInput v-model="form.titulo" label="Título *" placeholder="Ej. Analista de datos" required />
      </div>

      <div class="grid gap-5 sm:grid-cols-3">
        <AppSelect v-model="form.departamentoEmpresaId" label="Departamento" :options="options('departamento')" />
        <AppSelect v-model="form.areaProfesionalId" label="Área profesional" :options="options('area_profesional')" />
        <AppSelect v-model="form.ubicacionId" label="Ubicación" :options="options('ubicacion')" />
        <AppSelect v-model="form.modalidadId" label="Modalidad" :options="options('modalidad')" />
        <AppSelect v-model="form.tipoContratoId" label="Contrato" :options="options('tipo_contrato')" />
        <AppSelect v-model="form.jornadaId" label="Jornada" :options="options('jornada')" />
        <AppSelect v-model="form.nivelAcademicoId" label="Nivel académico" :options="options('nivel_academico')" />
        <AppInput v-model="form.numeroPlazas" label="Número de plazas" type="number" />
        <AppInput v-model="form.experienciaMinima" label="Experiencia mínima" placeholder="Ej. 2 años" />
      </div>

      <AppTextarea v-model="form.descripcion" label="Descripción *" rows="5" required />
      <AppTextarea v-model="form.funciones" label="Funciones" rows="4" />
      <AppTextarea v-model="form.requisitos" label="Requisitos *" rows="4" required />
      <AppTextarea v-model="form.habilidadesDeseadas" label="Habilidades deseadas" rows="3" />

      <div class="grid gap-5 sm:grid-cols-3">
        <AppInput v-model="form.salarioMinimo" label="Salario mínimo (USD)" type="number" />
        <AppInput v-model="form.salarioMaximo" label="Salario máximo (USD)" type="number" />
        <label class="flex items-center gap-2 pt-7 text-sm cursor-pointer select-none font-body">
          <input v-model="form.mostrarSalario" type="checkbox" class="rounded border-stone-300 text-brand-600 focus:ring-brand-500" />
          Mostrar salario
        </label>
        <AppInput v-model="form.fechaPublicacion" label="Fecha de publicación" type="date" />
        <AppInput v-model="form.fechaCierre" label="Fecha límite" type="date" />
        <label class="text-sm font-medium font-body">
          Imagen de vacante
          <input class="mt-2 block text-sm" type="file" accept="image/*" @change="e => image = e.target.files[0]" />
        </label>
      </div>

      <!-- SECCIÓN: Preguntas Adicionales -->
      <div class="border-t border-stone-200 pt-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-display font-bold text-base text-stone-900">Preguntas adicionales para candidatos</h3>
            <p class="text-xs text-stone-500 font-body mt-0.5">Define cuestionarios para capturar información extra de los candidatos al postularse.</p>
          </div>
          <button type="button" @click="addQuestion" class="btn btn-secondary px-4 py-2 text-xs flex items-center gap-1.5 hover:bg-stone-50">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Agregar pregunta
          </button>
        </div>

        <div v-if="questions.length === 0" class="bg-stone-50 border border-stone-150 rounded-xl p-6 text-center text-sm text-stone-400 font-body">
          No hay preguntas adicionales configuradas para esta vacante.
        </div>

        <div v-else class="space-y-4">
          <div v-for="(q, idx) in questions" :key="idx" class="card border border-stone-200 p-4 bg-stone-50/50 space-y-4">
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
              
              <!-- Orden y título rápido -->
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs text-stone-400 font-bold bg-white border border-stone-200 rounded-lg w-6 h-6 flex items-center justify-center">
                  {{ idx + 1 }}
                </span>
                <span class="text-xs font-semibold text-stone-600">Pregunta Complementaria</span>
              </div>

              <!-- Reordenamiento y eliminar -->
              <div class="flex items-center gap-1.5 ml-auto sm:ml-0">
                <button type="button" @click="moveUp(idx)" :disabled="idx === 0" 
                  class="p-1.5 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-30 transition-all">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
                </button>
                <button type="button" @click="moveDown(idx)" :disabled="idx === questions.length - 1" 
                  class="p-1.5 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-30 transition-all">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <button type="button" @click="removeQuestion(idx)" 
                  class="p-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-all ml-2">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>

            <!-- Campos de edición de la pregunta -->
            <div class="grid gap-4 grid-cols-1 md:grid-cols-12 bg-white border border-stone-150 p-4 rounded-xl">
              <div class="md:col-span-6">
                <AppInput v-model="q.pregunta" label="Enunciado de la pregunta *" placeholder="Ej. ¿Tienes licencia de conducir vigente?" required />
              </div>
              <div class="md:col-span-3">
                <AppSelect v-model="q.tipo_respuesta" label="Tipo de Respuesta *" :options="questionTypes" placeholder="Seleccionar..." required />
              </div>
              
              <div class="md:col-span-3 flex items-center gap-6 pt-5 pl-2">
                <label class="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer select-none font-body">
                  <input type="checkbox" v-model="q.obligatoria" class="rounded border-stone-300 text-brand-600 focus:ring-brand-500" />
                  Obligatoria
                </label>
                <label class="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer select-none font-body">
                  <input type="checkbox" v-model="q.activo" class="rounded border-stone-300 text-brand-600 focus:ring-brand-500" />
                  Activa
                </label>
              </div>

              <!-- Listado de opciones si es selección única / múltiple -->
              <div class="md:col-span-12" v-if="['seleccion_unica', 'seleccion_multiple'].includes(q.tipo_respuesta)">
                <AppInput v-model="q.opciones" label="Opciones de respuesta (separadas por coma) *" 
                  placeholder="Ej: Licencia Liviana, Licencia Pesada, No tengo licencia" required />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p v-if="store.error" class="text-sm text-red-600 font-body">{{ store.error }}</p>

      <div class="flex gap-3">
        <button :disabled="loading" class="btn btn-secondary px-5 py-2.5 text-sm">
          Guardar borrador
        </button>
        <button type="button" :disabled="loading" @click="save('publicada')" class="btn btn-primary px-5 py-2.5 text-sm">
          Publicar vacante
        </button>
      </div>
    </form>
  </div>
</template>
