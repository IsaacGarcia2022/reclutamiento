import { defineStore } from 'pinia'
import AuthService from '../services/AuthService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: AuthService.getSession(),
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    currentUser: (state) => state.user
  },

  actions: {
    async register (payload) {
      try {
        this.user = await AuthService.register(payload)
        this.error = null
        return true
      } catch (e) {
        this.error = e.message
        return false
      }
    },

    async login (email, password) {
      try {
        this.user = await AuthService.login(email, password)
        this.error = null
        return true
      } catch (e) {
        this.error = e.message
        return false
      }
    },

    logout () {
      AuthService.logout()
      this.user = null
    },

    clearError () {
      this.error = null
    }
  }
})
