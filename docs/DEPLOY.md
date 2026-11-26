# Despliegue en Vercel + Neon

Vercel aloja la app de Next.js y Neon aloja PostgreSQL. Ambos tienen plan gratuito.

## 1. Base de datos en Neon

El proyecto de Neon ya está vinculado al repo con la CLI de Neon (`neon.ts` declara los servicios;
`.neon`, que no se commitea, guarda el proyecto y la rama):

```bash
npm i -g neon@latest
neon login
neon init -y --org-id <org> --project-id <proyecto> --branch production --services postgres
neon deploy        # aplica neon.ts y baja DATABASE_URL y DATABASE_URL_UNPOOLED a .env
```

Neon entrega dos cadenas de conexión para la misma base:

| Variable                | Host               | La usa                                   |
|-------------------------|--------------------|------------------------------------------|
| `DATABASE_URL`          | con `-pooler`      | la app (PgBouncer, ideal para serverless) |
| `DATABASE_URL_UNPOOLED` | sin `-pooler`      | `prisma migrate` (necesita sesión propia) |

## 2. Importar el proyecto en Vercel

1. En https://vercel.com/new importá el repositorio. Vercel detecta Next.js solo.
2. En **Environment Variables** cargá (las dos primeras salen de `.env` después de `neon deploy`,
   o del botón **Connect** en la consola de Neon):

| Variable                | Valor                                          |
|-------------------------|------------------------------------------------|
| `DATABASE_URL`          | conexión pooled de Neon                        |
| `DATABASE_URL_UNPOOLED` | conexión directa de Neon                       |
| `AUTH_SECRET`           | resultado de `openssl rand -base64 32`         |
| `BUSINESS_TIMEZONE`     | `America/Argentina/Buenos_Aires` (o la tuya)   |

3. Deploy.

El script `build` corre `prisma generate && prisma migrate deploy && next build`, así que **las migraciones
pendientes se aplican solas en cada deploy** usando la conexión directa.

## 3. Datos de ejemplo

```bash
npm run db:seed    # usa DATABASE_URL de .env
```

La contraseña del admin del seed es pública en el README: para una demo está bien, pero no la uses con datos reales.

## Notas

- **Driver:** la app usa node-postgres (`pg`) a través del adapter de Prisma, con `attachDatabasePool` de
  `@vercel/functions`. Es lo que Neon recomienda en Vercel con Fluid compute: el pool se reutiliza entre
  requests y las conexiones ociosas se cierran antes de que la función se suspenda.
- `migrate deploy` en el build es lo más simple para un proyecto chico. En un equipo grande se suele correr
  como paso separado del pipeline.
- Neon suspende la base tras 5 minutos sin uso (plan gratuito): la primera request después tarda unos cientos
  de milisegundos más.
