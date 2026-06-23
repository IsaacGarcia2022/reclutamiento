-- Módulo de vacantes y catálogos base.

do $$ begin create type public.vacancy_status as enum ('borrador','publicada','pausada','cerrada','archivada'); exception when duplicate_object then null; end $$;

create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  categoria text not null check (categoria in ('departamento','area_profesional','ubicacion','modalidad','tipo_contrato','jornada','nivel_academico')),
  nombre text not null,
  activo boolean not null default true,
  unique (categoria, nombre)
);

insert into public.catalog_items (categoria, nombre) values
  ('departamento','Administración'), ('departamento','Recursos Humanos'), ('departamento','Tecnología'),
  ('area_profesional','Administración'), ('area_profesional','Tecnología'), ('area_profesional','Ventas'),
  ('ubicacion','San Salvador, El Salvador'), ('ubicacion','Remoto'),
  ('modalidad','Presencial'), ('modalidad','Híbrida'), ('modalidad','Remota'),
  ('tipo_contrato','Tiempo completo'), ('tipo_contrato','Medio tiempo'), ('tipo_contrato','Temporal'),
  ('jornada','Diurna'), ('jornada','Mixta'), ('jornada','Flexible'),
  ('nivel_academico','Bachillerato'), ('nivel_academico','Técnico'), ('nivel_academico','Universitario')
on conflict (categoria, nombre) do nothing;

create sequence if not exists public.vacancy_code_sequence start 1;
create or replace function public.next_vacancy_code() returns text language sql volatile as $$
  select 'VAC-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.vacancy_code_sequence')::text, 5, '0');
$$;

create table if not exists public.vacancies (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default public.next_vacancy_code(),
  titulo text not null,
  departamento_empresa_id uuid references public.catalog_items(id),
  area_profesional_id uuid references public.catalog_items(id),
  ubicacion_id uuid references public.catalog_items(id),
  modalidad_id uuid references public.catalog_items(id),
  tipo_contrato_id uuid references public.catalog_items(id),
  jornada_id uuid references public.catalog_items(id),
  numero_plazas integer not null default 1 check (numero_plazas > 0),
  descripcion text not null,
  funciones text,
  requisitos text not null,
  nivel_academico_id uuid references public.catalog_items(id),
  experiencia_minima text,
  habilidades_deseadas text,
  salario_minimo numeric(12,2), salario_maximo numeric(12,2), mostrar_salario boolean not null default false,
  fecha_publicacion date, fecha_cierre date,
  responsable_id uuid references public.profiles(id), imagen_url text,
  estado public.vacancy_status not null default 'borrador',
  cantidad_postulaciones integer not null default 0,
  creado_por uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (fecha_cierre is null or fecha_publicacion is null or fecha_cierre >= fecha_publicacion),
  check (salario_minimo is null or salario_maximo is null or salario_minimo <= salario_maximo)
);

create index if not exists vacancies_status_idx on public.vacancies(estado, fecha_publicacion desc);
alter table public.catalog_items enable row level security;
alter table public.vacancies enable row level security;
drop policy if exists "Public read published vacancies" on public.vacancies;
create policy "Public read published vacancies" on public.vacancies for select using (estado = 'publicada' and (fecha_cierre is null or fecha_cierre >= current_date));
drop policy if exists "Public read active catalogs" on public.catalog_items;
create policy "Public read active catalogs" on public.catalog_items for select using (activo);

create or replace function public.can_manage_vacancies() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p join public.roles r on r.id=p.role_id where p.id=auth.uid() and p.estado='activo' and r.code in ('administrador','recursos_humanos'));
$$;

insert into storage.buckets (id,name,public) values ('vacancy-assets','vacancy-assets',true) on conflict (id) do update set public=true;
drop policy if exists "Public view vacancy assets" on storage.objects;
create policy "Public view vacancy assets" on storage.objects for select using (bucket_id='vacancy-assets');
drop policy if exists "Managers upload vacancy assets" on storage.objects;
create policy "Managers upload vacancy assets" on storage.objects for insert to authenticated with check (bucket_id='vacancy-assets' and public.can_manage_vacancies());
drop policy if exists "Managers update vacancy assets" on storage.objects;
create policy "Managers update vacancy assets" on storage.objects for update to authenticated using (bucket_id='vacancy-assets' and public.can_manage_vacancies()) with check (bucket_id='vacancy-assets' and public.can_manage_vacancies());
