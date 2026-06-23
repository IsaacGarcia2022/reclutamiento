<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchKeyword = ref('')

function handleSearch() {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/vacantes', query: { keyword: searchKeyword.value.trim() } })
  } else {
    router.push({ path: '/vacantes' })
  }
}
</script>

<template>
  <div class="landing-page-container">
    <!-- HERO SECTION -->
    <section class="hero-section">
      <div class="hero-content-wrapper">
        <div class="hero-text-block">
          <div class="hero-eyebrow">Plataforma de reclutamiento inteligente</div>
          <h1 class="hero-title">
            Conectamos el <span class="highlight-text">talento ideal</span> con las empresas del futuro
          </h1>
          <p class="hero-subtitle">
            Un ecosistema ágil, transparente y con propósito. Encuentra tu próxima oportunidad profesional o construye tu equipo soñado en tiempo récord.
          </p>

          <!-- Dual CTA Buttons -->
          <div class="hero-cta-group">
            <router-link to="/vacantes" class="btn-hero-primary">
              Buscar empleo
              <svg class="icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </router-link>
          </div>

          <!-- Integrated Search Box -->
          <form class="hero-search-form" @submit.prevent="handleSearch" aria-label="Buscador de empleo rápido">
            <div class="search-input-wrapper">
              <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="Cargo, palabra clave o modalidad..."
                class="search-input"
                aria-label="Buscar vacantes"
              />
            </div>
            <button type="submit" class="btn-search-submit">Buscar</button>
          </form>

          <!-- Small Trust Badges -->
          <div class="hero-badges">
            <span class="hero-badge"><span class="badge-dot dot-positive"></span>Perfiles verificados</span>
            <span class="hero-badge"><span class="badge-dot dot-warning"></span>Procesos activos</span>
            <span class="hero-badge"><span class="badge-dot dot-primary"></span>Feedback garantizado</span>
          </div>
        </div>

        <!-- Hero Abstract Illustration (Diptych 40%) -->
        <div class="hero-graphic-block" aria-hidden="true">
          <div class="graphic-canvas">
            <div class="glass-card-bg"></div>
            <!-- Interactive Connecting Nodes SVG -->
            <svg class="abstract-svg-connection" viewBox="0 0 500 500" fill="none">
              <!-- Grid lines -->
              <line x1="50" y1="0" x2="50" y2="500" stroke="rgba(21, 79, 93, 0.05)" stroke-width="1" />
              <line x1="150" y1="0" x2="150" y2="500" stroke="rgba(21, 79, 93, 0.05)" stroke-width="1" />
              <line x1="250" y1="0" x2="250" y2="500" stroke="rgba(21, 79, 93, 0.05)" stroke-width="1" />
              <line x1="350" y1="0" x2="350" y2="500" stroke="rgba(21, 79, 93, 0.05)" stroke-width="1" />
              <line x1="450" y1="0" x2="450" y2="500" stroke="rgba(21, 79, 93, 0.05)" stroke-width="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(21, 79, 93, 0.05)" stroke-width="1" />
              <line x1="0" y1="200" x2="500" y2="200" stroke="rgba(21, 79, 93, 0.05)" stroke-width="1" />
              <line x1="0" y1="300" x2="500" y2="300" stroke="rgba(21, 79, 93, 0.05)" stroke-width="1" />
              <line x1="0" y1="400" x2="500" y2="400" stroke="rgba(21, 79, 93, 0.05)" stroke-width="1" />

              <!-- Connection curves -->
              <path class="connection-path-1" d="M100 150 C 200 150, 200 350, 380 350" stroke="var(--company-secondary)" stroke-width="3" stroke-linecap="round" stroke-dasharray="8 6" />
              <path class="connection-path-2" d="M120 380 C 250 380, 250 200, 380 150" stroke="var(--company-primary)" stroke-width="3" stroke-linecap="round" />
              <path class="connection-path-3" d="M250 100 Q 300 250 250 400" stroke="rgba(199, 154, 82, 0.4)" stroke-width="2" stroke-dasharray="5 5" />

              <!-- Orbiting rings -->
              <circle cx="250" cy="250" r="140" stroke="rgba(21, 79, 93, 0.04)" stroke-width="8" />
              <circle cx="250" cy="250" r="90" stroke="rgba(99, 133, 121, 0.06)" stroke-width="2" />

              <!-- Overlapping central circles representing matching -->
              <circle class="pulse-circle-primary" cx="210" cy="250" r="60" fill="rgba(21, 79, 93, 0.08)" />
              <circle class="pulse-circle-secondary" cx="290" cy="250" r="60" fill="rgba(99, 133, 121, 0.12)" />

              <!-- Glowing Node points -->
              <g class="glow-node" transform="translate(100, 150)">
                <circle r="14" fill="rgba(21, 79, 93, 0.1)" />
                <circle r="7" fill="var(--company-primary)" />
              </g>
              <g class="glow-node" transform="translate(380, 350)">
                <circle r="14" fill="rgba(99, 133, 121, 0.15)" />
                <circle r="7" fill="var(--company-secondary)" />
              </g>
              <g class="glow-node" transform="translate(380, 150)">
                <circle r="14" fill="rgba(199, 154, 82, 0.15)" />
                <circle r="7" fill="var(--company-warning)" />
              </g>
              <g class="glow-node" transform="translate(120, 380)">
                <circle r="14" fill="rgba(21, 79, 93, 0.1)" />
                <circle r="7" fill="var(--company-primary)" />
              </g>

              <!-- Central intersection point -->
              <circle cx="250" cy="250" r="6" fill="#39735A" />
              <circle class="glow-pulse" cx="250" cy="250" r="15" stroke="#39735A" stroke-width="2" fill="none" />
            </svg>

            <!-- Floating statistics widgets to mimic platform preview -->
            <div class="floating-widget widget-1">
              <div class="widget-icon bg-pos"><svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="2.5" fill="none"><path d="M20 6L9 17l-5-5" /></svg></div>
              <div class="widget-details">
                <span class="widget-title">Candidato Contratado</span>
                <span class="widget-time">Hace 3 minutos</span>
              </div>
              <span class="widget-badge badge-pos">Activo</span>
            </div>

            <div class="floating-widget widget-2">
              <div class="widget-icon bg-warn"><svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
              <div class="widget-details">
                <span class="widget-title">UX/UI Designer</span>
                <span class="widget-time">En revisión técnica</span>
              </div>
              <span class="widget-badge badge-warn">En proceso</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style>
