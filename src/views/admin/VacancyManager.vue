<script setup>
import { onMounted, ref } from 'vue'
import { useVacanciesStore } from '../../stores/vacancies'

const store = useVacanciesStore()
const confirmDelete = ref(null)

onMounted(() => store.fetchAll())

async function handleToggle (id) {
  await store.toggleStatus(id)
}

async function handleDelete (id) {
  await store.delete(id)
  confirmDelete.value = null
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-display text-xl font-bold text-stone-900">Mis vacantes</h2>
      <router-link to="/admin/vacantes/nueva" class="btn-primary px-4 py-2.5 text-sm">
        + Nueva
      </router-link>
    </div>

    <div v-if="store.loading" class="text-center py-12">
      <div class="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
      <p class="mt-4 text-sm text-stone-400">Cargando...</p>
    </div>

    <div v-else-if="store.list.length === 0" class="card border border-stone-100 p-10 text-center">
      <p class="text-stone-500 font-medium">Aún no has creado ninguna vacante.</p>
      <router-link to="/admin/vacantes/nueva" class="btn-primary mt-4 inline-flex px-5 py-2.5 text-sm">Crear primera vacante</router-link>
    </div>

    <div v-else class="space-y-3">
      <div v-for="v in store.list" :key="v.id" class="card border border-stone-100 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="min-w-0">
          <h3 class="font-display font-semibold text-stone-900">{{ v.title }}</h3>
          <p class="text-sm text-stone-500 mt-0.5 font-body">{{ v.company }} &middot; {{ v.location || 'Sin ubicación' }}</p>
          <p class="text-xs text-stone-400 mt-1 font-mono">
            {{ v.status === 'active' ? 'Activa' : 'Inactiva' }} &middot; {{ new Date(v.createdAt).toLocaleDateString('es-ES') }}
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0 flex-wrap">
          <button @click="handleToggle(v.id)"
            class="text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200"
            :class="v.status === 'active' ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'">
            {{ v.status === 'active' ? 'Desactivar' : 'Activar' }}
          </button>
          <router-link :to="`/admin/vacantes/${v.id}/editar`" class="text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-200 transition-all duration-200 font-medium">
            Editar
          </router-link>
          <router-link :to="`/admin/vacantes/${v.id}/postulaciones`" class="text-xs bg-brand-50 text-brand-600 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-all duration-200 font-medium">
            Postulaciones
          </router-link>
          <button @click="confirmDelete = v.id" class="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all duration-200 font-medium">
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <div v-if="confirmDelete" class="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-50 p-4" @click.self="confirmDelete = null">
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <h3 class="font-display font-semibold text-stone-900 text-lg">¿Eliminar vacante?</h3>
        <p class="text-sm text-stone-500 mt-2 font-body">Esta acción no se puede deshacer. También se eliminarán las postulaciones asociadas.</p>
        <div class="flex gap-3 mt-5 justify-end">
          <button @click="confirmDelete = null" class="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors">Cancelar</button>
          <button @click="handleDelete(confirmDelete)" class="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200">Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>
