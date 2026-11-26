export const BUSINESS_TIMEZONE =
  process.env.BUSINESS_TIMEZONE ?? "America/Argentina/Buenos_Aires";

/** Cada cuántos minutos se ofrece un horario de inicio. */
export const SLOT_STEP_MIN = 15;

/** Hasta cuántos días hacia adelante se puede reservar. */
export const MAX_DAYS_AHEAD = 30;

export const WEEKDAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
