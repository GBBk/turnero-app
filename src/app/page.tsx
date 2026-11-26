import Link from "next/link";
import { prisma } from "@/lib/db";
import { getNextAvailableSlot } from "@/lib/booking";
import { BUSINESS_TIMEZONE, WEEKDAYS } from "@/lib/config";
import { formatTime, minutesToHHMM } from "@/lib/slots";
import { relativeDay } from "@/lib/dates";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [services, hours] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, orderBy: { durationMin: "asc" } }),
    prisma.businessHours.findMany(),
  ]);

  // El dato más útil para quien llega: cuándo es el próximo turno libre.
  const quickest = services[0];
  const next = quickest ? await getNextAvailableSlot(quickest.id) : null;

  const week = [1, 2, 3, 4, 5, 6, 0].map((weekday) => ({
    weekday,
    hours: hours.find((h) => h.weekday === weekday),
  }));

  return (
    <div className="space-y-16">
      <section className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          {next ? (
            <>
              <p className="text-lg text-slate">Próximo turno libre, {relativeDay(next.start, BUSINESS_TIMEZONE)}</p>
              <p className="arrive font-display text-[clamp(6rem,30vw,13rem)] font-extrabold leading-[0.85] tracking-tight">
                {formatTime(next.start, BUSINESS_TIMEZONE)}
              </p>
            </>
          ) : (
            <p className="font-display text-6xl font-extrabold leading-none">Agenda completa por ahora</p>
          )}
          <p className="mt-6 max-w-md text-lg">
            Elegí el servicio, mirá los horarios libres y confirmá. Sin llamar ni escribir.
          </p>
        </div>
        {next && quickest && (
          <Link
            href={`/reservar?service=${quickest.id}&date=${next.date}`}
            className="inline-block self-start rounded-md bg-pole px-6 py-4 text-center text-lg font-semibold text-white hover:bg-pole-dark md:self-end"
          >
            Reservar turno
          </Link>
        )}
      </section>

      <div className="grid gap-12 md:grid-cols-[3fr_2fr]">
        <section>
          <h2 className="font-display text-3xl font-extrabold">Servicios</h2>
          <ul className="mt-4 divide-y divide-rule border-y border-rule">
            {services.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/reservar?service=${s.id}`}
                  className="group flex items-baseline justify-between gap-4 py-4 hover:text-pole"
                >
                  <span className="text-lg font-semibold">{s.name}</span>
                  <span className="shrink-0 text-slate group-hover:text-pole">
                    {s.durationMin} min, {formatPrice(s.priceCents)}
                  </span>
                </Link>
              </li>
            ))}
            {services.length === 0 && <li className="py-4 text-slate">Todavía no hay servicios cargados.</li>}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-3xl font-extrabold">Horario</h2>
          <dl className="mt-4 divide-y divide-rule border-y border-rule">
            {week.map(({ weekday, hours: h }) => (
              <div key={weekday} className="flex justify-between py-2">
                <dt>{WEEKDAYS[weekday]}</dt>
                <dd className={h ? "" : "text-slate"}>
                  {h ? `${minutesToHHMM(h.openMin)} a ${minutesToHHMM(h.closeMin)}` : "Cerrado"}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
