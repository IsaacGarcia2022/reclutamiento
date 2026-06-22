import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const cors = { 'Access-Control-Allow-Origin': Deno.env.get('APP_URL') || 'http://localhost:5173', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return response({ error: 'Sesión requerida.' }, 401)
    const db = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '', { auth: { persistSession: false } })
    const { data: { user }, error: authError } = await db.auth.getUser(token)
    if (authError || !user) return response({ error: 'Sesión inválida.' }, 401)
    const { data: profile, error: profileError } = await db.from('profiles').select('estado, role_id').eq('id', user.id).single()
    const { data: role, error: roleError } = profile ? await db.from('roles').select('code').eq('id', profile.role_id).single() : { data: null, error: null }
    if (profileError || roleError || !profile || !role || profile.estado !== 'activo' || !['administrador', 'recursos_humanos', 'consulta'].includes(role.code)) return response({ error: 'Sin permiso para consultar el dashboard.' }, 403)

    const today = new Date().toISOString().slice(0, 10)
    const inSevenDays = new Date(Date.now() + 604800000).toISOString().slice(0, 10)
    const monthStart = `${today.slice(0, 7)}-01`
    const [vacancyQuery, appQuery, candidateQuery, catalogQuery, newQuery, monthQuery, closingQuery] = await Promise.all([
      db.from('vacancies').select('id, estado, fecha_cierre, titulo, codigo, area_profesional_id').order('created_at', { ascending: false }),
      db.from('applications').select('id, candidato_id, vacante_id, created_at').order('created_at', { ascending: false }),
      db.from('candidates').select('id, nombres, apellidos', { count: 'exact' }),
      db.from('catalog_items').select('id, nombre').eq('categoria', 'area_profesional'),
      db.from('applications').select('id', { count: 'exact', head: true }).eq('estado_administrativo', 'nueva'),
      db.from('applications').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
      db.from('vacancies').select('id, titulo, codigo, fecha_cierre').eq('estado', 'publicada').gte('fecha_cierre', today).lte('fecha_cierre', inSevenDays).order('fecha_cierre')
    ])
    const failed = [vacancyQuery, appQuery, candidateQuery, catalogQuery, newQuery, monthQuery, closingQuery].find(query => query.error)
    if (failed?.error) throw new Error(failed.error.message)

    const vacancies = vacancyQuery.data || [], apps = appQuery.data || [], candidates = candidateQuery.data || []
    const applicationsByVacancy: Record<string, number> = {}
    apps.forEach(app => { applicationsByVacancy[app.vacante_id] = (applicationsByVacancy[app.vacante_id] || 0) + 1 })
    const vacancyTitle = Object.fromEntries(vacancies.map(vacancy => [vacancy.id, vacancy.titulo]))
    const candidateName = Object.fromEntries(candidates.map(candidate => [candidate.id, `${candidate.nombres} ${candidate.apellidos}`]))
    const areaName = Object.fromEntries((catalogQuery.data || []).map(area => [area.id, area.nombre]))
    const applicationsByArea: Record<string, number> = {}
    vacancies.forEach(vacancy => { const area = areaName[vacancy.area_profesional_id] || 'Sin área'; applicationsByArea[area] = (applicationsByArea[area] || 0) + (applicationsByVacancy[vacancy.id] || 0) })
    const byMonth = []
    for (let offset = 5; offset >= 0; offset--) { const date = new Date(); date.setMonth(date.getMonth() - offset); const key = date.toISOString().slice(0, 7); byMonth.push({ mes: key, total: apps.filter(app => app.created_at?.startsWith(key)).length }) }
    const topVacancies = vacancies.map(vacancy => ({ ...vacancy, cantidad_postulaciones: applicationsByVacancy[vacancy.id] || 0 })).sort((a, b) => b.cantidad_postulaciones - a.cantidad_postulaciones).slice(0, 6)

    return response({ data: { indicadores: { vacantes_activas: vacancies.filter(v => v.estado === 'publicada').length, vacantes_borrador: vacancies.filter(v => v.estado === 'borrador').length, vacantes_proximas_a_cerrar: closingQuery.data?.length || 0, postulaciones_nuevas: newQuery.count || 0, postulaciones_del_mes: monthQuery.count || 0, candidatos_registrados: candidateQuery.count || 0 }, porMes: byMonth, porArea: Object.entries(applicationsByArea).map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total), ultimas: apps.slice(0, 6).map(app => ({ id: app.id, candidate: { nombres: candidateName[app.candidato_id] || 'Candidato', apellidos: '' }, vacancy: { titulo: vacancyTitle[app.vacante_id] || 'Vacante' } })), proximas: closingQuery.data || [], mayorPostulaciones: topVacancies } })
  } catch (error) { return response({ error: error instanceof Error ? error.message : String(error) }, 400) }
})
