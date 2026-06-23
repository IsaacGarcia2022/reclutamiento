<script setup>
import { onMounted, ref, computed } from 'vue'
import { getSupabaseClient } from '../../services/supabase'

const data = ref(null)
const error = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data: r, error: e } = await getSupabaseClient().functions.invoke('dashboard')
    if (e) {
      let detail = ''
      try {
        detail = await e.context?.json()
      } catch {
        detail = ''
      }
      throw new Error(detail?.error || e.message)
    }
    if (r?.error) throw new Error(r.error)
    data.value = r.data
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)

const maxMonth = computed(() => Math.max(...(data.value?.porMes || []).map(x => x.total), 1))
const maxArea = computed(() => Math.max(...(data.value?.porArea || []).map(x => x.total), 1))

// Icon configurations for indicators
const indicators = computed(() => {
  if (!data.value?.indicadores) return []
  return [
    {
      label: 'Vacantes activas',
      value: data.value.indicadores.vacantes_activas,
      iconClass: 'text-positive bg-emerald-50',
      iconPath: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
    },
    {
      label: 'Vacantes en borrador',
      value: data.value.indicadores.vacantes_borrador,
      iconClass: 'text-warning bg-amber-50',
      iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
    },
    {
      label: 'Próximas a cerrar',
      value: data.value.indicadores.vacantes_proximas_a_cerrar,
      iconClass: 'text-negative bg-red-50',
      iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      label: 'Postulaciones nuevas',
      value: data.value.indicadores.postulaciones_nuevas,
      iconClass: 'text-secondary bg-teal-50/50',
      iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
    },
    {
      label: 'Postulaciones del mes',
      value: data.value.indicadores.postulaciones_del_mes,
      iconClass: 'text-primary bg-sky-50',
      iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    },
    {
      label: 'Candidatos registrados',
      value: data.value.indicadores.candidatos_registrados,
      iconClass: 'text-text-primary bg-stone-100',
      iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
    }
  ]
})
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado del Dashboard -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-display text-xl font-bold text-text-primary">Dashboard</h2>
        <p class="mt-1 text-sm text-text-secondary">Resumen operativo y analíticas de reclutamiento.</p>
      </div>
      <button 
        @click="load" 
        class="btn btn-secondary px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-stone-50 border-border-color"
        aria-label="Actualizar indicadores"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
        </svg>
        Actualizar
      </button>
    </div>

    <!-- Mensaje de Error -->
    <p v-if="error" class="alert alert-error" role="alert">
      {{ error }}
    </p>

    <!-- Estado de Carga -->
    <div v-else-if="loading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="i in 6" :key="i" class="card-kpi flex items-center justify-between">
        <div class="space-y-2 flex-1">
          <div class="h-4 w-2/3 skeleton-loader rounded-md"></div>
          <div class="h-8 w-1/3 skeleton-loader rounded-md"></div>
        </div>
        <div class="w-12 h-12 rounded-xl skeleton-loader"></div>
      </div>
    </div>

    <template v-else>
      <!-- Panel de Tarjetas de Indicadores (KPIs) -->
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article 
          v-for="indicator in indicators" 
          :key="indicator.label" 
          class="card-kpi flex items-center justify-between"
        >
          <div>
            <p class="text-xs font-semibold text-text-secondary tracking-wide uppercase">{{ indicator.label }}</p>
            <p class="mt-2 font-display text-3xl font-bold text-text-primary leading-none">{{ indicator.value }}</p>
          </div>
          <div 
            class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            :class="indicator.iconClass"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" :d="indicator.iconPath" />
            </svg>
          </div>
        </article>
      </div>

      <!-- Gráficos de Analíticas -->
      <div class="grid gap-6 xl:grid-cols-2">
        <!-- Postulaciones por Mes (Gráfico de Barras) -->
        <section class="card border border-border-color p-6 bg-surface shadow-sm">
          <h3 class="font-display font-bold text-text-primary text-base">Postulaciones por mes</h3>
          <div class="mt-6 flex h-48 items-end gap-3 px-2 border-b border-border-color pb-2">
            <div 
              v-for="item in data.porMes" 
              :key="item.mes" 
              class="flex flex-1 flex-col items-center gap-2 group cursor-pointer"
            >
              <!-- Tooltip valor -->
              <span class="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {{ item.total }}
              </span>
              <!-- Barra -->
              <div 
                class="w-full rounded-t-lg bg-primary hover:bg-primary-dark transition-colors duration-200" 
                :style="{ height: `${Math.max(6, (item.total / maxMonth) * 120)}px` }"
                :title="`${item.total} postulaciones en ${item.mes}`"
              ></div>
              <!-- Etiqueta mes -->
              <span class="text-[10px] font-bold text-text-secondary whitespace-nowrap">
                {{ item.mes.split('-')[1] }}/{{ item.mes.split('-')[0].slice(2) }}
              </span>
            </div>
          </div>
        </section>

        <!-- Postulaciones por Área (Gráfico de Progreso) -->
        <section class="card border border-border-color p-6 bg-surface shadow-sm">
          <h3 class="font-display font-bold text-text-primary text-base">Postulaciones por área profesional</h3>
          <div class="mt-6 space-y-4 max-h-48 overflow-y-auto pr-2">
            <div v-for="item in data.porArea" :key="item.nombre" class="space-y-1">
              <div class="flex justify-between text-xs font-medium">
                <span class="text-text-primary">{{ item.nombre }}</span>
                <strong class="text-primary">{{ item.total }}</strong>
              </div>
              <div class="h-2.5 rounded-full bg-stone-100 w-full overflow-hidden">
                <div 
                  class="h-full rounded-full bg-secondary transition-all duration-500" 
                  :style="{ width: `${(item.total / maxArea) * 100}%` }"
                ></div>
              </div>
            </div>
            <!-- Estado vacío si no hay áreas -->
            <div v-if="!data.porArea || data.porArea.length === 0" class="text-center py-8 text-xs text-text-secondary">
              No hay registros de postulaciones por área profesional.
            </div>
          </div>
        </section>
      </div>

      <!-- Tablas y Listados de Control -->
      <div class="grid gap-6 xl:grid-cols-3">
        <!-- Últimas Postulaciones -->
        <section class="card border border-border-color p-6 bg-surface shadow-sm">
          <h3 class="font-display font-bold text-text-primary text-base pb-3 border-b border-border-color">Últimas postulaciones</h3>
          <div class="divide-y divide-border-color">
            <div 
              v-for="a in data.ultimas" 
              :key="a.id" 
              class="py-3.5 flex flex-col gap-0.5 text-sm"
            >
              <span class="font-semibold text-text-primary">{{ a.candidate?.nombres }} {{ a.candidate?.apellidos }}</span>
              <span class="text-xs text-text-secondary leading-normal">{{ a.vacancy?.titulo }}</span>
            </div>
            <!-- Estado vacío -->
            <div v-if="!data.ultimas || data.ultimas.length === 0" class="py-8 text-center text-xs text-text-secondary">
              No se han registrado postulaciones recientes.
            </div>
          </div>
        </section>

        <!-- Próximas a Cerrar -->
        <section class="card border border-border-color p-6 bg-surface shadow-sm">
          <h3 class="font-display font-bold text-text-primary text-base pb-3 border-b border-border-color">Próximas a cerrar</h3>
          <div class="divide-y divide-border-color">
            <div 
              v-for="v in data.proximas" 
              :key="v.id" 
              class="py-3.5 flex flex-col gap-0.5 text-sm"
            >
              <span class="font-semibold text-text-primary">{{ v.titulo }}</span>
              <span class="text-xs text-negative flex items-center gap-1 mt-0.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cierra el: {{ new Date(v.fecha_cierre).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) }}
              </span>
            </div>
            <!-- Estado vacío -->
            <div v-if="!data.proximas || data.proximas.length === 0" class="py-8 text-center text-xs text-text-secondary">
              No hay vacantes activas próximas a expirar.
            </div>
          </div>
        </section>

        <!-- Vacantes con más Postulaciones -->
        <section class="card border border-border-color p-6 bg-surface shadow-sm">
          <h3 class="font-display font-bold text-text-primary text-base pb-3 border-b border-border-color">Vacantes populares</h3>
          <div class="divide-y divide-border-color">
            <div 
              v-for="v in data.mayorPostulaciones" 
              :key="v.id" 
              class="py-3.5 flex flex-col gap-0.5 text-sm"
            >
              <span class="font-semibold text-text-primary">{{ v.titulo }}</span>
              <span class="text-xs text-primary font-bold mt-0.5">{{ v.cantidad_postulaciones }} postulaciones</span>
            </div>
            <!-- Estado vacío -->
            <div v-if="!data.mayorPostulaciones || data.mayorPostulaciones.length === 0" class="py-8 text-center text-xs text-text-secondary">
              No hay registros de vacantes con postulantes.
            </div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
