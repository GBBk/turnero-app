"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { serviceSchema } from "@/lib/validation";
import { hhmmToMinutes } from "@/lib/slots";

export type AdminState = { error?: string; ok?: string } | undefined;

export async function createService(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const parsed = serviceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, durationMin, price } = parsed.data;
  // Guardamos el precio en centavos (entero) para evitar errores de punto flotante.
  await prisma.service.create({
    data: { name, durationMin, priceCents: Math.round(price * 100) },
  });
  revalidatePath("/admin/servicios");
  revalidatePath("/");
  return { ok: "Servicio agregado" };
}

export async function toggleService(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("serviceId") ?? "");
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) return;
  // No borramos servicios: tienen turnos históricos asociados. Los desactivamos.
  await prisma.service.update({ where: { id }, data: { active: !service.active } });
  revalidatePath("/admin/servicios");
  revalidatePath("/");
}

export async function saveBusinessHours(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const rows: { weekday: number; openMin: number; closeMin: number }[] = [];
  const closed: number[] = [];

  for (let weekday = 0; weekday < 7; weekday++) {
    if (formData.get(`open-${weekday}`) !== "on") {
      closed.push(weekday);
      continue;
    }
    const openMin = hhmmToMinutes(String(formData.get(`from-${weekday}`) ?? ""));
    const closeMin = hhmmToMinutes(String(formData.get(`to-${weekday}`) ?? ""));
    if (openMin === null || closeMin === null || closeMin <= openMin) {
      return { error: "Revisá los horarios: la hora de cierre debe ser posterior a la de apertura" };
    }
    rows.push({ weekday, openMin, closeMin });
  }

  // Todo o nada: si algo falla, no queda la semana a medio guardar.
  await prisma.$transaction([
    prisma.businessHours.deleteMany({ where: { weekday: { in: closed } } }),
    ...rows.map((r) =>
      prisma.businessHours.upsert({ where: { weekday: r.weekday }, update: r, create: r }),
    ),
  ]);
  revalidatePath("/admin/horarios");
  revalidatePath("/reservar");
  return { ok: "Horario guardado" };
}
