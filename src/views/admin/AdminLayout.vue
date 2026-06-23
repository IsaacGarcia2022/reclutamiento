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

// Sidebar collapse settings
const isCollapsed = ref(localStorage.getItem('admin_sidebar_collapsed') === 'true')
const mobileOpen = ref(false)

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('admin_sidebar_collapsed', isCollapsed.value ? 'true' : 'false')
}

// Dynamic Breadcrumbs
const breadcrumbs = computed(() => {
  const path = router.currentRoute.value.path
  const crumbs = [{ label: 'Inicio', path: '/admin/inicio' }]

  if (path.startsWith('/admin/vacantes')) {
    crumbs.push({ label: 'Vacantes', path: '/admin/vacantes' })
    if (path.endsWith('/nueva')) {
      crumbs.push({ label: 'Nueva vacante', path: path })
    } else if (path.includes('/editar')) {
      crumbs.push({ label: 'Editar vacante', path: path })
    } else if (path.includes('/postulaciones')) {
      crumbs.push({ label: 'Postulaciones', path: path })
    }
  } else if (path.startsWith('/admin/postulaciones')) {
    crumbs.push({ label: 'Postulaciones', path: '/admin/postulaciones' })
    if (path !== '/admin/postulaciones') {
      crumbs.push({ label: 'Detalle de postulación', path: path })
    }
  } else if (path.startsWith('/admin/candidatos')) {
    crumbs.push({ label: 'Banco de candidatos', path: '/admin/candidatos' })
    if (path !== '/admin/candidatos') {
      crumbs.push({ label: 'Detalle de candidato', path: path })
    }
  } else if (path.startsWith('/admin/usuarios')) {
    crumbs.push({ label: 'Usuarios', path: '/admin/usuarios' })
    if (path.endsWith('/nuevo')) {
      crumbs.push({ label: 'Nuevo usuario', path: path })
    } else if (path.includes('/editar')) {
      crumbs.push({ label: 'Editar usuario', path: path })
    }
  } else if (path.startsWith('/admin/reportes')) {
    crumbs.push({ label: 'Reportes', path: '/admin/reportes' })
  } else if (path.startsWith('/admin/catalogos')) {
    crumbs.push({ label: 'Catálogos', path: '/admin/catalogos' })
  } else if (path.startsWith('/admin/configuracion')) {
    crumbs.push({ label: 'Configuración', path: '/admin/configuracion' })
  } else if (path.startsWith('/admin/plantillas')) {
    crumbs.push({ label: 'Plantillas de correo', path: '/admin/plantillas' })
  } else if (path.startsWith('/admin/auditoria')) {
    crumbs.push({ label: 'Auditoría', path: '/admin/auditoria' })
  } else if (path.startsWith('/admin/privacidad')) {
    crumbs.push({ label: 'Privacidad', path: '/admin/privacidad' })
  }

  // Deduplicate consecutive crumbs with same label
  const uniqueCrumbs = []
  const seenLabels = new Set()
  crumbs.forEach(c => {
    if (!seenLabels.has(c.label)) {
      uniqueCrumbs.push(c)
      seenLabels.add(c.label)
    }
  })
  return uniqueCrumbs
})

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
  <div class="min-h-[calc(100vh-4rem)] flex bg-background text-text-primary font-body">
    <!-- Off-canvas mobile sidebar backdrop -->
    <div 
      v-if="mobileOpen" 
      @click="mobileOpen = false" 
      class="fixed inset-0 z-40 bg-stone-900/40 md:hidden transition-opacity duration-300"
    ></div>

    <!-- Sidebar Navegación Lateral -->
    <aside 
      class="fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] z-40 bg-surface border-r border-border-color transition-all duration-300 flex flex-col justify-between shrink-0"
      :class="[
        isCollapsed ? 'md:w-20' : 'md:w-64',
        mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0'
      ]"
    >
      <div class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <!-- Dashboard / Inicio -->
        <router-link 
          to="/admin/inicio"
          @click="mobileOpen = false"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
          :class="$route.path === '/admin/inicio' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-stone-50 hover:text-text-primary'"
          :title="isCollapsed ? 'Inicio' : ''"
          aria-label="Inicio"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <span v-show="!isCollapsed" class="whitespace-nowrap">Inicio</span>
        </router-link>

        <!-- Vacantes -->
        <router-link 
          to="/admin/vacantes"
          @click="mobileOpen = false"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
          :class="$route.path.startsWith('/admin/vacantes') ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-stone-50 hover:text-text-primary'"
          :title="isCollapsed ? 'Vacantes' : ''"
          aria-label="Vacantes"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          <span v-show="!isCollapsed" class="whitespace-nowrap">Vacantes</span>
        </router-link>

        <!-- Postulaciones -->
        <router-link 
          to="/admin/postulaciones"
          @click="mobileOpen = false"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
          :class="$route.path.startsWith('/admin/postulaciones') ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-stone-50 hover:text-text-primary'"
          :title="isCollapsed ? 'Postulaciones' : ''"
          aria-label="Postulaciones"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
          <span v-show="!isCollapsed" class="whitespace-nowrap">Postulaciones</span>
        </router-link>

        <!-- Banco de candidatos -->
        <router-link 
          to="/admin/candidatos"
          @click="mobileOpen = false"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
          :class="$route.path.startsWith('/admin/candidatos') ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-stone-50 hover:text-text-primary'"
          :title="isCollapsed ? 'Banco de candidatos' : ''"
          aria-label="Banco de candidatos"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          <span v-show="!isCollapsed" class="whitespace-nowrap">Candidatos</span>
        </router-link>

        <!-- Reportes -->
        <router-link 
          to="/admin/reportes"
          @click="mobileOpen = false"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
          :class="$route.path.startsWith('/admin/reportes') ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-stone-50 hover:text-text-primary'"
          :title="isCollapsed ? 'Reportes' : ''"
          aria-label="Reportes"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"/></svg>
          <span v-show="!isCollapsed" class="whitespace-nowrap">Reportes</span>
        </router-link>

        <!-- Divisor -->
        <div class="h-px bg-border-color my-4"></div>

        <!-- Usuarios (Administrador) -->
        <router-link 
          v-if="auth.currentUser?.role === 'administrador'"
          to="/admin/usuarios"
          @click="mobileOpen = false"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
          :class="$route.path.startsWith('/admin/usuarios') ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-stone-50 hover:text-text-primary'"
          :title="isCollapsed ? 'Usuarios' : ''"
          aria-label="Usuarios"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          <span v-show="!isCollapsed" class="whitespace-nowrap">Usuarios</span>
        </router-link>

        <!-- Catálogos (Administrador) -->
        <router-link 
          v-if="auth.currentUser?.role === 'administrador'"
          to="/admin/catalogos"
          @click="mobileOpen = false"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
          :class="$route.path.startsWith('/admin/catalogos') ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-stone-50 hover:text-text-primary'"
          :title="isCollapsed ? 'Catálogos' : ''"
          aria-label="Catálogos"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
          <span v-show="!isCollapsed" class="whitespace-nowrap">Catálogos</span>
        </router-link>

        <!-- Configuración (Administrador) -->
        <router-link 
          v-if="auth.currentUser?.role === 'administrador'"
          to="/admin/configuracion"
          @click="mobileOpen = false"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
          :class="$route.path.startsWith('/admin/configuracion') ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-stone-50 hover:text-text-primary'"
          :title="isCollapsed ? 'Configuración' : ''"
          aria-label="Configuración"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span v-show="!isCollapsed" class="whitespace-nowrap">Configuración</span>
        </router-link>

        <!-- Auditoría (Administrador) -->
        <router-link 
          v-if="auth.currentUser?.role === 'administrador'"
          to="/admin/auditoria"
          @click="mobileOpen = false"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
          :class="$route.path.startsWith('/admin/auditoria') ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-stone-50 hover:text-text-primary'"
          :title="isCollapsed ? 'Auditoría' : ''"
          aria-label="Auditoría"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          <span v-show="!isCollapsed" class="whitespace-nowrap">Auditoría</span>
        </router-link>

        <!-- Privacidad (Administrador y Recursos Humanos) -->
        <router-link 
          v-if="auth.currentUser?.role === 'administrador' || auth.currentUser?.role === 'recursos_humanos'"
          to="/admin/privacidad"
          @click="mobileOpen = false"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
          :class="$route.path.startsWith('/admin/privacidad') ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-stone-50 hover:text-text-primary'"
          :title="isCollapsed ? 'Privacidad' : ''"
          aria-label="Privacidad"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          <span v-show="!isCollapsed" class="whitespace-nowrap">Privacidad</span>
        </router-link>
      </div>

      <!-- Botón para Colapsar Sidebar (Solo Desktop) -->
      <div class="hidden md:block p-4 border-t border-border-color bg-stone-50/50">
        <button 
          @click="toggleSidebar"
          class="w-full flex items-center justify-center p-2.5 rounded-xl border border-border-color bg-white text-text-secondary hover:text-primary hover:bg-stone-50 transition-all duration-200 focus:outline-none"
          title="Contraer navegación"
          aria-label="Contraer navegación"
        >
          <svg 
            class="w-5 h-5 transition-transform duration-300"
            :class="{ 'rotate-180': isCollapsed }"
            fill="none" 
            stroke="currentColor" 
            stroke-width="2" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </aside>

    <!-- Panel de Contenido Principal -->
    <div class="flex-1 min-w-0 flex flex-col">
      <!-- Header Superior -->
      <header class="sticky top-16 bg-surface border-b border-border-color h-16 flex items-center justify-between px-6 z-30 select-none">
        <div class="flex items-center gap-4">
          <!-- Hamburger Móvil / Toggle -->
          <button 
            @click="mobileOpen = !mobileOpen"
            class="md:hidden p-2 rounded-xl text-text-secondary hover:bg-stone-100 hover:text-text-primary transition-all duration-200 focus:outline-none"
            title="Menu"
            aria-label="Menú principal"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Breadcrumbs dinámicos -->
          <nav aria-label="Ruta de navegación" class="hidden sm:flex items-center gap-2 text-xs font-medium text-text-secondary">
            <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
              <span v-if="index > 0" class="text-stone-300 select-none">/</span>
              <router-link 
                v-if="index < breadcrumbs.length - 1" 
                :to="crumb.path" 
                class="hover:text-primary transition-colors"
              >
                {{ crumb.label }}
              </router-link>
              <span v-else class="text-text-primary font-semibold select-none">
                {{ crumb.label }}
              </span>
            </template>
          </nav>
        </div>

        <!-- Acciones del Usuario & Notificaciones -->
        <div class="flex items-center gap-4">
          <!-- Dropdown Notificaciones -->
          <div class="relative notification-container">
            <button 
              @click.stop="showNotificationsDropdown = !showNotificationsDropdown" 
              class="relative p-2 text-text-secondary hover:text-primary hover:bg-stone-50 rounded-xl transition-all duration-200 focus:outline-none"
              title="Notificaciones"
              aria-label="Abrir notificaciones"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span 
                v-if="unreadCount > 0" 
                class="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-coral-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse"
              >
                {{ unreadCount }}
              </span>
            </button>

            <!-- Dropdown Menu -->
            <div 
              v-if="showNotificationsDropdown" 
              class="absolute right-0 mt-2.5 w-80 sm:w-96 bg-surface rounded-2xl border border-border-color shadow-xl py-2 z-50 origin-top-right transition-all duration-200"
            >
              <div class="flex items-center justify-between px-4 py-2 border-b border-border-color mb-2">
                <h3 class="font-display font-bold text-sm text-text-primary">Notificaciones</h3>
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-primary font-body">
                  {{ unreadCount }} pendientes
                </span>
              </div>

              <!-- List of notifications -->
              <div class="max-h-80 overflow-y-auto px-2 space-y-1">
                <div v-if="loadingAlerts" class="text-center py-6 text-xs text-text-secondary font-body">
                  <div class="w-5 h-5 border-2 border-border-color border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                  Cargando notificaciones...
                </div>
                <div v-else-if="internalNotifications.length === 0" class="text-center py-8 text-xs text-text-secondary font-body">
                  No tienes notificaciones en este momento.
                </div>
                <template v-else>
                  <button 
                    v-for="notif in internalNotifications" 
                    :key="notif.id"
                    @click="handleNotificationClick(notif)"
                    class="w-full text-left p-3 rounded-xl hover:bg-stone-50 transition-all duration-200 flex gap-3 border"
                    :class="[
                      notif.leida ? 'border-transparent opacity-75' : 'border-primary/20 bg-primary/5'
                    ]"
                  >
                    <!-- Icon Based on Title -->
                    <div 
                      class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                      :class="{
                        'bg-blue-50 text-blue-600': notif.titulo.includes('Nueva postulación'),
                        'bg-amber-50 text-amber-600': notif.titulo.includes('próxima a cerrar'),
                        'bg-purple-50 text-purple-600': notif.titulo.includes('sin postulaciones'),
                        'bg-red-50 text-red-600': notif.titulo.includes('Error al cargar'),
                        'bg-stone-100 text-stone-600': notif.titulo.includes('cerrada')
                      }"
                    >
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
                        <p class="text-xs font-bold text-text-primary font-display leading-tight truncate">{{ notif.titulo }}</p>
                        <span v-if="!notif.leida" class="w-2 h-2 shrink-0 bg-primary rounded-full mt-1"></span>
                      </div>
                      <p class="text-[11px] text-text-secondary font-body mt-0.5 leading-normal">{{ notif.mensaje }}</p>
                      <p class="text-[9px] text-stone-400 font-body mt-1">{{ formatTime(notif.created_at) }}</p>
                    </div>
                  </button>
                </template>
              </div>
            </div>
          </div>

          <!-- Perfil Corto y Cerrar Sesión -->
          <div class="h-8 w-px bg-border-color"></div>

          <div class="flex items-center gap-3">
            <div class="hidden md:block text-right">
              <p class="text-xs font-bold text-text-primary">{{ auth.currentUser?.name }}</p>
              <p class="text-[10px] font-semibold text-text-secondary capitalize">{{ auth.currentUser?.role }}</p>
            </div>
            
            <!-- Botón Cerrar Sesión -->
            <button 
              @click="logout" 
              class="flex items-center justify-center p-2 rounded-xl text-negative hover:bg-red-50 transition-colors focus:outline-none"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Panel de Vistas Administrativas -->
      <main class="flex-1 p-6 md:p-8 overflow-y-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>