/* VARIABLE DEFINITIONS (COHERENCIA VISUAL SISTEMA DE DISEÑO) */
:root {
  --company-primary: #154F5D;
  --company-primary-dark: #103F4A;
  --company-secondary: #638579;
  --company-background: #F4F7F8;
  --company-surface: #FFFFFF;
  --company-border: #D7E0E3;
  --company-text-primary: #263238;
  --company-text-secondary: #65757C;
  --company-positive: #39735A;
  --company-warning: #C79A52;
  --company-negative: #A65C5C;
  
  --spacing-base: 8px;
  --radius-small: 8px;
  --radius-large: 12px;
  --radius-card: 20px;
}

/* BASE STYLING FOR THE PAGE */
.landing-page-container {
  min-height: 100vh;
  background-color: var(--company-background);
  color: var(--company-text-primary);
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
}

/* TYPOGRAPHY */
.landing-page-container h1,
.landing-page-container h2,
.landing-page-container h3,
.landing-page-container h4 {
  font-family: 'Sora', sans-serif;
  color: var(--company-text-primary);
  font-weight: 700;
  line-height: 1.2;
}

/* ACCESSIBILITY: Visible outline on keyboard focus */
.landing-page-container a:focus-visible,
.landing-page-container button:focus-visible,
.landing-page-container input:focus-visible {
  outline: 2.5px solid var(--company-primary);
  outline-offset: 3px;
}

/* HEADER COMPONENT */
.public-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgba(244, 247, 248, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-b: 1px solid var(--company-border);
  height: 72px;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 calc(var(--spacing-base) * 3);
  display: flex;
  justify-content: justify;
  align-items: center;
  gap: calc(var(--spacing-base) * 4);
}

.logo-link {
  text-decoration: none;
  font-family: 'Sora', sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
}

.logo-primary {
  color: var(--company-primary);
}

.logo-secondary {
  color: var(--company-secondary);
}

.public-nav {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-base) * 3);
  margin: 0 auto 0 calc(var(--spacing-base) * 2);
}

