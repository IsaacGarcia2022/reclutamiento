<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'
import NotificationService from '../../services/NotificationService'

const auth = useAuthStore()
const router = useRouter()

const internalNotifications = ref([])
const showNotificationsDropdown = ref(false)
const loadingAlerts = ref(false)

const unreadCount = computed(() => {
  return internalNotifications.value.filter(n => !n.leida).length
})

async function loadNotifications () {
  loadingAlerts.value = true
  try {
    internalNotifications.value = await NotificationService.listInternal()
  } catch (e) {
    console.error('Error al cargar alertas internas:', e)
  } finally {
    loadingAlerts.value = false
  }
}

async function markAsRead (notif) {
  try {
    if (!notif.leida) {
      await NotificationService.markAsRead(notif.id)
      notif.leida = true
    }
    if (notif.postulacion_id) {
      router.push('/admin/candidatos')
    } else if (notif.titulo.toLowerCase().includes('vacante')) {
      router.push('/admin/vacantes')
    }
  } catch (e) {
    console.error('Error al marcar notificación como leída:', e)
  }
}

async function handleNotificationClick (notif) {
  showNotificationsDropdown.value = false
  await markAsRead(notif)
}

function formatTime (dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function logout () {
  auth.logout()
  router.push('/')
}

const closeDropdown = (e) => {
  if (!e.target.closest('.notification-container')) {
    showNotificationsDropdown.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', closeDropdown)
  try {
    // 1. Ejecutar el chequeo de alertas en tiempo real en la base de datos
    await NotificationService.checkVacancyAlerts()
  } catch (e) {
    console.error('Error al ejecutar RPC de chequeo de vacantes:', e)
  }
  // 2. Cargar las notificaciones del usuario
  await loadNotifications()
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8 md:py-10">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-3">
      <div>
        <h1 class="font-display text-2xl font-bold text-stone-900">Panel de administración</h1>
        <p class="text-sm text-stone-500 mt-1 font-body">{{ auth.currentUser?.name }} &mdash; {{ auth.currentUser?.company }}</p>
      </div>
      <div class="flex items-center gap-4">
        <!-- Notificaciones -->
        <div class="relative notification-container">
          <button @click.stop="showNotificationsDropdown = !showNotificationsDropdown" 
            class="relative p-2 text-stone-500 hover:text-brand-600 hover:bg-stone-50 rounded-xl transition-all duration-200 focus:outline-none"
            title="Notificaciones">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span v-if="unreadCount > 0" 
              class="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-coral-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
              {{ unreadCount }}
            </span>
          </button>

          <!-- Dropdown Menu -->
          <div v-if="showNotificationsDropdown" 
            class="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-2xl border border-stone-200 shadow-xl py-2 z-50 origin-top-right transition-all duration-200">
            <div class="flex items-center justify-between px-4 py-2 border-b border-stone-100 mb-2">
              <h3 class="font-display font-bold text-sm text-stone-850">Notificaciones</h3>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-body">
                {{ unreadCount }} pendientes
              </span>
            </div>

            <!-- List of notifications -->
            <div class="max-h-80 overflow-y-auto px-2 space-y-1">
              <div v-if="loadingAlerts" class="text-center py-6 text-xs text-stone-400 font-body">
                <div class="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2"></div>
                Cargando notificaciones...
              </div>
              <div v-else-if="internalNotifications.length === 0" class="text-center py-8 text-xs text-stone-400 font-body">
                No tienes notificaciones en este momento.
              </div>
              <template v-else>
                <button v-for="notif in internalNotifications" :key="notif.id"
                  @click="handleNotificationClick(notif)"
                  class="w-full text-left p-3 rounded-xl hover:bg-stone-50 transition-all duration-200 flex gap-3 border"
                  :class="[
                    notif.leida ? 'border-transparent opacity-75' : 'border-brand-100/50 bg-brand-50/10'
                  ]">
                  <!-- Icon Based on Title -->
                  <div class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                    :class="{
                      'bg-blue-50 text-blue-600': notif.titulo.includes('Nueva postulación'),
                      'bg-amber-50 text-amber-600': notif.titulo.includes('próxima a cerrar'),
                      'bg-purple-50 text-purple-600': notif.titulo.includes('sin postulaciones'),
                      'bg-coral-50 text-coral-600': notif.titulo.includes('Error al cargar'),
                      'bg-stone-100 text-stone-600': notif.titulo.includes('cerrada')
                    }">
                    <svg v-if="notif.titulo.includes('Nueva postulación')" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <svg v-else-if="notif.titulo.includes('próxima a cerrar')" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <svg v-else-if="notif.titulo.includes('sin postulaciones')" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <svg v-else-if="notif.titulo.includes('Error al cargar')" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-1">
                      <p class="text-xs font-bold text-stone-850 font-display leading-tight truncate">{{ notif.titulo }}</p>
                      <span v-if="!notif.leida" class="w-2 h-2 shrink-0 bg-brand-500 rounded-full mt-1"></span>
                    </div>
                    <p class="text-[11px] text-stone-500 font-body mt-0.5 leading-normal">{{ notif.mensaje }}</p>
                    <p class="text-[9px] text-stone-400 font-body mt-1">{{ formatTime(notif.created_at) }}</p>
                  </div>
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-6">
      <aside class="md:w-56 shrink-0">
        <nav class="card border border-stone-100 p-2 space-y-1">
          <!-- Inicio -->
          <router-link to="/admin/inicio"
            class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            :class="$route.path === '/admin/inicio' ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Inicio
          </router-link>

          <!-- Vacantes -->
          <router-link to="/admin/vacantes"
            class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            :class="$route.path.startsWith('/admin/vacantes') ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            Vacantes
          </router-link>

          <!-- Postulaciones -->
          <router-link to="/admin/postulaciones"
            class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            :class="$route.path.startsWith('/admin/postulaciones') ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5M14 10h-4"/></svg>
            Postulaciones
          </router-link>

          <!-- Banco de candidatos -->
          <router-link to="/admin/candidatos"
            class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            :class="$route.path === '/admin/candidatos' || $route.path.startsWith('/admin/candidatos/') ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            Banco de candidatos
          </router-link>

          <!-- Reportes -->
          <router-link to="/admin/reportes"
            class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            :class="$route.path.startsWith('/admin/reportes') ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"/></svg>
            Reportes
          </router-link>

          <!-- Usuarios -->
          <router-link v-if="auth.currentUser?.role === 'administrador'" to="/admin/usuarios"
            class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            :class="$route.path.startsWith('/admin/usuarios') ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5V9a2 2 0 00-2-2h-3m0 13H7m10 0v-2c0-1.105-.895-2-2-2H9c-1.105 0-2 .895-2 2v2m0 0H2V9a2 2 0 012-2h3m10 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0h10M9 11h6"/></svg>
            Usuarios
          </router-link>

          <!-- Catálogos -->
          <router-link v-if="auth.currentUser?.role === 'administrador'" to="/admin/catalogos"
            class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            :class="$route.path.startsWith('/admin/catalogos') ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16M4 12h16M4 17h16"/></svg>
            Catálogos
          </router-link>

          <!-- Configuración -->
          <router-link v-if="auth.currentUser?.role === 'administrador'" to="/admin/configuracion"
            class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            :class="$route.path.startsWith('/admin/configuracion') ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Configuración
          </router-link>

          <!-- Auditoría -->
          <router-link v-if="auth.currentUser?.role === 'administrador'" to="/admin/auditoria"
            class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            :class="$route.path.startsWith('/admin/auditoria') ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            Auditoría
          </router-link>

          <!-- Privacidad -->
          <router-link v-if="auth.currentUser?.role === 'administrador' || auth.currentUser?.role === 'recursos_humanos'" to="/admin/privacidad"
            class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            :class="$route.path.startsWith('/admin/privacidad') ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            Privacidad
          </router-link>
        </nav>
      </aside>

      <div class="flex-1 min-w-0">
        <router-view />
      </div>
    </div>
  </div>
</template>

