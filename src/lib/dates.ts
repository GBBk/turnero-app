import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { addDaysToDateString, todayIn, weekdayOf } from "./slots";

const SHORT_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** "lunes 30 de noviembre" */
export function longDate(d: Date, timeZone: string) {
  return formatInTimeZone(d, timeZone, "EEEE d 'de' MMMM", { locale: es });
}

/** Etiqueta relativa para el día de un instante: "hoy", "mañana" o "lunes 30/11". */
export function relativeDay(d: Date, timeZone: string, now = new Date()) {
  const date = formatInTimeZone(d, timeZone, "yyyy-MM-dd");
  const today = todayIn(timeZone, now);
  if (date === today) return "hoy";
  if (date === addDaysToDateString(today, 1)) return "mañana";
  return formatInTimeZone(d, timeZone, "EEEE d/MM", { locale: es });
}

/** Próximos `count` días con su etiqueta corta, para el selector de días. */
export function upcomingDays(timeZone: string, count: number, openWeekdays: Set<number>) {
  const today = todayIn(timeZone);
  return Array.from({ length: count }, (_, i) => {
    const date = addDaysToDateString(today, i);
    const weekday = weekdayOf(date);
    return {
      date,
      dayName: i === 0 ? "Hoy" : SHORT_DAYS[weekday],
      dayNumber: Number(date.slice(8, 10)),
      month: Number(date.slice(5, 7)),
      open: openWeekdays.has(weekday),
    };
  });
}
