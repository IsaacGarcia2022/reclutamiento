<script setup>
import { computed, onMounted, ref } from 'vue'
import CatalogService from '../../services/CatalogService'

const definitions = [
  ['departamento', 'Departamentos de la empresa'], ['area_profesional', 'Áreas profesionales'], ['puesto', 'Puestos'], ['ubicacion', 'Ubicaciones'], ['pais', 'Países'], ['departamento_geografico', 'Departamentos geográficos'], ['municipio', 'Municipios'], ['modalidad', 'Modalidades de trabajo'], ['tipo_contrato', 'Tipos de contrato'], ['jornada', 'Jornadas laborales'], ['nivel_academico', 'Niveles académicos'], ['profesion_oficio', 'Profesiones y oficios'], ['fuente_reclutamiento', 'Fuentes de reclutamiento'], ['tipo_documento', 'Tipos de documentos'], ['etiqueta_candidato', 'Etiquetas de candidatos']
].map(([value, label]) => ({ value, label }))
const parentRules = { departamento_geografico: 'pais', municipio: 'departamento_geografico' }
const items = ref([])
const selectedCategory = ref('departamento')
const query = ref('')
const includeInactive = ref(true)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const editorOpen = ref(false)
const form = ref({ id: '', nombre: '', descripcion: '', parentId: '' })

const currentDefinition = computed(() => definitions.find(item => item.value === selectedCategory.value))
const visibleItems = computed(() => items.value.filter(item => item.categoria === selectedCategory.value && (includeInactive.value || item.activo) && `${item.nombre} ${item.descripcion || ''}`.toLowerCase().includes(query.value.trim().toLowerCase())))
const requiredParent = computed(() => parentRules[selectedCategory.value] || '')
const parentOptions = computed(() => requiredParent.value ? items.value.filter(item => item.categoria === requiredParent.value && item.activo) : [])

async function load () {
  loading.value = true; error.value = ''
  try { items.value = await CatalogService.list() } catch (e) { error.value = e.message || 'No fue posible cargar los catálogos.' } finally { loading.value = false }
}

function openCreate () {
  form.value = { id: '', nombre: '', descripcion: '', parentId: '' }
  error.value = ''; editorOpen.value = true
}
function openEdit (item) {
  form.value = { id: item.id, nombre: item.nombre, descripcion: item.descripcion || '', parentId: item.parent_id || '' }
  error.value = ''; editorOpen.value = true
}
async function save () {
  saving.value = true; error.value = ''; notice.value = ''
  try {
    const payload = { ...form.value, categoria: selectedCategory.value }
    const item = form.value.id ? await CatalogService.update(payload) : await CatalogService.create(payload)
    const index = items.value.findIndex(current => current.id === item.id)
    if (index >= 0) items.value[index] = item; else items.value.push(item)
    editorOpen.value = false; notice.value = form.value.id ? 'Catálogo actualizado correctamente.' : 'Catálogo creado correctamente.'
  } catch (e) { error.value = e.message || 'No fue posible guardar el catálogo.' } finally { saving.value = false }
}
async function toggle (item) {
  saving.value = true; error.value = ''; notice.value = ''
  try {
    const updated = await CatalogService.toggle(item.id, !item.activo)
    const index = items.value.findIndex(current => current.id === updated.id)
    items.value[index] = updated
    notice.value = updated.activo ? 'Catálogo activado.' : 'Catálogo desactivado. No se eliminó ningún registro.'
  } catch (e) { error.value = e.message || 'No fue posible actualizar el estado.' } finally { saving.value = false }
}

onMounted(load)
</script>

