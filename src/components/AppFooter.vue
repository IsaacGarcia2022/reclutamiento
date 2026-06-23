<script setup>
import { ref } from 'vue'

const newsletterEmail = ref('')
const newsletterSuccess = ref(false)
const newsletterError = ref(false)

function handleNewsletterSubmit() {
  if (newsletterEmail.value.trim() && newsletterEmail.value.includes('@')) {
    newsletterSuccess.value = true
    newsletterError.value = false
    newsletterEmail.value = ''
    setTimeout(() => {
      newsletterSuccess.value = false
    }, 5000)
  } else {
    newsletterError.value = true
    newsletterSuccess.value = false
  }
}
</script>

<template>
  <footer class="public-footer">
    <div class="footer-container">
      <!-- Top bar with Newsletter -->
      <div class="footer-newsletter-row">
        <div class="newsletter-text">
          <h3>Mantente a la vanguardia</h3>
          <p>Suscríbete para recibir tendencias y análisis sobre reclutamiento tecnológico.</p>
        </div>
        <form class="newsletter-form" @submit.prevent="handleNewsletterSubmit" novalidate>
          <div class="newsletter-field-group">
            <input
              v-model="newsletterEmail"
              type="email"
              placeholder="Ingresa tu correo electrónico"
              class="newsletter-input"
              aria-label="Correo electrónico para newsletter"
              required
            />
            <button type="submit" class="btn-newsletter-submit">Suscribirme</button>
          </div>
          <p v-if="newsletterSuccess" class="newsletter-alert success-msg" role="alert">
            ✓ ¡Suscripción exitosa! Te enviaremos novedades pronto.
          </p>
          <p v-if="newsletterError" class="newsletter-alert error-msg" role="alert">
            ⚠ Por favor ingresa un correo electrónico válido.
          </p>
        </form>
      </div>

      <hr class="footer-divider" />

      <!-- Navigation and Info Grid -->
      <div class="footer-links-grid">
        <div class="footer-brand-col">
          <span class="footer-logo">
            <span class="logo-primary">Portal</span><span class="logo-secondary">Empleo</span>
          </span>
          <p class="brand-pitch">
            Conectamos el mejor talento técnico con oportunidades laborales excepcionales en base a datos de afinidad real.
          </p>
          <div class="social-links">
            <!-- LinkedIn -->
            <a href="#" class="social-icon" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
            <!-- Twitter -->
            <a href="#" class="social-icon" aria-label="Twitter">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
              </svg>
            </a>
            <!-- GitHub -->
            <a href="#" class="social-icon" aria-label="GitHub">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
              </svg>
            </a>
          </div>
        </div>

        <div class="footer-links-col">
          <h4>Portal</h4>
          <ul>
            <li><router-link to="/vacantes">Buscar Vacantes</router-link></li>
            <li><router-link to="/empresa">Conoce la Empresa</router-link></li>
            <li><router-link to="/preguntas-frecuentes">Preguntas Frecuentes</router-link></li>
            <li><router-link to="/contacto">Contacto</router-link></li>
          </ul>
        </div>

        <div class="footer-links-col">
          <h4>Administración</h4>
          <ul>
            <li><router-link to="/login">Acceso Interno</router-link></li>
          </ul>
        </div>

        <div class="footer-links-col">
          <h4>Legal</h4>
          <ul>
            <li><router-link to="/privacidad">Política de Privacidad</router-link></li>
            <li><router-link to="/terminos">Términos del Servicio</router-link></li>
            <li><router-link to="/solicitar-eliminacion">Eliminar Datos</router-link></li>
          </ul>
        </div>
      </div>

      <hr class="footer-divider-sub" />

      <div class="footer-bottom-row">
        <p>&copy; {{ new Date().getFullYear() }} PortalEmpleo. Todos los derechos reservados.</p>
        <p class="accessibility-notice">Diseño optimizado para accesibilidad (WCAG 2.1 AA)</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.public-footer {
  background-color: var(--company-primary-dark);
  color: white;
  padding-top: 80px;
  padding-bottom: 48px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-family: 'Inter', sans-serif;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.footer-newsletter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 32px;
  padding-bottom: 32px;
}

.newsletter-text h3 {
  color: white;
  font-family: 'Sora', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.newsletter-text p {
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.95rem;
  margin: 0;
}

.newsletter-form {
  width: 100%;
  max-width: 480px;
}

.newsletter-field-group {
  display: flex;
  background-color: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 4px;
}

.newsletter-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: white;
  font-family: 'Inter', sans-serif;
  padding: 12px 16px;
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
  padding: 0 28px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.88rem;
  transition: background-color 0.2s;
}

.btn-newsletter-submit:hover {
  background-color: #517166;
}

.newsletter-alert {
  font-size: 0.82rem;
  margin-top: 12px;
  margin-bottom: 0;
  font-weight: 600;
}

.success-msg { color: #a7f3d0; }
.error-msg { color: #fecaca; }

.footer-divider {
  border: 0;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.08);
  margin: 40px 0;
}

.footer-links-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 48px;
  padding-bottom: 48px;
}

@media (max-width: 768px) {
  .footer-links-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .footer-newsletter-row {
    flex-direction: column;
    text-align: center;
  }
}

.footer-brand-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
}

.footer-logo {
  font-family: 'Sora', sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.logo-primary {
  color: var(--company-primary);
}

.logo-secondary {
  color: var(--company-secondary);
}

.brand-pitch {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.88rem;
  line-height: 1.6;
  max-width: 260px;
  margin: 0;
}

.social-links {
  display: flex;
  gap: 16px;
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
  font-family: 'Sora', sans-serif;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 24px 0;
  font-weight: 700;
}

.footer-links-col ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  margin: 0 0 32px 0;
}

.footer-bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.8rem;
}

.footer-bottom-row p {
  margin: 0;
}

.accessibility-notice {
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 3px 10px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.02);
}
</style>
