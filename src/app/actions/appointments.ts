"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { bookAppointment, cancelAppointment } from "@/lib/booking";
import { bookSchema } from "@/lib/validation";

export type BookState = { error?: string } | undefined;

export async function book(_prev: BookState, formData: FormData): Promise<BookState> {
  const session = await requireUser();
  const parsed = bookSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Datos inválidos" };

  const result = await bookAppointment(
    session.userId,
    parsed.data.serviceId,
    new Date(parsed.data.startsAt),
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/reservar");
  revalidatePath("/admin");
  redirect("/mis-turnos?reservado=1");
}

export async function cancel(formData: FormData) {
  const session = await requireUser();
  const id = String(formData.get("appointmentId") ?? "");
  await cancelAppointment(id, session);
  revalidatePath("/mis-turnos");
  revalidatePath("/admin");
  revalidatePath("/reservar");
}
