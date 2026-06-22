-- Módulo de auditoría: extiende el log existente y lo convierte en inmutable.

alter table public.audit_log
  add column if not exists accion text,
  add column if not exists modulo text,
  add column if not exists entidad text,
  add column if not exists descripcion text,
  add column if not exists valor_anterior jsonb,
  add column if not exists valor_nuevo jsonb,
  add column if not exists direccion_ip text,
  add column if not exists user_agent text,
  add column if not exists fecha_hora timestamptz;

update public.audit_log
set
  accion = coalesce(accion, event_type),
  modulo = coalesce(modulo, entity_type, 'sistema'),
  entidad = coalesce(entidad, entity_type),
  fecha_hora = coalesce(fecha_hora, created_at)
where accion is null or modulo is null or entidad is null or fecha_hora is null;

alter table public.audit_log
  alter column accion set not null,
  alter column modulo set not null,
  alter column fecha_hora set not null,
  alter column fecha_hora set default now();

create index if not exists audit_log_filters_idx on public.audit_log(actor_id, modulo, accion, fecha_hora desc);
create index if not exists audit_log_fecha_hora_idx on public.audit_log(fecha_hora desc);

create or replace function public.enrich_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.accion := coalesce(nullif(new.accion, ''), new.event_type);
  new.modulo := coalesce(nullif(new.modulo, ''), nullif(new.entity_type, ''), 'sistema');
  new.entidad := coalesce(nullif(new.entidad, ''), new.entity_type);
  new.fecha_hora := coalesce(new.fecha_hora, new.created_at, now());
  new.direccion_ip := coalesce(new.direccion_ip, public.get_client_ip());
  new.user_agent := coalesce(new.user_agent, public.get_client_user_agent());
  return new;
end;
$$;

drop trigger if exists before_audit_log_inserted on public.audit_log;
create trigger before_audit_log_inserted
  before insert on public.audit_log
  for each row execute procedure public.enrich_audit_log();

create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Los registros de auditoría son inmutables.';
end;
$$;

drop trigger if exists prevent_audit_log_update on public.audit_log;
create trigger prevent_audit_log_update before update on public.audit_log
  for each row execute procedure public.prevent_audit_log_mutation();
drop trigger if exists prevent_audit_log_delete on public.audit_log;
create trigger prevent_audit_log_delete before delete on public.audit_log
  for each row execute procedure public.prevent_audit_log_mutation();

-- Auditoría automática de los cambios de estado administrativo.
create or replace function public.audit_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.estado_administrativo is distinct from new.estado_administrativo then
    insert into public.audit_log (
      actor_id, event_type, entity_type, entity_id, metadata,
      accion, modulo, entidad, descripcion, valor_anterior, valor_nuevo
    ) values (
      auth.uid(), 'cambio_estado_administrativo', 'postulacion', new.id,
      jsonb_build_object('anterior', old.estado_administrativo, 'nuevo', new.estado_administrativo),
      'cambio_estado_administrativo', 'postulaciones', 'postulacion', 'Cambio de estado administrativo de postulación.',
      jsonb_build_object('estado_administrativo', old.estado_administrativo),
      jsonb_build_object('estado_administrativo', new.estado_administrativo)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists after_application_status_changed_audit on public.applications;
create trigger after_application_status_changed_audit
  after update on public.applications
  for each row execute procedure public.audit_application_status_change();
