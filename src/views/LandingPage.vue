<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchKeyword = ref('')
const activeTab = ref('talento')

const content = computed(() => activeTab.value === 'talento'
  ? {
      eyebrow: 'Tu próxima oportunidad comienza aquí',
      titleStart: 'Encuentra un trabajo que',
      highlight: 'sí encaje contigo',
      description: 'Explora oportunidades relevantes, presenta tu perfil de forma profesional y da seguimiento a cada postulación desde un solo lugar.',
      primary: 'Explorar vacantes',
      secondary: 'Crear mi perfil',
      stepsTitle: 'Buscar empleo debería sentirse más claro',
      stepsDescription: 'Te acompañamos desde la primera búsqueda hasta el contacto con la empresa.',
      steps: [
        { number: '01', title: 'Descubre oportunidades', text: 'Filtra vacantes por área, modalidad, ubicación y nivel de experiencia.' },
        { number: '02', title: 'Presenta tu mejor perfil', text: 'Centraliza tu CV, experiencia y datos profesionales para aplicar con rapidez.' },
        { number: '03', title: 'Sigue tu proceso', text: 'Consulta el estado de tus postulaciones y mantén todo organizado.' }
      ]
    }
  : {
      eyebrow: 'Contratación más humana y organizada',
      titleStart: 'Construye el equipo que',
      highlight: 'tu empresa necesita',
      description: 'Publica vacantes, evalúa perfiles y administra cada etapa del proceso con una experiencia clara para reclutadores y candidatos.',
      primary: 'Publicar una vacante',
      secondary: 'Conocer la plataforma',
      stepsTitle: 'Del perfil correcto a la contratación',
      stepsDescription: 'Un proceso visual y ordenado para tomar mejores decisiones sin perder tiempo.',
      steps: [
        { number: '01', title: 'Define el perfil', text: 'Publica requisitos, responsabilidades, modalidad y beneficios de forma clara.' },
        { number: '02', title: 'Organiza candidatos', text: 'Revisa perfiles y mueve candidatos entre las distintas etapas del proceso.' },
        { number: '03', title: 'Selecciona con criterio', text: 'Compara información relevante y mantén trazabilidad de cada decisión.' }
      ]
    })

function handleSearch () {
  router.push({ path: '/vacantes', query: { keyword: searchKeyword.value.trim() } })
}
</script>

