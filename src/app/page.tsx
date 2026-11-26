import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const services = await prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Reservá tu turno en segundos</h1>
        <p className="max-w-2xl text-slate-600">
          Elegí el servicio, mirá los horarios libres en tiempo real y confirmá. Sin llamadas ni mensajes.
        </p>
        <Link href="/reservar" className="inline-block rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700">
          Reservar turno
        </Link>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold">Servicios</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <li key={s.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-slate-500">{s.durationMin} min · {formatPrice(s.priceCents)}</p>
              <Link href={`/reservar?service=${s.id}`} className="mt-3 inline-block text-sm font-medium text-indigo-700 hover:underline">
                Elegir →
              </Link>
            </li>
          ))}
          {services.length === 0 && <p className="text-slate-500">Todavía no hay servicios cargados.</p>}
        </ul>
      </section>
    </div>
  );
}
