import { defineStore } from 'pinia'
import AuthService from '../services/AuthService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    error: null,
    initialized: false,
    loading: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    currentUser: (state) => state.user
  },

  actions: {
    async initialize () {
      if (this.initialized) return

      this.loading = true
      try {
        this.user = AuthService.isConfigured ? await AuthService.getCurrentUser() : null
        this.error = null
      } catch (e) {
        this.user = null
        this.error = e.message
      } finally {
        this.loading = false
        this.initialized = true
      }
    },

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
      this.loading = true
      try {
        this.user = await AuthService.login(email, password)
        this.error = null
        return true
      } catch (e) {
        this.error = e.message
        return false
      } finally {
        this.loading = false
      }
    },

    async logout () {
      try {
        if (AuthService.isConfigured) await AuthService.logout()
      } finally {
        this.user = null
      }
    },

    clearError () {
      this.error = null
    }
  }
})
