# Diseño visual

Rediseño hecho siguiendo la guía *frontend-design*: primero un plan de tokens, después una revisión del plan
contra el brief para evitar las elecciones "por defecto", y recién ahí el código.

## Brief

- **Qué es:** reservas online para un negocio chico de servicios. Los datos de demo son de una barbería.
- **Quién lo usa:** clientes desde el celular, apurados, y el dueño mirando la agenda del día.
- **Trabajo principal:** encontrar un horario libre y reservarlo en pocos toques.

## Tokens

| Token | Hex | Uso |
|---|---|---|
| `ground` | `#EEF2F4` | fondo, gris azulado frío |
| `paper` | `#FFFFFF` | superficies y barra de confirmación |
| `ink` | `#14213D` | texto, estructura, día elegido |
| `slate` | `#5B7083` | texto secundario |
| `rule` | `#C9D3DA` | líneas divisorias |
| `pole` | `#C8102E` | acción principal y horario seleccionado, nada más |

La paleta sale del poste de barbería (azul, rojo, blanco), no de una plantilla. El rojo se usa poco
para que siempre signifique "esto es lo que vas a hacer".

**Tipografía:** *Big Shoulders* (condensada, de cartel de comercio) para la marca, los títulos y **los horarios**;
*Public Sans* para la interfaz. Números tabulares en todo el sitio para que los horarios queden alineados.

## Decisiones

- **El horario es el protagonista.** La home abre con el próximo turno libre real, sacado de la base, en
  tipografía gigante. Es el dato que más le sirve a quien llega y es la única "audacia" visual del sitio;
  todo lo demás es sobrio (listas con líneas finas, sin tarjetas ni sombras).
- **Un solo movimiento:** la hora de la home aparece al cargar. Se respeta `prefers-reduced-motion`.
- **Elegir no es reservar.** Tocar un horario lo selecciona y aparece una barra fija con el resumen
  ("Corte de pelo, lunes 30 de noviembre a las 9:15") y el botón *Reservar turno*. Evita reservas por un toque accidental.
- **Días como botones, no un `<input type=date>`.** Se ven los próximos 14 días y los cerrados aparecen
  punteados y no se pueden tocar, así nadie elige un domingo para encontrarse con "no hay horarios".
- **Horarios agrupados en Mañana y Tarde**, porque así piensa la gente un turno.
- **Numeración solo donde hay secuencia:** los 3 pasos de la reserva.
- **Textos:** verbos concretos y el mismo nombre en todo el flujo (*Reservar turno* en la home, en el botón
  y "Turno reservado" en la confirmación). Errores que dicen qué pasó y qué hacer.
- **Accesibilidad:** foco visible en rojo, radios reales detrás de los botones de horario (se pueden usar con
  teclado), `aria-current` en el servicio, el día y la sección activa del admin, sin scroll horizontal a 390 px.
