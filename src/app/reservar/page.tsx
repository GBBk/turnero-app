import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getAvailableSlots } from "@/lib/booking";
import { BUSINESS_TIMEZONE, MAX_DAYS_AHEAD } from "@/lib/config";
import { addDaysToDateString, formatTime, todayIn } from "@/lib/slots";
import { dateParamSchema } from "@/lib/validation";
import { formatPrice } from "@/lib/format";
import { SlotPicker } from "@/components/SlotPicker";

export default async function ReservarPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; date?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const services = await prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  const today = todayIn(BUSINESS_TIMEZONE);
  const maxDate = addDaysToDateString(today, MAX_DAYS_AHEAD);
  const date = dateParamSchema.safeParse(params.date).success ? params.date! : today;
  const selected = services.find((s) => s.id === params.service);

  const slots = selected ? await getAvailableSlots(selected.id, date) : [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Reservar turno</h1>

      <section className="space-y-3">
        <h2 className="font-semibold">1. Elegí un servicio</h2>
        <div className="flex flex-wrap gap-2">
          {services.map((s) => (
            <Link
              key={s.id}
              href={`/reservar?service=${s.id}&date=${date}`}
              className={`rounded-lg border px-3 py-2 text-sm ${
                s.id === selected?.id
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-300 bg-white hover:border-indigo-400"
              }`}
            >
              {s.name} · {s.durationMin} min · {formatPrice(s.priceCents)}
            </Link>
          ))}
        </div>
      </section>

      {selected && (
        <>
          <section className="space-y-3">
            <h2 className="font-semibold">2. Elegí el día</h2>
            {/* Formulario GET: la fecha queda en la URL, así se puede compartir o recargar. */}
            <form className="flex max-w-xs items-end gap-2">
              <input type="hidden" name="service" value={selected.id} />
              <input type="date" name="date" defaultValue={date} min={today} max={maxDate} />
              <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">Ver</button>
            </form>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold">3. Elegí el horario</h2>
            <SlotPicker
              serviceId={selected.id}
              slots={slots.map((s) => ({ iso: s.toISOString(), label: formatTime(s, BUSINESS_TIMEZONE) }))}
            />
          </section>
        </>
      )}
    </div>
  );
}
