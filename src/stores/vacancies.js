import { defineStore } from 'pinia'
import VacancyService from '../services/VacancyService'

export const useVacanciesStore = defineStore('vacancies', {
  state: () => ({
    list: [],
    current: null,
    loading: false,
    error: null,
    filters: { keyword: '', location: '', type: '' }
  }),

  getters: {
    activeVacancies: (state) => state.list.filter(v => v.status === 'active'),

    filteredVacancies: (state) => {
      const { keyword, location, type } = state.filters
      return state.list.filter(v => {
        if (v.status !== 'active') return false
        if (keyword && !`${v.title} ${v.company} ${v.description}`.toLowerCase().includes(keyword.toLowerCase())) return false
        if (location && !v.location.toLowerCase().includes(location.toLowerCase())) return false
        if (type && v.type !== type) return false
        return true
      })
    }
  },

  actions: {
    async fetchAll () {
      this.loading = true
      try {
        this.list = await VacancyService.getAll()
        this.error = null
      } catch (e) { this.error = e.message }
      finally { this.loading = false }
    },

    async fetchById (id) {
      this.loading = true
      try {
        this.current = await VacancyService.getById(id)
        this.error = null
      } catch (e) { this.error = e.message }
      finally { this.loading = false }
    },

    async create (data) {
      try {
        const created = await VacancyService.create(data)
        this.list.unshift(created)
        return created
      } catch (e) {
        this.error = e.message
        return null
      }
    },

    async update (id, data) {
      try {
        const updated = await VacancyService.update(id, data)
        const idx = this.list.findIndex(v => v.id === id)
        if (idx !== -1) this.list[idx] = updated
        if (this.current?.id === id) this.current = updated
        return updated
      } catch (e) {
        this.error = e.message
        return null
      }
    },

    async delete (id) {
      try {
        await VacancyService.delete(id)
        this.list = this.list.filter(v => v.id !== id)
        if (this.current?.id === id) this.current = null
        return true
      } catch (e) {
        this.error = e.message
        return false
      }
    },

    async toggleStatus (id) {
      try {
        const updated = await VacancyService.toggleStatus(id)
        const idx = this.list.findIndex(v => v.id === id)
        if (idx !== -1) this.list[idx] = updated
        return updated
      } catch (e) {
        this.error = e.message
        return null
      }
    },

    setFilters (filters) {
      this.filters = { ...this.filters, ...filters }
    }
  }
})
