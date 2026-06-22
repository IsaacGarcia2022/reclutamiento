// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'


const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') || 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const response = (body: unknown, status = 200) => 
  new Response(JSON.stringify(body), { 
    status, 
    headers: { ...cors, 'Content-Type': 'application/json' } 
  })

serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    // 1. Validar autenticación
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return response({ error: 'Sesión requerida.' }, 401)

    const db = createClient(
      Deno.env.get('SUPABASE_URL') || '', 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '', 
      { auth: { persistSession: false } }
    )

    const { data: { user }, error: authError } = await db.auth.getUser(token)
    if (authError || !user) return response({ error: 'Sesión inválida.' }, 401)

    // 2. Validar rol autorizado (RRHH, Administrador o Consulta)
    const { data: profile } = await db.from('profiles').select('estado, role_id').eq('id', user.id).single()
    const { data: role } = profile ? await db.from('roles').select('code').eq('id', profile.role_id).single() : { data: null }
    
    if (!profile || !role || profile.estado !== 'activo' || !['administrador', 'recursos_humanos', 'consulta'].includes(role.code)) {
      return response({ error: 'Sin permiso para consultar reportes.' }, 403)
    }

    // 3. Obtener cuerpo de petición
    const body = await request.json().catch(() => ({}))
    const reportType = body.reportType || 'vacantes_periodo'
    const filters = body.filters || {}

    // 4. Cargar catálogos y tablas core necesarios para consolidación
    const [vacancyQuery, appQuery, candidateQuery, catalogQuery, profileQuery] = await Promise.all([
      db.from('vacancies').select('*').order('created_at', { ascending: false }),
      db.from('applications').select('*').order('created_at', { ascending: false }),
      db.from('candidates').select('*').order('created_at', { ascending: false }),
      db.from('catalog_items').select('*'),
      db.from('profiles').select('id, full_name')
    ])

    const failed = [vacancyQuery, appQuery, candidateQuery, catalogQuery, profileQuery].find(q => q.error)
    if (failed?.error) throw new Error(failed.error.message)

    const vacancies = vacancyQuery.data || []
    const apps = appQuery.data || []
    const candidates = candidateQuery.data || []
    const catalogs = catalogQuery.data || []
    const profiles = profileQuery.data || []

    // Mapas auxiliares para nombres amigables
    const catalogMap = Object.fromEntries(catalogs.map(c => [c.id, c.nombre]))
    const profileMap = Object.fromEntries(profiles.map(p => [p.id, p.full_name]))
    const vacancyMap = Object.fromEntries(vacancies.map(v => [v.id, v]))
    const appsCountMap: Record<string, number> = {}
    apps.forEach(a => { appsCountMap[a.vacante_id] = (appsCountMap[a.vacante_id] || 0) + 1 })

    // 5. Aplicar filtros dinámicos en memoria
    let filteredVacancies = vacancies
    let filteredApps = apps
    let filteredCandidates = candidates

    // Rango de fechas (fecha_desde / fecha_hasta)
    if (filters.fecha_desde) {
      filteredVacancies = filteredVacancies.filter(v => v.created_at >= filters.fecha_desde)
      filteredApps = filteredApps.filter(a => a.created_at >= filters.fecha_desde)
      filteredCandidates = filteredCandidates.filter(c => c.created_at >= filters.fecha_desde)
    }
    if (filters.fecha_hasta) {
      // Agregar 23:59:59 para abarcar el día completo si viene en YYYY-MM-DD
      const hastaLimit = filters.fecha_hasta.includes('T') ? filters.fecha_hasta : `${filters.fecha_hasta}T23:59:59`
      filteredVacancies = filteredVacancies.filter(v => v.created_at <= hastaLimit)
      filteredApps = filteredApps.filter(a => a.created_at <= hastaLimit)
      filteredCandidates = filteredCandidates.filter(c => c.created_at <= hastaLimit)
    }

    // Filtro por Vacante
    if (filters.vacante_id) {
      filteredVacancies = filteredVacancies.filter(v => v.id === filters.vacante_id)
      filteredApps = filteredApps.filter(a => a.vacante_id === filters.vacante_id)
    }

    // Filtro por Área
    if (filters.area_id) {
      filteredVacancies = filteredVacancies.filter(v => v.area_profesional_id === filters.area_id)
      filteredApps = filteredApps.filter(a => vacancyMap[a.vacante_id]?.area_profesional_id === filters.area_id)
      filteredCandidates = filteredCandidates.filter(c => c.profesion_oficio?.toLowerCase().includes((catalogMap[filters.area_id] || '').toLowerCase()))
    }

    // Filtro por Ubicación
    if (filters.ubicacion_id) {
      filteredVacancies = filteredVacancies.filter(v => v.ubicacion_id === filters.ubicacion_id)
      filteredApps = filteredApps.filter(a => vacancyMap[a.vacante_id]?.ubicacion_id === filters.ubicacion_id)
      filteredCandidates = filteredCandidates.filter(c => c.ubicacion_id === filters.ubicacion_id)
    }

    // Filtro por Modalidad
    if (filters.modalidad_id) {
      filteredVacancies = filteredVacancies.filter(v => v.modalidad_id === filters.modalidad_id)
      filteredApps = filteredApps.filter(a => vacancyMap[a.vacante_id]?.modalidad_id === filters.modalidad_id)
    }

    // Filtro por Estado Vacante
    if (filters.estado_vacante) {
      filteredVacancies = filteredVacancies.filter(v => v.estado === filters.estado_vacante)
      filteredApps = filteredApps.filter(a => vacancyMap[a.vacante_id]?.estado === filters.estado_vacante)
    }

    // Filtro por Estado Postulación
    if (filters.estado_postulacion) {
      filteredApps = filteredApps.filter(a => a.estado_administrativo === filters.estado_postulacion)
    }

    // Filtro por Fuente Reclutamiento
    if (filters.fuente_reclutamiento_id) {
      filteredApps = filteredApps.filter(a => a.fuente_reclutamiento_id === filters.fuente_reclutamiento_id)
    }

    // 6. Procesar según Tipo de Reporte
    let kpis: Array<{ label: string; value: string | number }> = []
    let chartData: Array<{ label: string; value: number }> = []
    let tableData: { columns: string[]; rows: Record<string, unknown>[] } = { columns: [], rows: [] }

    switch (reportType) {
      case 'vacantes_periodo': {
        kpis = [
          { label: 'Total vacantes', value: filteredVacancies.length },
          { label: 'Vacantes publicadas', value: filteredVacancies.filter(v => v.estado === 'publicada').length },
          { label: 'Vacantes cerradas', value: filteredVacancies.filter(v => v.estado === 'cerrada').length }
        ]
        
        // Agrupar por mes de creación
        const vacanciesByMonth: Record<string, number> = {}
        filteredVacancies.forEach(v => {
          const month = v.created_at?.slice(0, 7) || 'N/A'
          vacanciesByMonth[month] = (vacanciesByMonth[month] || 0) + 1
        })
        chartData = Object.entries(vacanciesByMonth).map(([label, value]) => ({ label, value })).sort().slice(-6)

        tableData = {
          columns: ['Código', 'Título', 'Fecha Creación', 'Estado', 'Nro Plazas', 'Postulaciones', 'Responsable'],
          rows: filteredVacancies.map(v => ({
            Código: v.codigo,
            Título: v.titulo,
            'Fecha Creación': new Date(v.created_at).toLocaleDateString('es-ES'),
            Estado: v.estado.toUpperCase(),
            'Nro Plazas': v.numero_plazas,
            Postulaciones: appsCountMap[v.id] || 0,
            Responsable: profileMap[v.responsable_id] || 'Desconocido'
          }))
        }
        break
      }

      case 'vacantes_estado': {
        const counts: Record<string, number> = { borrador: 0, publicada: 0, pausada: 0, cerrada: 0, archivada: 0 }
        filteredVacancies.forEach(v => { if (counts[v.estado] !== undefined) counts[v.estado]++ })

        kpis = [
          { label: 'Total vacantes', value: filteredVacancies.length },
          { label: 'Publicadas', value: counts.publicada },
          { label: 'Cerradas', value: counts.cerrada }
        ]

        chartData = Object.entries(counts).map(([label, value]) => ({ label: label.toUpperCase(), value }))

        tableData = {
          columns: ['Estado', 'Cantidad de Vacantes', 'Porcentaje'],
          rows: Object.entries(counts).map(([estado, total]) => ({
            Estado: estado.toUpperCase(),
            'Cantidad de Vacantes': total,
            Porcentaje: filteredVacancies.length > 0 ? `${((total / filteredVacancies.length) * 100).toFixed(1)}%` : '0%'
          }))
        }
        break
      }

      case 'postulaciones_vacante': {
        const vacancyApps: Record<string, number> = {}
        apps.forEach(a => {
          const title = vacancyMap[a.vacante_id]?.titulo || 'Vacante Eliminada'
          vacancyApps[title] = (vacancyApps[title] || 0) + 1
        })

        kpis = [
          { label: 'Total postulaciones', value: filteredApps.length },
          { label: 'Vacante más postulada', value: Object.entries(vacancyApps).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Ninguna' },
          { label: 'Promedio por vacante', value: vacancies.length > 0 ? (filteredApps.length / vacancies.length).toFixed(1) : 0 }
        ]

        const topVacancyApps = Object.entries(vacancyApps).sort((a,b)=>b[1]-a[1]).slice(0, 8)
        chartData = topVacancyApps.map(([label, value]) => ({ label, value }))

        tableData = {
          columns: ['Código', 'Título Vacante', 'Estado Vacante', 'Total Postulaciones', 'Nuevas', 'Revisadas'],
          rows: filteredVacancies.map(v => {
            const vApps = filteredApps.filter(a => a.vacante_id === v.id)
            return {
              Código: v.codigo,
              'Título Vacante': v.titulo,
              'Estado Vacante': v.estado.toUpperCase(),
              'Total Postulaciones': vApps.length,
              Nuevas: vApps.filter(a => a.estado_administrativo === 'nueva').length,
              Revisadas: vApps.filter(a => a.estado_administrativo === 'revisada').length
            }
          }).sort((a, b) => (b['Total Postulaciones'] as number) - (a['Total Postulaciones'] as number))
        }
        break
      }

      case 'postulaciones_periodo': {
        const appsByMonth: Record<string, number> = {}
        filteredApps.forEach(a => {
          const month = a.created_at?.slice(0, 7) || 'N/A'
          appsByMonth[month] = (appsByMonth[month] || 0) + 1
        })

        kpis = [
          { label: 'Total postulaciones', value: filteredApps.length },
          { label: 'Mes con más postulaciones', value: Object.entries(appsByMonth).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A' },
          { label: 'Promedio mensual', value: Object.keys(appsByMonth).length > 0 ? (filteredApps.length / Object.keys(appsByMonth).length).toFixed(1) : filteredApps.length }
        ]

        chartData = Object.entries(appsByMonth).map(([label, value]) => ({ label, value })).sort().slice(-12)

        tableData = {
          columns: ['Período (Mes)', 'Total Postulaciones', 'Porcentaje'],
          rows: Object.entries(appsByMonth).map(([mes, total]) => ({
            'Período (Mes)': mes,
            'Total Postulaciones': total,
            Porcentaje: filteredApps.length > 0 ? `${((total / filteredApps.length) * 100).toFixed(1)}%` : '0%'
          })).sort((a,b) => b['Período (Mes)'].localeCompare(a['Período (Mes)']))
        }
        break
      }

      case 'postulaciones_area': {
        const appsByArea: Record<string, number> = {}
        filteredApps.forEach(a => {
          const v = vacancyMap[a.vacante_id]
          const area = v ? (catalogMap[v.area_profesional_id] || 'Sin área') : 'Sin área'
          appsByArea[area] = (appsByArea[area] || 0) + 1
        })

        kpis = [
          { label: 'Total postulaciones', value: filteredApps.length },
          { label: 'Área principal', value: Object.entries(appsByArea).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Ninguna' }
        ]

        chartData = Object.entries(appsByArea).map(([label, value]) => ({ label, value })).sort((a,b)=>b.value-a.value)

        tableData = {
          columns: ['Área Profesional', 'Total Postulaciones', 'Porcentaje'],
          rows: Object.entries(appsByArea).map(([area, total]) => ({
            'Área Profesional': area,
            'Total Postulaciones': total,
            Porcentaje: filteredApps.length > 0 ? `${((total / filteredApps.length) * 100).toFixed(1)}%` : '0%'
          })).sort((a, b) => (b['Total Postulaciones'] as number) - (a['Total Postulaciones'] as number))
        }
        break
      }

      case 'postulaciones_ubicacion': {
        const appsByLoc: Record<string, number> = {}
        filteredApps.forEach(a => {
          const loc = a.ubicacion || 'No especificada'
          appsByLoc[loc] = (appsByLoc[loc] || 0) + 1
        })

        kpis = [
          { label: 'Total postulaciones', value: filteredApps.length },
          { label: 'Ubicación principal', value: Object.entries(appsByLoc).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Ninguna' }
        ]

        chartData = Object.entries(appsByLoc).map(([label, value]) => ({ label, value })).sort((a,b)=>b.value-a.value).slice(0, 10)

        tableData = {
          columns: ['Ubicación Residencia', 'Total Postulaciones', 'Porcentaje'],
          rows: Object.entries(appsByLoc).map(([loc, total]) => ({
            'Ubicación Residencia': loc,
            'Total Postulaciones': total,
            Porcentaje: filteredApps.length > 0 ? `${((total / filteredApps.length) * 100).toFixed(1)}%` : '0%'
          })).sort((a, b) => (b['Total Postulaciones'] as number) - (a['Total Postulaciones'] as number))
        }
        break
      }

      case 'postulaciones_nivel_academico': {
        const appsByLevel: Record<string, number> = {}
        filteredApps.forEach(a => {
          const lvl = catalogMap[a.nivel_academico_id] || 'Desconocido'
          appsByLevel[lvl] = (appsByLevel[lvl] || 0) + 1
        })

        kpis = [
          { label: 'Total postulaciones', value: filteredApps.length },
          { label: 'Nivel predominante', value: Object.entries(appsByLevel).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Ninguno' }
        ]

        chartData = Object.entries(appsByLevel).map(([label, value]) => ({ label, value })).sort((a,b)=>b.value-a.value)

        tableData = {
          columns: ['Nivel Académico', 'Total Postulaciones', 'Porcentaje'],
          rows: Object.entries(appsByLevel).map(([lvl, total]) => ({
            'Nivel Académico': lvl,
            'Total Postulaciones': total,
            Porcentaje: filteredApps.length > 0 ? `${((total / filteredApps.length) * 100).toFixed(1)}%` : '0%'
          })).sort((a, b) => (b['Total Postulaciones'] as number) - (a['Total Postulaciones'] as number))
        }
        break
      }

      case 'postulaciones_modalidad': {
        const appsByMod: Record<string, number> = {}
        filteredApps.forEach(a => {
          const v = vacancyMap[a.vacante_id]
          const mod = v ? (catalogMap[v.modalidad_id] || 'No especificada') : 'No especificada'
          appsByMod[mod] = (appsByMod[mod] || 0) + 1
        })

        kpis = [
          { label: 'Total postulaciones', value: filteredApps.length },
          { label: 'Modalidad principal', value: Object.entries(appsByMod).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Ninguna' }
        ]

        chartData = Object.entries(appsByMod).map(([label, value]) => ({ label, value })).sort((a,b)=>b.value-a.value)

        tableData = {
          columns: ['Modalidad de Vacante', 'Total Postulaciones', 'Porcentaje'],
          rows: Object.entries(appsByMod).map(([mod, total]) => ({
            'Modalidad de Vacante': mod,
            'Total Postulaciones': total,
            Porcentaje: filteredApps.length > 0 ? `${((total / filteredApps.length) * 100).toFixed(1)}%` : '0%'
          })).sort((a, b) => (b['Total Postulaciones'] as number) - (a['Total Postulaciones'] as number))
        }
        break
      }

      case 'postulaciones_fuente': {
        const appsBySource: Record<string, number> = {}
        filteredApps.forEach(a => {
          const src = catalogMap[a.fuente_reclutamiento_id] || 'Sitio Web Directo'
          appsBySource[src] = (appsBySource[src] || 0) + 1
        })

        kpis = [
          { label: 'Total postulaciones', value: filteredApps.length },
          { label: 'Fuente principal', value: Object.entries(appsBySource).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Sitio Web Directo' }
        ]

        chartData = Object.entries(appsBySource).map(([label, value]) => ({ label, value })).sort((a,b)=>b.value-a.value)

        tableData = {
          columns: ['Fuente de Reclutamiento', 'Total Postulaciones', 'Porcentaje'],
          rows: Object.entries(appsBySource).map(([src, total]) => ({
            'Fuente de Reclutamiento': src,
            'Total Postulaciones': total,
            Porcentaje: filteredApps.length > 0 ? `${((total / filteredApps.length) * 100).toFixed(1)}%` : '0%'
          })).sort((a, b) => (b['Total Postulaciones'] as number) - (a['Total Postulaciones'] as number))
        }
        break
      }

      case 'banco_candidatos': {
        // Filtrar candidatos según criterios avanzados
        const candAppsCount: Record<string, number> = {}
        apps.forEach(a => { if (a.candidato_id) candAppsCount[a.candidato_id] = (candAppsCount[a.candidato_id] || 0) + 1 })

        kpis = [
          { label: 'Total candidatos', value: filteredCandidates.length },
          { label: 'Candidatos activos', value: filteredCandidates.filter(c => c.estado === 'activo').length },
          { label: 'Candidatos archivados', value: filteredCandidates.filter(c => c.estado === 'archivado').length }
        ]

        // Agrupar por profesión/oficio más común
        const commonProf: Record<string, number> = {}
        filteredCandidates.forEach(c => {
          const prof = c.profesion_oficio || 'Sin definir'
          commonProf[prof] = (commonProf[prof] || 0) + 1
        })
        chartData = Object.entries(commonProf).sort((a,b)=>b[1]-a[1]).slice(0, 8).map(([label, value]) => ({ label, value }))

        tableData = {
          columns: ['Nombre Completo', 'Correo', 'Teléfono', 'Profesión/Oficio', 'Años Experiencia', 'Postulaciones', 'Estado'],
          rows: filteredCandidates.map(c => ({
            'Nombre Completo': `${c.nombres} ${c.apellidos}`.trim(),
            Correo: c.correo,
            Teléfono: c.telefono,
            'Profesión/Oficio': c.profesion_oficio,
            'Años Experiencia': c.anios_experiencia ? Number(c.anios_experiencia) : 0,
            Postulaciones: candAppsCount[c.id] || 0,
            Estado: c.estado.toUpperCase()
          }))
        }
        break
      }

      case 'vacantes_mas_postulaciones': {
        const topVacancies = vacancies.map(v => ({
          ...v,
          count: appsCountMap[v.id] || 0
        })).sort((a, b) => b.count - a.count).slice(0, 10)

        kpis = [
          { label: 'Vacante más popular', value: topVacancies[0]?.titulo || 'Ninguna' },
          { label: 'Máx postulaciones', value: topVacancies[0]?.count || 0 },
          { label: 'Total postulaciones', value: apps.length }
        ]

        chartData = topVacancies.map(v => ({ label: v.codigo, value: v.count }))

        tableData = {
          columns: ['Código', 'Título Vacante', 'Área Profesional', 'Responsable', 'Total Postulaciones', 'Estado'],
          rows: topVacancies.map(v => ({
            Código: v.codigo,
            'Título Vacante': v.titulo,
            'Área Profesional': catalogMap[v.area_profesional_id] || 'Sin área',
            Responsable: profileMap[v.responsable_id] || 'Desconocido',
            'Total Postulaciones': v.count,
            Estado: v.estado.toUpperCase()
          }))
        }
        break
      }

      case 'vacantes_sin_postulaciones': {
        const noAppsVacancies = filteredVacancies.filter(v => (appsCountMap[v.id] || 0) === 0)

        kpis = [
          { label: 'Vacantes sin candidatos', value: noAppsVacancies.length },
          { label: 'Porcentaje del total', value: filteredVacancies.length > 0 ? `${((noAppsVacancies.length / filteredVacancies.length) * 100).toFixed(1)}%` : '0%' },
          { label: 'Total vacantes', value: filteredVacancies.length }
        ]

        // Agrupar por áreas de vacantes sin postulaciones
        const noAppsByArea: Record<string, number> = {}
        noAppsVacancies.forEach(v => {
          const area = catalogMap[v.area_profesional_id] || 'Sin área'
          noAppsByArea[area] = (noAppsByArea[area] || 0) + 1
        })
        chartData = Object.entries(noAppsByArea).map(([label, value]) => ({ label, value })).sort((a,b)=>b.value-a.value)

        tableData = {
          columns: ['Código', 'Título Vacante', 'Área Profesional', 'Fecha Publicación', 'Estado', 'Responsable'],
          rows: noAppsVacancies.map(v => ({
            Código: v.codigo,
            'Título Vacante': v.titulo,
            'Área Profesional': catalogMap[v.area_profesional_id] || 'Sin área',
            'Fecha Publicación': v.fecha_publicacion ? new Date(v.fecha_publicacion).toLocaleDateString('es-ES') : 'No publicada',
            Estado: v.estado.toUpperCase(),
            Responsable: profileMap[v.responsable_id] || 'Desconocido'
          }))
        }
        break
      }

      default:
        throw new Error('Tipo de reporte no soportado')
    }

    return response({ data: { kpis, chartData, tableData } })

  } catch (error) {
    return response({ error: error instanceof Error ? error.message : String(error) }, 400)
  }
})
