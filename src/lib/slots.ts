import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

export type TimeRange = { start: Date; end: Date };
export type DayHours = { openMin: number; closeMin: number };

/** Día de la semana (0 = domingo) de una fecha "YYYY-MM-DD", sin depender de la zona horaria del servidor. */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Convierte "fecha + minutos desde medianoche" en la zona del negocio a un instante UTC. */
export function zonedMinutesToDate(date: string, minutes: number, timeZone: string): Date {
  const hh = pad(Math.floor(minutes / 60));
  const mm = pad(minutes % 60);
  return fromZonedTime(`${date}T${hh}:${mm}:00`, timeZone);
}

export function overlaps(a: TimeRange, b: TimeRange): boolean {
  // Rangos semiabiertos [start, end): tocarse en un borde no es superposición.
  return a.start < b.end && b.start < a.end;
}

/**
 * Calcula los horarios de inicio libres para un servicio en un día.
 * Es una función pura (sin base de datos ni reloj implícito) para poder testearla fácil.
 */
export function computeAvailableSlots(params: {
  date: string;
  hours: DayHours | null;
  durationMin: number;
  busy: TimeRange[];
  now: Date;
  timeZone: string;
  stepMin: number;
}): Date[] {
  const { date, hours, durationMin, busy, now, timeZone, stepMin } = params;
  if (!hours || durationMin <= 0) return [];

  const slots: Date[] = [];
  for (let m = hours.openMin; m + durationMin <= hours.closeMin; m += stepMin) {
    const start = zonedMinutesToDate(date, m, timeZone);
    const end = new Date(start.getTime() + durationMin * 60_000);
    if (start <= now) continue;
    if (busy.some((b) => overlaps({ start, end }, b))) continue;
    slots.push(start);
  }
  return slots;
}

export function formatTime(d: Date, timeZone: string) {
  return formatInTimeZone(d, timeZone, "HH:mm");
}

export function formatDateTime(d: Date, timeZone: string) {
  return formatInTimeZone(d, timeZone, "dd/MM/yyyy HH:mm");
}

/** "YYYY-MM-DD" de hoy en la zona del negocio. */
export function todayIn(timeZone: string, now = new Date()) {
  return formatInTimeZone(now, timeZone, "yyyy-MM-dd");
}

export function addDaysToDateString(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function minutesToHHMM(min: number) {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

export function hhmmToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}
