import StorageService from './StorageService'

const SESSION_KEY = 'rrhh_session'

export default {
  async register ({ name, email, password, company }) {
    const users = await StorageService.getAll('users')
    const exists = users.find(u => u.email === email)
    if (exists) throw new Error('Este correo ya está registrado')

    const user = await StorageService.create('users', {
      name, email, password, company, role: 'recruiter', createdAt: new Date().toISOString()
    })
    const { password: _, ...safe } = user
    localStorage.setItem(SESSION_KEY, JSON.stringify(safe))
    return safe
  },

  async login (email, password) {
    const users = await StorageService.getAll('users')
    const user = users.find(u => u.email === email && u.password === password)
    if (!user) throw new Error('Credenciales inválidas')
    const { password: _, ...safe } = user
    localStorage.setItem(SESSION_KEY, JSON.stringify(safe))
    return safe
  },

  getSession () {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  },

  logout () {
    localStorage.removeItem(SESSION_KEY)
  }
}
