-- Módulo de preguntas adicionales por vacante: ejecutar después de las migraciones anteriores.

-- 1. Crear la tabla de preguntas por vacante (vacancy_questions)
create table if not exists public.vacancy_questions (
  id uuid primary key default gen_random_uuid(),
  vacante_id uuid not null references public.vacancies(id) on delete cascade,
  pregunta text not null,
  tipo_respuesta text not null check (tipo_respuesta in ('texto_corto', 'texto_largo', 'seleccion_unica', 'seleccion_multiple', 'si_no', 'numero', 'fecha')),
  opciones jsonb, -- array de strings en formato JSON (ej. ["A", "B", "C"])
  obligatoria boolean not null default false,
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices de rendimiento
create index if not exists vacancy_questions_vacante_id_idx on public.vacancy_questions(vacante_id);
create index if not exists vacancy_questions_orden_idx on public.vacancy_questions(orden);

-- 2. Crear la tabla de respuestas de candidatos (application_answers)
create table if not exists public.application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  question_id uuid not null references public.vacancy_questions(id) on delete cascade,
  respuesta jsonb not null, -- guarda la respuesta del candidato (texto, número, boolean, o array para selección_múltiple)
  created_at timestamptz not null default now(),
  constraint unique_application_question unique (application_id, question_id)
);

-- Índices de rendimiento
create index if not exists application_answers_application_id_idx on public.application_answers(application_id);

-- 3. Habilitar RLS para ambas tablas
alter table public.vacancy_questions enable row level security;
alter table public.application_answers enable row level security;

-- 4. Definir políticas RLS para 'vacancy_questions'
-- Lectura: Pública para preguntas de vacantes publicadas o para personal administrativo
drop policy if exists "Anyone can read active vacancy questions" on public.vacancy_questions;
create policy "Anyone can read active vacancy questions"
  on public.vacancy_questions for select
  using (
    activo and (
      exists (select 1 from public.vacancies v where v.id = vacancy_questions.vacante_id and v.estado = 'publicada')
      or public.can_view_applications()
    )
  );

-- Inserción/Modificación/Eliminación: Solo personal administrativo con rol de edición
drop policy if exists "Authorized staff can modify vacancy questions" on public.vacancy_questions;
create policy "Authorized staff can modify vacancy questions"
  on public.vacancy_questions for all to authenticated
  using (public.can_modify_applications())
  with check (public.can_modify_applications());

-- 5. Definir políticas RLS para 'application_answers'
-- Inserción: Pública para que los candidatos puedan registrar sus respuestas al postularse
drop policy if exists "Anyone can insert application answers" on public.application_answers;
create policy "Anyone can insert application answers"
  on public.application_answers for insert
  with check (true);

-- Lectura: Solo para personal administrativo con acceso a postulaciones
drop policy if exists "Authorized staff can read application answers" on public.application_answers;
create policy "Authorized staff can read application answers"
  on public.application_answers for select to authenticated
  using (public.can_view_applications());

-- Modificación/Eliminación: Solo para personal administrativo con privilegios de edición
drop policy if exists "Authorized staff can modify application answers" on public.application_answers;
create policy "Authorized staff can modify application answers"
  on public.application_answers for all to authenticated
  using (public.can_modify_applications())
  with check (public.can_modify_applications());

-- 6. Trigger para actualizar 'updated_at' en 'vacancy_questions'
drop trigger if exists before_vacancy_questions_updated on public.vacancy_questions;
create trigger before_vacancy_questions_updated
  before update on public.vacancy_questions
  for each row execute procedure public.set_application_updated_at();