.nav-item {
  color: var(--company-text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  padding: calc(var(--spacing-base) * 1) calc(var(--spacing-base) * 1.5);
  border-radius: var(--radius-small);
  transition: all 0.25s ease;
}

.nav-item:hover {
  color: var(--company-primary);
  background-color: rgba(21, 79, 93, 0.04);
}

.nav-item.active {
  color: var(--company-primary);
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-base) * 2);
}

.btn-navbar-login {
  color: var(--company-primary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  padding: calc(var(--spacing-base) * 1.2) calc(var(--spacing-base) * 2.5);
  border-radius: var(--radius-small);
  transition: background-color 0.2s;
}

.btn-navbar-login:hover {
  background-color: rgba(21, 79, 93, 0.05);
}

.btn-navbar-cta {
  background-color: var(--company-primary);
  color: white;
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 600;
  padding: calc(var(--spacing-base) * 1.2) calc(var(--spacing-base) * 2.5);
  border-radius: var(--radius-small);
  box-shadow: 0 4px 10px rgba(21, 79, 93, 0.15);
  transition: all 0.25s ease;
}

.btn-navbar-cta:hover {
  background-color: var(--company-primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(21, 79, 93, 0.22);
}

.btn-navbar-admin {
  background-color: var(--company-secondary);
  color: white;
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 600;
  padding: calc(var(--spacing-base) * 1.2) calc(var(--spacing-base) * 2.5);
  border-radius: var(--radius-small);
  transition: all 0.25s ease;
}

.btn-navbar-admin:hover {
  background-color: #517166;
  transform: translateY(-1px);
}

/* HERO SECTION */
.hero-section {
  position: relative;
  padding: calc(var(--spacing-base) * 10) 0 calc(var(--spacing-base) * 14) 0;
  background: radial-gradient(circle at 80% 20%, rgba(21, 79, 93, 0.06) 0%, rgba(244, 247, 248, 0) 65%), var(--company-background);
  border-bottom: 1px solid var(--company-border);
  overflow: hidden;
}

.hero-content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 calc(var(--spacing-base) * 3);
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  align-items: center;
  gap: calc(var(--spacing-base) * 8);
}

.hero-text-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.hero-eyebrow {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--company-secondary);
  margin-bottom: calc(var(--spacing-base) * 2.5);
}

.hero-title {
  font-size: clamp(2.3rem, 5vw, 4.3rem);
  line-height: 1.05;
  letter-spacing: -0.035em;
  margin-bottom: calc(var(--spacing-base) * 3);
}

.highlight-text {
  color: var(--company-primary);
  position: relative;
  display: inline-block;
}

.highlight-text::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 2px;
  width: 100%;
  height: 6px;
  background-color: rgba(99, 133, 121, 0.25);
  z-index: -1;
  border-radius: 4px;
}

.hero-subtitle {
  font-size: 1.15rem;
  line-height: 1.6;
  color: var(--company-text-secondary);
  max-width: 540px;
  margin-bottom: calc(var(--spacing-base) * 5);
}

/* Dual CTA buttons */
.hero-cta-group {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-base) * 2.5);
  margin-bottom: calc(var(--spacing-base) * 5);
  width: 100%;
  max-width: 500px;
}

