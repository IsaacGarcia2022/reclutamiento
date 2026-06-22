# Configuración inicial de Supabase

## 1. Crear el proyecto

1. Crea un proyecto en Supabase y conserva la contraseña de la base de datos.
2. En **SQL Editor**, ejecuta el contenido de `schema.sql`.
3. En **Authentication > Providers**, usa correo y contraseña solo para usuarios internos.
4. Deshabilita el registro público de nuevos usuarios. Las cuentas deberán crearse o invitarse desde un flujo administrativo posterior.

## 2. Conectar el frontend

1. Copia `.env.example` como `.env.local`.
2. En **Project Settings > API**, copia únicamente la URL del proyecto y la clave `anon` pública.
3. Completa el archivo:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
```

La clave `service_role` nunca se coloca en `.env.local`, Vue ni el repositorio. Se reservará para Edge Functions del servidor.

## 3. Crear el primer administrador

1. En **Authentication > Users**, crea el primer usuario interno.
2. El trigger de `schema.sql` creará su perfil con rol `consulta`.
3. En SQL Editor, sustituye el correo y ejecuta:

```sql
update public.profiles p
set role_id = r.id
from public.roles r
where p.email = 'admin@tuempresa.com'
  and r.code = 'administrador';
```

Después de iniciar sesión, el usuario podrá acceder al panel interno.

## Próximos módulos

Las próximas migraciones crearán las tablas de vacantes, candidatos, postulaciones, documentos privados y auditoría por operación. Cada una se acompañará de políticas RLS y funciones de servidor para no entregar permisos sensibles al navegador.

## Módulo de usuarios

Después de configurar la base inicial, ejecuta en el SQL Editor el archivo
`migrations/002_users_module.sql`. Añade los campos de usuario, los estados
`activo`, `inactivo` y `bloqueado`, además del registro de inicios/cierres de sesión.

Las operaciones sensibles del módulo se ejecutan en la Edge Function
`functions/users-admin/index.ts`. Para publicarla con la CLI de Supabase:

```powershell
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase secrets set APP_URL=http://localhost:5173
npx supabase functions deploy users-admin
```

Para producción, reemplaza `APP_URL` por el dominio real de la aplicación.
Supabase inyecta `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en la función;
no agregues esos valores al frontend ni a `.env.local`.

## Módulo de empresa

Ejecuta `migrations/003_company_module.sql` en SQL Editor y publica la función
administrativa:

```powershell
npx supabase functions deploy company-admin
```

Esta migración crea un único registro institucional y el bucket público
`company-assets` para el logo. Solo Administrador puede subir o reemplazar el
archivo; el logo puede visualizarse públicamente en las vacantes.
