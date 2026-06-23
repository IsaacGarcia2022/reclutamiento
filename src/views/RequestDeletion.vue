<script setup>
import { ref } from 'vue'
import ConsentService from '../services/ConsentService'

const form = ref({
  correo: '',
  motivo: ''
})

const errors = ref({})
const loading = ref(false)
const success = ref(false)
const errorMessage = ref(null)

function validate() {
  const errs = {}
  if (!form.value.correo.trim()) {
    errs.correo = 'El correo electrónico es obligatorio'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.correo)) {
    errs.correo = 'El correo electrónico no es válido'
  }
  
  if (!form.value.motivo.trim()) {
    errs.motivo = 'El motivo de la solicitud es obligatorio'
  } else if (form.value.motivo.trim().length < 10) {
    errs.motivo = 'Por favor proporcione una explicación más detallada (mínimo 10 caracteres)'
  }

  errors.value = errs
  return Object.keys(errs).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  
  loading.value = true
  errorMessage.value = null
  try {
    await ConsentService.requestDataDeletion({
      correo: form.value.correo.trim(),
      motivo: form.value.motivo.trim()
    })
    success.value = true
  } catch (e) {
    errorMessage.value = e.message || 'No fue posible registrar tu solicitud. Intenta nuevamente.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-[#f5f7f4] text-[#17282d] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <router-link to="/" class="inline-flex items-center gap-1 text-sm font-semibold text-[#1d6978] hover:text-[#154f5d] transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver al inicio
        </router-link>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold font-display text-[#17282d] tracking-tight">
        Derecho al Olvido
      </h2>
      <p class="mt-2 text-center text-sm text-[#617276] font-body max-w-sm mx-auto">
        Solicita la eliminación definitiva de tus datos personales e historial de postulaciones de nuestra plataforma.
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
      <div class="bg-white py-8 px-6 shadow-[0_12px_40px_rgba(28,61,66,0.06)] border border-[#dce5e2] rounded-2xl sm:px-10">
        
        <div v-if="success" class="text-center space-y-4 py-4">
          <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h3 class="text-xl font-bold font-display text-stone-900">Solicitud Recibida</h3>
          <p class="text-sm text-stone-500 font-body leading-relaxed">
            Hemos registrado tu solicitud de borrado para el correo <strong>{{ form.correo }}</strong>. Nuestro equipo de selección la revisará y procesará en un plazo máximo de 30 días hábiles.
          </p>
          <div class="bg-stone-50 rounded-xl p-3.5 border border-stone-200/60 text-left text-xs text-stone-400 font-body">
            <strong>Nota de cumplimiento:</strong> Conservaremos únicamente el registro histórico de esta solicitud de eliminación con fines de auditoría y evidencia legal, purgando de manera definitiva tus currículums y datos personales del pool activo.
          </div>
          <div class="pt-4">
            <router-link to="/" class="btn btn-secondary w-full py-2.5 text-sm font-semibold">
              Volver a la página de inicio
            </router-link>
          </div>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <div v-if="errorMessage" class="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl text-xs font-body">
            <strong>Error:</strong> {{ errorMessage }}
          </div>

          <div class="space-y-1">
            <label for="email" class="block text-sm font-semibold text-[#17282d] font-body">
              Correo electrónico registrado *
            </label>
            <input 
              id="email" 
              type="email" 
              v-model="form.correo" 
              placeholder="correo@ejemplo.com"
              class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1d6978]/25 focus:border-[#1d6978] transition font-body text-sm text-[#17282d]" 
              :class="errors.correo ? 'border-red-300 ring-2 ring-red-100' : ''"
            />
            <p v-if="errors.correo" class="text-xs text-red-500 font-body mt-1">{{ errors.correo }}</p>
          </div>

          <div class="space-y-1">
            <label for="reason" class="block text-sm font-semibold text-[#17282d] font-body">
              Motivo de la solicitud *
            </label>
            <textarea 
              id="reason" 
              v-model="form.motivo" 
              rows="4" 
              placeholder="Explica brevemente por qué deseas que tus datos sean eliminados del portal (ej. postulación finalizada, actualización de consentimiento, etc.)"
              class="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#1d6978]/25 focus:border-[#1d6978] transition font-body text-sm text-[#17282d]"
              :class="errors.motivo ? 'border-red-300 ring-2 ring-red-100' : ''"
            ></textarea>
            <p v-if="errors.motivo" class="text-xs text-red-500 font-body mt-1">{{ errors.motivo }}</p>
          </div>

          <div class="bg-stone-50 rounded-xl p-3 border border-stone-150 text-[11px] text-stone-500 font-body leading-relaxed">
            Al enviar esta solicitud, confirmas ser el titular de los datos asociados a este correo electrónico. Se te podrá contactar para verificar tu identidad antes de completar la purga de datos.
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            class="w-full bg-[#154f5d] hover:bg-[#103d48] text-white py-3 px-4 rounded-xl text-sm font-bold font-display shadow-sm transition flex items-center justify-center gap-2"
          >
            <svg v-if="loading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? 'Enviando solicitud...' : 'Solicitar Eliminación' }}
          </button>
        </form>
      </div>
    </div>
  </main>
</template>
