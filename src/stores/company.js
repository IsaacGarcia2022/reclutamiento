import { defineStore } from 'pinia'
import CompanyService from '../services/CompanyService'

export const useCompanyStore = defineStore('company', {
  state: () => ({ settings: null, loading: false, error: null }),
  actions: {
    async fetch () {
      this.loading = true
      try { this.settings = await CompanyService.get(); this.error = null; return this.settings } catch (e) { this.error = e.message; return null } finally { this.loading = false }
    },
    async save (payload, logoFile = null) {
      this.loading = true
      try {
        const logoUrl = logoFile ? await CompanyService.uploadLogo(logoFile) : payload.logoUrl
        this.settings = await CompanyService.update({ ...payload, logoUrl })
        this.error = null
        return this.settings
      } catch (e) { this.error = e.message; return null } finally { this.loading = false }
    }
  }
})
