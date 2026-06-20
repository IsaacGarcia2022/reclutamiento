<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVacanciesStore } from '../../stores/vacancies'
import AppInput from '../../components/AppInput.vue'
import AppTextarea from '../../components/AppTextarea.vue'
import AppSelect from '../../components/AppSelect.vue'

const route = useRoute()
const router = useRouter()
const store = useVacanciesStore()

const isEdit = !!route.params.id
const errors = ref({})
const form = ref({
  title: '',
  company: '',
  location: '',
  type: '',
  salary: '',
  description: '',
  requisitos: ''
})

const typeOptions = [
  { value: 'Tiempo completo', label: 'Tiempo completo' },
  { value: 'Medio tiempo', label: 'Medio tiempo' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Remoto', label: 'Remoto' },
  { value: 'Prácticas', label: 'Prácticas' }
]

onMounted(async () => {
  if (isEdit) {
    await store.fetchById(route.params.id)
    if (store.current) {
      form.value = {
        title: store.current.title,
        company: store.current.company,
        location: store.current.location || '',
        type: store.current.type || '',
        salary: store.current.salary || '',
        description: store.current.description || '',
        requisitos: store.current.requisitos || ''
      }
    }
  }
})

function validate () {
  const e = {}
  if (!form.value.title.trim()) e.title = 'Obligatorio'
  if (!form.value.company.trim()) e.company = 'Obligatorio'
  if (!form.value.location.trim()) e.location = 'Obligatorio'
  if (!form.value.type) e.type = 'Selecciona un tipo'
  if (!form.value.description.trim()) e.description = 'Obligatorio'
  if (!form.value.requisitos.trim()) e.requisitos = 'Obligatorio'
  errors.value = e
  return Object.keys(e).length === 0
}

async function submit () {
  if (!validate()) return
  if (isEdit) {
    await store.update(route.params.id, form.value)
  } else {
    await store.create(form.value)
  }
  router.push('/admin/vacantes')
}
</script>

<template>
  <div>
    <h2 class="font-display text-xl font-bold text-stone-900 mb-6">{{ isEdit ? 'Editar vacante' : 'Nueva vacante' }}</h2>

    <div class="card border border-stone-100 p-8">
      <form @submit.prevent="submit" class="space-y-5">
        <div class="grid sm:grid-cols-2 gap-5">
          <AppInput v-model="form.title" label="Título del puesto" placeholder="Ej: Desarrollador Frontend" :error="errors.title" />
          <AppInput v-model="form.company" label="Empresa" placeholder="Nombre de la empresa" :error="errors.company" />
        </div>
        <div class="grid sm:grid-cols-3 gap-5">
          <AppInput v-model="form.location" label="Ubicación" placeholder="Ej: Santiago, Chile" :error="errors.location" />
          <AppSelect v-model="form.type" label="Tipo de empleo" :options="typeOptions" :error="errors.type" />
          <AppInput v-model="form.salary" label="Salario (opcional)" placeholder="Ej: $1.500.000 - $2.000.000" />
        </div>
        <AppTextarea v-model="form.description" label="Descripción del puesto" placeholder="Describe las responsabilidades y el contexto del puesto..." :error="errors.description" rows="5" />
        <AppTextarea v-model="form.requisitos" label="Requisitos" placeholder="Lista los requisitos y habilidades necesarias..." :error="errors.requisitos" rows="5" />

        <div class="flex gap-3 pt-2">
          <button type="submit" class="btn-primary px-6 py-2.5 text-sm">
            {{ isEdit ? 'Guardar cambios' : 'Publicar vacante' }}
          </button>
          <router-link to="/admin/vacantes" class="btn-secondary px-6 py-2.5 text-sm">
            Cancelar
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>
