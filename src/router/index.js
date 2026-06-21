import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', name: 'Landing', component: () => import('../views/LandingPage.vue') },
  { path: '/vacantes', name: 'VacancyList', component: () => import('../views/VacancyList.vue') },
  { path: '/vacantes/:id', name: 'VacancyDetail', component: () => import('../views/VacancyDetail.vue') },
  { path: '/vacantes/:id/postular', name: 'ApplyForm', component: () => import('../views/ApplyForm.vue') },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
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
      { path: 'vacantes/:id/postulaciones', name: 'ApplicationList', component: () => import('../views/admin/ApplicationList.vue'), props: true }
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

  const allowedRoles = to.matched.flatMap(route => route.meta.allowedRoles || [])
  if (allowedRoles.length && !allowedRoles.includes(auth.currentUser.role)) return { name: 'Landing' }

  return true
})

export default router
