<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useVacanciesStore } from '../stores/vacancies'

const route = useRoute()
const store = useVacanciesStore()

onMounted(() => store.fetchById(route.params.id))

const v = computed(() => store.current)
const copied = computed(() => false)
async function share () { await navigator.clipboard?.writeText(window.location.href) }
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-10 md:py-14">
    <div v-if="store.loading" class="text-center py-16">
      <div class="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
      <p class="mt-4 text-sm text-stone-400">Cargando...</p>
    </div>

    <div v-else-if="!v" class="text-center py-16">
      <p class="text-stone-500 font-medium">Vacante no encontrada.</p>
    </div>

    <template v-else>
      <router-link to="/vacantes" class="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-brand-600 transition-colors mb-6">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Volver a vacantes
      </router-link>

      <div class="card border border-stone-100 p-8">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 class="font-display text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">{{ v.title }}</h1>
            <p class="text-lg text-brand-600 font-medium mt-1">{{ v.company }}</p>
          </div>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium font-mono"
            :class="v.status === 'publicada' ? 'bg-sage-50 text-sage-700' : 'bg-stone-100 text-stone-500'">
            {{ v.status === 'publicada' ? 'Publicada' : v.status }}
          </span>
        </div>

        <div class="flex flex-wrap gap-2 mt-4">
          <span v-if="v.location" class="inline-flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-lg text-sm text-stone-600 font-mono">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            {{ v.location }}
          </span>
          <span v-if="v.type" class="inline-flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-lg text-sm text-stone-600 font-mono">{{ v.type }}</span>
          <span v-if="v.salary" class="inline-flex items-center gap-1.5 bg-brand-50 px-3 py-1.5 rounded-lg text-sm font-semibold text-brand-700 font-mono">{{ v.salary }}</span>
          <span v-if="v.fecha_cierre" class="inline-flex items-center gap-1.5 bg-coral-50 px-3 py-1.5 rounded-lg text-sm font-semibold text-coral-700">Postula hasta el {{ new Date(`${v.fecha_cierre}T00:00:00`).toLocaleDateString('es-SV') }}</span>
        </div>

        <div class="mt-8 space-y-6">
          <div>
            <h2 class="font-display text-lg font-semibold text-stone-900 mb-2">Descripción</h2>
            <p class="text-stone-600 whitespace-pre-line leading-relaxed">{{ v.description }}</p>
          </div>
          <div>
            <h2 class="font-display text-lg font-semibold text-stone-900 mb-2">Requisitos</h2>
            <p class="text-stone-600 whitespace-pre-line leading-relaxed">{{ v.requisitos }}</p>
          </div>
        </div>

        <div class="mt-6 text-xs text-stone-400 font-mono">
          Publicada el {{ new Date(v.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) }}
        </div>

        <div class="mt-8" v-if="v.status === 'publicada'">
          <router-link :to="`/vacantes/${v.id}/postular`"
            class="btn-accent px-8 py-3 text-base">
            Postularme a esta vacante
          </router-link>
          <button @click="share" class="ml-3 rounded-xl border border-stone-200 px-4 py-3 text-sm font-semibold text-stone-600">Compartir enlace</button>
        </div>
      </div>
    </template>
  </div>
</template>
