import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { cancel } from "@/app/actions/appointments";
import { BUSINESS_TIMEZONE } from "@/lib/config";
import { addDaysToDateString, formatTime, todayIn, zonedMinutesToDate } from "@/lib/slots";
import { longDate } from "@/lib/dates";
import { dateParamSchema } from "@/lib/validation";
import { formatPrice } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";

const dayButton = "rounded-md border border-rule bg-paper px-3 py-2 text-sm font-semibold hover:border-ink";

export default async function AdminAgenda({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const today = todayIn(BUSINESS_TIMEZONE);
  const date = dateParamSchema.safeParse(params.date).success ? params.date! : today;

  // Límites del día en la zona del negocio, convertidos a UTC para la consulta.
  const from = zonedMinutesToDate(date, 0, BUSINESS_TIMEZONE);
  const to = zonedMinutesToDate(addDaysToDateString(date, 1), 0, BUSINESS_TIMEZONE);

  const appointments = await prisma.appointment.findMany({
    where: { startsAt: { gte: from, lt: to } },
    include: { service: true, user: { select: { name: true, email: true } } },
    orderBy: { startsAt: "asc" },
  });
  const booked = appointments.filter((a) => a.status === "BOOKED");
  const revenue = booked.reduce((sum, a) => sum + a.service.priceCents, 0);
  const label = longDate(new Date(`${date}T15:00:00Z`), BUSINESS_TIMEZONE);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-extrabold first-letter:uppercase sm:text-6xl">
            {date === today ? "Hoy" : label}
          </h1>
          <p className="mt-1 text-lg text-slate">
            {booked.length === 0
              ? "Sin turnos reservados"
              : `${booked.length} ${booked.length === 1 ? "turno" : "turnos"}, ${formatPrice(revenue)} estimados`}
            {date === today && <span className="first-letter:uppercase">, {label}</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin?date=${addDaysToDateString(date, -1)}`} className={dayButton}>Día anterior</Link>
          {date !== today && <Link href="/admin" className={dayButton}>Hoy</Link>}
          <Link href={`/admin?date=${addDaysToDateString(date, 1)}`} className={dayButton}>Día siguiente</Link>
          <form className="flex items-center gap-2">
            <label htmlFor="date" className="sr-only">Ir a una fecha</label>
            <input id="date" type="date" name="date" defaultValue={date} className="w-40" />
            <button className={dayButton}>Ver</button>
          </form>
        </div>
      </div>

      {appointments.length === 0 ? (
        <p className="border-y border-rule py-8 text-lg text-slate">No hay turnos para este día.</p>
      ) : (
        <ol className="divide-y divide-rule border-y border-rule">
          {appointments.map((a) => {
            const cancelled = a.status === "CANCELLED";
            return (
              <li
                key={a.id}
                data-email={a.user.email}
                className={`grid grid-cols-[6.5rem_1fr] items-center gap-x-4 gap-y-1 py-4 sm:grid-cols-[8rem_1fr_1fr_auto] ${cancelled ? "text-slate" : ""}`}
              >
                <span className={`font-display text-3xl font-extrabold leading-none ${cancelled ? "line-through" : ""}`}>
                  {formatTime(a.startsAt, BUSINESS_TIMEZONE)}
                  <span className="block text-base font-semibold text-slate">hasta {formatTime(a.endsAt, BUSINESS_TIMEZONE)}</span>
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{a.user.name}</p>
                  <p className="truncate text-sm text-slate">{a.user.email}</p>
                </div>
                <p className="col-start-2 sm:col-start-auto">
                  {a.service.name}
                  {cancelled && <span className="ml-2 text-sm">(cancelado)</span>}
                </p>
                <div className="col-start-2 sm:col-start-auto sm:text-right">
                  {!cancelled && (
                    <form action={cancel}>
                      <input type="hidden" name="appointmentId" value={a.id} />
                      <SubmitButton variant="quiet" pendingText="Cancelando…">Cancelar turno</SubmitButton>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
