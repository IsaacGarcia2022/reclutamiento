-- Módulo de Privacidad y Consentimiento (GDPR/ARCO): ejecutar después de las migraciones anteriores.

-- 1. Crear tipo enum para el tipo de consentimiento
do $$ begin
  create type public.consent_type as enum ('politica_privacidad', 'tratamiento_datos', 'conservacion_curriculum');
exception
  when duplicate_object then null;
end $$;

-- 2. Crear tipo enum para el estado de la solicitud de eliminación
do $$ begin
  create type public.deletion_request_status as enum ('recibida', 'en_revision', 'completada', 'rechazada');
exception
  when duplicate_object then null;
end $$;

-- 3. Alterar la configuración de empresa para añadir el periodo de conservación
alter table public.company_settings
  add column if not exists periodo_conservacion_meses integer not null default 12;

-- 4. Crear la tabla de consentimientos (consents)
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid not null references public.candidates(id) on delete cascade,
  postulacion_id uuid references public.applications(id) on delete cascade,
  aceptado boolean not null check (aceptado = true),
  tipo_consentimiento public.consent_type not null,
  version_documento text not null,
  fecha_aceptacion timestamptz not null default now(),
  direccion_ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- 5. Crear la tabla de solicitudes de eliminación (data_deletion_requests)
create table if not exists public.data_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid references public.candidates(id) on delete set null,
  correo text not null,
  motivo text not null,
  fecha_solicitud timestamptz not null default now(),
  estado public.deletion_request_status not null default 'recibida',
  procesado_por uuid references public.profiles(id) on delete set null,
  fecha_procesamiento timestamptz,
  observacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Crear índices para optimizar consultas
create index if not exists consents_candidato_idx on public.consents(candidato_id);
create index if not exists consents_postulacion_idx on public.consents(postulacion_id);
create index if not exists deletion_requests_correo_idx on public.data_deletion_requests(correo);
create index if not exists deletion_requests_estado_idx on public.data_deletion_requests(estado);

-- 7. Trigger para autocompletar IP y User Agent al insertar consentimientos
create or replace function public.set_consent_system_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.direccion_ip := public.get_client_ip();
  new.user_agent := public.get_client_user_agent();
  new.fecha_aceptacion := now();
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists before_consent_inserted on public.consents;
create trigger before_consent_inserted
  before insert on public.consents
  for each row execute procedure public.set_consent_system_fields();

-- 8. Trigger para autocompletar el candidato_id en base a la postulación asociada en consents
create or replace function public.set_consent_candidate_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidato_id uuid;
begin
  select candidato_id into v_candidato_id
  from public.applications
  where id = new.postulacion_id;

  new.candidato_id := v_candidato_id;
  return new;
end;
$$;

drop trigger if exists before_consent_inserted_fill_candidate on public.consents;
create trigger before_consent_inserted_fill_candidate
  before insert on public.consents
  for each row execute procedure public.set_consent_candidate_id();

-- 9. Trigger para vincular automáticamente candidato_id según el correo en solicitudes de borrado
create or replace function public.set_deletion_request_candidate_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidato_id uuid;
begin
  select id into v_candidato_id
  from public.candidates
  where correo = new.correo
  limit 1;

  new.candidato_id := v_candidato_id;
  new.estado := 'recibida';
  new.fecha_solicitud := now();
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists before_deletion_request_inserted on public.data_deletion_requests;
create trigger before_deletion_request_inserted
  before insert on public.data_deletion_requests
  for each row execute procedure public.set_deletion_request_candidate_id();

-- 10. Función RPC para obtener candidatos cuyo periodo de conservación ha expirado
create or replace function public.get_expired_candidates(p_months integer)
returns table (
  id uuid,
  nombres text,
  apellidos text,
  correo text,
  created_at timestamptz,
  ultima_actividad timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  with candidate_activity as (
    select
      c.id as c_id,
      max(a.created_at) as max_app_date
    from public.candidates c
    left join public.applications a on a.candidato_id = c.id
    group by c.id
  )
  select
    c.id,
    c.nombres,
    c.apellidos,
    c.correo,
    c.created_at,
    coalesce(ca.max_app_date, c.created_at) as ultima_actividad
  from public.candidates c
  join candidate_activity ca on ca.c_id = c.id
  where coalesce(ca.max_app_date, c.created_at) < now() - (p_months || ' months')::interval;
end;
$$;

-- 11. Función RPC para purgar candidatos expirados por conservación
create or replace function public.purge_expired_candidates(p_months integer, p_processed_by uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purged_count integer;
begin
  create temp table to_delete as
  select ge.id, ge.correo
  from public.get_expired_candidates(p_months) ge;

  select count(*) into v_purged_count from to_delete;

  if v_purged_count > 0 then
    -- Elimina de la tabla de candidatos (borrado físico cascada)
    delete from public.candidates
    where id in (select td.id from to_delete td);

    -- Registrar en bitácora de auditoría
    insert into public.audit_log (actor_id, event_type, entity_type, metadata)
    values (
      p_processed_by,
      'limpieza_conservacion_gdpr',
      'candidatos',
      jsonb_build_object(
        'periodo_meses', p_months,
        'cantidad_eliminada', v_purged_count,
        'correos_eliminados', (select json_agg(td.correo) from to_delete td)
      )
    );
  end if;

  drop table to_delete;
  return v_purged_count;
end;
$$;

-- 12. Habilitar seguridad RLS
alter table public.consents enable row level security;
alter table public.data_deletion_requests enable row level security;

-- Políticas de RLS para consents
drop policy if exists "Anyone can insert consents" on public.consents;
create policy "Anyone can insert consents"
  on public.consents for insert
  with check (true);

drop policy if exists "Authorized staff can read consents" on public.consents;
create policy "Authorized staff can read consents"
  on public.consents for select to authenticated
  using (public.can_view_applications());

-- Políticas de RLS para data_deletion_requests
drop policy if exists "Anyone can request data deletion" on public.data_deletion_requests;
create policy "Anyone can request data deletion"
  on public.data_deletion_requests for insert
  with check (true);

drop policy if exists "Authorized staff can read deletion requests" on public.data_deletion_requests;
create policy "Authorized staff can read deletion requests"
  on public.data_deletion_requests for select to authenticated
  using (public.can_view_applications());

drop policy if exists "Authorized staff can update deletion requests" on public.data_deletion_requests;
create policy "Authorized staff can update deletion requests"
  on public.data_deletion_requests for update to authenticated
  using (public.can_view_applications())
  with check (public.can_view_applications());
