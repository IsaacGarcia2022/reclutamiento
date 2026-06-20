<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVacanciesStore } from '../stores/vacancies'
import { useApplicationsStore } from '../stores/applications'
import AppInput from '../components/AppInput.vue'
import AppTextarea from '../components/AppTextarea.vue'

const route = useRoute()
const router = useRouter()
const vacancies = useVacanciesStore()
const applications = useApplicationsStore()

const v = computed(() => vacancies.current)
const success = ref(false)
const errors = ref({})

const form = ref({
  name: '',
  email: '',
  phone: '',
  message: '',
  cvFile: null,
  cvFileName: ''
})

onMounted(() => vacancies.fetchById(route.params.id))

function handleFile (e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    form.value.cvFile = reader.result
    form.value.cvFileName = file.name
  }
  reader.readAsDataURL(file)
}

function validate () {
  const errs = {}
  if (!form.value.name.trim()) errs.name = 'El nombre es obligatorio'
  if (!form.value.email.trim()) errs.email = 'El correo es obligatorio'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) errs.email = 'Correo inválido'
  if (!form.value.phone.trim()) errs.phone = 'El teléfono es obligatorio'
  if (!form.value.cvFile) errs.cvFile = 'Adjunta tu CV'
  errors.value = errs
  return Object.keys(errs).length === 0
}

async function submit () {
  if (!validate()) return
  const app = await applications.submit({
    vacancyId: route.params.id,
    name: form.value.name,
    email: form.value.email,
    phone: form.value.phone,
    message: form.value.message,
    cv: form.value.cvFile,
    cvFileName: form.value.cvFileName
  })
  if (app) success.value = true
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-10 md:py-14">
    <div v-if="!v && vacancies.loading" class="text-center py-16">
      <div class="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
      <p class="mt-4 text-sm text-stone-400">Cargando...</p>
    </div>

    <div v-else-if="!v" class="text-center py-16">
      <p class="text-stone-500 font-medium">Vacante no encontrada.</p>
    </div>

    <div v-else-if="success" class="card border border-stone-100 p-10 text-center">
      <div class="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
      </div>
      <h2 class="mt-5 font-display text-2xl font-bold text-stone-900">¡Postulación enviada!</h2>
      <p class="mt-2 text-stone-500">Hemos recibido tu postulación para <strong class="text-stone-900">{{ v.title }}</strong> en <strong class="text-stone-900">{{ v.company }}</strong>.</p>
      <router-link to="/vacantes" class="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Ver más vacantes
      </router-link>
    </div>

    <div v-else>
      <router-link :to="`/vacantes/${v.id}`" class="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-brand-600 transition-colors mb-6">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Volver a la vacante
      </router-link>

      <div class="card border border-stone-100 p-8">
        <h1 class="font-display text-2xl font-bold text-stone-900 mb-1">Postularme</h1>
        <p class="text-stone-500 mb-6">
          <strong class="text-stone-900">{{ v.title }}</strong> &mdash; {{ v.company }}
        </p>

        <form @submit.prevent="submit" class="space-y-5">
          <AppInput v-model="form.name" label="Nombre completo" placeholder="Tu nombre" :error="errors.name" />
          <AppInput v-model="form.email" label="Correo electrónico" type="email" placeholder="tu@correo.com" :error="errors.email" />
          <AppInput v-model="form.phone" label="Teléfono" placeholder="+56 9 1234 5678" :error="errors.phone" />

          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-stone-700 font-body">Curriculum Vitae (PDF, Word, Imagen)</label>
            <div class="relative">
              <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" @change="handleFile"
                class="w-full text-sm text-stone-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer file:transition-colors" />
            </div>
            <p v-if="errors.cvFile" class="text-xs text-red-500 font-body">{{ errors.cvFile }}</p>
            <p v-if="form.cvFileName" class="text-xs text-stone-400 font-body mt-1">Archivo: {{ form.cvFileName }}</p>
          </div>

          <AppTextarea v-model="form.message" label="Mensaje de presentación (opcional)" placeholder="Cuéntanos por qué eres el candidato ideal..." rows="4" />

          <button type="submit" :disabled="applications.loading"
            class="btn-accent w-full py-3.5 text-base">
            {{ applications.loading ? 'Enviando...' : 'Enviar postulación' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
