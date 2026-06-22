-- Módulo de Documentos (2.9 Documentos)

-- 1. Crear la tabla de documentos
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid not null references public.candidates(id) on delete cascade,
  postulacion_id uuid references public.applications(id) on delete cascade,
  tipo_documento text not null check (tipo_documento in ('curriculum', 'carta_presentacion', 'certificado', 'portafolio', 'otro')),
  nombre_original text not null,
  nombre_interno text not null,
  ruta text not null,
  mime_type text not null,
  tamanio integer not null,
  fecha_carga timestamptz not null default now(),
  estado text not null default 'activo' check (estado in ('activo', 'eliminado'))
);

-- 2. Crear índices para rendimiento
create index if not exists documents_candidato_id_idx on public.documents(candidato_id);
create index if not exists documents_postulacion_id_idx on public.documents(postulacion_id);
create index if not exists documents_estado_idx on public.documents(estado);

-- 3. Habilitar RLS en public.documents
alter table public.documents enable row level security;

-- 4. Definir políticas RLS para la tabla public.documents
-- Lectura: Solo personal interno autorizado
drop policy if exists "Authorized staff can read documents" on public.documents;
create policy "Authorized staff can read documents"
  on public.documents for select to authenticated
  using (public.can_view_applications() and estado = 'activo');

-- Inserción: Permitir públicamente para que candidatos anónimos puedan subir archivos al postularse
drop policy if exists "Anyone can insert documents" on public.documents;
create policy "Anyone can insert documents"
  on public.documents for insert
  with check (true);

-- Modificación/Eliminación: Solo administradores o personal con permisos de edición
drop policy if exists "Authorized staff can modify documents" on public.documents;
create policy "Authorized staff can modify documents"
  on public.documents for all to authenticated
  using (public.can_modify_applications())
  with check (public.can_modify_applications());

-- 5. Configurar almacenamiento privado para los documentos
insert into storage.buckets (id, name, public)
values ('candidate-documents', 'candidate-documents', false)
on conflict (id) do update set public = false;

-- 6. Políticas RLS de almacenamiento para 'candidate-documents'
drop policy if exists "Anyone can upload documents" on storage.objects;
create policy "Anyone can upload documents"
  on storage.objects for insert
  with check (bucket_id = 'candidate-documents');

drop policy if exists "Authorized staff can view documents" on storage.objects;
create policy "Authorized staff can view documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'candidate-documents' and public.can_view_applications());

drop policy if exists "Authorized staff can update documents" on storage.objects;
create policy "Authorized staff can update documents"
  on storage.objects for update to authenticated
  using (bucket_id = 'candidate-documents' and public.can_modify_applications())
  with check (bucket_id = 'candidate-documents' and public.can_modify_applications());

drop policy if exists "Authorized staff can delete documents" on storage.objects;
create policy "Authorized staff can delete documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'candidate-documents' and public.can_modify_applications());

-- 7. Función RPC para descarga/visualización auditada de documentos
create or replace function public.log_document_download(p_document_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_document_record record;
  v_profile_record record;
begin
  -- Verificar que el usuario esté autenticado
  v_actor_id := auth.uid();
  if v_actor_id is null then
    raise exception 'No autorizado: usuario no autenticado';
  end if;

  -- Verificar que el usuario tenga permisos de visualización de postulaciones
  if not public.can_view_applications() then
    raise exception 'No autorizado: permisos insuficientes';
  end if;

  -- Obtener metadatos del documento
  select * into v_document_record from public.documents where id = p_document_id and estado = 'activo';
  if not found then
    raise exception 'Documento no encontrado o inactivo';
  end if;

  -- Obtener correo del usuario que descarga
  select email into v_profile_record from public.profiles where id = v_actor_id;

  -- Insertar registro en el log de auditoría
  insert into public.audit_log (actor_id, event_type, entity_type, entity_id, metadata)
  values (
    v_actor_id,
    'descarga_documento',
    'document',
    p_document_id,
    jsonb_build_object(
      'nombre_original', v_document_record.nombre_original,
      'nombre_interno', v_document_record.nombre_interno,
      'tipo_documento', v_document_record.tipo_documento,
      'ruta', v_document_record.ruta,
      'usuario_correo', coalesce(v_profile_record.email, 'Desconocido')
    )
  );

  return jsonb_build_object(
    'success', true,
    'ruta', v_document_record.ruta,
    'nombre_original', v_document_record.nombre_original
  );
end;
$$;

-- 8. Migrar currículums de postulaciones existentes
insert into public.documents (candidato_id, postulacion_id, tipo_documento, nombre_original, nombre_interno, ruta, mime_type, tamanio, fecha_carga, estado)
select 
  candidato_id, 
  id as postulacion_id, 
  'curriculum' as tipo_documento, 
  coalesce(nullif(split_part(curriculum_url, '/', 2), ''), curriculum_url) as nombre_original,
  coalesce(nullif(split_part(curriculum_url, '/', 2), ''), curriculum_url) as nombre_interno,
  case 
    when curriculum_url like 'candidate-cvs/%' then curriculum_url 
    else 'candidate-cvs/' || curriculum_url 
  end as ruta,
  'application/pdf' as mime_type,
  0 as tamanio,
  created_at as fecha_carga,
  'activo' as estado
from public.applications
where curriculum_url is not null and curriculum_url <> '' and candidato_id is not null
on conflict do nothing;
