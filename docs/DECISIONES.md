# Decisiones de diseño (y cómo defenderlas en una entrevista)

Cada sección explica **qué** se eligió, **por qué**, y **qué alternativa** existía. Al final hay preguntas
típicas de entrevista con respuestas cortas.

## 1. Next.js App Router con Server Actions, sin API REST aparte

**Qué:** las páginas son Server Components que consultan la base directamente, y las mutaciones (reservar,
cancelar, crear servicio) son Server Actions.

**Por qué:** un solo proyecto, un solo deploy y tipos compartidos de punta a punta. Los formularios funcionan
incluso sin JavaScript (progressive enhancement) y hay menos código "pegamento" (fetch, endpoints, estados de carga).

**Alternativa:** una API REST con Express y un frontend React separado. Tiene sentido si hay otros clientes
(app móvil) consumiendo la misma API. Para este alcance sumaba complejidad sin beneficio.

**Ojo:** una Server Action es un endpoint POST público. Por eso cada acción vuelve a validar sesión y rol
(`requireUser` / `requireAdmin`) y valida los datos con Zod, aunque la UI ya lo haga.

## 2. PostgreSQL + Prisma

**Por qué PostgreSQL:** datos relacionales claros (usuarios, servicios, turnos) y, sobre todo, funcionalidades
que resuelven el problema central de la app: tipos de rango (`tstzrange`) y exclusion constraints.

**Por qué Prisma:** esquema declarativo, cliente con tipos generados (si cambio una columna, TypeScript marca
todos los usos) y migraciones versionadas en SQL. Cuando Prisma no alcanza (la exclusion constraint), se edita
el SQL de la migración a mano.

**Alternativa:** Drizzle (más cercano a SQL, más liviano) o SQL directo con `pg`. Prisma es el más difundido y
el más fácil de leer para quien revisa el repo.

## 3. Evitar la doble reserva: exclusion constraint en la base de datos

Este es el punto más importante del proyecto.

**El problema:** "chequear si el horario está libre y después insertar" tiene una condición de carrera.
Si dos personas reservan las 10:00 al mismo tiempo, ambas pasan el chequeo y ambas insertan.

**La solución:**

```sql
ALTER TABLE appointments ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (tstzrange(starts_at, ends_at, '[)') WITH &&)
  WHERE (status = 'BOOKED');
```

- `tstzrange(inicio, fin, '[)')` es un rango semiabierto: un turno de 9:30 a 10:00 no choca con uno de 10:00 a 10:30.
- `&&` es el operador "se superpone".
- `WHERE status = 'BOOKED'` hace que los turnos cancelados no bloqueen el horario.
- Necesita la extensión `btree_gist`.

La app igual valida antes de insertar (para dar un buen mensaje de error), pero **la base de datos es la
última línea de defensa**. Si el INSERT falla con el código `23P01`, se responde "Ese horario se acaba de ocupar".
Hay un test que lanza dos reservas en paralelo y verifica que solo una gana.

**Alternativas:**
- *Índice único sobre `starts_at`:* solo evita turnos que empiezan exactamente a la misma hora; no detecta
  un turno de 45 minutos que pisa al siguiente.
- *Transacción `SERIALIZABLE` o `SELECT ... FOR UPDATE`:* funciona, pero depende de que todo el código
  lo haga bien; la constraint protege incluso contra un INSERT manual.

## 4. Cálculo de disponibilidad como función pura

`computeAvailableSlots` recibe el horario del día, la duración, los turnos ocupados y "ahora", y devuelve los
horarios libres. No toca la base ni lee el reloj.

**Por qué:** se testea con datos fijos, sin base de datos y sin depender de la fecha en que corre el test.
`booking.ts` se encarga de traer los datos y llamarla.

**Validar la reserva con la misma función:** al reservar, se recalculan los horarios libres y se exige que el
pedido sea uno de ellos. Así una sola regla cubre horario de atención, alineación a intervalos de 15 minutos,
fechas pasadas y límite de 30 días.

## 5. Fechas y zonas horarias

- Se guardan como `timestamptz` (instantes en UTC).
- El horario de atención se guarda como "minutos desde la medianoche" en la zona del negocio (`BUSINESS_TIMEZONE`).
- Se convierte con `date-fns-tz` al calcular y al mostrar.

