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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Servicios</h1>
      <ServiceForm />
      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {services.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-4 p-4">
            <div className={s.active ? "" : "text-slate-400"}>
              <p className="font-medium">{s.name} {!s.active && "(inactivo)"}</p>
              <p className="text-sm">{s.durationMin} min · {formatPrice(s.priceCents)}</p>
            </div>
            <form action={toggleService}>
              <input type="hidden" name="serviceId" value={s.id} />
              <SubmitButton variant={s.active ? "danger" : "secondary"}>{s.active ? "Desactivar" : "Activar"}</SubmitButton>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
