<script setup>
import { onMounted, ref, computed } from 'vue'
import { useVacanciesStore } from '../../stores/vacancies'

const store = useVacanciesStore()
const action = ref(null)
const searchQuery = ref('')
const selectedStatus = ref('')

const statusConfig = {
  borrador: {
    label: 'Borrador',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    icon: `<svg class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`
  },
  publicada: {
    label: 'Publicada',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    icon: `<svg class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
  },
  pausada: {
    label: 'Pausada',
    badgeClass: 'bg-orange-50 text-orange-700 border border-orange-200/60',
    icon: `<svg class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
  },
  cerrada: {
    label: 'Cerrada',
    badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    icon: `<svg class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>`
  },
  archivada: {
    label: 'Archivada',
    badgeClass: 'bg-stone-100 text-stone-600 border border-stone-200',
    icon: `<svg class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>`
  }
}

const tabConfig = {
  '': {
    activeClass: 'bg-brand-50 text-brand-700 border-brand-200/50 shadow-sm border',
    inactiveClass: 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-100'
  },
  borrador: {
    activeClass: 'bg-amber-50 text-amber-700 border-amber-200/60 shadow-sm border',
    inactiveClass: 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-100'
  },
  publicada: {
    activeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-sm border',
    inactiveClass: 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-100'
  },
  pausada: {
    activeClass: 'bg-orange-50 text-orange-700 border-orange-200/60 shadow-sm border',
    inactiveClass: 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-100'
  },
  cerrada: {
    activeClass: 'bg-rose-50 text-rose-700 border-rose-200/60 shadow-sm border',
    inactiveClass: 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-100'
  },
  archivada: {
    activeClass: 'bg-stone-200 text-stone-700 border-stone-300 shadow-sm border',
    inactiveClass: 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-100'
  }
}

onMounted(() => store.fetchAdmin())

async function run() {
  const { v, estado, type } = action.value
  if (type === 'duplicate') await store.duplicate(v.id)
  else await store.transition(v.id, estado)
  action.value = null
}

const filterTabs = computed(() => {
  const list = store.list || []
  return [
    { label: 'Todas', value: '', count: list.length },
    { label: 'Publicadas', value: 'publicada', count: list.filter(v => v.status === 'publicada').length },
    { label: 'Borradores', value: 'borrador', count: list.filter(v => v.status === 'borrador').length },
    { label: 'Pausadas', value: 'pausada', count: list.filter(v => v.status === 'pausada').length },
    { label: 'Cerradas', value: 'cerrada', count: list.filter(v => v.status === 'cerrada').length },
    { label: 'Archivadas', value: 'archivada', count: list.filter(v => v.status === 'archivada').length }
  ]
})

