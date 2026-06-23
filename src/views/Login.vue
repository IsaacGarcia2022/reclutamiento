<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppInput from '../components/AppInput.vue'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')

async function submit () {
  const ok = await auth.login(email.value, password.value)
  if (ok) router.push('/admin')
}
</script>

<template>
  <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center"><h1 class="font-display text-3xl font-bold text-stone-900">Iniciar sesión</h1><p class="mt-1.5 text-stone-500">Accede al panel interno de reclutamiento</p></div>
      <div class="card border border-stone-100 p-8 shadow-lg shadow-stone-200/30">
        <form @submit.prevent="submit" class="space-y-5"><AppInput v-model="email" label="Correo electrónico" type="email" placeholder="correo@empresa.com" /><AppInput v-model="password" label="Contraseña" type="password" placeholder="••••••••" /><p v-if="auth.error" class="text-center text-sm text-red-500">{{ auth.error }}</p><button :disabled="auth.loading" type="submit" class="btn-primary w-full py-3 text-base">{{ auth.loading ? 'Verificando...' : 'Entrar' }}</button></form>
        <p class="mt-5 text-center text-sm text-stone-500"><router-link to="/recuperar-contrasena" class="font-semibold text-brand-600 hover:text-brand-700">¿Olvidaste tu contraseña?</router-link></p>
      </div>
    </div>
  </div>
</template>