.btn-hero-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: var(--company-primary);
  color: white;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  padding: calc(var(--spacing-base) * 2) calc(var(--spacing-base) * 4);
  border-radius: var(--radius-large);
  box-shadow: 0 8px 24px rgba(21, 79, 93, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-hero-primary:hover {
  background-color: var(--company-primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(21, 79, 93, 0.28);
}

.icon-arrow {
  width: 16px;
  height: 16px;
  transition: transform 0.25s ease;
}

.btn-hero-primary:hover .icon-arrow {
  transform: translateX(4px);
}

.btn-hero-secondary {
  display: inline-flex;
  align-items: center;
  border: 2px solid var(--company-primary);
  color: var(--company-primary);
  background-color: transparent;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  padding: calc(var(--spacing-base) * 1.8) calc(var(--spacing-base) * 4);
  border-radius: var(--radius-large);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-hero-secondary:hover {
  background-color: rgba(21, 79, 93, 0.05);
  transform: translateY(-2px);
}

/* Integrated Search Box */
.hero-search-form {
  display: flex;
  background-color: var(--company-surface);
  border: 1px solid var(--company-border);
  border-radius: calc(var(--radius-large) * 1.5);
  padding: calc(var(--spacing-base) * 1);
  box-shadow: 0 10px 35px rgba(28, 61, 66, 0.06);
  width: 100%;
  max-width: 540px;
  margin-bottom: calc(var(--spacing-base) * 4);
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  padding-left: calc(var(--spacing-base) * 2);
}

.search-icon {
  width: 20px;
  height: 20px;
  color: var(--company-text-secondary);
  margin-right: calc(var(--spacing-base) * 1.5);
}

.search-input {
  width: 100%;
  border: none;
  outline: none;
  font-family: 'Inter', sans-serif;
  color: var(--company-text-primary);
  font-size: 0.95rem;
  background-color: transparent;
}

.search-input::placeholder {
  color: var(--company-text-secondary);
  opacity: 0.75;
}

.btn-search-submit {
  background-color: var(--company-secondary);
  color: white;
  border: none;
  font-weight: 600;
  padding: calc(var(--spacing-base) * 1.8) calc(var(--spacing-base) * 3.5);
  border-radius: var(--radius-large);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.25s ease;
}

.btn-search-submit:hover {
  background-color: #517166;
  box-shadow: 0 4px 10px rgba(99, 133, 121, 0.2);
}

.hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--spacing-base) * 3);
  font-size: 0.85rem;
  color: var(--company-text-secondary);
}

.hero-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.dot-positive { background-color: var(--company-positive); }
.dot-warning { background-color: var(--company-warning); }
.dot-primary { background-color: var(--company-primary); }

/* Hero Graphic block */
.hero-graphic-block {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.graphic-canvas {
  position: relative;
  width: 100%;
  max-width: 440px;
  aspect-ratio: 1;
  border-radius: var(--radius-card);
}

.glass-card-bg {
  position: absolute;
  inset: -15px;
  background-color: rgba(99, 133, 121, 0.08);
  border-radius: 40px;
  transform: rotate(2deg);
  z-index: 1;
}

.abstract-svg-connection {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  background-color: var(--company-surface);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-card);
  box-shadow: 0 30px 70px rgba(29, 67, 73, 0.12);
}

/* Node flow animation */
@keyframes dash {
  to {
    stroke-dashoffset: -40;
  }
}

.connection-path-1 {
  animation: dash 3.5s linear infinite;
}

/* Pulse scale animation */
@keyframes scalePulse {
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 0.95; }
  100% { transform: scale(1); opacity: 0.8; }
}

.pulse-circle-primary {
  transform-origin: 210px 250px;
  animation: scalePulse 6s ease-in-out infinite alternate;
}

.pulse-circle-secondary {
  transform-origin: 290px 250px;
  animation: scalePulse 6s ease-in-out infinite alternate-reverse;
}

@keyframes doublePulse {
  0% { r: 6px; opacity: 1; }
  100% { r: 24px; opacity: 0; stroke-width: 1px; }
}

.glow-pulse {
  transform-origin: 250px 250px;
  animation: doublePulse 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

/* Floating Widgets on Hero */
.floating-widget {
  position: absolute;
  z-index: 5;
  background-color: var(--company-surface);
  border: 1px solid var(--company-border);
  border-radius: var(--radius-large);
  padding: calc(var(--spacing-base) * 1.5) calc(var(--spacing-base) * 2);
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-base) * 1.5);
  box-shadow: 0 15px 30px rgba(29, 67, 73, 0.1);
  transition: transform 0.3s ease;
}

.floating-widget:hover {
  transform: translateY(-4px);
}

.widget-1 {
  top: 15%;
  left: -20px;
}

.widget-2 {
  bottom: 12%;
  right: -25px;
}

.widget-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-small);
  display: grid;
  place-items: center;
}

.bg-pos { background-color: var(--company-positive); }
.bg-warn { background-color: var(--company-warning); }

.widget-details {
  display: flex;
  flex-direction: column;
}

.widget-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--company-text-primary);
}

.widget-time {
  font-size: 0.72rem;
  color: var(--company-text-secondary);
}

.widget-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  margin-left: calc(var(--spacing-base) * 1.5);
}

.badge-pos {
  background-color: rgba(57, 115, 90, 0.1);
  color: var(--company-positive);
}

.badge-warn {
  background-color: rgba(199, 154, 82, 0.1);
  color: var(--company-warning);
}

