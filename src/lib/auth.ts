import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  signSession,
  verifySession,
  type SessionPayload,
} from "./session";

export async function createSession(payload: SessionPayload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true, // JavaScript del navegador no puede leerla (mitiga XSS)
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // mitiga CSRF en requests cross-site
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession() {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/**
 * El middleware ya filtra rutas, pero cada Server Action vuelve a verificar:
 * las acciones son endpoints POST públicos y no hay que confiar solo en la UI.
 */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/");
  return session;
}
