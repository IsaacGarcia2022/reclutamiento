import StorageService from './StorageService'

export default {
  async getAll () {
    return StorageService.getAll('vacancies')
  },

  async getById (id) {
    return StorageService.getById('vacancies', id)
  },

  async create (data) {
    return StorageService.create('vacancies', {
      ...data,
      status: 'active',
      createdAt: new Date().toISOString()
    })
  },

  async update (id, data) {
    return StorageService.update('vacancies', id, data)
  },

  async delete (id) {
    return StorageService.delete('vacancies', id)
  },

  async toggleStatus (id) {
    const vacancy = await StorageService.getById('vacancies', id)
    if (!vacancy) throw new Error('Vacante no encontrada')
    return StorageService.update('vacancies', id, {
      status: vacancy.status === 'active' ? 'inactive' : 'active'
    })
  }
}
