<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const mobileOpen = ref(false)

function goHome () { router.push('/'); mobileOpen.value = false }
function logout () { auth.logout(); router.push('/'); mobileOpen.value = false }
</script>

<template>
  <nav class="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <button @click="goHome" class="flex items-center gap-1.5 font-display text-xl font-bold tracking-tight">
          <span class="text-brand-600">Portal</span><span class="text-coral-500">Empleo</span>
        </button>

        <div class="hidden md:flex items-center gap-8">
          <router-link to="/vacantes" class="text-sm font-medium text-stone-600 hover:text-brand-600 transition-colors duration-200">Vacantes</router-link>
          <template v-if="auth.isAuthenticated">
            <router-link to="/admin" class="text-sm font-medium text-stone-600 hover:text-brand-600 transition-colors duration-200">Panel</router-link>
            <div class="h-5 w-px bg-stone-200"></div>
            <span class="text-sm text-stone-500">{{ auth.currentUser.name }}</span>
            <button @click="logout" class="text-sm font-medium text-coral-500 hover:text-coral-600 transition-colors duration-200">Cerrar sesión</button>
          </template>
          <template v-else>
            <router-link to="/login" class="text-sm font-medium text-stone-600 hover:text-brand-600 transition-colors duration-200">Acceder</router-link>
            <router-link to="/registro" class="btn-primary text-sm px-5 py-2.5">Registrarse</router-link>
          </template>
        </div>

        <button @click="mobileOpen = !mobileOpen" class="md:hidden p-2.5 rounded-xl text-stone-500 hover:bg-stone-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-show="mobileOpen" class="md:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-3">
      <router-link @click="mobileOpen = false" to="/vacantes" class="block text-sm font-medium text-stone-600 hover:text-brand-600">Vacantes</router-link>
      <template v-if="auth.isAuthenticated">
        <router-link @click="mobileOpen = false" to="/admin" class="block text-sm font-medium text-stone-600 hover:text-brand-600">Panel</router-link>
        <button @click="logout" class="block text-sm font-medium text-coral-500">Cerrar sesión ({{ auth.currentUser.name }})</button>
      </template>
      <template v-else>
        <router-link @click="mobileOpen = false" to="/login" class="block text-sm font-medium text-stone-600 hover:text-brand-600">Acceder</router-link>
        <router-link @click="mobileOpen = false" to="/registro" class="block text-sm font-semibold text-brand-600">Registrarse</router-link>
      </template>
    </div>
  </nav>
</template>