<template>
  <main class="min-h-screen bg-[#f5f7f4] text-[#17282d]">
    <!-- HERO -->
    <section class="relative overflow-hidden border-b border-[#dce5e2]">
      <div class="absolute -right-36 -top-44 h-[34rem] w-[34rem] rounded-full bg-[#dcece5] blur-3xl" />
      <div class="absolute -left-36 bottom-0 h-80 w-80 rounded-full bg-[#e7ece8] blur-3xl" />

      <div class="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pb-24 lg:pt-20">
        <div class="max-w-2xl">
          <div class="inline-flex rounded-full border border-[#cfddd9] bg-white/80 p-1 shadow-sm backdrop-blur">
            <button
              type="button"
              class="rounded-full px-5 py-2 text-sm font-semibold transition"
              :class="activeTab === 'talento' ? 'bg-[#154f5d] text-white shadow-sm' : 'text-[#66797d] hover:text-[#154f5d]'"
              @click="activeTab = 'talento'"
            >
              Busco trabajo
            </button>
            <button
              type="button"
              class="rounded-full px-5 py-2 text-sm font-semibold transition"
              :class="activeTab === 'empresa' ? 'bg-[#154f5d] text-white shadow-sm' : 'text-[#66797d] hover:text-[#154f5d]'"
              @click="activeTab = 'empresa'"
            >
              Busco talento
            </button>
          </div>

          <p class="mt-9 text-sm font-bold uppercase tracking-[0.2em] text-[#4f7d70]">
            {{ content.eyebrow }}
          </p>

          <h1 class="mt-5 max-w-3xl font-display text-5xl font-extrabold leading-[1.02] tracking-[-0.045em] text-[#17282d] sm:text-6xl lg:text-[4.6rem]">
            {{ content.titleStart }}
            <span class="relative block text-[#1d6978]">
              {{ content.highlight }}
              <svg class="absolute -bottom-3 left-0 h-4 w-[72%] text-[#a7c9b7]" viewBox="0 0 300 16" fill="none" aria-hidden="true">
                <path d="M3 11C80 3 187 3 297 8" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
              </svg>
            </span>
          </h1>

          <p class="mt-9 max-w-xl text-lg leading-8 text-[#617276]">
            {{ content.description }}
          </p>

          <form
            v-if="activeTab === 'talento'"
            class="mt-9 flex max-w-2xl flex-col gap-3 rounded-[1.35rem] border border-[#d6e0dd] bg-white p-2.5 shadow-[0_18px_60px_rgba(28,61,66,0.10)] sm:flex-row"
            @submit.prevent="handleSearch"
          >
            <label class="flex min-w-0 flex-1 items-center gap-3 px-3">
              <svg class="h-5 w-5 shrink-0 text-[#718589]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 21l-4.35-4.35m1.35-5.15A6.5 6.5 0 115 11.5a6.5 6.5 0 0113 0z" />
              </svg>
              <input
                v-model="searchKeyword"
                class="w-full bg-transparent py-3 text-sm text-[#17282d] outline-none placeholder:text-[#8a999c]"
                type="search"
                placeholder="Cargo, área o palabra clave"
              >
            </label>
            <button class="rounded-2xl bg-[#154f5d] px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#103f4a]">
              {{ content.primary }}
            </button>
          </form>

          <div v-else class="mt-9 flex flex-col gap-3 sm:flex-row">
            <router-link to="/registro" class="rounded-2xl bg-[#154f5d] px-7 py-4 text-center text-sm font-bold text-white shadow-lg shadow-[#154f5d]/15 transition hover:-translate-y-0.5 hover:bg-[#103f4a]">
              {{ content.primary }}
            </router-link>
            <router-link to="/vacantes" class="rounded-2xl border border-[#bdcdca] bg-white px-7 py-4 text-center text-sm font-bold text-[#29484f] transition hover:border-[#799b93] hover:bg-[#edf3f0]">
              {{ content.secondary }}
            </router-link>
          </div>

          <div class="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-[#617276]">
            <span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-[#5e927e]" /> Perfiles verificados</span>
            <span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-[#5e927e]" /> Proceso organizado</span>
            <span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-[#5e927e]" /> Experiencia transparente</span>
          </div>
        </div>

        <!-- PRODUCT PREVIEW -->
        <div class="relative mx-auto w-full max-w-[38rem] lg:mx-0 lg:justify-self-end">
          <div class="absolute -inset-5 rotate-2 rounded-[2.2rem] bg-[#bad4c7]/55" />
          <div class="relative overflow-hidden rounded-[2rem] border border-white/80 bg-[#edf3f0] p-4 shadow-[0_28px_80px_rgba(29,67,73,0.18)] sm:p-5">
            <div class="rounded-[1.5rem] bg-white p-4 sm:p-5">
              <div class="flex items-center justify-between border-b border-[#e5ece9] pb-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#78908c]">Panel de selección</p>
                  <h2 class="mt-1 text-lg font-bold text-[#1b3035]">Diseñador/a de producto</h2>
                </div>
                <span class="rounded-full bg-[#e2f0e8] px-3 py-1.5 text-xs font-bold text-[#356b59]">Vacante activa</span>
              </div>

              <div class="mt-5 grid grid-cols-3 gap-3">
                <div class="rounded-2xl bg-[#f2f6f4] p-3">
                  <span class="text-2xl font-extrabold text-[#1d6978]">48</span>
                  <p class="mt-1 text-xs text-[#718084]">Candidatos</p>
                </div>
                <div class="rounded-2xl bg-[#f2f6f4] p-3">
                  <span class="text-2xl font-extrabold text-[#1d6978]">12</span>
                  <p class="mt-1 text-xs text-[#718084]">En revisión</p>
                </div>
                <div class="rounded-2xl bg-[#f2f6f4] p-3">
                  <span class="text-2xl font-extrabold text-[#1d6978]">5</span>
                  <p class="mt-1 text-xs text-[#718084]">Entrevistas</p>
                </div>
              </div>

              <div class="mt-5 space-y-3">
                <article class="flex items-center gap-3 rounded-2xl border border-[#e3ebe8] p-3.5">
                  <div class="grid h-11 w-11 place-items-center rounded-xl bg-[#dcebe6] font-bold text-[#38675d]">AM</div>
                  <div class="min-w-0 flex-1">
                    <h3 class="truncate text-sm font-bold text-[#263b40]">Andrea Martínez</h3>
                    <p class="truncate text-xs text-[#7a898c]">Product Designer · 4 años</p>
                  </div>
                  <span class="rounded-full bg-[#e9f3ee] px-3 py-1 text-[11px] font-bold text-[#4d7969]">Entrevista</span>
                </article>

                <article class="flex items-center gap-3 rounded-2xl border border-[#e3ebe8] p-3.5">
                  <div class="grid h-11 w-11 place-items-center rounded-xl bg-[#e8ecef] font-bold text-[#526971]">CR</div>
                  <div class="min-w-0 flex-1">
                    <h3 class="truncate text-sm font-bold text-[#263b40]">Carlos Rivera</h3>
                    <p class="truncate text-xs text-[#7a898c]">UX Researcher · 3 años</p>
                  </div>
                  <span class="rounded-full bg-[#f5efe1] px-3 py-1 text-[11px] font-bold text-[#8b6c32]">En revisión</span>
                </article>

                <article class="flex items-center gap-3 rounded-2xl border border-[#e3ebe8] p-3.5">
                  <div class="grid h-11 w-11 place-items-center rounded-xl bg-[#eee8e4] font-bold text-[#735e54]">LM</div>
                  <div class="min-w-0 flex-1">
                    <h3 class="truncate text-sm font-bold text-[#263b40]">Lucía Méndez</h3>
                    <p class="truncate text-xs text-[#7a898c]">UI Designer · 5 años</p>
                  </div>
                  <span class="rounded-full bg-[#edf1f2] px-3 py-1 text-[11px] font-bold text-[#65767a]">Nuevo perfil</span>
                </article>
              </div>
            </div>
          </div>

          <div class="absolute -bottom-5 -left-4 hidden rounded-2xl border border-white bg-white px-4 py-3 shadow-xl sm:block">
            <p class="text-xs text-[#748387]">Coincidencia del perfil</p>
            <div class="mt-1 flex items-end gap-2">
              <strong class="text-2xl text-[#245f69]">92%</strong>
              <span class="mb-1 text-xs font-semibold text-[#56806f]">Alta afinidad</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TRUST STRIP -->
    <section class="border-b border-[#dce5e2] bg-white">
      <div class="mx-auto grid max-w-7xl gap-5 px-5 py-7 text-sm text-[#65777a] sm:grid-cols-3 sm:px-6 lg:px-8">
        <p><strong class="block text-xl text-[#213a40]">Procesos claros</strong> Cada etapa en un solo lugar</p>
        <p><strong class="block text-xl text-[#213a40]">Mejores coincidencias</strong> Información relevante primero</p>
        <p><strong class="block text-xl text-[#213a40]">Experiencia humana</strong> Diseñada para ambas partes</p>
      </div>
    </section>

    <!-- PROCESS -->
    <section class="bg-[#f5f7f4] py-20 lg:py-28">
      <div class="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div class="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <div>
            <span class="text-xs font-bold uppercase tracking-[0.2em] text-[#4f7d70]">Cómo funciona</span>
            <h2 class="mt-4 max-w-md font-display text-4xl font-bold leading-tight tracking-[-0.035em] text-[#1a3035] sm:text-5xl">
              {{ content.stepsTitle }}
            </h2>
            <p class="mt-5 max-w-md text-base leading-7 text-[#68797d]">{{ content.stepsDescription }}</p>
          </div>

          <div class="grid gap-4">
            <article
              v-for="step in content.steps"
              :key="step.number"
              class="group grid gap-4 rounded-[1.6rem] border border-[#dbe4e1] bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#a7c4bb] hover:shadow-[0_18px_50px_rgba(37,72,75,.08)] sm:grid-cols-[4.5rem_1fr_auto] sm:items-center"
            >
              <span class="text-sm font-bold tracking-[0.18em] text-[#78a092]">{{ step.number }}</span>
              <div>
                <h3 class="text-lg font-bold text-[#263d42]">{{ step.title }}</h3>
                <p class="mt-1 text-sm leading-6 text-[#738286]">{{ step.text }}</p>
              </div>
              <div class="hidden h-11 w-11 place-items-center rounded-full border border-[#d7e2de] text-[#557873] transition group-hover:bg-[#154f5d] group-hover:text-white sm:grid">→</div>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- BENTO BENEFITS -->
    <section class="bg-[#172d33] py-20 text-white lg:py-28">
      <div class="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div class="max-w-2xl">
          <span class="text-xs font-bold uppercase tracking-[0.2em] text-[#9fc6b6]">Una plataforma con criterio</span>
          <h2 class="mt-4 font-display text-4xl font-bold tracking-[-0.035em] sm:text-5xl">Menos ruido. Más decisiones útiles.</h2>
        </div>

        <div class="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <article class="rounded-[1.7rem] bg-[#214048] p-7 lg:row-span-2">
            <div class="grid h-12 w-12 place-items-center rounded-2xl bg-[#9fc6b6] text-xl text-[#183139]">◎</div>
            <h3 class="mt-10 text-2xl font-bold">Una vista completa del proceso</h3>
            <p class="mt-3 leading-7 text-[#bed0d0]">Consulta vacantes, candidatos, etapas y acciones pendientes sin saltar entre herramientas.</p>
            <div class="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div class="flex items-center justify-between text-sm text-[#d8e2e1]"><span>Perfiles revisados</span><strong>74%</strong></div>
              <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div class="h-full w-3/4 rounded-full bg-[#9fc6b6]" /></div>
            </div>
          </article>

          <article class="rounded-[1.7rem] bg-[#e5eee9] p-7 text-[#20383d] lg:col-span-2">
            <span class="text-sm font-bold text-[#527a6c]">Diseño enfocado</span>
            <h3 class="mt-3 max-w-xl text-2xl font-bold">La información importante aparece primero</h3>
            <p class="mt-3 max-w-2xl leading-7 text-[#627875]">Jerarquía visual, estados reconocibles y filtros sencillos para reducir esfuerzo y facilitar el seguimiento.</p>
          </article>

          <article class="rounded-[1.7rem] border border-white/10 bg-white/5 p-7">
            <span class="text-sm font-bold text-[#9fc6b6]">Para candidatos</span>
            <h3 class="mt-3 text-xl font-bold">Postulaciones sin incertidumbre</h3>
            <p class="mt-3 leading-7 text-[#b9cacc]">Un recorrido más claro desde la búsqueda hasta el contacto.</p>
          </article>

          <article class="rounded-[1.7rem] border border-white/10 bg-white/5 p-7">
            <span class="text-sm font-bold text-[#9fc6b6]">Para empresas</span>
            <h3 class="mt-3 text-xl font-bold">Selección sin desorden</h3>
            <p class="mt-3 leading-7 text-[#b9cacc]">Un flujo visual para evaluar y avanzar candidatos con criterio.</p>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-[#edf2ef] py-20">
      <div class="mx-auto max-w-5xl px-5 sm:px-6">
        <div class="relative overflow-hidden rounded-[2rem] bg-[#dceae4] px-6 py-12 text-center sm:px-12 lg:py-16">
          <div class="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[36px] border-white/30" />
          <div class="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/25" />
          <div class="relative">
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-[#567c70]">Da el siguiente paso</p>
            <h2 class="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold tracking-[-0.035em] text-[#19333a] sm:text-5xl">
              El talento correcto merece un proceso a su altura.
            </h2>
            <p class="mx-auto mt-5 max-w-xl text-[#627673]">Crea tu cuenta y comienza a construir mejores conexiones profesionales.</p>
            <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <router-link to="/registro" class="rounded-2xl bg-[#154f5d] px-7 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#103f4a]">Crear cuenta</router-link>
              <router-link to="/vacantes" class="rounded-2xl border border-[#aebfbb] bg-white/70 px-7 py-4 text-sm font-bold text-[#28474e] transition hover:bg-white">Explorar vacantes</router-link>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>