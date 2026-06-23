<script setup>
import { ref } from 'vue'
import AuthService from '../services/AuthService'
import AppInput from '../components/AppInput.vue'

const email = ref('')
const error = ref('')
const sent = ref(false)
const loading = ref(false)

async function submit () {
  error.value = ''
  loading.value = true
  try {
    await AuthService.requestPasswordReset(email.value.trim())
    sent.value = true
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12"><div class="w-full max-w-md"><div class="card border border-stone-100 p-8 shadow-lg shadow-stone-200/30"><template v-if="sent"><div class="text-center"><div class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sage-100 text-xl text-sage-700">✓</div><h1 class="mt-5 font-display text-2xl font-bold text-stone-900">Revisa tu correo</h1><p class="mt-2 text-sm leading-6 text-stone-500">Si el correo pertenece a un usuario interno, recibirás un enlace para restablecer la contraseña.</p><router-link to="/login" class="mt-6 inline-block text-sm font-semibold text-brand-600">Volver al inicio de sesión</router-link></div></template><template v-else><h1 class="font-display text-2xl font-bold text-stone-900">Recuperar contraseña</h1><p class="mt-2 text-sm leading-6 text-stone-500">Indica tu correo institucional y te enviaremos un enlace seguro.</p><form @submit.prevent="submit" class="mt-6 space-y-5"><AppInput v-model="email" label="Correo institucional" type="email" placeholder="nombre@empresa.com" /><p v-if="error" class="text-sm text-red-600">{{ error }}</p><button :disabled="loading" class="btn-primary w-full py-3 text-sm">{{ loading ? 'Enviando...' : 'Enviar enlace' }}</button></form><router-link to="/login" class="mt-5 block text-center text-sm font-semibold text-brand-600">Volver al inicio de sesión</router-link></template></div></div></div>
</template>
