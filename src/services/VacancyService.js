import { getSupabaseClient } from './supabase'

const select = '*, departamento:departamento_empresa_id(nombre), area:area_profesional_id(nombre), ubicacion:ubicacion_id(nombre), modalidad:modalidad_id(nombre), contrato:tipo_contrato_id(nombre), jornada:jornada_id(nombre), nivel:nivel_academico_id(nombre)'
const map = (v) => v && ({ ...v, title: v.titulo, description: v.descripcion, requisitos: v.requisitos, location: v.ubicacion?.nombre, type: v.tipo_contrato_id ? `${v.modalidad?.nombre || ''} · ${v.contrato?.nombre || ''}` : v.modalidad?.nombre, status: v.estado, createdAt: v.created_at, company: 'Empresa', salary: v.mostrar_salario && (v.salario_minimo || v.salario_maximo) ? `$${v.salario_minimo || ''}${v.salario_maximo ? ` - $${v.salario_maximo}` : ''}` : null })
async function admin (action, payload = {}) { const { data, error } = await getSupabaseClient().functions.invoke('vacancies-admin', { body: { action, payload } }); if (error) throw new Error(error.message); if (data?.error) throw new Error(data.error); return data.data }

export default {
  async getPublic () { const { data, error } = await getSupabaseClient().from('vacancies').select(select).order('fecha_publicacion', { ascending: false }); if (error) throw error; return data.map(map) },
  async getById (id) { const { data, error } = await getSupabaseClient().from('vacancies').select(select).eq('id', id).maybeSingle(); if (error) throw error; return map(data) },
  async listAdmin () { return (await admin('list')).map(map) },
  async getAdmin (id) { return map(await admin('get', { id })) },
  create: (payload) => admin('create', payload), update: (payload) => admin('update', payload), transition: (id, estado) => admin('transition', { id, estado }), duplicate: (id) => admin('duplicate', { id }), delete: (id) => admin('delete', { id }),
  async catalogs () { const { data, error } = await getSupabaseClient().from('catalog_items').select('*').order('nombre'); if (error) throw error; return data },
  async uploadImage (file) { if (!file) return null; if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) throw new Error('La imagen debe ser menor a 2 MB.'); const ext=file.name.split('.').pop() || 'jpg'; const path=`vacancies/${crypto.randomUUID()}.${ext}`; const client=getSupabaseClient(); const {error}=await client.storage.from('vacancy-assets').upload(path,file,{contentType:file.type}); if(error) throw error; return client.storage.from('vacancy-assets').getPublicUrl(path).data.publicUrl }
}
