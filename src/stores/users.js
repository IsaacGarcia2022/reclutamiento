import { defineStore } from 'pinia'
import UserService from '../services/UserService'

export const useUsersStore = defineStore('users', {
  state: () => ({ list: [], roles: [], loading: false, error: null }),

  actions: {
    async fetchAll () {
      this.loading = true
      try { this.list = await UserService.list(); this.error = null } catch (e) { this.error = e.message } finally { this.loading = false }
    },
    async fetchRoles () {
      try { this.roles = await UserService.roles(); this.error = null } catch (e) { this.error = e.message }
    },
    async getById (id) { return UserService.get(id) },
    async create (payload) {
      try { const user = await UserService.create(payload); await this.fetchAll(); return user } catch (e) { this.error = e.message; return null }
    },
    async update (payload) {
      try { const user = await UserService.update(payload); await this.fetchAll(); return user } catch (e) { this.error = e.message; return null }
    },
    async setStatus (id, estado) {
      try { const user = await UserService.setStatus(id, estado); await this.fetchAll(); return user } catch (e) { this.error = e.message; return null }
    },
    async resetPassword (id) {
      try { await UserService.resetPassword(id); this.error = null; return true } catch (e) { this.error = e.message; return false }
    },
    activity: (id) => UserService.activity(id)
  }
})
