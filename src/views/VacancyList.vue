<script setup>
import { onMounted } from 'vue'
import { useVacanciesStore } from '../stores/vacancies'
import VacancyCard from '../components/VacancyCard.vue'
import FilterBar from '../components/FilterBar.vue'

const store = useVacanciesStore()

onMounted(() => store.fetchAll())
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-10 md:py-14">
    <div class="mb-8">
      <span class="inline-block text-xs font-semibold tracking-widest uppercase text-brand-600 bg-brand-50 px-4 py-1.5 rounded-full">Oportunidades</span>
      <h1 class="mt-3 font-display text-3xl md:text-4xl font-bold text-stone-900">Vacantes disponibles</h1>
      <p class="mt-2 text-stone-500">Encuentra la oportunidad que se ajusta a tu perfil</p>
    </div>

    <FilterBar />

    <div v-if="store.loading" class="mt-10 text-center text-stone-400 py-16">
      <div class="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
      <p class="mt-4 text-sm">Cargando vacantes...</p>
    </div>

    <div v-else-if="store.filteredVacancies.length === 0" class="mt-10 text-center py-16">
      <div class="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto">
        <svg class="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <p class="mt-4 text-stone-500 font-medium">No se encontraron vacantes</p>
      <p class="text-sm text-stone-400 mt-1">Prueba con otros filtros o vuelve más tarde.</p>
    </div>

    <div v-else class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <VacancyCard v-for="v in store.filteredVacancies" :key="v.id" :vacancy="v" />
    </div>
  </div>
</template>
