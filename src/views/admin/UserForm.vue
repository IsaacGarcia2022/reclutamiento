<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUsersStore } from '../../stores/users'
import AppInput from '../../components/AppInput.vue'
import AppSelect from '../../components/AppSelect.vue'

const route = useRoute()
const router = useRouter()
const users = useUsersStore()
const isEdit = computed(() => Boolean(route.params.id))
const loading = ref(false)
const errors = ref({})
const form = ref({ nombres: '', apellidos: '', email: '', telefono: '', cargo: '', roleId: '', password: '' })

const roleOptions = computed(() => users.roles.map(role => ({ value: role.id, label: role.name })))

onMounted(async () => {
  await users.fetchRoles()
  if (isEdit.value) {
    loading.value = true
    try {
      const user = await users.getById(route.params.id)
      form.value = { nombres: user.nombres, apellidos: user.apellidos, email: user.email, telefono: user.telefono || '', cargo: user.cargo || '', roleId: user.role_id, password: '' }
    } catch (e) { users.error = e.message } finally { loading.value = false }
  }
})

function validate () {
  const nextErrors = {}
  if (!form.value.nombres.trim()) nextErrors.nombres = 'Obligatorio'
  if (!form.value.apellidos.trim()) nextErrors.apellidos = 'Obligatorio'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) nextErrors.email = 'Ingresa un correo válido'
  if (!form.value.roleId) nextErrors.roleId = 'Selecciona un rol'
  if (!isEdit.value && form.value.password.length < 10) nextErrors.password = 'Mínimo 10 caracteres'
  errors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

async function submit () {
  if (!validate()) return
  loading.value = true
  const payload = { ...form.value, id: route.params.id }
  const result = isEdit.value ? await users.update(payload) : await users.create(payload)
  loading.value = false
  if (result) router.push('/admin/usuarios')
}
</script>

<template>
  <div>
    <div class="mb-6"><router-link to="/admin/usuarios" class="text-sm font-semibold text-brand-600 hover:text-brand-700">← Volver a usuarios</router-link><h2 class="mt-3 font-display text-xl font-bold text-stone-900">{{ isEdit ? 'Editar usuario' : 'Crear usuario' }}</h2><p class="mt-1 text-sm text-stone-500">{{ isEdit ? 'Actualiza los datos y el rol de acceso.' : 'La persona recibirá acceso al sistema con una contraseña temporal.' }}</p></div>
    <p v-if="users.error" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ users.error }}</p>
    <div class="card max-w-3xl border border-stone-100 p-6 sm:p-8"><div v-if="loading && isEdit" class="py-10 text-center text-sm text-stone-400">Cargando usuario...</div><form v-else @submit.prevent="submit" class="space-y-5"><div class="grid gap-5 sm:grid-cols-2"><AppInput v-model="form.nombres" label="Nombres" :error="errors.nombres" placeholder="Ej. Ana María" /><AppInput v-model="form.apellidos" label="Apellidos" :error="errors.apellidos" placeholder="Ej. López" /></div><div class="grid gap-5 sm:grid-cols-2"><AppInput v-model="form.email" label="Correo institucional" type="email" :error="errors.email" placeholder="nombre@empresa.com" /><AppInput v-model="form.telefono" label="Teléfono" placeholder="+503 0000 0000" /></div><div class="grid gap-5 sm:grid-cols-2"><AppInput v-model="form.cargo" label="Cargo" placeholder="Ej. Analista de RR. HH." /><AppSelect v-model="form.roleId" label="Rol" :options="roleOptions" :error="errors.roleId" /></div><AppInput v-if="!isEdit" v-model="form.password" label="Contraseña temporal" type="password" :error="errors.password" placeholder="Mínimo 10 caracteres" /><p v-if="!isEdit" class="-mt-2 text-xs text-stone-500">El usuario podrá restablecerla desde el correo institucional.</p><div class="flex gap-3 pt-2"><button type="submit" :disabled="loading" class="btn-primary px-6 py-2.5 text-sm">{{ loading ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Crear usuario') }}</button><router-link to="/admin/usuarios" class="btn-secondary px-6 py-2.5 text-sm">Cancelar</router-link></div></form></div>
  </div>
</template>