/* TRUST STRIP */
.trust-strip {
  background-color: var(--company-surface);
  border-bottom: 1px solid var(--company-border);
  padding: calc(var(--spacing-base) * 4) 0;
}

.trust-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 calc(var(--spacing-base) * 3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--spacing-base) * 2.5);
}

.trust-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--company-text-secondary);
  letter-spacing: 0.16em;
}

.logos-grid {
  width: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: calc(var(--spacing-base) * 4);
}

.logo-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
}

.logo-svg {
  color: var(--company-text-secondary);
  opacity: 0.45;
  transition: all 0.3s ease;
  width: 110px;
}

.logo-item:hover .logo-svg {
  opacity: 0.95;
  color: var(--company-primary);
  transform: scale(1.03);
}

/* SECTION HEADER GENERAL */
.section-header {
  margin-bottom: calc(var(--spacing-base) * 8);
  max-width: 700px;
}

.text-center {
  text-align: center;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.section-eyebrow {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--company-secondary);
  margin-bottom: calc(var(--spacing-base) * 1.5);
  display: inline-block;
}

.section-title {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  letter-spacing: -0.02em;
  margin-bottom: calc(var(--spacing-base) * 2);
}

.section-subtitle {
  font-size: 1.05rem;
  line-height: 1.55;
  color: var(--company-text-secondary);
}

/* VALUE DIFFERENTIATED SECTION (ZIG-ZAG LAYOUT) */
.value-section {
  padding: calc(var(--spacing-base) * 12) 0;
  background-color: var(--company-background);
}

.value-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 calc(var(--spacing-base) * 3);
}

.zigzag-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: calc(var(--spacing-base) * 10);
  margin-bottom: calc(var(--spacing-base) * 12);
}

.zigzag-row:last-child {
  margin-bottom: 0;
}

.zigzag-row.reverse {
  direction: rtl;
}

.zigzag-row.reverse .zigzag-text {
  direction: ltr; /* Reset read order for text block */
}

.zigzag-row.reverse .zigzag-graphic {
  direction: ltr;
}

.zigzag-graphic {
  display: flex;
  justify-content: center;
}

.graphic-frame {
  width: 100%;
  max-width: 440px;
  background-color: var(--company-surface);
  border: 1px solid var(--company-border);
  border-radius: var(--radius-card);
  padding: calc(var(--spacing-base) * 3);
  box-shadow: 0 15px 40px rgba(29, 67, 73, 0.04);
  transition: transform 0.4s ease;
}

.graphic-frame:hover {
  transform: translateY(-5px);
}

.feature-svg {
  width: 100%;
  height: auto;
}

@keyframes pulseGlow {
  0% { transform: scale(1); filter: drop-shadow(0 0 1px rgba(99, 133, 121, 0.2)); }
  50% { transform: scale(1.02); filter: drop-shadow(0 0 10px rgba(99, 133, 121, 0.4)); }
  100% { transform: scale(1); filter: drop-shadow(0 0 1px rgba(99, 133, 121, 0.2)); }
}

.pulse-line {
  animation: dash 6s linear infinite;
}

.zigzag-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.icon-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: rgba(99, 133, 121, 0.15); /* 15% opacity secondary color */
  display: grid;
  place-items: center;
  margin-bottom: calc(var(--spacing-base) * 3);
}

.zigzag-text h3 {
  font-size: 1.6rem;
  margin-bottom: calc(var(--spacing-base) * 2);
}

.zigzag-text p {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--company-text-secondary);
}

/* HOW IT WORKS SECTION */
.steps-section {
  padding: calc(var(--spacing-base) * 12) 0;
  background-color: var(--company-surface);
  border-top: 1px solid var(--company-border);
  border-bottom: 1px solid var(--company-border);
}

.steps-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 calc(var(--spacing-base) * 3);
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: calc(var(--spacing-base) * 4);
}

.step-card {
  position: relative;
  background-color: var(--company-surface);
  border: 1px solid var(--company-border);
  border-radius: var(--radius-card);
  padding: calc(var(--spacing-base) * 5) calc(var(--spacing-base) * 4);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.step-number {
  position: absolute;
  top: calc(var(--spacing-base) * 3);
  right: calc(var(--spacing-base) * 3);
  font-family: 'Sora', sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--company-primary);
  background-color: rgba(21, 79, 93, 0.06);
  padding: 4px 10px;
  border-radius: var(--radius-small);
}

