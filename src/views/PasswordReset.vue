<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthService from '../services/AuthService'
import { getSupabaseClient } from '../services/supabase'
import AppInput from '../components/AppInput.vue'

const router = useRouter()
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const ready = ref(false)
const completed = ref(false)
const loading = ref(false)

onMounted(async () => {
  try {
    const { data: { session } } = await getSupabaseClient().auth.getSession()
    ready.value = Boolean(session)
  } catch (e) {
    error.value = e.message
  }
})

async function submit () {
  error.value = ''
  if (password.value.length < 10) { error.value = 'La contraseña debe tener al menos 10 caracteres.'; return }
  if (password.value !== confirmPassword.value) { error.value = 'Las contraseñas no coinciden.'; return }
  loading.value = true
  try {
    await AuthService.updatePassword(password.value)
    completed.value = true
    setTimeout(() => router.push('/login'), 1800)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12"><div class="w-full max-w-md"><div class="card border border-stone-100 p-8 shadow-lg shadow-stone-200/30"><template v-if="completed"><div class="text-center"><div class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sage-100 text-xl text-sage-700">✓</div><h1 class="mt-5 font-display text-2xl font-bold text-stone-900">Contraseña actualizada</h1><p class="mt-2 text-sm text-stone-500">Te redirigiremos al inicio de sesión.</p></div></template><template v-else-if="!ready && !error"><p class="py-8 text-center text-sm text-stone-500">Validando enlace seguro...</p></template><template v-else-if="!ready"><h1 class="font-display text-2xl font-bold text-stone-900">Enlace no válido</h1><p class="mt-2 text-sm leading-6 text-stone-500">Solicita un nuevo enlace de recuperación. Los enlaces expiran por seguridad.</p><router-link to="/recuperar-contrasena" class="mt-6 inline-block text-sm font-semibold text-brand-600">Solicitar otro enlace</router-link></template><template v-else><h1 class="font-display text-2xl font-bold text-stone-900">Nueva contraseña</h1><p class="mt-2 text-sm text-stone-500">Usa una contraseña de al menos 10 caracteres.</p><form @submit.prevent="submit" class="mt-6 space-y-5"><AppInput v-model="password" label="Nueva contraseña" type="password" /><AppInput v-model="confirmPassword" label="Confirmar contraseña" type="password" /><p v-if="error" class="text-sm text-red-600">{{ error }}</p><button :disabled="loading" class="btn-primary w-full py-3 text-sm">{{ loading ? 'Guardando...' : 'Actualizar contraseña' }}</button></form></template></div></div></div>
</template>
