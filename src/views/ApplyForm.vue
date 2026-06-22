<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVacanciesStore } from '../stores/vacancies'
import { useApplicationsStore } from '../stores/applications'
import VacancyService from '../services/VacancyService'
import AppInput from '../components/AppInput.vue'
import AppSelect from '../components/AppSelect.vue'
import AppTextarea from '../components/AppTextarea.vue'

const route = useRoute()
const router = useRouter()
const vacancies = useVacanciesStore()
const applications = useApplicationsStore()

const v = computed(() => vacancies.current)
const success = ref(false)
const errors = ref({})
const showOptional = ref(false)

const academicLevels = ref([])
const recruitmentSources = ref([])
const rawCvFile = ref(null)

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  academicLevelId: '',
  profession: '',
  cv: null,
  cvFileName: '',
  privacyConsent: false,
  identityDocument: '',
  yearsExperience: '',
  lastPosition: '',
  availability: '',
  salaryExpectation: '',
  message: '',
  portfolioUrl: '',
  linkedinUrl: '',
  recruitmentSourceId: ''
})

onMounted(async () => {
  await vacancies.fetchById(route.params.id)
  try {
    const cats = await VacancyService.catalogs()
    academicLevels.value = cats
      .filter(c => c.categoria === 'nivel_academico' && c.activo)
      .map(c => ({ value: c.id, label: c.nombre }))
      
    recruitmentSources.value = cats.filter(c => c.categoria === 'fuente_reclutamiento' && c.activo)
    
    // Capturar fuente de reclutamiento desde los parámetros de la URL (?ref= o ?source=)
    const refParam = (route.query.ref || route.query.source || '').toString().trim().toLowerCase()
    if (refParam) {
      const matchedSource = recruitmentSources.value.find(s => s.nombre.toLowerCase().includes(refParam))
      if (matchedSource) {
        form.value.recruitmentSourceId = matchedSource.id
      }
    }
  } catch (e) {
    console.error('Error cargando los catálogos de base de datos:', e)
  }
})

function handleFile (e) {
  const file = e.target.files[0]
  if (!file) return
  
  // Validaciones básicas de tipo y tamaño
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]
  if (!allowedTypes.includes(file.type)) {
    errors.value.cvFile = 'Formato de currículum no válido. Solo se permite PDF, Word (.doc, .docx) o imágenes.'
    rawCvFile.value = null
    form.value.cvFileName = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    errors.value.cvFile = 'El archivo no puede superar los 5 MB.'
    rawCvFile.value = null
    form.value.cvFileName = ''
    return
  }
  
  rawCvFile.value = file
  form.value.cvFileName = file.name
  errors.value.cvFile = null
}

function validate () {
  const errs = {}
  
  // Validaciones obligatorias
  if (!form.value.firstName.trim()) errs.firstName = 'El nombre es obligatorio'
  if (!form.value.lastName.trim()) errs.lastName = 'El apellido es obligatorio'
  
  if (!form.value.email.trim()) errs.email = 'El correo electrónico es obligatorio'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) errs.email = 'El correo electrónico no es válido'
  
  if (!form.value.phone.trim()) errs.phone = 'El teléfono es obligatorio'
  if (!form.value.location.trim()) errs.location = 'La ubicación de residencia es obligatoria'
  if (!form.value.academicLevelId) errs.academicLevelId = 'El nivel académico es obligatorio'
  if (!form.value.profession.trim()) errs.profession = 'La profesión u oficio es obligatoria'
  
  if (!rawCvFile.value) errs.cvFile = 'Es obligatorio adjuntar tu currículum vitae'
  if (!form.value.privacyConsent) errs.privacyConsent = 'Debes otorgar tu consentimiento de privacidad para postularte'
  
  // Validaciones opcionales (si se rellenan)
  if (form.value.portfolioUrl.trim() && !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(form.value.portfolioUrl)) {
    errs.portfolioUrl = 'El enlace de portafolio debe ser una URL válida (con http:// o https://)'
  }
  if (form.value.linkedinUrl.trim() && !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(form.value.linkedinUrl)) {
    errs.linkedinUrl = 'El enlace de LinkedIn debe ser una URL válida (con http:// o https://)'
  }
  if (form.value.yearsExperience && (isNaN(parseFloat(form.value.yearsExperience)) || parseFloat(form.value.yearsExperience) < 0)) {
    errs.yearsExperience = 'Los años de experiencia deben ser un número mayor o igual a 0'
  }
  if (form.value.salaryExpectation && (isNaN(parseFloat(form.value.salaryExpectation)) || parseFloat(form.value.salaryExpectation) < 0)) {
    errs.salaryExpectation = 'La expectativa salarial debe ser un número válido'
  }
  
  errors.value = errs
  return Object.keys(errs).length === 0
}

