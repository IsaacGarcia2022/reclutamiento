-- Módulo de postulaciones (aplicaciones): ejecutar después de las migraciones anteriores.

-- 1. Crear tipo enum para el estado administrativo de la postulación
do $$ begin
  create type public.application_status as enum ('nueva', 'revisada', 'archivada', 'descartada');
exception
  when duplicate_object then null;
end $$;

-- 2. Modificar la restricción de categorías en catalog_items para permitir 'fuente_reclutamiento'
do $$
declare
  r record;
begin
  for r in (
    select c.constraint_name
    from information_schema.table_constraints c
    join information_schema.constraint_column_usage col on col.constraint_name = c.constraint_name
    where c.table_name = 'catalog_items' 
      and c.constraint_type = 'CHECK' 
      and col.column_name = 'categoria'
  ) loop
    execute 'alter table public.catalog_items drop constraint ' || quote_ident(r.constraint_name);
  end loop;
end $$;

alter table public.catalog_items add constraint catalog_items_categoria_check check (
  categoria in ('departamento', 'area_profesional', 'ubicacion', 'modalidad', 'tipo_contrato', 'jornada', 'nivel_academico', 'fuente_reclutamiento')
);

-- 3. Insertar valores iniciales para las fuentes de reclutamiento
insert into public.catalog_items (categoria, nombre) values
  ('fuente_reclutamiento', 'LinkedIn'),
  ('fuente_reclutamiento', 'Computrabajo'),
  ('fuente_reclutamiento', 'Sitio Web Corporativo'),
  ('fuente_reclutamiento', 'Referido Interno'),
  ('fuente_reclutamiento', 'Otro')
on conflict (categoria, nombre) do nothing;

-- 4. Crear la tabla de postulaciones (applications)
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  vacante_id uuid not null references public.vacancies(id) on delete cascade,
  candidato_id uuid references public.profiles(id) on delete set null,
  
  -- Campos obligatorios del formulario público
  nombres text not null,
  apellidos text not null,
  correo text not null,
  telefono text not null,
  ubicacion text not null,
  nivel_academico_id uuid not null references public.catalog_items(id),
  profesion_oficio text not null,
  curriculum_url text not null,
  consentimiento_privacidad boolean not null check (consentimiento_privacidad = true),
  
  -- Campos opcionales del formulario público
  documento_identidad text,
  anios_experiencia numeric(4,1),
  ultimo_puesto text,
  disponibilidad text,
  expectativa_salarial numeric(12,2),
  mensaje_presentacion text,
  portafolio_url text,
  linkedin_url text,
  
  -- Campos del sistema
  fuente_reclutamiento_id uuid references public.catalog_items(id) on delete set null,
  estado_administrativo public.application_status not null default 'nueva',
  observacion_interna text,
  revisado_por uuid references public.profiles(id) on delete set null,
  fecha_revision timestamptz,
  direccion_ip text,
  navegador text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Crear índices de rendimiento
create index if not exists applications_vacante_id_idx on public.applications(vacante_id);
create index if not exists applications_estado_idx on public.applications(estado_administrativo);
create index if not exists applications_created_at_idx on public.applications(created_at desc);

-- 6. Crear funciones auxiliares para capturar datos de conexión del cliente de forma segura
create or replace function public.get_client_ip()
returns text
language sql
stable
as $$
  select coalesce(
    split_part(current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for', ',', 1),
    '127.0.0.1'
  );
$$;

create or replace function public.get_client_user_agent()
returns text
language sql
stable
as $$
  select coalesce(
    current_setting('request.headers', true)::jsonb ->> 'user-agent',
    'Unknown'
  );
$$;

-- 7. Crear trigger para rellenar campos del sistema en la inserción
create or replace function public.set_application_system_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.direccion_ip := public.get_client_ip();
  new.navegador := public.get_client_user_agent();
  new.estado_administrativo := 'nueva';
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists before_application_inserted on public.applications;
create trigger before_application_inserted
  before insert on public.applications
  for each row execute procedure public.set_application_system_fields();

-- 8. Crear trigger para actualizar 'updated_at' en las modificaciones
create or replace function public.set_application_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists before_application_updated on public.applications;
create trigger before_application_updated
  before update on public.applications
  for each row execute procedure public.set_application_updated_at();

-- 9. Funciones helper para validación de políticas RLS basadas en roles
create or replace function public.can_view_applications()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid() and p.estado = 'activo' and r.code in ('administrador', 'recursos_humanos', 'consulta')
  );
$$;

create or replace function public.can_modify_applications()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid() and p.estado = 'activo' and r.code in ('administrador', 'recursos_humanos')
  );
$$;

-- 10. Habilitar y definir RLS para la tabla 'applications'
alter table public.applications enable row level security;

drop policy if exists "Anyone can apply to vacancies" on public.applications;
create policy "Anyone can apply to vacancies"
  on public.applications for insert
  with check (true);

drop policy if exists "Authorized staff can read applications" on public.applications;
create policy "Authorized staff can read applications"
  on public.applications for select to authenticated
  using (public.can_view_applications());

drop policy if exists "Authorized staff can update applications" on public.applications;
create policy "Authorized staff can update applications"
  on public.applications for update to authenticated
  using (public.can_modify_applications())
  with check (public.can_modify_applications());

drop policy if exists "Authorized staff can delete applications" on public.applications;
create policy "Authorized staff can delete applications"
  on public.applications for delete to authenticated
  using (public.can_modify_applications());

-- 11. Configurar almacenamiento privado para los currículums de candidatos
insert into storage.buckets (id, name, public)
values ('candidate-cvs', 'candidate-cvs', false)
on conflict (id) do update set public = false;

-- 12. Políticas RLS de almacenamiento para 'candidate-cvs'
drop policy if exists "Anyone can upload CVs" on storage.objects;
create policy "Anyone can upload CVs"
  on storage.objects for insert
  with check (bucket_id = 'candidate-cvs');

drop policy if exists "Authorized staff can view CVs" on storage.objects;
create policy "Authorized staff can view CVs"
  on storage.objects for select to authenticated
  using (bucket_id = 'candidate-cvs' and public.can_view_applications());

drop policy if exists "Authorized staff can update CVs" on storage.objects;
create policy "Authorized staff can update CVs"
  on storage.objects for update to authenticated
  using (bucket_id = 'candidate-cvs' and public.can_modify_applications())
  with check (bucket_id = 'candidate-cvs' and public.can_modify_applications());

drop policy if exists "Authorized staff can delete CVs" on storage.objects;
create policy "Authorized staff can delete CVs"
  on storage.objects for delete to authenticated
  using (bucket_id = 'candidate-cvs' and public.can_modify_applications());
