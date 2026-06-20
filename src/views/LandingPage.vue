<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchKeyword = ref('')
const activeTab = ref('talento')
const showHeroBg = ref(false) // cambia a true para mostrar la imagen de fondo

function handleSearch () {
  router.push({ path: '/vacantes', query: { keyword: searchKeyword.value } })
}
</script>

<template>
  <div class="overflow-hidden">
    <!-- Hero -->
    <section class="relative min-h-screen flex pt-10 bg-white">
      <div v-if="showHeroBg" class="absolute inset-0">
        <img src="/hero-background.webp" alt="" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-white/60"></div>
      </div>

      <div class="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative w-full">
        <div class="max-w-3xl mx-auto text-center">
          <!-- Role tabs -->
          <div class="flex items-center justify-center gap-1 mb-8 border-b border-stone-200">
            <button @click="activeTab = 'talento'"
              class="px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px"
              :class="activeTab === 'talento' ? 'text-brand-600 border-brand-600' : 'text-stone-400 border-transparent hover:text-stone-600 hover:border-stone-300'">
              Busco trabajo
            </button>
            <button @click="activeTab = 'empresa'"
              class="px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px"
              :class="activeTab === 'empresa' ? 'text-brand-600 border-brand-600' : 'text-stone-400 border-transparent hover:text-stone-600 hover:border-stone-300'">
              Busco talento
            </button>
          </div>

          <h1 class="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-stone-900 leading-[1.1] tracking-tight">
            <span v-if="activeTab === 'talento'">
              El trabajo que <span class="text-brand-600">mereces</span><br />
              está a un clic de distancia
            </span>
            <span v-else>
              El talento que <span class="text-brand-600">necesitas</span><br />
              está a un clic de distancia
            </span>
          </h1>
          <p class="mt-5 text-lg text-stone-500 max-w-xl mx-auto leading-relaxed">
            <span v-if="activeTab === 'talento'">
              Conectamos profesionales con las mejores oportunidades laborales. Encuentra vacantes que se alineen con tu experiencia y aspiraciones.
            </span>
            <span v-else>
              Publica tus vacantes y encuentra los candidatos ideales para tu empresa. Gestiona todo desde un panel exclusivo.
            </span>
          </p>

          <!-- Quick search -->
          <div class="mt-10 max-w-xl mx-auto">
            <form @submit.prevent="handleSearch" class="flex items-center gap-2 bg-white border border-stone-200 rounded-2xl p-2 shadow-lg shadow-stone-200/50">
              <div class="flex-1 flex items-center gap-2 pl-3">
                <svg class="w-5 h-5 text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input v-model="searchKeyword" type="text" placeholder="Puesto, empresa, palabra clave..." class="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400 py-2" />
              </div>
              <button type="submit" class="btn-primary px-6 py-2.5 text-sm whitespace-nowrap">Buscar</button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- Cómo funciona -->
    <section class="py-10 md:py-10 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-xl mx-auto mb-12">
          <span class="inline-block text-xs font-semibold tracking-widest uppercase text-brand-600 bg-brand-50 px-4 py-1.5 rounded-full">Cómo funciona</span>
          <h2 class="mt-4 font-display text-3xl md:text-4xl font-bold text-stone-900">
            <template v-if="activeTab === 'talento'">
              Tres pasos para encontrar <span class="text-brand-600">trabajo</span>
            </template>
            <template v-else>
              Tres pasos para encontrar <span class="text-brand-600">talento</span>
            </template>
          </h2>
        </div>

        <template v-if="activeTab === 'talento'">
          <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center">
              <div class="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto">
                <span class="font-display text-xl font-bold text-brand-600">1</span>
              </div>
              <h3 class="mt-5 font-display text-lg font-semibold text-stone-900">Explora vacantes</h3>
              <p class="mt-2 text-sm text-stone-500 leading-relaxed">Busca entre cientos de oportunidades. Filtra por palabra clave, ubicación y tipo de empleo para encontrar la vacante ideal.</p>
            </div>
            <div class="text-center">
              <div class="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto">
                <span class="font-display text-xl font-bold text-brand-600">2</span>
              </div>
              <h3 class="mt-5 font-display text-lg font-semibold text-stone-900">Postúlate</h3>
              <p class="mt-2 text-sm text-stone-500 leading-relaxed">Aplica con tu CV y un mensaje de presentación. El proceso es rápido y sin complicaciones.</p>
            </div>
            <div class="text-center">
              <div class="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto">
                <span class="font-display text-xl font-bold text-brand-600">3</span>
              </div>
              <h3 class="mt-5 font-display text-lg font-semibold text-stone-900">Recibe respuesta</h3>
              <p class="mt-2 text-sm text-stone-500 leading-relaxed">Las empresas revisan tu perfil y te contactan directamente. Tu próximo trabajo está a un clic.</p>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center">
              <div class="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto">
                <span class="font-display text-xl font-bold text-brand-600">1</span>
              </div>
              <h3 class="mt-5 font-display text-lg font-semibold text-stone-900">Publica tu vacante</h3>
              <p class="mt-2 text-sm text-stone-500 leading-relaxed">Describe el puesto, requisitos y lo que ofreces. En minutos tu oferta estará visible.</p>
            </div>
            <div class="text-center">
              <div class="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto">
                <span class="font-display text-xl font-bold text-brand-600">2</span>
              </div>
              <h3 class="mt-5 font-display text-lg font-semibold text-stone-900">Recibe postulaciones</h3>
              <p class="mt-2 text-sm text-stone-500 leading-relaxed">Los candidatos aplican con su CV y un mensaje. Revisa todo desde tu panel.</p>
            </div>
            <div class="text-center">
              <div class="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto">
                <span class="font-display text-xl font-bold text-brand-600">3</span>
              </div>
              <h3 class="mt-5 font-display text-lg font-semibold text-stone-900">Elige al mejor</h3>
              <p class="mt-2 text-sm text-stone-500 leading-relaxed">Compara perfiles, descarga CVs y contacta directamente al candidato ideal.</p>
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- Features / Trust -->
    <section class="py-16 md:py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-xl mx-auto mb-12">
          <span class="inline-block text-xs font-semibold tracking-widest uppercase text-coral-500 bg-coral-50 px-4 py-1.5 rounded-full">Por qué elegirnos</span>
          <h2 class="mt-4 font-display text-3xl md:text-4xl font-bold text-stone-900">Una plataforma <span class="text-coral-500">pensada en ti</span></h2>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <div class="card border border-stone-100 p-8 hover:shadow-lg hover:shadow-stone-200/50 hover:-translate-y-0.5">
            <div class="w-11 h-11 bg-brand-100 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <h3 class="mt-4 font-display text-base font-semibold text-stone-900">Busca oportunidades</h3>
            <p class="mt-2 text-sm text-stone-500 leading-relaxed">Explora vacantes filtrando por palabra clave, ubicación y tipo de empleo. Encuentra justo lo que buscas.</p>
          </div>
          <div class="card border border-stone-100 p-8 hover:shadow-lg hover:shadow-stone-200/50 hover:-translate-y-0.5">
            <div class="w-11 h-11 bg-brand-100 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 class="mt-4 font-display text-base font-semibold text-stone-900">Postúlate rápido</h3>
            <p class="mt-2 text-sm text-stone-500 leading-relaxed">Aplica a las vacantes con tu CV y un mensaje de presentación. Sin pasos complicados.</p>
          </div>
          <div class="card border border-stone-100 p-8 hover:shadow-lg hover:shadow-stone-200/50 hover:-translate-y-0.5">
            <div class="w-11 h-11 bg-brand-100 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <h3 class="mt-4 font-display text-base font-semibold text-stone-900">Gestiona vacantes</h3>
            <p class="mt-2 text-sm text-stone-500 leading-relaxed">Publica, edita y administra tus ofertas desde un panel exclusivo diseñado para reclutadores.</p>
          </div>
        </div>

        <div class="mt-12 text-center">
          <router-link to="/registro" class="btn-primary px-8 py-3.5 text-base">
            Comenzar ahora
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </router-link>
        </div>
      </div>
    </section>

    <!-- CTA final -->
    <section class="py-16 md:py-20 bg-brand-600">
      <div class="max-w-3xl mx-auto px-4 text-center">
        <h2 class="font-display text-3xl md:text-4xl font-bold text-white">¿Listo para encontrar <span class="text-brand-200">talento excepcional</span>?</h2>
        <p class="mt-4 text-brand-100 text-lg">Únete a las empresas que ya confían en nosotros para construir sus equipos.</p>
        <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <router-link to="/registro" class="btn bg-white text-brand-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-brand-50 transition-all text-base shadow-xl">
            Crear cuenta gratis
          </router-link>
          <router-link to="/vacantes" class="btn border-2 border-white text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-brand-700 transition-all text-base">
            Explorar vacantes
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>
