"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validation";

// Devolvemos lo que la persona escribió (salvo la contraseña) porque React 19
// resetea el formulario después de cada acción y si no se perdería el email.
export type FormState = { error?: string; name?: string; email?: string } | undefined;

function safeNext(value: FormDataEntryValue | null) {
  // Evita "open redirect": solo aceptamos rutas internas.
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? "") };
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, ...values };

  const { name, email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "Ya existe una cuenta con ese email", ...values };

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10) },
  });
  await createSession({ userId: user.id, role: user.role, name: user.name });
  redirect(safeNext(formData.get("next")));
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, email };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Mismo mensaje para email inexistente y contraseña incorrecta:
  // no revelamos qué emails están registrados.
  const valid = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!user || !valid) return { error: "Email o contraseña incorrectos", email };

  await createSession({ userId: user.id, role: user.role, name: user.name });
  const next = safeNext(formData.get("next"));
  redirect(next === "/" && user.role === "ADMIN" ? "/admin" : next);
}

export async function logout() {
  await destroySession();
  redirect("/");
}
