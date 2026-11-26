/**
 * Tests de integración contra una base PostgreSQL real (no mocks), porque la
 * regla anti doble reserva vive en la base de datos.
 * Usan TEST_DATABASE_URL; si no está definida, se saltean.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const TEST_DB = process.env.TEST_DATABASE_URL;
if (TEST_DB) process.env.DATABASE_URL = TEST_DB;

describe.skipIf(!TEST_DB)("reservas (integración)", async () => {
  const { prisma } = await import("@/lib/db");
  const { bookAppointment, cancelAppointment, getAvailableSlots } = await import("@/lib/booking");

  // Lunes 7/1/2030, 9:00 hora de Buenos Aires = 12:00 UTC. "now" fijo para que el test no dependa del día.
  const now = new Date("2030-01-01T12:00:00Z");
  const nineAm = new Date("2030-01-07T12:00:00Z");
  let serviceId = "";
  let ana = "";
  let beto = "";

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.appointment.deleteMany();
    await prisma.service.deleteMany();
    await prisma.user.deleteMany();
    await prisma.businessHours.deleteMany();
    await prisma.businessHours.create({ data: { weekday: 1, openMin: 9 * 60, closeMin: 12 * 60 } });
    serviceId = (await prisma.service.create({ data: { name: "Corte", durationMin: 30, priceCents: 1000 } })).id;
    ana = (await prisma.user.create({ data: { name: "Ana", email: "ana@test.dev", passwordHash: "x" } })).id;
    beto = (await prisma.user.create({ data: { name: "Beto", email: "beto@test.dev", passwordHash: "x" } })).id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("reserva un horario libre y deja de ofrecerlo", async () => {
    const res = await bookAppointment(ana, serviceId, nineAm, now);
    expect(res.ok).toBe(true);
    const slots = await getAvailableSlots(serviceId, "2030-01-07", now);
    expect(slots.some((s) => s.getTime() === nineAm.getTime())).toBe(false);
  });

  it("rechaza un horario fuera del horario de atención", async () => {
    const res = await bookAppointment(ana, serviceId, new Date("2030-01-07T20:00:00Z"), now);
    expect(res).toEqual({ ok: false, error: "Ese horario ya no está disponible" });
  });

  it("dos reservas simultáneas del mismo horario: solo una gana", async () => {
    const results = await Promise.all([
      bookAppointment(ana, serviceId, nineAm, now),
      bookAppointment(beto, serviceId, nineAm, now),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await prisma.appointment.count({ where: { status: "BOOKED" } })).toBe(1);
  });

  it("la base de datos rechaza turnos superpuestos aunque se salteen las validaciones", async () => {
    await prisma.appointment.create({
      data: { userId: ana, serviceId, startsAt: nineAm, endsAt: new Date("2030-01-07T12:30:00Z") },
    });
    await expect(
      prisma.appointment.create({
        data: {
          userId: beto,
          serviceId,
          startsAt: new Date("2030-01-07T12:15:00Z"),
          endsAt: new Date("2030-01-07T12:45:00Z"),
        },
      }),
    ).rejects.toThrow();
  });

  it("un cliente no puede cancelar el turno de otro, pero el admin sí", async () => {
    const res = await bookAppointment(ana, serviceId, nineAm, now);
    if (!res.ok) throw new Error(res.error);
    expect(await cancelAppointment(res.appointmentId, { userId: beto, role: "CLIENT" })).toBe(false);
    expect(await cancelAppointment(res.appointmentId, { userId: beto, role: "ADMIN" })).toBe(true);
  });

  it("al cancelar, el horario vuelve a estar disponible", async () => {
    const res = await bookAppointment(ana, serviceId, nineAm, now);
    if (!res.ok) throw new Error(res.error);
    await cancelAppointment(res.appointmentId, { userId: ana, role: "CLIENT" });
    const again = await bookAppointment(beto, serviceId, nineAm, now);
    expect(again.ok).toBe(true);
  });
});
