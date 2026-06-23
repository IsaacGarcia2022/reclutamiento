-- Módulo de usuarios: ejecutar después de supabase/schema.sql.

do $$
begin
  create type public.user_status as enum ('activo', 'inactivo', 'bloqueado');
exception
  when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists nombres text,
  add column if not exists apellidos text,
  add column if not exists telefono text,
  add column if not exists cargo text,
  add column if not exists estado public.user_status not null default 'activo',
  add column if not exists ultimo_acceso timestamptz,
  add column if not exists creado_por uuid references public.profiles(id) on delete set null;

update public.profiles
set
  nombres = coalesce(nullif(nombres, ''), nullif(split_part(full_name, ' ', 1), ''), split_part(email, '@', 1)),
  apellidos = coalesce(apellidos, ''),
  estado = case when is_active then 'activo'::public.user_status else 'inactivo'::public.user_status end
where nombres is null or apellidos is null;

alter table public.profiles
  alter column nombres set not null,
  alter column apellidos set not null;

create index if not exists profiles_role_id_idx on public.profiles(role_id);
create index if not exists profiles_estado_idx on public.profiles(estado);
create index if not exists audit_log_entity_idx on public.audit_log(entity_type, entity_id, created_at desc);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, role_id, full_name, email, nombres, apellidos, estado
  )
  select
    new.id,
    r.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'nombres', ''), split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'apellidos', ''),
    'activo'::public.user_status
  from public.roles r
  where r.code = 'consulta'
  on conflict (id) do nothing;

  return new;
end;
$$;

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
    where p.id = auth.uid() and p.estado = 'activo' and r.code = 'administrador'
  );
$$;

create or replace function public.register_auth_event(p_event_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_type not in ('inicio_sesion', 'cierre_sesion') then
    raise exception 'Evento de autenticación no permitido';
  end if;

  if p_event_type = 'inicio_sesion' then
    update public.profiles set ultimo_acceso = now(), updated_at = now() where id = auth.uid();
  end if;

  insert into public.audit_log (actor_id, event_type, entity_type, entity_id)
  values (auth.uid(), p_event_type, 'usuario', auth.uid());
end;
$$;

revoke all on function public.register_auth_event(text) from public;
grant execute on function public.register_auth_event(text) to authenticated;