async function submit () {
  if (!validate()) return
  
  const app = await applications.submit({
    ...form.value,
    vacancyId: route.params.id
  }, rawCvFile.value)
  
  if (app) {
    success.value = true
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-10 md:py-14">
    <div v-if="!v && vacancies.loading" class="text-center py-16">
      <div class="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
      <p class="mt-4 text-sm text-stone-400">Cargando detalles de la oferta laboral...</p>
    </div>

    <div v-else-if="!v" class="text-center py-16">
      <div class="card border border-stone-200 p-8">
        <p class="text-stone-500 font-medium font-display text-lg">La vacante no está disponible o no existe.</p>
        <router-link to="/vacantes" class="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700">Ver todas las ofertas</router-link>
      </div>
    </div>

    <div v-else-if="success" class="card border border-stone-100 p-10 text-center shadow-sm">
      <div class="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto">
        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
      </div>
      <h2 class="mt-5 font-display text-2xl font-bold text-stone-900">¡Postulación recibida con éxito!</h2>
      <p class="mt-3 text-stone-500 font-body">
        Muchas gracias por tu interés. Hemos registrado tu postulación para la vacante <strong class="text-stone-800">{{ v.title }}</strong>.
      </p>
      <div class="mt-8 flex justify-center gap-4">
        <router-link to="/vacantes" class="btn btn-secondary px-6 py-2.5 text-sm">Ver otras vacantes</router-link>
      </div>
    </div>

    <div v-else-if="v.status === 'publicada'">
      <router-link :to="`/vacantes/${v.id}`" class="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-brand-600 transition-colors mb-6">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Volver a la vacante
      </router-link>

      <div class="card border border-stone-150 p-8 shadow-sm">
        <h1 class="font-display text-2xl font-bold text-stone-900 mb-1">Postularme a la Vacante</h1>
        <p class="text-stone-500 font-body mb-6">
          Estás aplicando a: <strong class="text-stone-800">{{ v.title }}</strong> &mdash; {{ v.company }}
        </p>

        <form @submit.prevent="submit" class="space-y-6">
          <!-- Alerta de Error General si falla en Backend -->
          <div v-if="applications.error" class="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-body border border-red-100">
            <strong>Error:</strong> {{ applications.error }}
          </div>

          <!-- SECCIÓN: Información Obligatoria -->
          <div class="space-y-5">
            <h3 class="font-display font-semibold text-stone-800 border-b border-stone-100 pb-2 text-base">Información Obligatoria</h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AppInput v-model="form.firstName" label="Nombres *" placeholder="Tus nombres" :error="errors.firstName" />
              <AppInput v-model="form.lastName" label="Apellidos *" placeholder="Tus apellidos" :error="errors.lastName" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AppInput v-model="form.email" label="Correo electrónico *" type="email" placeholder="candidato@correo.com" :error="errors.email" />
              <AppInput v-model="form.phone" label="Teléfono / Celular *" placeholder="+503 7000-0000" :error="errors.phone" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AppInput v-model="form.location" label="Ubicación de residencia *" placeholder="Ciudad, Departamento" :error="errors.location" />
              <AppSelect v-model="form.academicLevelId" label="Nivel Académico *" :options="academicLevels" placeholder="Seleccionar nivel..." :error="errors.academicLevelId" />
            </div>

            <AppInput v-model="form.profession" label="Profesión u Oficio *" placeholder="Ej. Desarrollador Web, Contador Público, Soldador" :error="errors.profession" />

            <!-- Subida de Currículum -->
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-stone-700 font-body">Currículum Vitae (PDF, Word o Imagen) *</label>
              <div class="relative border-2 border-dashed border-stone-200 hover:border-brand-400 rounded-xl p-4 transition-colors text-center cursor-pointer bg-stone-50">
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" @change="handleFile"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div class="space-y-1">
                  <svg class="w-8 h-8 text-stone-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                  <p class="text-xs text-stone-500 font-body"><span class="text-brand-600 font-semibold">Haz clic para subir</span> o arrastra un archivo aquí</p>
                  <p class="text-[10px] text-stone-400 font-body">Límite de tamaño: 5 MB</p>
                </div>
              </div>
              <p v-if="errors.cvFile" class="text-xs text-red-500 font-body mt-1">{{ errors.cvFile }}</p>
              <p v-if="form.cvFileName" class="text-xs text-stone-600 font-medium font-body flex items-center gap-1 mt-1.5 bg-stone-100 rounded-lg py-1.5 px-3 w-fit">
                <svg class="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Archivo: {{ form.cvFileName }}
              </p>
            </div>
          </div>

          <!-- SECCIÓN: Información Opcional (Colapsable) -->
          <div class="border border-stone-200 rounded-2xl overflow-hidden bg-stone-50 shadow-inner">
            <button type="button" @click="showOptional = !showOptional" 
              class="w-full flex items-center justify-between p-4 bg-stone-100/50 hover:bg-stone-100 transition-colors focus:outline-none">
              <span class="font-display font-semibold text-sm text-stone-700">Información Complementaria (Opcional)</span>
              <svg class="w-4 h-4 text-stone-500 transition-transform duration-200" :class="showOptional ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
            </button>
            
            <div v-show="showOptional" class="p-5 space-y-5 bg-white border-t border-stone-150">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AppInput v-model="form.identityDocument" label="Documento de identidad (DUI / Cédula / Pasaporte)" placeholder="Número de documento" />
                <AppInput v-model="form.yearsExperience" label="Años de experiencia" type="number" step="0.5" placeholder="Ej. 3.5" :error="errors.yearsExperience" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AppInput v-model="form.lastPosition" label="Último puesto desempeñado" placeholder="Nombre del puesto" />
                <AppInput v-model="form.availability" label="Disponibilidad de incorporación" placeholder="Ej. Inmediata, 15 días, 1 mes" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AppInput v-model="form.salaryExpectation" label="Expectativa salarial (USD)" type="number" placeholder="Ej. 1200" :error="errors.salaryExpectation" />
                <AppInput v-model="form.portfolioUrl" label="Enlace a portafolio web" placeholder="https://tuportafolio.com" :error="errors.portfolioUrl" />
              </div>

              <AppInput v-model="form.linkedinUrl" label="Perfil de LinkedIn" placeholder="https://linkedin.com/in/tuusuario" :error="errors.linkedinUrl" />
              <AppTextarea v-model="form.message" label="Mensaje de presentación" placeholder="Háblanos un poco de ti y por qué te interesa esta vacante..." :rows="4" />
            </div>
          </div>

          <!-- SECCIÓN: Consentimiento y Envío -->
          <div class="space-y-4 pt-2">
            <div class="flex items-start gap-3">
              <input type="checkbox" id="consent" v-model="form.privacyConsent" 
                class="w-4 h-4 mt-0.5 rounded border-stone-300 text-brand-600 focus:ring-brand-500 focus:ring-offset-0 transition-colors" />
              <label for="consent" class="text-xs text-stone-600 font-body cursor-pointer select-none leading-relaxed">
                Autorizo el tratamiento de mis datos personales para los fines exclusivos del proceso de selección y contratación laboral, de conformidad con los 
                <router-link to="/terminos-de-postulacion" target="_blank" class="text-brand-600 underline font-medium hover:text-brand-700">términos de postulación</router-link> y la 
                <router-link to="/politica-de-privacidad" target="_blank" class="text-brand-600 underline font-medium hover:text-brand-700">política de privacidad</router-link>. *
              </label>
            </div>
            <p v-if="errors.privacyConsent" class="text-xs text-red-500 font-body">{{ errors.privacyConsent }}</p>

            <button type="submit" :disabled="applications.loading"
              class="btn-accent w-full py-3.5 text-base flex items-center justify-center gap-2">
              <svg v-if="applications.loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {{ applications.loading ? 'Enviando Postulación...' : 'Enviar Postulación' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <div v-else class="card border border-stone-250 p-10 text-center shadow-sm">
      <p class="font-medium text-stone-700 font-display text-lg">Esta vacante ya no acepta nuevas postulaciones.</p>
      <p class="text-sm text-stone-400 font-body mt-1">El proceso de reclutamiento ha sido pausado o cerrado.</p>
      <router-link to="/vacantes" class="mt-6 inline-block btn btn-primary px-6 py-2.5 text-sm">Ver otras vacantes activas</router-link>
    </div>
  </div>
</template>
