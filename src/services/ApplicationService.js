import StorageService from './StorageService'

export default {
  async getByVacancy (vacancyId) {
    return StorageService.getByIndex('applications', 'vacancyId', vacancyId)
  },

  async getAll () {
    return StorageService.getAll('applications')
  },

  async create (data) {
    return StorageService.create('applications', {
      ...data,
      createdAt: new Date().toISOString()
    })
  }
}
