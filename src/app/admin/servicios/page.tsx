import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { toggleService } from "@/app/actions/admin";
import { formatPrice } from "@/lib/format";
import { ServiceForm } from "@/components/ServiceForm";
import { SubmitButton } from "@/components/SubmitButton";

export default async function ServiciosPage() {
  await requireAdmin();
  const services = await prisma.service.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  return (
    <div className="grid gap-12 md:grid-cols-[3fr_2fr]">
      <section>
        <h1 className="font-display text-5xl font-extrabold">Servicios</h1>
        <p className="mt-1 text-slate">Los servicios pausados no se pueden reservar, pero conservan sus turnos.</p>
        <ul className="mt-6 divide-y divide-rule border-y border-rule">
          {services.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 py-4">
              <div className={s.active ? "" : "text-slate"}>
                <p className="font-semibold">
                  {s.name}
                  {!s.active && <span className="ml-2 text-sm font-normal">(pausado)</span>}
                </p>
                <p className="text-sm text-slate">{s.durationMin} min, {formatPrice(s.priceCents)}</p>
              </div>
              <form action={toggleService}>
                <input type="hidden" name="serviceId" value={s.id} />
                <SubmitButton variant={s.active ? "quiet" : "secondary"}>{s.active ? "Pausar" : "Reactivar"}</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-display text-3xl font-extrabold">Nuevo servicio</h2>
        <ServiceForm />
      </section>
    </div>
  );
}
