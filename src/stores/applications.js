import { defineStore } from 'pinia'
import ApplicationService from '../services/ApplicationService'
import DocumentService from '../services/DocumentService'
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

    async submit (data, file, answers, optionalFiles = {}) {
      this.loading = true
      try {
        let cvPath = data.cv
        let cvUploadedData = null
        
        // 1. Subir CV al almacenamiento privado
        if (file) {
          cvUploadedData = await DocumentService.uploadFile(file, 'curriculum')
          cvPath = cvUploadedData.ruta
        }
        
        // 2. Subir archivos opcionales al almacenamiento
        const uploadedOptionalFiles = {}
        for (const [key, f] of Object.entries(optionalFiles)) {
          if (f) {
            uploadedOptionalFiles[key] = await DocumentService.uploadFile(f, key)
          }
        }
        
        // 3. Crear la postulación
        const app = await ApplicationService.create({
          ...data,
          cv: cvPath
        }, answers)
        
        if (app && app.id) {
          const candidateId = app.candidateId
          const applicationId = app.id
          
          // 4. Crear registro del CV en la tabla documents
          if (cvUploadedData) {
            await DocumentService.createRecord({
              ...cvUploadedData,
              candidateId,
              applicationId,
              type: 'curriculum'
            })
          }
          
          // 5. Crear registros de archivos opcionales en la tabla documents
          for (const [type, uploaded] of Object.entries(uploadedOptionalFiles)) {
            await DocumentService.createRecord({
              ...uploaded,
              candidateId,
              applicationId,
              type
            })
          }
          
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