<template>
  <div>
    <header class="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p class="text-sm font-semibold text-brand-600">Configuración maestra</p><h2 class="mt-1 font-display text-2xl font-bold text-stone-900">Catálogos</h2><p class="mt-1 text-sm text-stone-500">Administra valores reutilizables sin borrar información histórica.</p></div><button type="button" class="btn-primary px-4 py-2 text-sm" @click="openCreate">Nuevo {{ currentDefinition?.label.slice(0, -1) || 'catálogo' }}</button></header>
    <p v-if="error" class="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{{ error }}</p><p v-if="notice" class="mb-5 rounded-xl border border-sage-200 bg-sage-50 p-4 text-sm text-sage-700">{{ notice }}</p>
    <div class="grid gap-6 xl:grid-cols-[285px_minmax(0,1fr)]">
      <aside class="card border border-stone-100 p-2 shadow-sm"><button v-for="definition in definitions" :key="definition.value" type="button" class="w-full rounded-xl px-3 py-2.5 text-left text-sm transition" :class="selectedCategory === definition.value ? 'bg-brand-50 font-semibold text-brand-700' : 'text-stone-600 hover:bg-stone-50'" @click="selectedCategory = definition.value; query = ''">{{ definition.label }}</button></aside>
      <section class="card min-w-0 border border-stone-100 p-5 shadow-sm">
        <div class="flex flex-col gap-4 border-b border-stone-100 pb-5 lg:flex-row lg:items-center lg:justify-between"><div><h3 class="font-display text-lg font-bold text-stone-900">{{ currentDefinition?.label }}</h3><p class="mt-1 text-sm text-stone-500">{{ visibleItems.length }} registros · Los inactivos se conservan por trazabilidad.</p></div><div class="flex flex-wrap gap-2"><label class="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-600"><input v-model="includeInactive" type="checkbox" class="accent-brand-600" /> Mostrar inactivos</label><input v-model="query" class="input-field w-52" placeholder="Buscar..." /></div></div>
        <div v-if="loading" class="py-16 text-center text-sm text-stone-400">Cargando catálogos...</div>
        <div v-else-if="!visibleItems.length" class="py-16 text-center text-sm text-stone-400">No hay registros para esta categoría.</div>
        <div v-else class="mt-4 overflow-x-auto"><table class="min-w-full text-left text-sm"><thead class="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400"><tr><th class="px-3 py-3">Nombre</th><th class="px-3 py-3">Relación</th><th class="px-3 py-3">Estado</th><th class="px-3 py-3 text-right">Acciones</th></tr></thead><tbody><tr v-for="item in visibleItems" :key="item.id" class="border-b border-stone-50"><td class="px-3 py-3"><p class="font-semibold text-stone-800">{{ item.nombre }}</p><p v-if="item.descripcion" class="mt-0.5 text-xs text-stone-500">{{ item.descripcion }}</p></td><td class="px-3 py-3 text-stone-600">{{ item.parent?.nombre || '—' }}</td><td class="px-3 py-3"><span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="item.activo ? 'bg-sage-50 text-sage-700' : 'bg-stone-100 text-stone-500'">{{ item.activo ? 'Activo' : 'Inactivo' }}</span></td><td class="px-3 py-3 text-right"><button type="button" class="mr-2 text-xs font-semibold text-brand-700 hover:text-brand-900" @click="openEdit(item)">Editar</button><button type="button" class="text-xs font-semibold" :class="item.activo ? 'text-coral-700 hover:text-coral-900' : 'text-sage-700 hover:text-sage-900'" :disabled="saving" @click="toggle(item)">{{ item.activo ? 'Desactivar' : 'Activar' }}</button></td></tr></tbody></table></div>
      </section>
    </div>
    <div v-if="editorOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/35 p-4" @click.self="editorOpen = false"><form class="card w-full max-w-lg border border-stone-100 p-6 shadow-xl" @submit.prevent="save"><div class="flex items-start justify-between gap-4"><div><p class="text-sm font-semibold text-brand-600">{{ currentDefinition?.label }}</p><h3 class="mt-1 font-display text-xl font-bold">{{ form.id ? 'Editar catálogo' : 'Nuevo catálogo' }}</h3></div><button type="button" class="text-stone-400 hover:text-stone-700" @click="editorOpen = false">Cerrar</button></div><label class="mt-6 block text-sm font-semibold text-stone-700">Nombre<input v-model.trim="form.nombre" required maxlength="120" class="input-field mt-1" placeholder="Escribe el nombre" /></label><label v-if="requiredParent" class="mt-4 block text-sm font-semibold text-stone-700">{{ requiredParent === 'pais' ? 'País' : 'Departamento geográfico' }}<select v-model="form.parentId" required class="input-field mt-1"><option value="">Seleccionar...</option><option v-for="item in parentOptions" :key="item.id" :value="item.id">{{ item.nombre }}</option></select></label><label class="mt-4 block text-sm font-semibold text-stone-700">Descripción <span class="font-normal text-stone-400">(opcional)</span><textarea v-model.trim="form.descripcion" rows="3" class="input-field mt-1" placeholder="Contexto o aclaración para el equipo"></textarea></label><div class="mt-6 flex justify-end gap-3"><button type="button" class="btn-secondary px-4 py-2 text-sm" @click="editorOpen = false">Cancelar</button><button type="submit" class="btn-primary px-4 py-2 text-sm" :disabled="saving">{{ saving ? 'Guardando...' : 'Guardar' }}</button></div></form></div>
  </div>
</template>
