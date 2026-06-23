<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import ReportService from '../../services/ReportService'
import VacancyService from '../../services/VacancyService'
import AuditService from '../../services/AuditService'

// Tipos de reporte en español con sus respectivos IDs para la Edge Function
const reportTypes = [
  { id: 'vacantes_periodo', label: 'Vacantes por periodo' },
  { id: 'vacantes_estado', label: 'Vacantes por estado' },
  { id: 'postulaciones_vacante', label: 'Postulaciones por vacante' },
  { id: 'postulaciones_periodo', label: 'Postulaciones por periodo' },
  { id: 'postulaciones_area', label: 'Postulaciones por área' },
  { id: 'postulaciones_ubicacion', label: 'Postulaciones por ubicación' },
  { id: 'postulaciones_nivel_academico', label: 'Postulaciones por nivel académico' },
  { id: 'postulaciones_modalidad', label: 'Postulaciones por modalidad' },
  { id: 'postulaciones_fuente', label: 'Postulaciones por fuente de reclutamiento' },
  { id: 'banco_candidatos', label: 'Banco de candidatos' },
  { id: 'vacantes_mas_postulaciones', label: 'Vacantes con más postulaciones' },
  { id: 'vacantes_sin_postulaciones', label: 'Vacantes sin postulaciones' }
]

// Opciones de estados fijos en el sistema
const vacancyStates = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'publicada', label: 'Publicada' },
  { value: 'pausada', label: 'Pausada' },
  { value: 'cerrada', label: 'Cerrada' },
  { value: 'archivada', label: 'Archivada' }
]

const applicationStates = [
  { value: 'nueva', label: 'Nueva' },
  { value: 'revisada', label: 'Revisada' },
  { value: 'preseleccionada', label: 'Preseleccionada' },
  { value: 'entrevista', label: 'Entrevista' },
  { value: 'evaluacion', label: 'Evaluación' },
  { value: 'oferta', label: 'Oferta' },
  { value: 'contratado', label: 'Contratado' },
  { value: 'descartado', label: 'Descartado' }
]

// Estado local
const selectedReport = ref('vacantes_periodo')
const loading = ref(false)
const error = ref(null)
const reportData = ref(null)

// Datos cargados desde catálogos y base de datos para los filtros
const vacancies = ref([])
const catalogs = ref([])

// Estructura de filtros reactivos
const filters = ref({
  fecha_desde: '',
  fecha_hasta: '',
  vacante_id: '',
  area_id: '',
  ubicacion_id: '',
  modalidad_id: '',
  estado_vacante: '',
  estado_postulacion: '',
  fuente_reclutamiento_id: ''
})

// Variables para búsqueda y paginación local de la tabla
const tableSearch = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Desglosar elementos del catálogo
const professionalAreas = computed(() => catalogs.value.filter(c => c.categoria === 'area_profesional' && c.activo))
const locations = computed(() => catalogs.value.filter(c => c.categoria === 'ubicacion' && c.activo))
const modalities = computed(() => catalogs.value.filter(c => c.categoria === 'modalidad' && c.activo))
const recruitmentSources = computed(() => catalogs.value.filter(c => c.categoria === 'fuente_reclutamiento' && c.activo))

// Obtener título actual en español del reporte seleccionado
const currentReportLabel = computed(() => {
  return reportTypes.find(r => r.id === selectedReport.value)?.label || 'Reporte de Selección'
})

// Control de impresión sin setTimeout para evitar warnings de bloqueo en el navegador
let originalLimit = 10
let originalPage = 1

function handleBeforePrint() {
  originalLimit = itemsPerPage.value
  originalPage = currentPage.value
  itemsPerPage.value = filteredRows.value.length || 10
  currentPage.value = 1
}

function handleAfterPrint() {
  itemsPerPage.value = originalLimit
  currentPage.value = originalPage
}

onUnmounted(() => {
  window.removeEventListener('beforeprint', handleBeforePrint)
  window.removeEventListener('afterprint', handleAfterPrint)
})

