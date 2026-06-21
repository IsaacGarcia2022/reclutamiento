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