**Por qué:** el servidor de Vercel corre en UTC y el cliente puede estar en otra zona. Si se usaran fechas
"locales" del servidor, los horarios saldrían corridos 3 horas.

## 6. Autenticación propia (bcrypt + JWT en cookie httpOnly)

**Qué:** contraseñas hasheadas con bcrypt; al ingresar se firma un JWT (HS256, con `jose`) con `userId`, `role`
y `name`, y se guarda en una cookie `httpOnly`, `secure` en producción y `sameSite=lax`.

**Por qué:**
- `httpOnly`: el JavaScript del navegador no puede leer la cookie, lo que mitiga robo de sesión por XSS.
- `sameSite=lax`: el navegador no la envía en POST desde otros sitios, lo que mitiga CSRF. Next.js además
  verifica el origen de las Server Actions.
- `jose` funciona en el runtime Edge, así el middleware puede verificar la sesión sin tocar la base.
- Mismo mensaje de error para "email no existe" y "contraseña incorrecta", para no revelar qué emails están registrados.
- El parámetro `next` del login solo acepta rutas internas, para evitar *open redirects*.

**Alternativa:** Auth.js (NextAuth) o un servicio como Clerk. Son la opción correcta si se necesita login con
Google, recuperación de contraseña, etc. Acá se hizo a mano para demostrar que se entiende cómo funciona una
sesión, y está aislado en `lib/session.ts` y `lib/auth.ts` para poder reemplazarlo.

**Limitación conocida:** un JWT no se puede revocar antes de que expire (7 días). Si se cambia el rol de un
usuario, el cambio aplica en su próximo login. La solución sería una tabla de sesiones en la base.

## 7. Autorización en dos capas

1. **Middleware:** redirige antes de renderizar si no hay sesión o si un cliente entra a `/admin`.
2. **Páginas y Server Actions:** vuelven a chequear con `requireUser` / `requireAdmin`.

Al cancelar, un cliente solo puede afectar sus propios turnos: el `WHERE` incluye `userId`, así que aunque
alguien mande el id de un turno ajeno, no se modifica nada.

## 8. Otros detalles de modelado

- **Precios en centavos (enteros):** evita errores de redondeo de punto flotante (`0.1 + 0.2 !== 0.3`).
- **Servicios se desactivan, no se borran:** tienen turnos históricos asociados.
- **Turnos se cancelan, no se borran:** queda historial y la agenda del admin los muestra tachados.
- **Guardar horarios es una transacción:** la semana se guarda completa o no se guarda.

## 9. Tests

- **Unit tests** del cálculo de horarios: bordes del horario, servicios que no entran, superposición, pasado.
- **Integración contra PostgreSQL real** (no mocks), porque la regla crítica vive en la base. Incluye la
  carrera de dos reservas simultáneas.
- **CI en GitHub Actions** con un contenedor de PostgreSQL: lint, chequeo de tipos y tests en cada push.

## Preguntas típicas de entrevista

**¿Qué pasa si dos usuarios reservan el mismo turno al mismo tiempo?**
Ambos pasan la validación de la app, pero la exclusion constraint de PostgreSQL rechaza el segundo INSERT
(error 23P01). Lo capturo y muestro "Ese horario se acaba de ocupar". Tengo un test que lo prueba.

**¿Por qué no validar solo en el frontend?**
Porque el frontend se puede saltear: cualquiera puede mandar un POST a mano. La UI valida para la experiencia
del usuario; el servidor y la base validan para la seguridad y la integridad.

**¿Dónde guardás la sesión y por qué no en localStorage?**
En una cookie httpOnly. localStorage es accesible desde JavaScript, así que un XSS podría robar el token.

**¿Cómo escalaría esto a varios profesionales?**
Agregaría un modelo `Staff`, una columna `staff_id` en turnos y la incluiría en la exclusion constraint
(`staff_id WITH =, tstzrange(...) WITH &&`), así dos profesionales pueden atender a la misma hora pero uno no
puede tener dos turnos superpuestos. Por eso hace falta `btree_gist`: permite usar `=` sobre columnas comunes en un índice GiST.

**¿Cómo manejás las zonas horarias?**
Todo se guarda en UTC; la zona del negocio es configuración. Convierto al calcular disponibilidad y al mostrar.

**¿Qué mejorarías?**
Rate limiting en el login, tests end-to-end con Playwright, recordatorios por email, sesiones revocables y
paginación en la agenda del admin.