// Cargar catálogos iniciales
onMounted(async () => {
  window.addEventListener('beforeprint', handleBeforePrint)
  window.addEventListener('afterprint', handleAfterPrint)
  document.title = 'Reportes - Portal de Reclutamiento'
  loading.value = true
  try {
    const [vacs, cats] = await Promise.all([
      VacancyService.listAdmin(),
      VacancyService.catalogs()
    ])
    vacancies.value = vacs
    catalogs.value = cats
    
    // Generar reporte inicial
    await fetchReport()
  } catch (e) {
    console.error('Error al inicializar cargado de catálogos:', e)
    error.value = 'Ocurrió un error al cargar la información inicial de los filtros.'
  } finally {
    loading.value = false
  }
})

// Volver a consultar si cambia el reporte
watch(selectedReport, () => {
  fetchReport()
})

// Invocar servicio Edge Function
async function fetchReport() {
  loading.value = true
  error.value = null
  currentPage.value = 1
  tableSearch.value = ''
  try {
    const data = await ReportService.generateReport(selectedReport.value, filters.value)
    reportData.value = data
  } catch (e) {
    console.error('Error generando reporte:', e)
    error.value = e.message || 'No fue posible generar el reporte en este momento.'
    reportData.value = null
  } finally {
    loading.value = false
  }
}

// Limpiar filtros del formulario
function clearFilters() {
  filters.value = {
    fecha_desde: '',
    fecha_hasta: '',
    vacante_id: '',
    area_id: '',
    ubicacion_id: '',
    modalidad_id: '',
    estado_vacante: '',
    estado_postulacion: '',
    fuente_reclutamiento_id: ''
  }
  fetchReport()
}

// Lógica de Gráficos CSS
const chartType = computed(() => {
  // Reportes por periodo usan barras verticales; el resto usan barras horizontales
  if (['vacantes_periodo', 'postulaciones_periodo'].includes(selectedReport.value)) {
    return 'vertical'
  }
  return 'horizontal'
})

const maxChartValue = computed(() => {
  if (!reportData.value?.chartData || reportData.value.chartData.length === 0) return 1
  return Math.max(...reportData.value.chartData.map(item => item.value), 1)
})

const totalChartSum = computed(() => {
  if (!reportData.value?.chartData) return 0
  return reportData.value.chartData.reduce((acc, curr) => acc + curr.value, 0)
})

function calculatePercentage(val) {
  if (totalChartSum.value === 0) return 0
  return ((val / totalChartSum.value) * 100).toFixed(1)
}

function formatLabel(label) {
  if (!label) return 'N/A'
  // Si coincide con formato YYYY-MM (Mes de base de datos)
  if (/^\d{4}-\d{2}$/.test(label)) {
    const [year, month] = label.split('-')
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    return `${months[parseInt(month, 10) - 1]} ${year}`
  }
  return label
}

// Filtro y Búsqueda local de la Tabla
const filteredRows = computed(() => {
  if (!reportData.value?.tableData?.rows) return []
  const term = tableSearch.value.trim().toLowerCase()
  if (!term) return reportData.value.tableData.rows

  return reportData.value.tableData.rows.filter(row => {
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(term)
    )
  })
})

// Paginación local
const totalPages = computed(() => {
  return Math.ceil(filteredRows.value.length / itemsPerPage.value) || 1
})

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredRows.value.slice(start, end)
})

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

// Auxiliar para metadatos del reporte exportado
function formatAppliedFiltersForMeta() {
  const parts = []
  if (filters.value.fecha_desde) parts.push(`Desde: ${filters.value.fecha_desde}`)
  if (filters.value.fecha_hasta) parts.push(`Hasta: ${filters.value.fecha_hasta}`)
  if (filters.value.vacante_id) {
    const v = vacancies.value.find(x => x.id === filters.value.vacante_id)
    parts.push(`Vacante: ${v ? (v.title || v.titulo) : filters.value.vacante_id}`)
  }
  if (filters.value.area_id) {
    const a = catalogs.value.find(x => x.id === filters.value.area_id)
    parts.push(`Área: ${a ? a.nombre : filters.value.area_id}`)
  }
  if (filters.value.ubicacion_id) {
    const u = catalogs.value.find(x => x.id === filters.value.ubicacion_id)
    parts.push(`Ubicación: ${u ? u.nombre : filters.value.ubicacion_id}`)
  }
  if (filters.value.modalidad_id) {
    const m = catalogs.value.find(x => x.id === filters.value.modalidad_id)
    parts.push(`Modalidad: ${m ? m.nombre : filters.value.modalidad_id}`)
  }
  if (filters.value.estado_vacante) parts.push(`Estado Vacante: ${filters.value.estado_vacante}`)
  if (filters.value.estado_postulacion) parts.push(`Estado Postulación: ${filters.value.estado_postulacion}`)
  if (filters.value.fuente_reclutamiento_id) {
    const f = catalogs.value.find(x => x.id === filters.value.fuente_reclutamiento_id)
    parts.push(`Fuente: ${f ? f.nombre : filters.value.fuente_reclutamiento_id}`)
  }
  return parts.length ? parts.join(', ') : 'Ninguno'
}

