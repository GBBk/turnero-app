import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getAvailableSlots } from "@/lib/booking";
import { BUSINESS_TIMEZONE } from "@/lib/config";
import { formatTime, todayIn } from "@/lib/slots";
import { longDate, upcomingDays } from "@/lib/dates";
import { dateParamSchema } from "@/lib/validation";
import { formatPrice } from "@/lib/format";
import { SlotPicker } from "@/components/SlotPicker";

const DAYS_SHOWN = 14;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  // Los pasos sí son una secuencia, por eso van numerados.
  return (
    <section className="grid grid-cols-[2.25rem_1fr] gap-x-3 gap-y-4 md:grid-cols-[3rem_1fr] md:gap-x-4">
      <span aria-hidden className="font-display text-4xl font-extrabold leading-none text-rule md:text-5xl">{n}</span>
      <div className="min-w-0 space-y-4">
        <h2 className="font-display text-3xl font-extrabold">{title}</h2>
        {children}
      </div>
    </section>
  );
}

export default async function ReservarPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; date?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const [services, hours] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, orderBy: { durationMin: "asc" } }),
    prisma.businessHours.findMany({ select: { weekday: true } }),
  ]);

  const days = upcomingDays(BUSINESS_TIMEZONE, DAYS_SHOWN, new Set(hours.map((h) => h.weekday)));
  const requested = dateParamSchema.safeParse(params.date).success ? params.date! : null;
  const date = days.find((d) => d.date === requested)?.date ?? days.find((d) => d.open)?.date ?? todayIn(BUSINESS_TIMEZONE);
  const selected = services.find((s) => s.id === params.service);
  const slots = selected ? await getAvailableSlots(selected.id, date) : [];
  // Mediodía UTC del día elegido: cae en el mismo día en cualquier zona de América.
  const dayLabel = longDate(new Date(`${date}T15:00:00Z`), BUSINESS_TIMEZONE);

  return (
    <div className="space-y-12">
      <h1 className="font-display text-5xl font-extrabold sm:text-6xl">Reservar turno</h1>

      <Step n={1} title="Servicio">
        <ul className="divide-y divide-rule border-y border-rule">
          {services.map((s) => {
            const active = s.id === selected?.id;
            return (
              <li key={s.id}>
                <Link
                  href={`/reservar?service=${s.id}&date=${date}`}
                  aria-current={active ? "true" : undefined}
                  className={`flex items-baseline justify-between gap-4 border-l-4 py-3 pl-3 pr-1 ${
                    active ? "border-pole bg-paper" : "border-transparent hover:bg-paper"
                  }`}
                >
                  <span className="font-semibold">{s.name}</span>
                  <span className="shrink-0 text-sm text-slate">
                    {s.durationMin} min, {formatPrice(s.priceCents)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Step>

      {selected && (
        <>
          <Step n={2} title="Día">
            <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              <ul className="flex gap-2">
                {days.map((d) => {
                  const active = d.date === date;
                  const base = "flex w-16 shrink-0 flex-col items-center rounded-md border py-2";
                  if (!d.open)
                    return (
                      <li key={d.date} className={`${base} border-dashed border-rule text-slate`} title="Cerrado">
                        <span className="text-xs">{d.dayName}</span>
                        <span className="font-display text-2xl font-semibold">{d.dayNumber}</span>
                      </li>
                    );
                  return (
                    <li key={d.date}>
                      <Link
                        href={`/reservar?service=${selected.id}&date=${d.date}`}
                        aria-current={active ? "date" : undefined}
                        className={`${base} ${active ? "border-ink bg-ink text-white" : "border-rule bg-paper hover:border-ink"}`}
                      >
                        <span className="text-xs">{d.dayName}</span>
                        <span className="font-display text-2xl font-semibold">{d.dayNumber}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Step>

          <Step n={3} title="Horario">
            <p className="text-slate first-letter:uppercase">{dayLabel}</p>
            <SlotPicker
              key={`${selected.id}-${date}`}
              serviceId={selected.id}
              serviceName={selected.name}
              dayLabel={dayLabel}
              slots={slots.map((s) => ({
                iso: s.toISOString(),
                label: formatTime(s, BUSINESS_TIMEZONE),
                hour: Number(formatInTimeZone(s, BUSINESS_TIMEZONE, "H")),
              }))}
            />
          </Step>
        </>
      )}
    </div>
  );
}
