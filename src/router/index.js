import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', name: 'Landing', component: () => import('../views/LandingPage.vue') },
  { path: '/vacantes', name: 'VacancyList', component: () => import('../views/VacancyList.vue') },
  { path: '/vacantes/:id', name: 'VacancyDetail', component: () => import('../views/VacancyDetail.vue') },
  { path: '/vacantes/:id/postular', name: 'ApplyForm', component: () => import('../views/ApplyForm.vue') },
  { path: '/trabaja-con-nosotros', name: 'Careers', component: () => import('../views/VacancyList.vue') },
  { path: '/conoce-la-empresa', name: 'CompanyInfo', component: () => import('../views/CompanyInfo.vue') },
  { path: '/preguntas-frecuentes', name: 'Faq', component: () => import('../views/Faq.vue') },
  { path: '/politica-de-privacidad', name: 'Privacy', component: () => import('../views/LegalPage.vue') },
  { path: '/terminos-de-postulacion', name: 'Terms', component: () => import('../views/LegalPage.vue') },
  { path: '/contacto', name: 'Contact', component: () => import('../views/Contact.vue') },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  { path: '/recuperar-contrasena', name: 'PasswordRecovery', component: () => import('../views/PasswordRecovery.vue') },
  { path: '/restablecer-contrasena', name: 'PasswordReset', component: () => import('../views/PasswordReset.vue') },
  { path: '/registro', name: 'Register', component: () => import('../views/Register.vue') },

  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, allowedRoles: ['administrador', 'recursos_humanos', 'consulta'] },
    children: [
      { path: '', name: 'AdminDashboard', component: () => import('../views/admin/AdminDashboard.vue') },
      { path: 'vacantes', name: 'VacancyManager', component: () => import('../views/admin/VacancyManager.vue') },
      { path: 'vacantes/nueva', name: 'VacancyCreate', component: () => import('../views/admin/VacancyForm.vue') },
      { path: 'vacantes/:id/editar', name: 'VacancyEdit', component: () => import('../views/admin/VacancyForm.vue'), props: true },
      { path: 'vacantes/:id/postulaciones', name: 'ApplicationList', component: () => import('../views/admin/ApplicationList.vue'), props: true },
      { path: 'usuarios', name: 'UserManager', component: () => import('../views/admin/UserManager.vue'), meta: { allowedRoles: ['administrador'] } },
      { path: 'usuarios/nuevo', name: 'UserCreate', component: () => import('../views/admin/UserForm.vue'), meta: { allowedRoles: ['administrador'] } },
      { path: 'usuarios/:id/editar', name: 'UserEdit', component: () => import('../views/admin/UserForm.vue'), props: true, meta: { allowedRoles: ['administrador'] } }
      , { path: 'empresa', name: 'CompanySettings', component: () => import('../views/admin/CompanySettings.vue'), meta: { allowedRoles: ['administrador'] } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const requiresAuth = to.matched.some(route => route.meta.requiresAuth)
  if (!requiresAuth) return true

  const auth = useAuthStore()
  await auth.initialize()

  if (!auth.isAuthenticated) return { name: 'Login' }

  const roleRule = [...to.matched].reverse().find(route => route.meta.allowedRoles)
  const allowedRoles = roleRule?.meta.allowedRoles || []
  if (allowedRoles.length && !allowedRoles.includes(auth.currentUser.role)) return { name: 'Landing' }

  return true
})

export default router
