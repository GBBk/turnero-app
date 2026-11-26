import { SignJWT, jwtVerify } from "jose";

// Este archivo no importa nada de Node ni de Prisma para poder usarse
// también en el middleware, que corre en el runtime Edge.

export type SessionPayload = { userId: string; role: "CLIENT" | "ADMIN"; name: string };

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 días

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET debe estar definido y tener al menos 32 caracteres");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string") return null;
    if (payload.role !== "CLIENT" && payload.role !== "ADMIN") return null;
    return { userId: payload.userId, role: payload.role, name: String(payload.name ?? "") };
  } catch {
    return null;
  }
}
