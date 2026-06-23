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
  <nav class="global-navbar">
    <div class="nav-container">
      <div class="nav-row">
        <button @click="goHome" class="logo-btn" aria-label="Volver al inicio">
          <span class="logo-prim">Portal</span><span class="logo-sec">Empleo</span>
        </button>

        <div class="nav-links">
          <router-link to="/" class="nav-lnk" active-class="nav-lnk-active">Inicio</router-link>
          <router-link to="/vacantes" class="nav-lnk" active-class="nav-lnk-active">Vacantes</router-link>
          <router-link to="/empresa" class="nav-lnk" active-class="nav-lnk-active">Conoce la empresa</router-link>
          <router-link to="/preguntas-frecuentes" class="nav-lnk" active-class="nav-lnk-active">Preguntas frecuentes</router-link>
          <router-link to="/contacto" class="nav-lnk" active-class="nav-lnk-active">Contacto</router-link>
        </div>

        <div class="nav-actions">
          <template v-if="auth.isAuthenticated">
            <router-link to="/admin" class="btn-panel">Panel</router-link>
            <div class="divider-v"></div>
            <span class="user-name">{{ auth.currentUser.name }}</span>
            <button @click="logout" class="btn-logout">Cerrar sesión</button>
          </template>
          <template v-else>
            <router-link to="/login" class="nav-lnk nav-lnk-login">Acceso Interno</router-link>
          </template>
        </div>

        <button @click="mobileOpen = !mobileOpen" class="mobile-toggle" :aria-expanded="mobileOpen" aria-label="Abrir menú de navegación">
          <svg class="toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <div v-show="mobileOpen" class="mobile-menu">
      <router-link @click="mobileOpen = false" to="/" class="mob-lnk" active-class="mob-lnk-active">Inicio</router-link>
      <router-link @click="mobileOpen = false" to="/vacantes" class="mob-lnk" active-class="mob-lnk-active">Vacantes</router-link>
      <router-link @click="mobileOpen = false" to="/empresa" class="mob-lnk" active-class="mob-lnk-active">Conoce la empresa</router-link>
      <router-link @click="mobileOpen = false" to="/preguntas-frecuentes" class="mob-lnk" active-class="mob-lnk-active">Preguntas frecuentes</router-link>
      <router-link @click="mobileOpen = false" to="/contacto" class="mob-lnk" active-class="mob-lnk-active">Contacto</router-link>
      <hr class="mob-divider" />
      <template v-if="auth.isAuthenticated">
        <router-link @click="mobileOpen = false" to="/admin" class="mob-lnk font-semibold">Panel de Control</router-link>
        <div class="mob-user-row">
          <span class="mob-username">{{ auth.currentUser.name }}</span>
          <button @click="logout" class="btn-logout-mob">Cerrar sesión</button>
        </div>
      </template>
      <template v-else>
        <router-link @click="mobileOpen = false" to="/login" class="mob-lnk font-semibold">Acceso Interno</router-link>
      </template>
    </div>
  </nav>
</template>

<style scoped>
.global-navbar {
  background-color: rgba(244, 247, 248, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--company-border);
  position: sticky;
  top: 0;
  z-index: 99;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.nav-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
}

.logo-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  font-family: 'Sora', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.logo-prim {
  color: var(--company-primary);
}

.logo-sec {
  color: var(--company-secondary);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: 24px;
  margin-right: auto;
}

/* Hide navigation links on small screens */
@media (max-width: 768px) {
  .nav-links, .nav-actions {
    display: none !important;
  }
}

.nav-lnk {
  color: var(--company-text-secondary);
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-lnk:hover {
  color: var(--company-primary);
  background-color: rgba(21, 79, 93, 0.04);
}

.nav-lnk-active {
  color: var(--company-primary) !important;
  font-weight: 600;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-panel {
  background-color: var(--company-secondary);
  color: white;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.btn-panel:hover {
  background-color: #517166;
}

.divider-v {
  width: 1px;
  height: 20px;
  background-color: var(--company-border);
}

.user-name {
  font-size: 0.85rem;
  color: var(--company-text-secondary);
}

.btn-logout {
  background: none;
  border: none;
  color: var(--company-negative);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.btn-logout:hover {
  background-color: rgba(166, 92, 92, 0.05);
}

.btn-postular {
  background-color: var(--company-primary);
  color: white;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(21, 79, 93, 0.1);
  transition: all 0.2s ease;
}

.btn-postular:hover {
  background-color: var(--company-primary-dark);
  transform: translateY(-1px);
}

.mobile-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: var(--company-text-secondary);
  border-radius: 8px;
}

.mobile-toggle:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.toggle-icon {
  width: 20px;
  height: 20px;
}

@media (max-width: 768px) {
  .mobile-toggle {
    display: block !important;
  }
}

/* Mobile menu dropdown */
.mobile-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: white;
  border-top: 1px solid var(--company-border);
  padding: 16px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.05);
}

.mob-lnk {
  color: var(--company-text-secondary);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 10px 14px;
  border-radius: 8px;
  transition: all 0.2s;
}

.mob-lnk:hover {
  color: var(--company-primary);
  background-color: rgba(21, 79, 93, 0.04);
}

.mob-lnk-active {
  color: var(--company-primary) !important;
  background-color: rgba(21, 79, 93, 0.04);
  font-weight: 600;
}

.mob-divider {
  border: 0;
  height: 1px;
  background-color: var(--company-border);
  margin: 8px 0;
}

.mob-user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
}

.mob-username {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--company-text-primary);
}

.btn-logout-mob {
  background: none;
  border: none;
  color: var(--company-negative);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-postular-mob {
  display: block;
  text-align: center;
  background-color: var(--company-primary);
  color: white;
  text-decoration: none;
  font-weight: 600;
  padding: 12px;
  border-radius: 8px;
  margin-top: 8px;
}
</style>
