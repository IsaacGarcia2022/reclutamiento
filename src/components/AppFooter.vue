<template>
  <footer class="bg-stone-900 text-stone-300 py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-1.5 font-display text-lg font-bold">
          <span class="text-brand-400">Portal</span><span class="text-coral-400">Empleo</span>
        </div>
        <p class="text-sm text-stone-400">Plataforma de reclutamiento &mdash; &copy; {{ new Date().getFullYear() }}</p>
        <div class="flex items-center gap-6 text-sm text-stone-400">
          <router-link to="/vacantes" class="hover:text-white transition-colors">Vacantes</router-link>
          <router-link to="/login" class="hover:text-white transition-colors">Acceder</router-link>
        </div>
      </div>
    </div>
  </footer>
</template>
