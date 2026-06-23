-- Módulo de empresa: una única configuración institucional.

create table if not exists public.company_settings (
  id boolean primary key default true check (id),
  nombre_legal text,
  nombre_comercial text,
  descripcion text,
  logo_url text,
  sector text,
  direccion text,
  telefono text,
  correo_recursos_humanos text,
  sitio_web text,
  facebook text,
  instagram text,
  linkedin text,
  mision text,
  vision text,
  valores text,
  beneficios_laborales text,
  color_principal text not null default '#18566B' check (color_principal ~ '^#[0-9A-Fa-f]{6}$'),
  color_secundario text not null default '#638579' check (color_secundario ~ '^#[0-9A-Fa-f]{6}$'),
  politica_privacidad text,
  version_politica_privacidad text,
  terminos_postulacion text,
  version_terminos text,
  actualizado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.company_settings (id) values (true) on conflict (id) do nothing;

alter table public.company_settings enable row level security;

drop policy if exists "Public users can read company settings" on public.company_settings;
create policy "Public users can read company settings"
  on public.company_settings for select using (true);

insert into storage.buckets (id, name, public)
values ('company-assets', 'company-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "Public users can view company assets" on storage.objects;
create policy "Public users can view company assets"
  on storage.objects for select using (bucket_id = 'company-assets');

drop policy if exists "Administrators can upload company assets" on storage.objects;
create policy "Administrators can upload company assets"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'company-assets' and public.is_administrator());

drop policy if exists "Administrators can update company assets" on storage.objects;
create policy "Administrators can update company assets"
  on storage.objects for update to authenticated
  using (bucket_id = 'company-assets' and public.is_administrator())
  with check (bucket_id = 'company-assets' and public.is_administrator());

drop policy if exists "Administrators can delete company assets" on storage.objects;
create policy "Administrators can delete company assets"
  on storage.objects for delete to authenticated
  using (bucket_id = 'company-assets' and public.is_administrator());
