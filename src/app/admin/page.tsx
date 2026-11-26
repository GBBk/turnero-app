import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { cancel } from "@/app/actions/appointments";
import { BUSINESS_TIMEZONE } from "@/lib/config";
import { addDaysToDateString, formatTime, todayIn, zonedMinutesToDate } from "@/lib/slots";
import { dateParamSchema } from "@/lib/validation";
import { formatPrice } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";

export default async function AdminAgenda({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const date = dateParamSchema.safeParse(params.date).success ? params.date! : todayIn(BUSINESS_TIMEZONE);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/admin?date=${addDaysToDateString(date, -1)}`} className="rounded-lg border border-slate-300 bg-white px-3 py-2">←</Link>
          <form className="flex items-center gap-2"><input type="date" name="date" defaultValue={date} className="w-40" /><button className="rounded-lg border border-slate-300 bg-white px-3 py-2">Ir</button></form>
          <Link href={`/admin?date=${addDaysToDateString(date, 1)}`} className="rounded-lg border border-slate-300 bg-white px-3 py-2">→</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Turnos del día</p>
          <p className="text-2xl font-semibold">{booked.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Ingresos estimados</p>
          <p className="text-2xl font-semibold">{formatPrice(revenue)}</p>
        </div>
      </div>

      {appointments.length === 0 ? (
        <p className="text-slate-500">No hay turnos para este día.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2">Hora</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Servicio</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((a) => (
                <tr key={a.id} className={a.status === "CANCELLED" ? "text-slate-400" : ""}>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {formatTime(a.startsAt, BUSINESS_TIMEZONE)}–{formatTime(a.endsAt, BUSINESS_TIMEZONE)}
                  </td>
                  <td className="px-4 py-2">
                    {a.user.name}
                    <span className="block text-xs text-slate-400">{a.user.email}</span>
                  </td>
                  <td className="px-4 py-2">{a.service.name}</td>
                  <td className="px-4 py-2">{a.status === "BOOKED" ? "Reservado" : "Cancelado"}</td>
                  <td className="px-4 py-2 text-right">
                    {a.status === "BOOKED" && (
                      <form action={cancel}>
                        <input type="hidden" name="appointmentId" value={a.id} />
                        <SubmitButton variant="danger">Cancelar</SubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