.step-card-title {
  font-size: 1.25rem;
  margin-top: calc(var(--spacing-base) * 2);
  margin-bottom: calc(var(--spacing-base) * 2);
}

.step-card-text {
  font-size: 0.95rem;
  line-height: 1.55;
  color: var(--company-text-secondary);
  margin-bottom: calc(var(--spacing-base) * 4);
}

.step-card-arrow {
  margin-top: auto;
  color: var(--company-text-secondary);
  transition: transform 0.25s, color 0.25s;
}

.step-card:hover {
  transform: scale(1.02);
  border-color: var(--company-primary);
  box-shadow: 0 20px 45px rgba(21, 79, 93, 0.06);
}

.step-card:hover .step-card-arrow {
  color: var(--company-primary);
  transform: translateX(5px);
}

/* STATISTICS SECTION */
.stats-section {
  padding: calc(var(--spacing-base) * 10) 0;
  background-color: var(--company-primary-dark);
  color: white;
}

.stats-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 calc(var(--spacing-base) * 3);
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  align-items: center;
  gap: calc(var(--spacing-base) * 8);
}

.stats-text h2 {
  color: white;
  font-size: clamp(1.8rem, 3.5vw, 2.3rem);
  margin-bottom: calc(var(--spacing-base) * 2.5);
}

.stats-eyebrow {
  color: var(--company-secondary);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: calc(var(--spacing-base) * 1.5);
  display: inline-block;
}

.stats-text p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.05rem;
  line-height: 1.6;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: calc(var(--spacing-base) * 3);
}

.stat-card {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-large);
  padding: calc(var(--spacing-base) * 4);
  text-align: center;
  transition: background-color 0.25s;
}

.stat-card:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.stat-num {
  font-family: 'Sora', sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  color: white;
  margin-bottom: calc(var(--spacing-base) * 1);
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.65);
}

/* TESTIMONIALS SECTION (STACK CAROUSEL) */
.testimonials-section {
  padding: calc(var(--spacing-base) * 12) 0;
  background-color: var(--company-background);
  border-bottom: 1px solid var(--company-border);
}

.testimonials-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 calc(var(--spacing-base) * 3);
}

.carousel-stack-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: calc(var(--spacing-base) * 6);
  position: relative;
}

.testimonial-deck {
  position: relative;
  width: 100%;
  max-width: 580px;
  height: 290px;
}

.testimonial-card-stack {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: var(--company-surface);
  border: 1px solid var(--company-border);
  border-radius: var(--radius-card);
  padding: calc(var(--spacing-base) * 4) calc(var(--spacing-base) * 5);
  box-shadow: 0 10px 30px rgba(29, 67, 73, 0.03);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}

/* Card Quote Icon */
.card-quote-icon {
  position: absolute;
  top: 15px;
  right: 25px;
  font-family: 'Sora', sans-serif;
  font-size: 5rem;
  color: rgba(99, 133, 121, 0.12);
  line-height: 0.8;
  pointer-events: none;
}

.testimonial-quote {
  font-size: 1.12rem;
  line-height: 1.55;
  color: var(--company-text-primary);
  font-style: italic;
  font-weight: 500;
  margin-top: calc(var(--spacing-base) * 2);
}

.testimonial-author-block {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-base) * 2);
  border-top: 1px solid rgba(21, 79, 93, 0.07);
  padding-top: calc(var(--spacing-base) * 2);
}

.author-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: var(--company-primary);
  color: white;
  display: grid;
  place-items: center;
  font-family: 'Sora', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
}

.author-info {
  flex: 1;
}

.author-name {
  font-size: 0.98rem;
  font-weight: 700;
  margin: 0;
}

.author-role {
  font-size: 0.8rem;
  color: var(--company-text-secondary);
  margin: 2px 0 0 0;
}

.testimonial-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 30px;
}

.badge-company {
  background-color: rgba(199, 154, 82, 0.12);
  color: var(--company-warning);
}

.badge-candidate {
  background-color: rgba(57, 115, 90, 0.12);
  color: var(--company-positive);
}

/* STACK LAYOUT TRANSFORMATIONS */
.active-slide {
  transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
  opacity: 1;
  box-shadow: 0 20px 45px rgba(29, 67, 73, 0.08);
}

