<script setup>
import { onMounted } from 'vue'
import AppNavbar from './components/AppNavbar.vue'
import AppFooter from './components/AppFooter.vue'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()

onMounted(() => auth.initialize())
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
