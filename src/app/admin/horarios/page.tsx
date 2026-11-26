import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { minutesToHHMM } from "@/lib/slots";
import { HoursForm } from "@/components/HoursForm";

export default async function HorariosPage() {
  await requireAdmin();
  const hours = await prisma.businessHours.findMany();
  // Mostramos la semana empezando el lunes.
  const order = [1, 2, 3, 4, 5, 6, 0];
  const rows = order.map((weekday) => {
    const h = hours.find((x) => x.weekday === weekday);
    return {
      weekday,
      open: Boolean(h),
      from: minutesToHHMM(h?.openMin ?? 9 * 60),
      to: minutesToHHMM(h?.closeMin ?? 18 * 60),
    };
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Horario de atención</h1>
      <p className="text-sm text-slate-500">Los cambios no afectan los turnos ya reservados.</p>
      <HoursForm rows={rows} />
    </div>
  );
}