.behind-slide-1 {
  transform: translate3d(24px, 16px, 0) scale(0.96) rotate(1.5deg);
  opacity: 0.85;
}

.behind-slide-2 {
  transform: translate3d(48px, 32px, 0) scale(0.92) rotate(3deg);
  opacity: 0.55;
}

.hidden-slide {
  transform: translate3d(72px, 48px, 0) scale(0.85) rotate(4.5deg);
  opacity: 0;
  pointer-events: none;
}

/* Controls */
.carousel-controls {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing-base) * 4);
  margin-top: calc(var(--spacing-base) * 6);
  z-index: 10;
}

.btn-carousel-control {
  background-color: var(--company-surface);
  border: 1px solid var(--company-border);
  color: var(--company-primary);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 1.15rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
  transition: all 0.25s ease;
}

.btn-carousel-control:hover {
  background-color: var(--company-primary);
  color: white;
  border-color: var(--company-primary);
  transform: scale(1.05);
}

.carousel-indicators {
  display: flex;
  gap: 8px;
}

.carousel-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--company-border);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.25s ease;
}

.carousel-indicator-dot.dot-active {
  background-color: var(--company-primary);
  width: 20px;
  border-radius: 4px;
}

/* BLOG SECTION */
.blog-section {
  padding: calc(var(--spacing-base) * 12) 0;
  background-color: var(--company-surface);
}

.blog-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 calc(var(--spacing-base) * 3);
}

.blog-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: calc(var(--spacing-base) * 4);
}

.blog-card {
  background-color: var(--company-surface);
  border: 1px solid var(--company-border);
  border-radius: var(--radius-card);
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.blog-card:hover {
  transform: translateY(-6px);
  border-color: var(--company-primary);
  box-shadow: 0 20px 40px rgba(21, 79, 93, 0.06);
}

.blog-card-media {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.blog-placeholder-graphic {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.5s ease;
}

.blog-card:hover .blog-placeholder-graphic {
  transform: scale(1.08);
}

.bg-grad-1 { background: linear-gradient(135deg, #103F4A 0%, #638579 100%); }
.bg-grad-2 { background: linear-gradient(135deg, #154F5D 0%, #C79A52 100%); }
.bg-grad-3 { background: linear-gradient(135deg, #638579 0%, #39735A 100%); }

.decor-blog-svg {
  width: 50%;
  height: auto;
}

.blog-card-badge {
  position: absolute;
  bottom: 12px;
  left: 16px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
}

.warning-badge { background-color: var(--company-warning); color: white; }
.positive-badge { background-color: var(--company-positive); color: white; }
.primary-badge { background-color: var(--company-primary); color: white; }

.blog-card-content {
  padding: calc(var(--spacing-base) * 3);
  display: flex;
  flex-direction: column;
  flex: 1;
}

.blog-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--company-text-secondary);
  margin-bottom: calc(var(--spacing-base) * 1.5);
}

.blog-card-title {
  font-size: 1.15rem;
  line-height: 1.35;
  margin-bottom: calc(var(--spacing-base) * 1.5);
}

.blog-card-excerpt {
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--company-text-secondary);
  margin-bottom: calc(var(--spacing-base) * 3);
  flex: 1;
}

.blog-card-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--company-primary);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.85rem;
  margin-top: auto;
}

.link-arrow {
  transition: transform 0.2s ease;
}

.blog-card-link:hover .link-arrow {
  transform: translateX(3px);
}

/* FOOTER COMPONENT */
.public-footer {
  background-color: var(--company-primary-dark);
  color: white;
  padding-top: calc(var(--spacing-base) * 10);
  padding-bottom: calc(var(--spacing-base) * 6);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 calc(var(--spacing-base) * 3);
}

.footer-newsletter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: calc(var(--spacing-base) * 4);
  padding-bottom: calc(var(--spacing-base) * 4);
}

.newsletter-text h3 {
  color: white;
  font-size: 1.5rem;
  margin-bottom: calc(var(--spacing-base) * 1);
}

.newsletter-text p {
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.95rem;
}

.newsletter-form {
  width: 100%;
  max-width: 480px;
}

.newsletter-field-group {
  display: flex;
  background-color: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-large);
  padding: 4px;
}

.newsletter-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: white;
  font-family: 'Inter', sans-serif;
  padding: calc(var(--spacing-base) * 1.5) calc(var(--spacing-base) * 2);
  font-size: 0.9rem;
}

