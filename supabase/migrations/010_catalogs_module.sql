-- Módulo de catálogos: extiende el catálogo reutilizable sin eliminar registros existentes.

alter table public.catalog_items
  add column if not exists parent_id uuid references public.catalog_items(id) on delete restrict,
  add column if not exists descripcion text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Amplía las categorías existentes para cubrir toda la administración de reclutamiento.
alter table public.catalog_items drop constraint if exists catalog_items_categoria_check;
alter table public.catalog_items add constraint catalog_items_categoria_check check (
  categoria in (
    'departamento', 'area_profesional', 'puesto', 'ubicacion', 'pais',
    'departamento_geografico', 'municipio', 'modalidad', 'tipo_contrato',
    'jornada', 'nivel_academico', 'profesion_oficio', 'fuente_reclutamiento',
    'tipo_documento', 'etiqueta_candidato'
  )
);

-- Evita variantes de duplicados por espacios o mayúsculas/minúsculas.
create unique index if not exists catalog_items_category_name_normalized_key
  on public.catalog_items (categoria, lower(btrim(nombre)));

create index if not exists catalog_items_parent_id_idx on public.catalog_items(parent_id);
create index if not exists catalog_items_category_active_idx on public.catalog_items(categoria, activo);

create or replace function public.set_catalog_item_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists before_catalog_item_updated on public.catalog_items;
create trigger before_catalog_item_updated
  before update on public.catalog_items
  for each row execute procedure public.set_catalog_item_updated_at();

-- Valores iniciales únicamente para categorías nuevas; pueden editarse o desactivarse desde el módulo.
insert into public.catalog_items (categoria, nombre) values
  ('pais', 'El Salvador'),
  ('puesto', 'Analista'),
  ('profesion_oficio', 'Administración de Empresas'),
  ('tipo_documento', 'Currículum'),
  ('etiqueta_candidato', 'Pendiente de revisión')
on conflict do nothing;
