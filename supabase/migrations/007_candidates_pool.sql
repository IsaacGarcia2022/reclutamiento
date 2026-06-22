-- Módulo de banco de candidatos: ejecutar después de las migraciones anteriores.

-- 1. Crear la tabla de candidatos (candidates)
create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  nombres text not null,
  apellidos text not null,
  correo text not null unique,
  telefono text not null,
  documento_identidad text,
  ubicacion_id uuid references public.catalog_items(id) on delete set null,
  ubicacion_texto text, -- para guardar texto libre si no coincide con catálogos
  nivel_academico_id uuid references public.catalog_items(id) on delete set null,
  profesion_oficio text not null,
  anios_experiencia numeric(4,1),
  ultimo_puesto text,
  disponibilidad text,
  expectativa_salarial numeric(12,2),
  linkedin_url text,
  portafolio_url text,
  estado text not null default 'activo' check (estado in ('activo', 'archivado')),
  etiquetas text[] not null default '{}'::text[], -- etiquetas organizativas (ej. {"Senior", "Node.js"})
  observaciones_internas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices de rendimiento
create index if not exists candidates_correo_idx on public.candidates(correo);
create index if not exists candidates_estado_idx on public.candidates(estado);
create index if not exists candidates_etiquetas_idx on public.candidates using gin(etiquetas);

-- 2. Modificar la relación en 'applications' para enlazarla con 'candidates' en lugar de 'profiles'
alter table public.applications drop constraint if exists applications_candidato_id_fkey;
alter table public.applications add constraint applications_candidato_id_fkey 
  foreign key (candidato_id) references public.candidates(id) on delete cascade;

-- 3. Trigger y función para asociar postulaciones a candidatos por correo de forma automática (o crear perfil de candidato nuevo)
create or replace function public.process_application_candidate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate_id uuid;
begin
  -- Buscar si ya existe un candidato con ese correo
  select id into v_candidate_id
  from public.candidates
  where correo = new.correo;
  
  -- Si no existe, crear el perfil de candidato único automáticamente
  if v_candidate_id is null then
    insert into public.candidates (
      nombres, apellidos, correo, telefono, documento_identidad, 
      ubicacion_texto, nivel_academico_id, profesion_oficio, 
      anios_experiencia, ultimo_puesto, disponibilidad, 
      expectativa_salarial, linkedin_url, portafolio_url, estado
    )
    values (
      new.nombres, new.apellidos, new.correo, new.telefono, new.documento_identidad,
      new.ubicacion, new.nivel_academico_id, new.profesion_oficio,
      new.anios_experiencia, new.ultimo_puesto, new.disponibilidad,
      new.expectativa_salarial, new.linkedin_url, new.portafolio_url, 'activo'
    )
    returning id into v_candidate_id;
  else
    -- Si ya existe, actualizamos su información de contacto y profesional con la más reciente de su postulación
    update public.candidates
    set
      nombres = new.nombres,
      apellidos = new.apellidos,
      telefono = new.telefono,
      documento_identidad = coalesce(new.documento_identidad, documento_identidad),
      ubicacion_texto = new.ubicacion,
      nivel_academico_id = new.nivel_academico_id,
      profesion_oficio = new.profesion_oficio,
      anios_experiencia = coalesce(new.anios_experiencia, anios_experiencia),
      ultimo_puesto = coalesce(new.ultimo_puesto, ultimo_puesto),
      disponibilidad = coalesce(new.disponibilidad, disponibilidad),
      expectativa_salarial = coalesce(new.expectativa_salarial, expectativa_salarial),
      linkedin_url = coalesce(new.linkedin_url, linkedin_url),
      portafolio_url = coalesce(new.portafolio_url, portafolio_url),
      updated_at = now()
    where id = v_candidate_id;
  end if;
  
  -- Enlazar el candidato_id en la postulación
  new.candidato_id := v_candidate_id;
  
  return new;
end;
$$;

drop trigger if exists on_application_inserted_candidacy on public.applications;
create trigger on_application_inserted_candidacy
  before insert on public.applications
  for each row execute procedure public.process_application_candidate();

-- 4. Habilitar RLS en la tabla 'candidates'
alter table public.candidates enable row level security;

-- 5. Definir políticas RLS para 'candidates'
-- Lectura: Solo para personal interno autorizado
drop policy if exists "Authorized staff can read candidates" on public.candidates;
create policy "Authorized staff can read candidates"
  on public.candidates for select to authenticated
  using (public.can_view_applications());

-- Escritura/Edición/Eliminación: Solo administradores o reclutadores
drop policy if exists "Authorized staff can modify candidates" on public.candidates;
create policy "Authorized staff can modify candidates"
  on public.candidates for all to authenticated
  using (public.can_modify_applications())
  with check (public.can_modify_applications());

-- 6. Trigger para actualizar 'updated_at' en 'candidates'
drop trigger if exists before_candidates_updated on public.candidates;
create trigger before_candidates_updated
  before update on public.candidates
  for each row execute procedure public.set_application_updated_at();
