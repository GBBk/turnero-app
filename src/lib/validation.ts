import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(80),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export const bookSchema = z.object({
  serviceId: z.string().min(1),
  startsAt: z.string().datetime({ message: "Horario inválido" }),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(80),
  durationMin: z.coerce
    .number()
    .int()
    .min(5, "Mínimo 5 minutos")
    .max(480, "Máximo 8 horas"),
  price: z.coerce.number().min(0, "El precio no puede ser negativo").max(10_000_000),
});

export const dateParamSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
