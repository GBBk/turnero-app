import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { cancel } from "@/app/actions/appointments";
import { BUSINESS_TIMEZONE } from "@/lib/config";
import { formatTime } from "@/lib/slots";
import { relativeDay } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";

export default async function MisTurnosPage({ searchParams }: { searchParams: Promise<{ reservado?: string }> }) {
  const session = await requireUser();
  const { reservado } = await searchParams;
  const appointments = await prisma.appointment.findMany({
    where: { userId: session.userId, status: "BOOKED", startsAt: { gte: new Date() } },
    include: { service: true },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="space-y-8">
      <h1 className="font-display text-5xl font-extrabold sm:text-6xl">Mis turnos</h1>
      {reservado && (
        <p role="status" className="border-l-4 border-ok bg-paper px-4 py-3">
          Turno reservado. Te esperamos.
        </p>
      )}
      {appointments.length === 0 ? (
        <div className="space-y-4">
          <p className="text-lg text-slate">No tenés turnos próximos.</p>
          <Link href="/reservar" className="inline-block rounded-md bg-pole px-4 py-2.5 font-semibold text-white hover:bg-pole-dark">
            Reservar turno
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-rule border-y border-rule">
          {appointments.map((a) => (
            <li key={a.id} className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 py-5 sm:grid-cols-[auto_1fr_auto]">
              <span className="row-span-2 font-display text-6xl font-extrabold leading-none sm:row-span-1">
                {formatTime(a.startsAt, BUSINESS_TIMEZONE)}
              </span>
              <div>
                <p className="text-lg font-semibold first-letter:uppercase">{relativeDay(a.startsAt, BUSINESS_TIMEZONE)}</p>
                <p className="text-slate">
                  {a.service.name}, {a.service.durationMin} min, {formatPrice(a.service.priceCents)}
                </p>
              </div>
              <form action={cancel}>
                <input type="hidden" name="appointmentId" value={a.id} />
                <SubmitButton variant="quiet" pendingText="Cancelando…">Cancelar turno</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
