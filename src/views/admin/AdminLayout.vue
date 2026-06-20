<script setup>
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function logout () {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8 md:py-10">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-3">
      <div>
        <h1 class="font-display text-2xl font-bold text-stone-900">Panel de administración</h1>
        <p class="text-sm text-stone-500 mt-1 font-body">{{ auth.currentUser?.name }} &mdash; {{ auth.currentUser?.company }}</p>
      </div>
      <div class="flex items-center gap-4">
        <router-link to="/" class="text-sm font-medium text-stone-500 hover:text-brand-600 transition-colors">Ver sitio</router-link>
        <button @click="logout" class="text-sm font-medium text-coral-500 hover:text-coral-600 transition-colors">Cerrar sesión</button>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-6">
      <aside class="md:w-56 shrink-0">
        <nav class="card border border-stone-100 p-2 space-y-1">
          <router-link to="/admin"
            class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            :class="$route.path === '/admin' ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Dashboard
          </router-link>
          <router-link to="/admin/vacantes"
            class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            :class="$route.path.startsWith('/admin/vacantes') ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            Mis vacantes
          </router-link>
        </nav>
      </aside>

      <div class="flex-1 min-w-0">
        <router-view />
      </div>
    </div>
  </div>
</template>