const filteredVacancies = computed(() => {
  const list = store.list || []
  return list.filter(v => {
    const matchesSearch = !searchQuery.value ||
      v.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (v.codigo && v.codigo.toLowerCase().includes(searchQuery.value.toLowerCase()));
    const matchesStatus = !selectedStatus.value || v.status === selectedStatus.value;
    return matchesSearch && matchesStatus;
  })
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="font-display text-2xl font-bold text-stone-900">Vacantes</h2>
        <p class="mt-1 text-sm text-stone-500">Gestiona publicaciones y su visibilidad pública.</p>
      </div>
      <router-link to="/admin/vacantes/nueva" class="btn-primary self-start px-4 py-2.5 text-sm sm:self-auto">+ Nueva vacante</router-link>
    </div>

    <!-- Error message -->
    <p v-if="store.error" class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ store.error }}</p>

    <!-- Filters & Search -->
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <!-- Search Input -->
      <div class="relative w-full lg:max-w-xs">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg class="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por título o código..."
          class="input-field pl-9 w-full text-sm"
        />
      </div>

      <!-- Status Tabs -->
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          type="button"
          @click="selectedStatus = tab.value"
          class="inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-semibold transition"
          :class="selectedStatus === tab.value ? tabConfig[tab.value].activeClass : tabConfig[tab.value].inactiveClass"
        >
          {{ tab.label }}
          <span
            class="ml-1.5 inline-flex items-center justify-center rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-stone-600 shadow-sm border border-stone-100"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div v-if="store.loading" class="py-12 text-center text-stone-400">Cargando vacantes...</div>
    <div v-else-if="filteredVacancies.length === 0" class="py-16 text-center text-stone-400 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
      <svg class="mx-auto h-8 w-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="mt-3 text-sm font-medium text-stone-500">No se encontraron vacantes con los filtros seleccionados.</p>
    </div>
    <div v-else class="space-y-3">
      <article
        v-for="v in filteredVacancies"
        :key="v.id"
        class="card flex flex-col gap-4 border border-stone-100 p-5 shadow-sm transition hover:shadow-md hover:border-stone-200/80 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="font-display font-semibold text-stone-900 text-base">{{ v.title }}</h3>
            <span
              :class="['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold shadow-xs', statusConfig[v.status]?.badgeClass]"
            >
              <span class="inline-flex items-center" v-html="statusConfig[v.status]?.icon"></span>
              {{ statusConfig[v.status]?.label }}
            </span>
          </div>
          <p class="mt-1.5 text-sm text-stone-500">
            <span class="font-medium text-stone-600">{{ v.codigo }}</span>
            <span class="mx-2 text-stone-300">·</span>
            {{ v.location || 'Sin ubicación' }}
            <span class="mx-2 text-stone-300">·</span>
            {{ v.type || 'Sin modalidad' }}
          </p>
          <p class="mt-1 text-xs text-stone-400">
            <span class="font-medium text-brand-600">{{ v.cantidad_postulaciones }}</span>
            {{ v.cantidad_postulaciones === 1 ? 'postulación' : 'postulaciones' }}
            <span class="mx-1.5">·</span>
            Creada el {{ new Date(v.createdAt).toLocaleDateString('es-SV') }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap items-center gap-2">
          <router-link :to="`/admin/vacantes/${v.id}/editar`" class="rounded-lg bg-stone-100 hover:bg-stone-200/70 px-3 py-1.5 text-xs font-semibold text-stone-700 transition">Editar</router-link>
          <router-link :to="`/admin/vacantes/${v.id}/postulaciones`" class="rounded-lg bg-brand-50 hover:bg-brand-100/70 px-3 py-1.5 text-xs font-semibold text-brand-700 transition">Postulaciones</router-link>
          <select
            class="rounded-lg bg-stone-100 hover:bg-stone-200/70 px-3 py-1.5 text-xs font-semibold text-stone-700 transition outline-none cursor-pointer"
            @change="e => {
              const value = e.target.value;
              e.target.value = '';
              if (value === 'duplicate') action = { v, type: 'duplicate' };
              else if (value) action = { v, type: 'status', estado: value };
            }"
          >
            <option value="">Acciones</option>
            <option value="duplicate">Duplicar</option>
            <option v-if="v.status === 'borrador' || v.status === 'pausada'" value="publicada">Publicar</option>
            <option v-if="v.status === 'publicada'" value="pausada">Pausar</option>
            <option v-if="v.status === 'publicada' || v.status === 'pausada'" value="cerrada">Cerrar</option>
            <option v-if="v.status !== 'archivada'" value="archivada">Archivar</option>
          </select>
        </div>
      </article>
    </div>

    <!-- Confirm Dialog -->
    <div v-if="action" class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs">
      <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-stone-100 animate-in fade-in zoom-in-95 duration-150">
        <h3 class="font-display text-lg font-bold text-stone-900">Confirmar acción</h3>
        <p class="mt-2 text-sm text-stone-500">¿Deseas {{ action.type === 'duplicate' ? 'duplicar' : 'cambiar el estado de' }} la vacante <strong>{{ action.v.title }}</strong>?</p>
        <div class="mt-6 flex justify-end gap-3">
          <button @click="action = null" class="btn-secondary px-4 py-2 text-sm">Cancelar</button>
          <button @click="run" class="btn-primary px-4 py-2 text-sm">Confirmar</button>
        </div>
      </div>
    </div>
  </div>
</template>
