<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from '../../stores/users'
import { useAuthStore } from '../../stores/auth'

const users = useUsersStore()
const auth = useAuthStore()
const router = useRouter()
const search = ref('')
const activity = ref(null)
const activityLoading = ref(false)
const notice = ref('')
const confirmAction = ref(null)

const filteredUsers = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return users.list
  return users.list.filter(user => `${user.nombres} ${user.apellidos} ${user.email} ${user.cargo || ''} ${user.roles?.name || ''}`.toLowerCase().includes(term))
})

const statusClasses = {
  activo: 'bg-sage-50 text-sage-700',
  inactivo: 'bg-stone-100 text-stone-600',
  bloqueado: 'bg-red-50 text-red-700'
}

onMounted(() => users.fetchAll())

async function openActivity (user) {
  activity.value = { user, items: [] }
  activityLoading.value = true
  try {
    activity.value.items = await users.activity(user.id)
  } catch (e) {
    users.error = e.message
  } finally {
    activityLoading.value = false
  }
}

async function executeAction () {
  const { user, estado, type } = confirmAction.value
  const success = type === 'status'
    ? await users.setStatus(user.id, estado)
    : await users.resetPassword(user.id)

  if (success) {
    notice.value = type === 'status'
      ? `El usuario fue marcado como ${estado}.`
      : `Se envió el correo para restablecer la contraseña de ${user.email}.`
  }
  confirmAction.value = null
}

function statusLabel (status) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function eventLabel (event) {
  return event.replaceAll('_', ' ')
}

function handleAction (event, user) {
  const action = event.target.value
  event.target.value = ''

  if (action === 'edit') router.push(`/admin/usuarios/${user.id}/editar`)
  if (action === 'activity') openActivity(user)
  if (action === 'reset') confirmAction.value = { user, type: 'reset' }
  if (action === 'activate') confirmAction.value = { user, type: 'status', estado: 'activo' }
  if (action === 'deactivate') confirmAction.value = { user, type: 'status', estado: 'inactivo' }
  if (action === 'block') confirmAction.value = { user, type: 'status', estado: 'bloqueado' }
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="font-display text-xl font-bold text-stone-900">Usuarios</h2>
        <p class="mt-1 text-sm text-stone-500">Administra el acceso interno al sistema.</p>
      </div>
      <router-link to="/admin/usuarios/nuevo" class="btn-primary px-4 py-2.5 text-sm">+ Crear usuario</router-link>
    </div>

    <p v-if="notice" class="mb-4 rounded-xl bg-sage-50 px-4 py-3 text-sm text-sage-700">{{ notice }}</p>
    <p v-if="users.error" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ users.error }}</p>

    <div class="card overflow-hidden border border-stone-100">
      <div class="border-b border-stone-100 p-4">
        <input v-model="search" class="input-field max-w-md" placeholder="Buscar por nombre, correo, cargo o rol" />
      </div>
      <div v-if="users.loading" class="py-14 text-center text-sm text-stone-400">Cargando usuarios...</div>
      <div v-else-if="filteredUsers.length === 0" class="py-14 text-center text-sm text-stone-500">No se encontraron usuarios.</div>
      <div v-else class="divide-y divide-stone-100">
        <article v-for="user in filteredUsers" :key="user.id" class="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex min-w-0 items-start gap-3">
            <div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-sm font-bold text-brand-700">{{ user.nombres?.[0] }}{{ user.apellidos?.[0] }}</div>
            <div class="min-w-0">
              <h3 class="font-semibold text-stone-900">{{ user.nombres }} {{ user.apellidos }}</h3>
              <p class="truncate text-sm text-stone-500">{{ user.email }}</p>
              <p class="mt-1 text-xs text-stone-400">{{ user.cargo || 'Sin cargo registrado' }} · Último acceso: {{ user.ultimo_acceso ? new Date(user.ultimo_acceso).toLocaleString('es-SV') : 'Sin registros' }}</p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2 lg:justify-end">
            <span class="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{{ user.roles?.name }}</span>
            <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="statusClasses[user.estado]">{{ statusLabel(user.estado) }}</span>
            <select class="rounded-lg border-0 bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 outline-none transition hover:bg-stone-200 focus:ring-2 focus:ring-brand-200" aria-label="Acciones del usuario" @change="handleAction($event, user)">
              <option value="">Acciones</option>
              <option value="edit">Editar</option>
              <option value="activity">Actividad</option>
              <option value="reset">Restablecer contraseña</option>
              <option v-if="user.id !== auth.currentUser?.id && user.estado !== 'activo'" value="activate">Activar</option>
              <option v-if="user.id !== auth.currentUser?.id && user.estado === 'activo'" value="deactivate">Desactivar</option>
              <option v-if="user.id !== auth.currentUser?.id && user.estado === 'activo'" value="block">Bloquear</option>
            </select>
          </div>
        </article>
      </div>
    </div>

    <div v-if="activity" class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4" @click.self="activity = null">
      <div class="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div class="flex justify-between gap-4"><div><h3 class="font-display text-lg font-bold text-stone-900">Actividad de {{ activity.user.nombres }}</h3><p class="text-sm text-stone-500">Últimos 100 eventos registrados.</p></div><button @click="activity = null" class="text-stone-400 hover:text-stone-700">✕</button></div>
        <div v-if="activityLoading" class="py-10 text-center text-sm text-stone-400">Cargando actividad...</div>
        <div v-else-if="activity.items.length === 0" class="py-10 text-center text-sm text-stone-500">Aún no hay actividad registrada.</div>
        <div v-else class="mt-5 max-h-80 space-y-3 overflow-y-auto"><div v-for="item in activity.items" :key="item.id" class="rounded-xl bg-stone-50 p-3"><p class="text-sm font-semibold capitalize text-stone-800">{{ eventLabel(item.event_type) }}</p><p class="mt-1 text-xs text-stone-500">{{ new Date(item.created_at).toLocaleString('es-SV') }} · {{ item.actor ? `${item.actor.nombres} ${item.actor.apellidos}` : 'Sistema' }}</p></div></div>
      </div>
    </div>

    <div v-if="confirmAction" class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4" @click.self="confirmAction = null">
      <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"><h3 class="font-display text-lg font-bold text-stone-900">{{ confirmAction.type === 'reset' ? '¿Restablecer contraseña?' : '¿Cambiar estado?' }}</h3><p class="mt-2 text-sm leading-relaxed text-stone-500">{{ confirmAction.type === 'reset' ? `Se enviará un correo de restablecimiento a ${confirmAction.user.email}.` : `El usuario quedará ${confirmAction.estado}.` }}</p><div class="mt-6 flex justify-end gap-3"><button @click="confirmAction = null" class="px-4 py-2 text-sm font-semibold text-stone-600">Cancelar</button><button @click="executeAction" class="btn-primary px-4 py-2 text-sm">Confirmar</button></div></div>
    </div>
  </div>
</template>
