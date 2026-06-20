<script setup>
import { useVacanciesStore } from '../stores/vacancies'

const store = useVacanciesStore()
const { filters } = store

const typeOptions = [
  { value: 'Tiempo completo', label: 'Tiempo completo' },
  { value: 'Medio tiempo', label: 'Medio tiempo' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Remoto', label: 'Remoto' },
  { value: 'Prácticas', label: 'Prácticas' }
]

function clearFilters () {
  store.setFilters({ keyword: '', location: '', type: '' })
}
</script>

<template>
  <div class="card border border-stone-100 p-5">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
      <div>
        <label class="block text-xs font-medium text-stone-500 mb-1.5 font-body">Palabra clave</label>
        <input v-model="filters.keyword" placeholder="Puesto, empresa..." class="input-field text-sm py-2.5" />
      </div>
      <div>
        <label class="block text-xs font-medium text-stone-500 mb-1.5 font-body">Ubicación</label>
        <input v-model="filters.location" placeholder="Ciudad, país..." class="input-field text-sm py-2.5" />
      </div>
      <div>
        <label class="block text-xs font-medium text-stone-500 mb-1.5 font-body">Tipo de empleo</label>
        <select v-model="filters.type" class="input-field text-sm py-2.5 appearance-none bg-no-repeat select-chevron">
          <option value="">Todos</option>
          <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <button @click="clearFilters" class="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2 self-center justify-self-start md:justify-self-center transition-colors font-body">
        Limpiar filtros
      </button>
    </div>
  </div>
</template>

<style scoped>
.select-chevron {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-size: 1.25rem;
}
</style>
