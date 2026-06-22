-- Módulo de Notificaciones y Plantillas (2.10 Notificaciones)

-- 1. Crear la tabla de plantillas de notificación
create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  asunto text not null,
  contenido_html text not null,
  contenido_texto text not null,
  variables_disponibles text[] not null default '{}'::text[],
  estado text not null default 'activo' check (estado in ('activo', 'inactivo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Crear la tabla de notificaciones (alertas internas y correos enviados)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('internal', 'email')),
  candidato_id uuid references public.candidates(id) on delete cascade,
  postulacion_id uuid references public.applications(id) on delete cascade,
  usuario_id uuid references public.profiles(id) on delete cascade,
  titulo text not null,
  mensaje text not null,
  leida boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Crear índices de rendimiento
create index if not exists notifications_usuario_id_idx on public.notifications(usuario_id) where tipo = 'internal';
create index if not exists notifications_candidato_id_idx on public.notifications(candidato_id) where tipo = 'email';
create index if not exists notifications_leida_idx on public.notifications(leida) where tipo = 'internal';

-- 3. Habilitar Row Level Security (RLS) en ambas tablas
alter table public.notification_templates enable row level security;
alter table public.notifications enable row level security;

-- 4. Definir políticas RLS para public.notification_templates
-- Lectura: Todo el personal autorizado puede ver las plantillas
drop policy if exists "Authorized staff can read templates" on public.notification_templates;
create policy "Authorized staff can read templates"
  on public.notification_templates for select to authenticated
  using (public.can_view_applications());

-- Modificación: Solo los administradores pueden crear, modificar o eliminar plantillas
drop policy if exists "Only administrators can modify templates" on public.notification_templates;
create policy "Only administrators can modify templates"
  on public.notification_templates for all to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

-- 5. Definir políticas RLS para public.notifications
-- Lectura: Todo el personal autorizado puede ver las notificaciones
drop policy if exists "Authorized staff can read notifications" on public.notifications;
create policy "Authorized staff can read notifications"
  on public.notifications for select to authenticated
  using (public.can_view_applications());

-- Inserción: Permitir de forma pública (para que el frontend de candidatos envíe los correos simulados)
drop policy if exists "Anyone can insert notifications" on public.notifications;
create policy "Anyone can insert notifications"
  on public.notifications for insert
  with check (true);

-- Modificación/Edición (por ejemplo para marcar como leída): Personal autorizado
drop policy if exists "Authorized staff can update notifications" on public.notifications;
create policy "Authorized staff can update notifications"
  on public.notifications for update to authenticated
  using (public.can_view_applications())
  with check (public.can_view_applications());

-- 6. Trigger para generar notificación interna al recibir una nueva postulación y enviar correos simulados al candidato
create or replace function public.process_application_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_responsable_id uuid;
  v_vacante_titulo text;
  v_vacante_codigo text;
  v_empresa_nombre text;
  v_nombre_completo text;
  v_fecha text;
  v_tpl_asunto text;
  v_tpl_html text;
  v_tpl_texto text;
begin
  -- Obtener responsable de la vacante, código y título
  select responsable_id, titulo, codigo into v_responsable_id, v_vacante_titulo, v_vacante_codigo
  from public.vacancies
  where id = new.vacante_id;

  -- Obtener nombre de la empresa
  select coalesce(nombre_comercial, nombre_legal, 'Empresa') into v_empresa_nombre
  from public.company_settings
  limit 1;

  v_nombre_completo := new.nombres || ' ' || new.apellidos;
  v_fecha := to_char(now(), 'DD/MM/YYYY');

  -- A. Insertar notificación interna para el responsable
  insert into public.notifications (tipo, candidato_id, postulacion_id, usuario_id, titulo, mensaje)
  values (
    'internal',
    new.candidato_id,
    new.id,
    v_responsable_id,
    'Nueva postulación recibida',
    'El candidato ' || v_nombre_completo || ' se ha postulado a la vacante "' || v_vacante_titulo || '".'
  );

  -- B. Correo de confirmación de postulación (si existe plantilla activa)
  select asunto, contenido_html, contenido_texto into v_tpl_asunto, v_tpl_html, v_tpl_texto
  from public.notification_templates
  where nombre = 'confirmacion_postulacion' and estado = 'activo';

  if found then
    v_tpl_asunto := replace(v_tpl_asunto, '{{nombre_vacante}}', v_vacante_titulo);
    v_tpl_asunto := replace(v_tpl_asunto, '{{nombre_candidato}}', v_nombre_completo);
    v_tpl_asunto := replace(v_tpl_asunto, '{{codigo_vacante}}', v_vacante_codigo);
    v_tpl_asunto := replace(v_tpl_asunto, '{{nombre_empresa}}', v_empresa_nombre);
    v_tpl_asunto := replace(v_tpl_asunto, '{{fecha_postulacion}}', v_fecha);

    v_tpl_html := replace(v_tpl_html, '{{nombre_vacante}}', v_vacante_titulo);
    v_tpl_html := replace(v_tpl_html, '{{nombre_candidato}}', v_nombre_completo);
    v_tpl_html := replace(v_tpl_html, '{{codigo_vacante}}', v_vacante_codigo);
    v_tpl_html := replace(v_tpl_html, '{{nombre_empresa}}', v_empresa_nombre);
    v_tpl_html := replace(v_tpl_html, '{{fecha_postulacion}}', v_fecha);

    v_tpl_texto := replace(v_tpl_texto, '{{nombre_vacante}}', v_vacante_titulo);
    v_tpl_texto := replace(v_tpl_texto, '{{nombre_candidato}}', v_nombre_completo);
    v_tpl_texto := replace(v_tpl_texto, '{{codigo_vacante}}', v_vacante_codigo);
    v_tpl_texto := replace(v_tpl_texto, '{{nombre_empresa}}', v_empresa_nombre);
    v_tpl_texto := replace(v_tpl_texto, '{{fecha_postulacion}}', v_fecha);

    insert into public.notifications (tipo, candidato_id, postulacion_id, titulo, mensaje, metadata)
    values (
      'email',
      new.candidato_id,
      new.id,
      v_tpl_asunto,
      v_tpl_texto,
      jsonb_build_object(
        'template', 'confirmacion_postulacion',
        'html_content', v_tpl_html,
        'variables_used', jsonb_build_object(
          'nombre_candidato', v_nombre_completo,
          'nombre_vacante', v_vacante_titulo,
          'codigo_vacante', v_vacante_codigo,
          'nombre_empresa', v_empresa_nombre,
          'fecha_postulacion', v_fecha
        )
      )
    );
  end if;

  -- C. Correo de recepción de CV (si existe plantilla activa)
  select asunto, contenido_html, contenido_texto into v_tpl_asunto, v_tpl_html, v_tpl_texto
  from public.notification_templates
  where nombre = 'recepcion_cv' and estado = 'activo';

  if found then
    v_tpl_asunto := replace(v_tpl_asunto, '{{nombre_vacante}}', v_vacante_titulo);
    v_tpl_asunto := replace(v_tpl_asunto, '{{nombre_candidato}}', v_nombre_completo);
    v_tpl_asunto := replace(v_tpl_asunto, '{{codigo_vacante}}', v_vacante_codigo);
    v_tpl_asunto := replace(v_tpl_asunto, '{{nombre_empresa}}', v_empresa_nombre);
    v_tpl_asunto := replace(v_tpl_asunto, '{{fecha_postulacion}}', v_fecha);

    v_tpl_html := replace(v_tpl_html, '{{nombre_vacante}}', v_vacante_titulo);
    v_tpl_html := replace(v_tpl_html, '{{nombre_candidato}}', v_nombre_completo);
    v_tpl_html := replace(v_tpl_html, '{{codigo_vacante}}', v_vacante_codigo);
    v_tpl_html := replace(v_tpl_html, '{{nombre_empresa}}', v_empresa_nombre);
    v_tpl_html := replace(v_tpl_html, '{{fecha_postulacion}}', v_fecha);

    v_tpl_texto := replace(v_tpl_texto, '{{nombre_vacante}}', v_vacante_titulo);
    v_tpl_texto := replace(v_tpl_texto, '{{nombre_candidato}}', v_nombre_completo);
    v_tpl_texto := replace(v_tpl_texto, '{{codigo_vacante}}', v_vacante_codigo);
    v_tpl_texto := replace(v_tpl_texto, '{{nombre_empresa}}', v_empresa_nombre);
    v_tpl_texto := replace(v_tpl_texto, '{{fecha_postulacion}}', v_fecha);

    insert into public.notifications (tipo, candidato_id, postulacion_id, titulo, mensaje, metadata)
    values (
      'email',
      new.candidato_id,
      new.id,
      v_tpl_asunto,
      v_tpl_texto,
      jsonb_build_object(
        'template', 'recepcion_cv',
        'html_content', v_tpl_html,
        'variables_used', jsonb_build_object(
          'nombre_candidato', v_nombre_completo,
          'nombre_vacante', v_vacante_titulo,
          'codigo_vacante', v_vacante_codigo,
          'nombre_empresa', v_empresa_nombre,
          'fecha_postulacion', v_fecha
        )
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_application_inserted_notification on public.applications;
create trigger on_application_inserted_notification
  after insert on public.applications
  for each row execute procedure public.process_application_notification();

-- 6b. Trigger para rellenar automáticamente candidato_id en documentos cuando es nulo y proviene de una postulación
create or replace function public.process_document_candidate_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.candidato_id is null and new.postulacion_id is not null then
    select candidato_id into new.candidato_id
    from public.applications
    where id = new.postulacion_id;
  end if;
  return new;
end;
$$;

drop trigger if exists before_document_inserted on public.documents;
create trigger before_document_inserted
  before insert on public.documents
  for each row execute procedure public.process_document_candidate_id();

-- 7. Trigger para generar notificación interna al cerrar una vacante
create or replace function public.process_vacancy_closed_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado = 'cerrada' and (old.estado is null or old.estado <> 'cerrada') then
    insert into public.notifications (tipo, usuario_id, titulo, mensaje)
    values (
      'internal',
      new.responsable_id,
      'Vacante cerrada',
      'La vacante "' || new.titulo || '" (' || new.codigo || ') ha sido cerrada.'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_vacancy_closed_notification on public.vacancies;
create trigger on_vacancy_closed_notification
  after update on public.vacancies
  for each row execute procedure public.process_vacancy_closed_notification();

-- 8. Función RPC para chequeo en tiempo real de vacantes (vencimiento y sin postulaciones)
create or replace function public.check_vacancies_status()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vacante record;
  v_alertas_creadas int := 0;
  v_cerradas_creadas int := 0;
  v_sin_postulaciones_creadas int := 0;
  v_apps_count int;
begin
  -- 1. Vacantes próximas a vencer (vencimiento en las próximas 48 horas) y que no tengan alerta ya creada
  for v_vacante in (
    select v.*
    from public.vacancies v
    where v.estado = 'publicada'
      and v.fecha_cierre is not null
      and v.fecha_cierre <= (now() + interval '48 hours')
      and v.fecha_cierre > now()
      and not exists (
        select 1 from public.notifications n
        where n.usuario_id = v.responsable_id
          and n.titulo = 'Vacante próxima a cerrar'
          and n.mensaje like '%' || v.codigo || '%'
      )
  ) loop
    insert into public.notifications (tipo, usuario_id, titulo, mensaje)
    values (
      'internal',
      v_vacante.responsable_id,
      'Vacante próxima a cerrar',
      'La vacante "' || v_vacante.titulo || '" (' || v_vacante.codigo || ') está próxima a cerrar (vence el ' || to_char(v_vacante.fecha_cierre, 'DD-MM-YYYY') || ').'
    );
    v_alertas_creadas := v_alertas_creadas + 1;
  end loop;

  -- 2. Vacantes vencidas que siguen publicadas -> Cambiar a 'cerrada' y notificar
  for v_vacante in (
    select v.*
    from public.vacancies v
    where v.estado = 'publicada'
      and v.fecha_cierre is not null
      and v.fecha_cierre <= now()
  ) loop
    -- Cambiar estado en la tabla de vacantes
    update public.vacancies set estado = 'cerrada', updated_at = now() where id = v_vacante.id;
    
    -- Insertar notificación de cierre por vencimiento
    insert into public.notifications (tipo, usuario_id, titulo, mensaje)
    values (
      'internal',
      v_vacante.responsable_id,
      'Vacante cerrada',
      'La vacante "' || v_vacante.titulo || '" (' || v_vacante.codigo || ') ha sido cerrada automáticamente por fecha de vencimiento expirada.'
    );
    v_cerradas_creadas := v_cerradas_creadas + 1;
  end loop;

  -- 3. Vacantes publicadas hace más de 15 días con 0 postulaciones y sin alerta previa
  for v_vacante in (
    select v.*
    from public.vacancies v
    where v.estado = 'publicada'
      and v.created_at <= (now() - interval '15 days')
      and not exists (
        select 1 from public.notifications n
        where n.usuario_id = v.responsable_id
          and n.titulo = 'Vacante sin postulaciones'
          and n.mensaje like '%' || v.codigo || '%'
      )
  ) loop
    select count(*) into v_apps_count from public.applications where vacante_id = v_vacante.id;
    if v_apps_count = 0 then
      insert into public.notifications (tipo, usuario_id, titulo, mensaje)
      values (
        'internal',
        v_vacante.responsable_id,
        'Vacante sin postulaciones',
        'La vacante "' || v_vacante.titulo || '" (' || v_vacante.codigo || ') lleva más de 15 días publicada y no ha recibido postulaciones.'
      );
      v_sin_postulaciones_creadas := v_sin_postulaciones_creadas + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'alertas_proximas_vencer', v_alertas_creadas,
    'vacantes_cerradas_vencidas', v_cerradas_creadas,
    'vacantes_sin_postulaciones', v_sin_postulaciones_creadas
  );
end;
$$;

-- 9. Insertar plantillas de correo semilla en español
insert into public.notification_templates (nombre, asunto, contenido_html, contenido_texto, variables_disponibles, estado)
values
  (
    'confirmacion_postulacion',
    'Confirmación de tu postulación a la vacante: {{nombre_vacante}}',
    '<html><body><h2>¡Hola {{nombre_candidato}}!</h2><p>Hemos recibido tu postulación para la vacante <strong>{{nombre_vacante}}</strong> (Código: {{codigo_vacante}}) en <strong>{{nombre_empresa}}</strong>.</p><p>Agradecemos tu interés en formar parte de nuestro equipo. Nuestro equipo de Recursos Humanos revisará tu perfil y se pondrá en contacto contigo si avanzas en el proceso.</p><p>Fecha de postulación: {{fecha_postulacion}}</p><p>Atentamente,<br>El equipo de {{nombre_empresa}}</p></body></html>',
    '¡Hola {{nombre_candidato}}!\n\nHemos recibido tu postulación para la vacante "{{nombre_vacante}}" (Código: {{codigo_vacante}}) en {{nombre_empresa}}.\n\nAgradecemos tu interés en formar parte de nuestro equipo. Nuestro equipo de Recursos Humanos revisará tu perfil y se pondrá en contacto contigo si avanzas en el proceso.\n\nFecha de postulación: {{fecha_postulacion}}\n\nAtentamente,\nEl equipo de {{nombre_empresa}}',
    array['nombre_candidato', 'nombre_vacante', 'codigo_vacante', 'nombre_empresa', 'fecha_postulacion'],
    'activo'
  ),
  (
    'recepcion_cv',
    'Recepción de tu Currículum Vitae - {{nombre_empresa}}',
    '<html><body><h2>¡Hola {{nombre_candidato}}!</h2><p>Te confirmamos que tu Currículum Vitae ha sido cargado con éxito en el expediente del proceso de selección para la oferta <strong>{{nombre_vacante}}</strong> en <strong>{{nombre_empresa}}</strong>.</p><p>Tu expediente profesional queda registrado de forma confidencial y segura en nuestra base de datos corporativa.</p><p>¡Te deseamos el mayor de los éxitos!</p><p>Atentamente,<br>Recursos Humanos, {{nombre_empresa}}</p></body></html>',
    '¡Hola {{nombre_candidato}}!\n\nTe confirmamos que tu Currículum Vitae ha sido cargado con éxito en el expediente del proceso de selección para la oferta "{{nombre_vacante}}" en {{nombre_empresa}}.\n\nTu expediente profesional queda registrado de forma confidencial y segura en nuestra base de datos corporativa.\n\n¡Te deseamos el mayor de los éxitos!\n\nAtentamente,\nRecursos Humanos, {{nombre_empresa}}',
    array['nombre_candidato', 'nombre_vacante', 'codigo_vacante', 'nombre_empresa', 'fecha_postulacion'],
    'activo'
  ),
  (
    'eliminacion_datos',
    'Confirmación de eliminación de datos personales (GDPR/ARCO) - {{nombre_empresa}}',
    '<html><body><h2>Estimado(a) {{nombre_candidato}},</h2><p>De conformidad con tu solicitud y nuestras políticas de privacidad y protección de datos, te confirmamos que hemos procesado la eliminación definitiva e irreversible de toda tu información personal, currículums, expedientes e historial de postulaciones de nuestra plataforma.</p><p>Si deseas postularte nuevamente en el futuro, deberás completar un nuevo registro.</p><p>Atentamente,<br>Delegado de Protección de Datos (DPO), {{nombre_empresa}}</p></body></html>',
    'Estimado(a) {{nombre_candidato}},\n\nDe conformidad con tu solicitud y nuestras políticas de privacidad y protección de datos, te confirmamos que hemos procesado la eliminación definitiva e irreversible de toda tu información personal, currículums, expedientes e historial de postulaciones de nuestra plataforma.\n\nSi deseas postularte nuevamente en el futuro, deberás completar un nuevo registro.\n\nAtentamente,\nDelegado de Protección de Datos (DPO), {{nombre_empresa}}',
    array['nombre_candidato', 'nombre_empresa'],
    'activo'
  )
on conflict (nombre) do update set
  asunto = excluded.asunto,
  contenido_html = excluded.contenido_html,
  contenido_texto = excluded.contenido_texto,
  variables_disponibles = excluded.variables_disponibles,
  estado = excluded.estado;
