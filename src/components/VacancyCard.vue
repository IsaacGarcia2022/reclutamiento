<script setup>
defineProps({
  vacancy: { type: Object, required: true }
})
</script>

<template>
  <div class="card border border-stone-100 p-6 hover:shadow-lg hover:shadow-stone-200/50 hover:-translate-y-0.5 flex flex-col justify-between">
    <div>
      <h3 class="font-display text-lg font-semibold text-stone-900">{{ vacancy.title }}</h3>
      <p class="text-brand-600 font-medium text-sm mt-1">{{ vacancy.company }}</p>
      <div class="flex flex-wrap gap-2 mt-3">
        <span v-if="vacancy.location" class="inline-flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-lg text-xs text-stone-600 font-mono">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          {{ vacancy.location }}
        </span>
        <span v-if="vacancy.type" class="inline-flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-lg text-xs text-stone-600 font-mono">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          {{ vacancy.type }}
        </span>
        <span v-if="vacancy.salary" class="inline-flex items-center gap-1 bg-brand-50 px-2.5 py-1 rounded-lg text-xs font-medium text-brand-700 font-mono">
          {{ vacancy.salary }}
        </span>
      </div>
      <p class="mt-3 text-sm text-stone-600 line-clamp-2 leading-relaxed">{{ vacancy.description }}</p>
    </div>
    <div class="mt-5 flex items-center justify-between pt-4 border-t border-stone-100">
      <span class="text-xs text-stone-400 font-mono">{{ new Date(vacancy.createdAt).toLocaleDateString('es-ES') }}</span>
      <router-link :to="`/vacantes/${vacancy.id}`" class="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors inline-flex items-center gap-1">
        Ver detalle
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </router-link>
    </div>
  </div>
</template>
