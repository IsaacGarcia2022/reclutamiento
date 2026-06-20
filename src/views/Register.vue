<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppInput from '../components/AppInput.vue'

const auth = useAuthStore()
const router = useRouter()
const form = ref({ name: '', email: '', password: '', confirm: '', company: '' })
const errors = ref({})

function validate () {
  const e = {}
  if (!form.value.name.trim()) e.name = 'Obligatorio'
  if (!form.value.email.trim()) e.email = 'Obligatorio'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) e.email = 'Correo inválido'
  if (!form.value.password) e.password = 'Obligatorio'
  else if (form.value.password.length < 6) e.password = 'Mínimo 6 caracteres'
  if (form.value.password !== form.value.confirm) e.confirm = 'Las contraseñas no coinciden'
  if (!form.value.company.trim()) e.company = 'Obligatorio'
  errors.value = e
  return Object.keys(e).length === 0
}

async function submit () {
  if (!validate()) return
  const ok = await auth.register({
    name: form.value.name,
    email: form.value.email,
    password: form.value.password,
    company: form.value.company
  })
  if (ok) router.push('/admin')
}
</script>

<template>
  <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="font-display text-3xl font-bold text-stone-900">Crear cuenta</h1>
        <p class="mt-1.5 text-stone-500">Para reclutadores y empresas</p>
      </div>

      <div class="card border border-stone-100 p-8 shadow-lg shadow-stone-200/30">
        <form @submit.prevent="submit" class="space-y-5">
          <AppInput v-model="form.name" label="Nombre completo" placeholder="Tu nombre" :error="errors.name" />
          <AppInput v-model="form.email" label="Correo electrónico" type="email" placeholder="correo@empresa.com" :error="errors.email" />
          <AppInput v-model="form.company" label="Empresa" placeholder="Nombre de la empresa" :error="errors.company" />
          <AppInput v-model="form.password" label="Contraseña" type="password" placeholder="Mínimo 6 caracteres" :error="errors.password" />
          <AppInput v-model="form.confirm" label="Confirmar contraseña" type="password" placeholder="Repite la contraseña" :error="errors.confirm" />

          <p v-if="auth.error" class="text-sm text-red-500 text-center font-body">{{ auth.error }}</p>

          <button type="submit" class="btn-primary w-full py-3 text-base">Crear cuenta</button>
        </form>

        <p class="mt-5 text-center text-sm text-stone-500">
          ¿Ya tienes cuenta?
          <router-link to="/login" class="font-semibold text-brand-600 hover:text-brand-700 transition-colors">Inicia sesión</router-link>
        </p>
      </div>
    </div>
  </div>
</template>
