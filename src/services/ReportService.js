import { getSupabaseClient } from './supabase'

export default {
  /**
   * Genera el reporte seleccionado aplicando los filtros avanzados en el servidor.
   * @param {string} reportType Tipo de reporte a generar
   * @param {object} filters Filtros avanzados aplicados
   */
  async generateReport (reportType, filters = {}) {
    const client = getSupabaseClient()
    const { data, error } = await client.functions.invoke('reports', {
      body: { reportType, filters }
    })

    if (error) {
      console.error('Error al invocar Edge Function de reportes:', error)
      throw new Error(error.message || 'No fue posible generar el reporte en este momento.')
    }

    if (data?.error) {
      throw new Error(data.error)
    }

    // Defensive check: if the response is wrapped in an outer { data: { kpis, ... } }
    if (data && typeof data === 'object' && 'data' in data && data.data && typeof data.data === 'object') {
      const inner = data.data
      if ('kpis' in inner || 'tableData' in inner || 'chartData' in inner) {
        return inner
      }
    }

    return data
  }
}
