import { defineStore } from 'pinia'
import ApplicationService from '../services/ApplicationService'

export const useApplicationsStore = defineStore('applications', {
  state: () => ({
    byVacancy: {},
    loading: false,
    error: null
  }),

  getters: {
    getByVacancyId: (state) => (id) => state.byVacancy[id] || []
  },

  actions: {
    async fetchAll () {
      this.loading = true
      try {
        const all = await ApplicationService.getAll()
        this.byVacancy = {}
        for (const app of all) {
          if (!this.byVacancy[app.vacancyId]) this.byVacancy[app.vacancyId] = []
          this.byVacancy[app.vacancyId].push(app)
        }
        this.error = null
      } catch (e) { this.error = e.message }
      finally { this.loading = false }
    },

    async fetchByVacancy (vacancyId) {
      this.loading = true
      try {
        const apps = await ApplicationService.getByVacancy(vacancyId)
        this.byVacancy[vacancyId] = apps
        this.error = null
      } catch (e) { this.error = e.message }
      finally { this.loading = false }
    },

    async submit (data) {
      try {
        const app = await ApplicationService.create(data)
        const vid = app.vacancyId
        if (!this.byVacancy[vid]) this.byVacancy[vid] = []
        this.byVacancy[vid].push(app)
        return app
      } catch (e) {
        this.error = e.message
        return null
      }
    }
  }
})
