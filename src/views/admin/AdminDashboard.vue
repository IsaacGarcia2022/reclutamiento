<script setup>
import { onMounted, computed } from 'vue'
import { useVacanciesStore } from '../../stores/vacancies'
import { useApplicationsStore } from '../../stores/applications'
import { useAuthStore } from '../../stores/auth'

const vacancies = useVacanciesStore()
const applications = useApplicationsStore()
const auth = useAuthStore()

onMounted(async () => {
  await vacancies.fetchAll()
  await applications.fetchAll()
})

const myVacancies = computed(() => vacancies.list)
const activeCount = computed(() => myVacancies.value.filter(v => v.status === 'active').length)
const totalApps = computed(() => Object.values(applications.byVacancy).flat().length)
</script>

<template>
  <div>
    <h2 class="font-display text-xl font-bold text-stone-900 mb-6">Dashboard</h2>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
      <div class="card border border-stone-100 p-6">
        <p class="text-sm text-stone-500 font-body">Total vacantes</p>
        <p class="font-display text-3xl font-bold text-stone-900 mt-1">{{ myVacancies.length }}</p>
      </div>
      <div class="card border border-stone-100 p-6">
        <p class="text-sm text-stone-500 font-body">Vacantes activas</p>
        <p class="font-display text-3xl font-bold text-brand-600 mt-1">{{ activeCount }}</p>
      </div>
      <div class="card border border-stone-100 p-6">
        <p class="text-sm text-stone-500 font-body">Postulaciones</p>
        <p class="font-display text-3xl font-bold text-coral-500 mt-1">{{ totalApps }}</p>
      </div>
    </div>

    <div class="card border border-stone-100 p-6">
      <h3 class="font-display font-semibold text-stone-900 mb-4">Accesos rápidos</h3>
      <div class="flex flex-wrap gap-3">
        <router-link to="/admin/vacantes/nueva" class="btn-primary px-5 py-2.5 text-sm">
          + Nueva vacante
        </router-link>
        <router-link to="/admin/vacantes" class="btn-secondary px-5 py-2.5 text-sm">
          Gestionar vacantes
        </router-link>
      </div>
    </div>
  </div>
</template>
