import { defineStore } from 'pinia'
import ApplicationService from '../services/ApplicationService'
import { useAuthStore } from './auth'

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
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    async fetchByVacancy (vacancyId) {
      this.loading = true
      try {
        const apps = await ApplicationService.getByVacancy(vacancyId)
        this.byVacancy[vacancyId] = apps
        this.error = null
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    async submit (data, file, answers) {
      this.loading = true
      try {
        let cvPath = data.cv
        if (file) {
          cvPath = await ApplicationService.uploadCv(file)
        }
        const app = await ApplicationService.create({
          ...data,
          cv: cvPath
        }, answers)
        if (app && app.id) {
          const vid = app.vacancyId
          if (!this.byVacancy[vid]) this.byVacancy[vid] = []
          this.byVacancy[vid].push(app)
        }
        this.error = null
        return app
      } catch (e) {
        this.error = e.message
        return null
      } finally {
        this.loading = false
      }
    },

    async updateStatus (id, vacancyId, status) {
      const auth = useAuthStore()
      const reviewerId = auth.user?.id
      try {
        const updated = await ApplicationService.updateStatus(id, status, reviewerId)
        this.updateLocalApplication(vacancyId, updated)
        return updated
      } catch (e) {
        this.error = e.message
        return null
      }
    },

    async addObservation (id, vacancyId, observation) {
      const auth = useAuthStore()
      const reviewerId = auth.user?.id
      try {
        const updated = await ApplicationService.addObservation(id, observation, reviewerId)
        this.updateLocalApplication(vacancyId, updated)
        return updated
      } catch (e) {
        this.error = e.message
        return null
      }
    },

    updateLocalApplication (vacancyId, updated) {
      const list = this.byVacancy[vacancyId] || []
      const idx = list.findIndex(a => a.id === updated.id)
      if (idx !== -1) {
        list[idx] = updated
      } else {
        list.push(updated)
      }
      this.byVacancy[vacancyId] = [...list]
    }
  }
})
