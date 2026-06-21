-- Base de seguridad para el Sistema Interno de Reclutamiento.
-- Ejecutar en Supabase Dashboard > SQL Editor.
-- No agregues la service_role key al frontend.

create extension if not exists pgcrypto;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('administrador', 'recursos_humanos', 'consulta')),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

insert into public.roles (code, name, description)
values
  ('administrador', 'Administrador', 'Acceso completo al sistema.'),
  ('recursos_humanos', 'Recursos Humanos', 'Gestión operativa de vacantes y candidatos.'),
  ('consulta', 'Consulta', 'Acceso de solo lectura.')
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  full_name text not null,
  email text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Cada usuario creado por un administrador en Supabase Auth recibe el rol
-- mínimo de consulta. El primer administrador se eleva manualmente una vez.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role_id, full_name, email)
  select
    new.id,
    r.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.email
  from public.roles r
  where r.code = 'consulta'
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

create or replace function public.is_administrator()
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
    where p.id = auth.uid() and p.is_active and r.code = 'administrador'
  );
$$;

alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "Authenticated users can read roles" on public.roles;
create policy "Authenticated users can read roles"
  on public.roles for select to authenticated using (true);

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_administrator());

drop policy if exists "Administrators can read audit log" on public.audit_log;
create policy "Administrators can read audit log"
  on public.audit_log for select to authenticated
  using (public.is_administrator());

-- La creación, edición, desactivación de perfiles y auditoría se hará mediante
-- funciones de servidor/Edge Functions con service_role; no desde el navegador.