// Exportación CSV
function exportCSV() {
  if (!reportData.value?.tableData) return
  const { columns, rows } = reportData.value.tableData
  
  // Agregar BOM de UTF-8 para visualización correcta de acentos en Excel
  const csvRows = [
    columns.join(','),
    ...rows.map(row => 
      columns.map(col => {
        const val = row[col] !== undefined ? String(row[col]) : ''
        return `"${val.replace(/"/g, '""')}"`
      }).join(',')
    )
  ]
  
  const csvContent = '\uFEFF' + csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const filename = `${selectedReport.value}_${new Date().toISOString().slice(0, 10)}.csv`
  link.setAttribute('href', URL.createObjectURL(blob))
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  AuditService.record({ accion: 'exportacion_reporte', modulo: 'reportes', entidad: 'reporte', descripcion: `Exportación CSV: ${currentReportLabel.value}`, valorNuevo: { tipo: selectedReport.value, formato: 'csv' } }).catch(() => {})
}

// Exportación Excel (Formato HTML Spreadsheet compatible)
function exportExcel() {
  if (!reportData.value?.tableData) return
  const { columns, rows } = reportData.value.tableData
  
  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #263238; }
        .header-title { font-size: 20px; font-weight: bold; color: #18566b; margin-bottom: 5px; }
        .meta-text { font-size: 11px; color: #5e8291; margin-bottom: 20px; line-height: 1.5; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        th { background-color: #18566b; color: white; border: 1px solid #d7e0e3; padding: 10px; font-weight: bold; text-align: left; }
        td { border: 1px solid #d7e0e3; padding: 8px; font-size: 13px; }
        tr:nth-child(even) { background-color: #f4f7f8; }
      </style>
    </head>
    <body>
      <div class="header-title">${currentReportLabel.value}</div>
      <div class="meta-text">
        <strong>Generado el:</strong> ${new Date().toLocaleString('es-ES')}<br/>
        <strong>Filtros avanzados aplicados:</strong> ${formatAppliedFiltersForMeta()}
      </div>
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${columns.map(col => `<td>${row[col] !== undefined ? row[col] : ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `
  
  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const link = document.createElement('a')
  const filename = `${selectedReport.value}_${new Date().toISOString().slice(0, 10)}.xls`
  link.setAttribute('href', URL.createObjectURL(blob))
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  AuditService.record({ accion: 'exportacion_reporte', modulo: 'reportes', entidad: 'reporte', descripcion: `Exportación Excel: ${currentReportLabel.value}`, valorNuevo: { tipo: selectedReport.value, formato: 'excel' } }).catch(() => {})
}

// Exportación PDF (Impresión nativa controlada)
function exportPDF() {
  window.print()
  AuditService.record({ accion: 'exportacion_reporte', modulo: 'reportes', entidad: 'reporte', descripcion: `Exportación PDF: ${currentReportLabel.value}`, valorNuevo: { tipo: selectedReport.value, formato: 'pdf' } }).catch(() => {})
}
</script>

<template>
  <div class="max-w-7xl mx-auto py-2">
    <!-- Encabezado de Reportes -->
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 no-print">
      <div>
        <div class="flex items-center gap-2 text-stone-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <span>Administración</span>
          <span>&rsaquo;</span>
          <span class="text-stone-600">Reportes</span>
        </div>
        <h2 class="font-display text-2xl font-bold text-stone-900 leading-tight">
          Reportería y Analíticas
        </h2>
        <p class="text-sm text-stone-500 font-body">
          Consolida, visualiza y exporta métricas clave del proceso de reclutamiento.
        </p>
      </div>

      <!-- Selector de Reportes Rápido -->
      <div class="w-full sm:w-72">
        <label for="report-selector" class="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
          Seleccionar Reporte
        </label>
        <select 
          id="report-selector"
          v-model="selectedReport" 
          class="input-field shadow-sm bg-white"
        >
          <option v-for="type in reportTypes" :key="type.id" :value="type.id">
            {{ type.label }}
          </option>
        </select>
      </div>
    </header>

    <!-- Contenido Principal: Filtros y Visualización -->
    <div class="flex flex-col lg:flex-row gap-6 items-start">
      
      <!-- Panel Izquierdo: Filtros Avanzados (Se oculta al imprimir) -->
      <aside class="w-full lg:w-72 shrink-0 card border border-stone-200 p-5 shadow-sm no-print">
        <div class="flex justify-between items-center pb-4 mb-4 border-b border-stone-100">
          <h3 class="font-display font-bold text-sm text-stone-800 flex items-center gap-1.5">
            <svg class="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            Filtros Avanzados
          </h3>
          <button 
            @click="clearFilters" 
            class="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            title="Restablecer filtros"
          >
            Limpiar
          </button>
        </div>

        <div class="space-y-4">
          <!-- Rango de Fechas -->
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Fecha Desde</label>
            <input 
              type="date" 
              v-model="filters.fecha_desde" 
              class="input-field text-stone-700" 
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Fecha Hasta</label>
            <input 
              type="date" 
              v-model="filters.fecha_hasta" 
              class="input-field text-stone-700" 
            />
          </div>

          <!-- Filtro por Vacante -->
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Por Vacante</label>
            <select v-model="filters.vacante_id" class="input-field text-stone-700">
              <option value="">Todas las vacantes</option>
              <option v-for="v in vacancies" :key="v.id" :value="v.id">
                [{{ v.codigo }}] {{ v.title || v.titulo }}
              </option>
            </select>
          </div>

          <!-- Filtro por Área -->
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Por Área</label>
            <select v-model="filters.area_id" class="input-field text-stone-700">
              <option value="">Todas las áreas</option>
              <option v-for="a in professionalAreas" :key="a.id" :value="a.id">
                {{ a.nombre }}
              </option>
            </select>
          </div>

          <!-- Filtro por Ubicación -->
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Por Ubicación</label>
            <select v-model="filters.ubicacion_id" class="input-field text-stone-700">
              <option value="">Todas las ubicaciones</option>
              <option v-for="u in locations" :key="u.id" :value="u.id">
                {{ u.nombre }}
              </option>
            </select>
          </div>

          <!-- Filtro por Modalidad -->
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Por Modalidad</label>
            <select v-model="filters.modalidad_id" class="input-field text-stone-700">
              <option value="">Todas las modalidades</option>
              <option v-for="m in modalities" :key="m.id" :value="m.id">
                {{ m.nombre }}
              </option>
            </select>
          </div>

          <!-- Filtro por Estado Vacante -->
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Estado de Vacante</label>
            <select v-model="filters.estado_vacante" class="input-field text-stone-700">
              <option value="">Todos los estados</option>
              <option v-for="st in vacancyStates" :key="st.value" :value="st.value">
                {{ st.label }}
              </option>
            </select>
          </div>

          <!-- Filtro por Estado Postulación -->
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Estado Postulación</label>
            <select v-model="filters.estado_postulacion" class="input-field text-stone-700">
              <option value="">Todos los estados</option>
              <option v-for="st in applicationStates" :key="st.value" :value="st.value">
                {{ st.label }}
              </option>
            </select>
          </div>

          <!-- Filtro por Fuente de Reclutamiento -->
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Fuente Reclutamiento</label>
            <select v-model="filters.fuente_reclutamiento_id" class="input-field text-stone-700">
              <option value="">Todas las fuentes</option>
              <option v-for="f in recruitmentSources" :key="f.id" :value="f.id">
                {{ f.nombre }}
              </option>
            </select>
          </div>

          <!-- Botón de Acción Filtrar -->
          <button 
            @click="fetchReport"
            class="btn btn-primary w-full py-2.5 flex items-center justify-center gap-1.5 shadow-sm text-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Aplicar Filtros
          </button>
        </div>
      </aside>

      <!-- Panel Derecho: Visualizador del Reporte (Se muestra completo al imprimir) -->
      <section class="flex-1 w-full min-w-0">
        
        <!-- Estado de Carga -->
        <div v-if="loading" class="card border border-stone-200 p-16 text-center shadow-sm no-print">
          <div class="inline-block w-8 h-8 border-4 border-stone-200 border-t-brand-600 rounded-full animate-spin mb-3"></div>
          <p class="text-stone-500 font-semibold font-display text-sm">Generando informe consolidador...</p>
          <p class="text-xs text-stone-400 font-body mt-1">Este proceso consolida información de vacantes, candidatos e interacciones.</p>
        </div>

        <!-- Estado de Error -->
        <div v-else-if="error" class="card border border-red-150 bg-red-50/50 p-6 text-center text-red-700 shadow-sm no-print">
          <p class="font-display font-bold text-sm">No fue posible cargar el reporte</p>
          <p class="text-xs font-body mt-1">{{ error }}</p>
          <button @click="fetchReport" class="btn btn-secondary mt-4 px-4 py-1.5 text-xs bg-white">
            Reintentar consulta
          </button>
        </div>

        <!-- Datos del Reporte Cargados -->
        <div v-else-if="reportData" id="printable-report-area" class="fade-in space-y-6">
          
          <!-- Encabezado exclusivo de Impresión PDF -->
          <div class="hidden print:block border-b-2 border-stone-800 pb-4 mb-6">
            <h1 class="text-2xl font-bold text-stone-900">{{ currentReportLabel }}</h1>
            <div class="text-xs text-stone-500 mt-2 space-y-1">
              <p><strong>Portal de Reclutamiento Interno</strong> &mdash; Reporte Gerencial</p>
              <p><strong>Fecha de Generación:</strong> {{ new Date().toLocaleString('es-ES') }}</p>
              <p><strong>Filtros aplicados:</strong> {{ formatAppliedFiltersForMeta() }}</p>
            </div>
          </div>

          <!-- Cabecera Informativa con Opciones de Exportación (Solo pantalla) -->
          <div class="card border border-stone-200 p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white no-print">
            <div>
              <h3 class="font-display font-bold text-base text-stone-850">
                {{ currentReportLabel }}
              </h3>
              <p class="text-xs text-stone-400 font-body mt-0.5">
                Valores calculados aplicando los criterios activos en el panel lateral.
              </p>
            </div>

            <!-- Botones de Exportar -->
            <div class="flex flex-wrap gap-2">
              <button 
                @click="exportCSV" 
                class="btn btn-secondary text-stone-600 hover:text-stone-800 border-stone-200 hover:bg-stone-50 px-3.5 py-2 text-xs flex items-center"
                title="Descargar archivo separado por comas"
              >
                <svg class="w-4 h-4 mr-1.5 text-stone-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                CSV
              </button>
              <button 
                @click="exportExcel" 
                class="btn btn-secondary text-stone-600 hover:text-stone-800 border-stone-200 hover:bg-stone-50 px-3.5 py-2 text-xs flex items-center"
                title="Descargar hoja de cálculo Excel"
              >
                <svg class="w-4 h-4 mr-1.5 text-stone-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel
              </button>
              <button 
                @click="exportPDF" 
                class="btn btn-accent px-3.5 py-2 text-xs flex items-center text-white font-semibold"
                title="Imprimir o guardar como PDF"
              >
                <svg class="w-4 h-4 mr-1.5 text-white/90" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 9h1v1H9V9zm0 4h6v1H9v-1zm0 4h6v1H9v-1z" />
                </svg>
                Imprimir / PDF
              </button>
            </div>
          </div>

          <!-- KPI Cards Grid -->
          <div class="grid gap-4 grid-cols-2 md:grid-cols-3">
            <article 
              v-for="kpi in reportData.kpis" 
              :key="kpi.label" 
              class="card border border-stone-200/80 p-5 shadow-sm bg-gradient-to-br from-white to-stone-50/20"
            >
              <p class="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                {{ kpi.label }}
              </p>
              <p class="mt-2.5 font-display text-2xl md:text-3xl font-extrabold text-stone-850 leading-none">
                {{ kpi.value }}
              </p>
            </article>
          </div>

          <!-- Gráfico visual CSS -->
          <section 
            v-if="reportData.chartData && reportData.chartData.length > 0" 
            class="card border border-stone-200 p-6 shadow-sm bg-white"
          >
            <h3 class="font-display font-bold text-sm text-stone-800 border-b border-stone-100 pb-3 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
              </svg>
              Distribución de Datos
            </h3>

            <!-- 1. Barras Verticales (Para series temporales) -->
            <div 
              v-if="chartType === 'vertical'" 
              class="flex items-end justify-around h-64 pt-6 border-b border-stone-100 px-2 sm:px-6"
            >
              <div 
                v-for="item in reportData.chartData" 
                :key="item.label" 
                class="flex flex-col items-center flex-1 group"
              >
                <!-- Valor flotante -->
                <span class="text-xs font-bold text-stone-700 mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  {{ item.value }}
                </span>
                <!-- Barra con degradado -->
                <div 
                  class="w-8 sm:w-12 bg-gradient-to-t from-teal-700 to-teal-500 rounded-t-lg transition-all duration-300 hover:from-teal-600 hover:to-teal-400 cursor-pointer shadow-sm"
                  :style="{ height: `${(item.value / maxChartValue) * 160}px` }"
                ></div>
                <!-- Etiqueta de Mes / Periodo -->
                <span class="text-[10px] sm:text-xs text-stone-500 mt-2.5 font-medium truncate max-w-[80px]" :title="item.label">
                  {{ formatLabel(item.label) }}
                </span>
              </div>
            </div>

            <!-- 2. Barras Horizontales (Para categorías de texto) -->
            <div 
              v-else 
              class="space-y-4 max-h-96 overflow-y-auto pr-2"
            >
              <div 
                v-for="item in reportData.chartData" 
                :key="item.label" 
                class="group"
              >
                <div class="flex justify-between text-xs sm:text-sm mb-1.5">
                  <span class="font-semibold text-stone-700 truncate max-w-[280px]" :title="item.label">
                    {{ item.label }}
                  </span>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-stone-850">{{ item.value }}</span>
                    <span class="text-[11px] text-stone-400 font-medium">
                      ({{ calculatePercentage(item.value) }}%)
                    </span>
                  </div>
                </div>
                <!-- Barra horizontal de progreso -->
                <div class="h-3 w-full bg-stone-100 rounded-full overflow-hidden shadow-inner">
                  <div 
                    class="h-full bg-gradient-to-r from-teal-700 to-teal-500 rounded-full transition-all duration-500 group-hover:from-teal-600 group-hover:to-teal-400"
                    :style="{ width: `${(item.value / maxChartValue) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </section>

          <!-- Tabla de Datos Detallados -->
          <section 
            v-if="reportData.tableData" 
            class="card border border-stone-200 shadow-sm bg-white overflow-hidden"
          >
            <!-- Cabecera de la Tabla + Buscador Local -->
            <div class="px-5 py-4 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 no-print">
              <h3 class="font-display font-bold text-sm text-stone-800 flex items-center gap-2">
                <svg class="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                Registros Detallados
              </h3>
              <div class="relative w-full sm:w-64" v-if="reportData.tableData.rows.length > 0">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input 
                  type="text" 
                  v-model="tableSearch" 
                  class="input-field pl-9 py-1.5 text-xs shadow-inner" 
                  placeholder="Buscar en registros..." 
                />
              </div>
            </div>

            <!-- Si la tabla no tiene registros -->
            <div v-if="reportData.tableData.rows.length === 0" class="p-16 text-center text-stone-400 font-body">
              <svg class="w-12 h-12 mx-auto mb-3.5 text-stone-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p class="font-semibold text-stone-600 text-sm">No se encontraron registros</p>
              <p class="text-xs text-stone-400 mt-1 max-w-md mx-auto">
                No existen datos que coincidan con los filtros seleccionados o el rango de fechas establecido. Intente ampliar los criterios de búsqueda.
              </p>
            </div>

            <template v-else>
              <!-- Tabla Desplazable -->
              <div class="overflow-x-auto w-full">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-stone-50 border-b border-stone-200">
                      <th 
                        v-for="col in reportData.tableData.columns" 
                        :key="col" 
                        class="px-5 py-3 text-xs font-bold text-stone-500 uppercase tracking-wider"
                      >
                        {{ col }}
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-stone-100 text-stone-700 text-xs font-body">
                    <tr v-if="paginatedRows.length === 0">
                      <td 
                        :colspan="reportData.tableData.columns.length" 
                        class="px-5 py-8 text-center text-stone-400 font-semibold"
                      >
                        Ningún registro coincide con los criterios aplicados o términos de búsqueda.
                      </td>
                    </tr>
                    <tr 
                      v-for="(row, idx) in paginatedRows" 
                      :key="idx" 
                      class="hover:bg-stone-50/40 transition-colors even:bg-stone-50/20"
                    >
                      <td 
                        v-for="col in reportData.tableData.columns" 
                        :key="col" 
                        class="px-5 py-3 leading-relaxed whitespace-nowrap"
                      >
                        {{ row[col] !== undefined ? row[col] : '—' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Controles de Paginación (Solo Pantalla) -->
              <footer class="px-5 py-4 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-stone-50/30 no-print">
                <span class="text-xs text-stone-500">
                  Mostrando del 
                  <strong>{{ Math.min(filteredRows.length, (currentPage - 1) * itemsPerPage + 1) }}</strong> 
                  al 
                  <strong>{{ Math.min(filteredRows.length, currentPage * itemsPerPage) }}</strong> 
                  de 
                  <strong>{{ filteredRows.length }}</strong> registros
                </span>

                <div class="flex items-center gap-2">
                  <button 
                    @click="prevPage" 
                    :disabled="currentPage === 1" 
                    class="btn btn-secondary px-3 py-1.5 text-xs flex items-center border-stone-200"
                  >
                    &lsaquo; Anterior
                  </button>
                  <span class="text-xs font-semibold text-stone-600 px-1">
                    Pág. {{ currentPage }} de {{ totalPages }}
                  </span>
                  <button 
                    @click="nextPage" 
                    :disabled="currentPage === totalPages" 
                    class="btn btn-secondary px-3 py-1.5 text-xs flex items-center border-stone-200"
                  >
                    Siguiente &rsaquo;
                  </button>
                </div>
              </footer>
            </template>
          </section>

        </div>

        <!-- Vista cuando no hay datos iniciales -->
        <div v-else class="card border border-stone-200 p-16 text-center shadow-sm no-print">
          <p class="text-stone-400 font-display font-bold text-sm">Seleccione un reporte para visualizar la información</p>
        </div>

      </section>

    </div>
  </div>
</template>

<style scoped>
/* Transición suave para carga y cambio de reportes */
.fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<style>
/* Reglas y estilos específicos para Impresión PDF (Globales) */
@media print {
  /* Ocultar elementos de layout global, navegación, menús y botones */
  nav,
  footer,
  aside,
  header,
  .no-print,
  .notification-container,
  .global-navbar,
  .public-footer {
    display: none !important;
  }
  
  /* Desactivar flexbox, overflows y alturas fijas en la estructura de layouts padre */
  html,
  body,
  #app,
  #app > div,
  #app > div > main,
  #app > div > main > div,
  #app > div > main > div > div,
  #app > div > main > div > div > main {
    background: #fff !important;
    color: #000 !important;
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
    display: block !important;
    box-shadow: none !important;
    border: none !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    position: static !important;
  }

  /* Asegurar que el contenedor de reporte ocupe toda la anchura y fluya libremente */
  #printable-report-area {
    display: block !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    position: static !important;
    overflow: visible !important;
  }

  /* Forzar colores de fondo y degradados en la impresión (gráficos, tarjetas, etc.) */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Evitar saltos de página dentro de tarjetas y añadir bordes limpios */
  .card, 
  article, 
  section {
    page-break-inside: avoid !important;
    box-shadow: none !important;
    border: 1px solid #d7e0e3 !important;
    background: #fff !important;
    margin-bottom: 24px !important;
    padding: 24px !important;
  }

  /* Distribuir KPIs en 3 columnas en la hoja impresa */
  #printable-report-area .grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)) !important;
    gap: 16px !important;
  }

  /* Tablas limpias para reporte impreso, repitiendo encabezados en cada página */
  table {
    border-collapse: collapse !important;
    width: 100% !important;
    border: 1px solid #ccc !important;
    page-break-inside: auto !important;
  }
  
  tr {
    page-break-inside: avoid !important;
    page-break-after: auto !important;
  }

  thead {
    display: table-header-group !important;
  }
  
  th, td {
    border: 1px solid #ccc !important;
    padding: 8px 12px !important;
    color: #000 !important;
    font-size: 11px !important;
    white-space: normal !important;
    word-break: break-word !important;
  }
}
</style>