.newsletter-input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.btn-newsletter-submit {
  background-color: var(--company-secondary);
  color: white;
  border: none;
  font-weight: 600;
  padding: 0 calc(var(--spacing-base) * 3.5);
  border-radius: var(--radius-large);
  cursor: pointer;
  font-size: 0.88rem;
  transition: background-color 0.2s;
}

.btn-newsletter-submit:hover {
  background-color: #517166;
}

.newsletter-alert {
  font-size: 0.82rem;
  margin-top: calc(var(--spacing-base) * 1.5);
  font-weight: 600;
}

.success-msg { color: #a7f3d0; }
.error-msg { color: #fecaca; }

.footer-divider {
  border: 0;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.08);
  margin: calc(var(--spacing-base) * 5) 0;
}

.footer-links-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: calc(var(--spacing-base) * 6);
  padding-bottom: calc(var(--spacing-base) * 6);
}

.footer-brand-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--spacing-base) * 3);
}

.footer-logo {
  font-family: 'Sora', sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.brand-pitch {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.88rem;
  line-height: 1.6;
  max-width: 260px;
}

.social-links {
  display: flex;
  gap: calc(var(--spacing-base) * 2);
}

.social-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.65);
  display: grid;
  place-items: center;
  transition: all 0.25s ease;
}

.social-icon:hover {
  background-color: var(--company-secondary);
  color: white;
  transform: translateY(-2px);
}

.footer-links-col h4 {
  color: white;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: calc(var(--spacing-base) * 3);
}

.footer-links-col ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-base) * 1.5);
}

.footer-links-col ul a {
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.footer-links-col ul a:hover {
  color: white;
}

.footer-divider-sub {
  border: 0;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.05);
  margin: 0 0 calc(var(--spacing-base) * 4) 0;
}

.footer-bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: calc(var(--spacing-base) * 2);
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.8rem;
}

.accessibility-notice {
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 3px 10px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.02);
}

/* RESPONSIVE DESIGN (CSS MEDIA QUERIES) */
@media (max-width: 1024px) {
  .hero-content-wrapper {
    grid-template-columns: 1fr;
    gap: calc(var(--spacing-base) * 6);
    text-align: center;
  }
  
  .hero-text-block {
    align-items: center;
  }
  
  .hero-subtitle {
    max-width: 600px;
  }
  
  .hero-cta-group,
  .hero-search-form {
    max-width: 100%;
  }

  .hero-graphic-block {
    margin-top: calc(var(--spacing-base) * 4);
  }
  
  .zigzag-row {
    grid-template-columns: 1fr;
    gap: calc(var(--spacing-base) * 6);
    margin-bottom: calc(var(--spacing-base) * 8);
  }
  
  .zigzag-row.reverse {
    direction: ltr;
  }
  
  .stats-wrapper {
    grid-template-columns: 1fr;
    text-align: center;
    gap: calc(var(--spacing-base) * 6);
  }
  
  .steps-grid,
  .blog-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .public-header {
    height: auto;
    padding: calc(var(--spacing-base) * 2) 0;
  }
  
  .header-content {
    flex-direction: column;
    gap: calc(var(--spacing-base) * 2);
  }
  
  .public-nav {
    margin: calc(var(--spacing-base) * 1.5) 0;
    flex-wrap: wrap;
    justify-content: center;
    gap: calc(var(--spacing-base) * 1);
  }
  
  .steps-grid,
  .blog-grid {
    grid-template-columns: 1fr;
  }
  
  .footer-links-grid {
    grid-template-columns: 1fr;
    gap: calc(var(--spacing-base) * 4);
  }
  
  .footer-newsletter-row {
    flex-direction: column;
    text-align: center;
  }
  
  .testimonial-deck {
    height: 380px; /* More vertical space for wrapped text on smaller devices */
  }
  
  .testimonial-card-stack {
    padding: calc(var(--spacing-base) * 3);
  }
  
  .behind-slide-1 {
    transform: translate3d(0, 16px, 0) scale(0.96) rotate(1deg);
  }
  
  .behind-slide-2 {
    transform: translate3d(0, 32px, 0) scale(0.92) rotate(2deg);
  }
  
  .hidden-slide {
    transform: translate3d(0, 48px, 0) scale(0.85) rotate(3deg);
  }
}
</style>
