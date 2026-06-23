<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppNavbar from './components/AppNavbar.vue'
import AppFooter from './components/AppFooter.vue'
import { useAuthStore } from './stores/auth'
import { useCompanyStore } from './stores/company'

const auth = useAuthStore()
const company = useCompanyStore()
const route = useRoute()

const showNavbar = computed(() => !route.meta.hideNavbar)
const showFooter = computed(() => !route.meta.hideFooter)

onMounted(async () => {
  await auth.initialize()
  const settings = await company.fetch()
  if (settings) {
    document.documentElement.style.setProperty('--company-primary', settings.colorPrincipal)
    document.documentElement.style.setProperty('--company-secondary', settings.colorSecundario)
  }
})
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <AppNavbar v-if="showNavbar" />
    <main class="flex-1">
      <router-view />
    </main>
    <AppFooter v-if="showFooter" />
  </div>
</template>

