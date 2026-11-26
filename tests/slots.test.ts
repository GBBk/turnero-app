import { describe, expect, it } from "vitest";
import {
  addDaysToDateString,
  computeAvailableSlots,
  hhmmToMinutes,
  overlaps,
  weekdayOf,
  zonedMinutesToDate,
} from "@/lib/slots";

const TZ = "America/Argentina/Buenos_Aires"; // UTC-3, sin horario de verano
const base = {
  date: "2030-01-07", // lunes
  hours: { openMin: 9 * 60, closeMin: 11 * 60 },
  durationMin: 30,
  busy: [],
  now: new Date("2030-01-01T00:00:00Z"),
  timeZone: TZ,
  stepMin: 30,
};
const hhmm = (d: Date) => d.toISOString().slice(11, 16);

describe("zonedMinutesToDate", () => {
  it("convierte la hora local del negocio a UTC", () => {
    expect(zonedMinutesToDate("2030-01-07", 9 * 60, TZ).toISOString()).toBe("2030-01-07T12:00:00.000Z");
  });
});

describe("computeAvailableSlots", () => {
  it("genera horarios dentro del horario de atención sin pasarse del cierre", () => {
    const slots = computeAvailableSlots(base);
    // 9:00, 9:30, 10:00, 10:30 locales = 12:00..13:30 UTC. 11:00 no entra (terminaría 11:30).
    expect(slots.map(hhmm)).toEqual(["12:00", "12:30", "13:00", "13:30"]);
  });

  it("no ofrece horarios si el servicio no entra en el día", () => {
    expect(computeAvailableSlots({ ...base, durationMin: 180 })).toEqual([]);
  });

  it("devuelve vacío si el negocio está cerrado", () => {
    expect(computeAvailableSlots({ ...base, hours: null })).toEqual([]);
  });

  it("excluye horarios que se superponen con turnos ocupados", () => {
    const busy = [{ start: new Date("2030-01-07T12:30:00Z"), end: new Date("2030-01-07T13:00:00Z") }];
    expect(computeAvailableSlots({ ...base, busy }).map(hhmm)).toEqual(["12:00", "13:00", "13:30"]);
  });

  it("un servicio largo no puede empezar si choca con un turno posterior", () => {
    const busy = [{ start: new Date("2030-01-07T13:00:00Z"), end: new Date("2030-01-07T13:30:00Z") }];
    const slots = computeAvailableSlots({ ...base, durationMin: 60, busy });
    // 9:00-10:00 local entra; 9:30-10:30 choca con 10:00-10:30; 10:30-11:30 se pasa del cierre.
    expect(slots.map(hhmm)).toEqual(["12:00"]);
  });

  it("no ofrece horarios en el pasado", () => {
    const now = new Date("2030-01-07T12:45:00Z"); // 9:45 local
    expect(computeAvailableSlots({ ...base, now }).map(hhmm)).toEqual(["13:00", "13:30"]);
  });
});

describe("overlaps", () => {
  const r = (a: string, b: string) => ({ start: new Date(a), end: new Date(b) });
  it("turnos que se tocan en el borde no se superponen", () => {
    expect(overlaps(r("2030-01-01T10:00Z", "2030-01-01T10:30Z"), r("2030-01-01T10:30Z", "2030-01-01T11:00Z"))).toBe(false);
  });
  it("detecta superposición parcial y total", () => {
    expect(overlaps(r("2030-01-01T10:00Z", "2030-01-01T10:30Z"), r("2030-01-01T10:15Z", "2030-01-01T10:45Z"))).toBe(true);
    expect(overlaps(r("2030-01-01T10:00Z", "2030-01-01T12:00Z"), r("2030-01-01T10:15Z", "2030-01-01T10:45Z"))).toBe(true);
  });
});

describe("helpers de fechas", () => {
  it("weekdayOf no depende de la zona del servidor", () => {
    expect(weekdayOf("2030-01-07")).toBe(1);
    expect(weekdayOf("2030-01-06")).toBe(0);
  });
  it("addDaysToDateString cruza fin de mes y de año", () => {
    expect(addDaysToDateString("2029-12-31", 1)).toBe("2030-01-01");
  });
  it("hhmmToMinutes valida el formato", () => {
    expect(hhmmToMinutes("09:30")).toBe(570);
    expect(hhmmToMinutes("25:00")).toBeNull();
    expect(hhmmToMinutes("9:30")).toBeNull();
  });
});
