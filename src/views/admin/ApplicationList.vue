<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useVacanciesStore } from '../../stores/vacancies'
import { useApplicationsStore } from '../../stores/applications'

const route = useRoute()
const vacancies = useVacanciesStore()
const applications = useApplicationsStore()
const previewCv = ref(null)

const v = computed(() => vacancies.current)
const apps = computed(() => applications.getByVacancyId(route.params.id))

onMounted(async () => {
  await vacancies.fetchById(route.params.id)
  await applications.fetchByVacancy(route.params.id)
})
</script>

<template>
  <div>
    <div class="mb-6">
      <router-link to="/admin/vacantes" class="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-brand-600 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Volver a vacantes
      </router-link>
      <h2 class="font-display text-xl font-bold text-stone-900 mt-3" v-if="v">Postulaciones: {{ v.title }}</h2>
      <p v-if="v" class="text-sm text-stone-500 font-body mt-0.5">{{ v.company }}</p>
    </div>

    <div v-if="applications.loading" class="text-center py-12">
      <div class="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
      <p class="mt-4 text-sm text-stone-400">Cargando...</p>
    </div>

    <div v-else-if="apps.length === 0" class="card border border-stone-100 p-10 text-center">
      <div class="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto">
        <svg class="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
      </div>
      <p class="mt-4 text-stone-500 font-medium">Aún no hay postulaciones</p>
      <p class="text-sm text-stone-400 mt-1">Los candidatos empezarán a llegar pronto.</p>
    </div>

    <div v-else class="space-y-3">
      <div v-for="app in apps" :key="app.id" class="card border border-stone-100 p-5">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div>
            <h3 class="font-display font-semibold text-stone-900">{{ app.name }}</h3>
            <p class="text-sm text-stone-500 font-body">{{ app.email }} <span v-if="app.phone">&middot; {{ app.phone }}</span></p>
          </div>
          <span class="text-xs text-stone-400 font-mono shrink-0">{{ new Date(app.createdAt).toLocaleDateString('es-ES') }}</span>
        </div>

        <p v-if="app.message" class="mt-3 text-sm text-stone-600 bg-stone-50 rounded-xl p-4 leading-relaxed">"{{ app.message }}"</p>

        <div class="mt-4 flex gap-3">
          <button v-if="app.cv" @click="previewCv = app.cv"
            class="text-xs bg-brand-50 text-brand-600 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-all duration-200 font-medium">
            Ver CV
          </button>
          <a v-if="app.cv" :href="app.cv" :download="app.cvFileName || 'cv'"
            class="text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-200 transition-all duration-200 font-medium">
            Descargar CV
          </a>
        </div>
      </div>
    </div>

    <div v-if="previewCv" class="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-50 p-4" @click.self="previewCv = null">
      <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl">
        <div class="flex items-center justify-between p-4 border-b border-stone-200">
          <h3 class="font-display font-semibold text-stone-900">Vista previa del CV</h3>
          <button @click="previewCv = null" class="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-all flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="p-4 flex justify-center overflow-auto">
          <img v-if="previewCv.startsWith('data:image')" :src="previewCv" alt="CV" class="max-w-full rounded-lg" />
          <iframe v-else :src="previewCv" class="w-full h-[70vh] rounded-lg"></iframe>
        </div>
      </div>
    </div>
  </div>
</template>
