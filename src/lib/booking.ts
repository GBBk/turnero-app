import { prisma } from "./db";
import { BUSINESS_TIMEZONE, MAX_DAYS_AHEAD, SLOT_STEP_MIN } from "./config";
import {
  addDaysToDateString,
  computeAvailableSlots,
  todayIn,
  weekdayOf,
  zonedMinutesToDate,
} from "./slots";
import { formatInTimeZone } from "date-fns-tz";

export async function getAvailableSlots(serviceId: string, date: string, now = new Date()) {
  const service = await prisma.service.findFirst({ where: { id: serviceId, active: true } });
  if (!service) return [];

  const today = todayIn(BUSINESS_TIMEZONE, now);
  if (date < today || date > addDaysToDateString(today, MAX_DAYS_AHEAD)) return [];

  const hours = await prisma.businessHours.findUnique({ where: { weekday: weekdayOf(date) } });
  if (!hours) return [];

  // Traemos solo los turnos activos que caen dentro del horario de ese día.
  const dayStart = zonedMinutesToDate(date, hours.openMin, BUSINESS_TIMEZONE);
  const dayEnd = zonedMinutesToDate(date, hours.closeMin, BUSINESS_TIMEZONE);
  const busy = await prisma.appointment.findMany({
    where: { status: "BOOKED", startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
    select: { startsAt: true, endsAt: true },
  });

  return computeAvailableSlots({
    date,
    hours,
    durationMin: service.durationMin,
    busy: busy.map((b) => ({ start: b.startsAt, end: b.endsAt })),
    now,
    timeZone: BUSINESS_TIMEZONE,
    stepMin: SLOT_STEP_MIN,
  });
}

export type BookResult =
  | { ok: true; appointmentId: string }
  | { ok: false; error: string };

/** PostgreSQL devuelve el código 23P01 cuando se viola una exclusion constraint. */
export function isOverlapError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("23P01") || message.includes("appointments_no_overlap");
}

export async function bookAppointment(
  userId: string,
  serviceId: string,
  startsAt: Date,
  now = new Date(),
): Promise<BookResult> {
  const service = await prisma.service.findFirst({ where: { id: serviceId, active: true } });
  if (!service) return { ok: false, error: "El servicio no existe o no está disponible" };

  // Validamos que el horario pedido sea uno de los que ofrecemos. Así cubrimos
  // de una vez: horario de atención, alineación, que sea futuro y el rango de días.
  const date = formatInTimeZone(startsAt, BUSINESS_TIMEZONE, "yyyy-MM-dd");
  const slots = await getAvailableSlots(serviceId, date, now);
  if (!slots.some((s) => s.getTime() === startsAt.getTime())) {
    return { ok: false, error: "Ese horario ya no está disponible" };
  }

  const endsAt = new Date(startsAt.getTime() + service.durationMin * 60_000);
  try {
    const appointment = await prisma.appointment.create({
      data: { userId, serviceId, startsAt, endsAt },
    });
    return { ok: true, appointmentId: appointment.id };
  } catch (err) {
    // Carrera: otra persona reservó entre nuestra validación y el INSERT.
    // La base de datos es la última línea de defensa.
    if (isOverlapError(err)) return { ok: false, error: "Ese horario se acaba de ocupar" };
    throw err;
  }
}

/** Cancela un turno. Un cliente solo puede cancelar los suyos; el admin, cualquiera. */
export async function cancelAppointment(
  appointmentId: string,
  actor: { userId: string; role: "CLIENT" | "ADMIN" },
) {
  const where =
    actor.role === "ADMIN"
      ? { id: appointmentId, status: "BOOKED" as const }
      : { id: appointmentId, status: "BOOKED" as const, userId: actor.userId };
  const res = await prisma.appointment.updateMany({ where, data: { status: "CANCELLED" } });
  return res.count === 1;
}
