<script setup>
import { onMounted } from 'vue'
import AppNavbar from './components/AppNavbar.vue'
import AppFooter from './components/AppFooter.vue'
import { useAuthStore } from './stores/auth'
import { useCompanyStore } from './stores/company'

const auth = useAuthStore()
const company = useCompanyStore()

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
    <AppNavbar />
    <main class="flex-1">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>
