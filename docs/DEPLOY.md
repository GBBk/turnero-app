# Despliegue en Vercel + Neon

Vercel aloja la app de Next.js y Neon aloja PostgreSQL. Ambos tienen plan gratuito.
(Supabase también sirve: solo cambia de dónde sacás la cadena de conexión.)

## 1. Crear la base de datos en Neon

1. Creá un proyecto en https://neon.tech (región cercana a la de Vercel, por ejemplo `us-east-1`).
2. Copiá la **connection string** (formato `postgresql://usuario:clave@host/neondb?sslmode=require`).

## 2. Subir el repositorio a GitHub

```bash
git remote add origin git@github.com:<tu-usuario>/turnero.git
git push -u origin main
```

## 3. Importar el proyecto en Vercel

1. En https://vercel.com/new importá el repositorio. Vercel detecta Next.js solo.
2. En **Environment Variables** cargá:

| Variable            | Valor                                           |
|---------------------|-------------------------------------------------|
| `DATABASE_URL`      | la connection string de Neon                    |
| `AUTH_SECRET`       | resultado de `openssl rand -base64 32`          |
| `BUSINESS_TIMEZONE` | `America/Argentina/Buenos_Aires` (o la tuya)    |

3. Deploy.

El script `build` corre `prisma generate && prisma migrate deploy && next build`, así que **las migraciones se aplican
solas en cada deploy**, incluida la exclusion constraint.

## 4. Cargar datos de ejemplo (opcional)

Desde tu máquina, apuntando a la base de Neon:

```bash
DATABASE_URL="<connection string de Neon>" npm run db:seed
```

Después de cargar el seed, **cambiá la contraseña del admin** o crealo con otra, porque la del seed es pública en el README.

## Notas

- `migrate deploy` en el build es la opción más simple para un proyecto chico. En un equipo grande se suele
  correr como paso separado del pipeline, para que un build fallido no deje migraciones a medias.
- Si usás muchas instancias serverless, conviene la connection string **pooled** de Neon (host con `-pooler`)
  para no agotar conexiones.
