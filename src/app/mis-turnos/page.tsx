import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { cancel } from "@/app/actions/appointments";
import { BUSINESS_TIMEZONE } from "@/lib/config";
import { formatDateTime } from "@/lib/slots";
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mis turnos</h1>
      {reservado && (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">¡Turno reservado!</p>
      )}
      {appointments.length === 0 ? (
        <p className="text-slate-500">
          No tenés turnos próximos. <Link href="/reservar" className="text-indigo-700 hover:underline">Reservá uno</Link>.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {appointments.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium">{a.service.name}</p>
                <p className="text-sm text-slate-500">{formatDateTime(a.startsAt, BUSINESS_TIMEZONE)} hs</p>
              </div>
              <form action={cancel}>
                <input type="hidden" name="appointmentId" value={a.id} />
                <SubmitButton variant="danger">Cancelar</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
