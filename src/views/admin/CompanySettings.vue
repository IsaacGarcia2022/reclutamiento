<script setup>
import { onMounted, ref } from 'vue'
import { useCompanyStore } from '../../stores/company'
import AppInput from '../../components/AppInput.vue'
import AppTextarea from '../../components/AppTextarea.vue'

const company = useCompanyStore()
const form = ref(null)
const logoFile = ref(null)
const logoPreview = ref('')
const saved = ref(false)

onMounted(async () => {
  form.value = await company.fetch()
  logoPreview.value = form.value?.logoUrl || ''
})

function selectLogo (event) {
  const [file] = event.target.files
  if (!file) return
  logoFile.value = file
  logoPreview.value = URL.createObjectURL(file)
}

async function submit () {
  saved.value = false
  const result = await company.save(form.value, logoFile.value)
  if (result) {
    form.value = result
    logoFile.value = null
    logoPreview.value = result.logoUrl
    saved.value = true
  }
}
</script>

<template>
  <div>
    <div class="mb-6"><h2 class="font-display text-xl font-bold text-stone-900">Empresa</h2><p class="mt-1 text-sm text-stone-500">Configuración institucional y contenido público de la organización.</p></div>
    <p v-if="company.error" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ company.error }}</p>
    <p v-if="saved" class="mb-4 rounded-xl bg-sage-50 px-4 py-3 text-sm text-sage-700">La configuración de la empresa fue actualizada.</p>
    <div v-if="!form && company.loading" class="py-16 text-center text-sm text-stone-400">Cargando configuración...</div>
    <form v-else-if="form" @submit.prevent="submit" class="space-y-6">
      <section class="card border border-stone-100 p-6 sm:p-8"><div class="mb-6"><h3 class="font-display text-lg font-bold text-stone-900">Identidad institucional</h3><p class="mt-1 text-sm text-stone-500">Datos principales que se mostrarán en las vacantes y comunicaciones.</p></div><div class="grid gap-5 lg:grid-cols-[auto_1fr]"><div class="w-full lg:w-44"><div class="grid aspect-square place-items-center overflow-hidden rounded-2xl border border-dashed border-stone-300 bg-stone-50"><img v-if="logoPreview" :src="logoPreview" alt="Logo de la empresa" class="h-full w-full object-contain p-3" /><span v-else class="text-sm text-stone-400">Logo</span></div><label class="mt-3 block cursor-pointer rounded-xl bg-stone-100 px-3 py-2 text-center text-xs font-semibold text-stone-700 hover:bg-stone-200">Cambiar logo<input class="hidden" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" @change="selectLogo" /></label><p class="mt-2 text-center text-xs text-stone-400">PNG, JPG, WebP o SVG · máx. 2 MB</p></div><div class="grid gap-5 sm:grid-cols-2"><AppInput v-model="form.nombreLegal" label="Nombre legal" placeholder="Razón social de la empresa" /><AppInput v-model="form.nombreComercial" label="Nombre comercial" placeholder="Nombre visible al público" /><AppInput v-model="form.sector" label="Sector" placeholder="Ej. Tecnología, servicios, comercio" /><AppInput v-model="form.correoRecursosHumanos" label="Correo de Recursos Humanos" type="email" placeholder="rrhh@empresa.com" /><AppInput v-model="form.telefono" label="Teléfono" placeholder="+503 0000 0000" /><AppInput v-model="form.sitioWeb" label="Sitio web" placeholder="https://empresa.com" /></div></div><div class="mt-5"><AppTextarea v-model="form.descripcion" label="Descripción de la empresa" placeholder="Presenta a la empresa y su cultura." rows="4" /></div><div class="mt-5"><AppTextarea v-model="form.direccion" label="Dirección" placeholder="Dirección de oficinas o sede principal." rows="2" /></div></section>

      <section class="card border border-stone-100 p-6 sm:p-8"><div class="mb-6"><h3 class="font-display text-lg font-bold text-stone-900">Marca y presencia digital</h3><p class="mt-1 text-sm text-stone-500">Los colores institucionales se aplican a los elementos principales de la interfaz.</p></div><div class="grid gap-5 sm:grid-cols-2"><div class="rounded-2xl border border-stone-200 p-4"><label class="text-sm font-medium text-stone-700">Color principal</label><div class="mt-3 flex items-center gap-3"><input v-model="form.colorPrincipal" type="color" class="h-10 w-12 cursor-pointer rounded border border-stone-200 bg-white p-1" /><input v-model="form.colorPrincipal" class="input-field flex-1 font-mono uppercase" maxlength="7" /></div></div><div class="rounded-2xl border border-stone-200 p-4"><label class="text-sm font-medium text-stone-700">Color secundario</label><div class="mt-3 flex items-center gap-3"><input v-model="form.colorSecundario" type="color" class="h-10 w-12 cursor-pointer rounded border border-stone-200 bg-white p-1" /><input v-model="form.colorSecundario" class="input-field flex-1 font-mono uppercase" maxlength="7" /></div></div><AppInput v-model="form.facebook" label="Facebook" placeholder="https://facebook.com/empresa" /><AppInput v-model="form.instagram" label="Instagram" placeholder="https://instagram.com/empresa" /><AppInput v-model="form.linkedin" label="LinkedIn" placeholder="https://linkedin.com/company/empresa" /></div><div class="mt-6 flex items-center gap-3 rounded-2xl bg-stone-50 p-4"><span class="h-10 w-10 rounded-xl" :style="{ backgroundColor: form.colorPrincipal }"></span><span class="h-10 w-10 rounded-xl" :style="{ backgroundColor: form.colorSecundario }"></span><p class="text-sm text-stone-600">Vista previa de colores institucionales.</p></div></section>

      <section class="card border border-stone-100 p-6 sm:p-8"><h3 class="font-display text-lg font-bold text-stone-900">Cultura y beneficios</h3><div class="mt-6 grid gap-5"><AppTextarea v-model="form.mision" label="Misión" rows="3" /><AppTextarea v-model="form.vision" label="Visión" rows="3" /><AppTextarea v-model="form.valores" label="Valores" placeholder="Describe los valores que orientan a la organización." rows="3" /><AppTextarea v-model="form.beneficiosLaborales" label="Beneficios laborales" placeholder="Describe los beneficios ofrecidos a colaboradores." rows="4" /></div></section>

      <section class="card border border-stone-100 p-6 sm:p-8"><div class="mb-6"><h3 class="font-display text-lg font-bold text-stone-900">Documentos para postulantes</h3><p class="mt-1 text-sm text-stone-500">Este contenido será presentado antes de enviar una postulación.</p></div><div class="grid gap-5"><div class="grid gap-5 sm:grid-cols-[1fr_14rem]"><AppTextarea v-model="form.politicaPrivacidad" label="Política de privacidad" rows="6" /><AppInput v-model="form.versionPoliticaPrivacidad" label="Versión de política" placeholder="Ej. 1.0 · 2026" /></div><div class="grid gap-5 sm:grid-cols-[1fr_14rem]"><AppTextarea v-model="form.terminosPostulacion" label="Términos de postulación" rows="6" /><AppInput v-model="form.versionTerminos" label="Versión de términos" placeholder="Ej. 1.0 · 2026" /></div></div></section>

      <div class="sticky bottom-4 z-10 flex justify-end rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-lg backdrop-blur"><button :disabled="company.loading" class="btn-primary px-6 py-3 text-sm">{{ company.loading ? 'Guardando...' : 'Guardar configuración' }}</button></div>
    </form>
  </div>
</template>
