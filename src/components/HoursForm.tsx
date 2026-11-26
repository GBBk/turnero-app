"use client";

import { useActionState } from "react";
import { saveBusinessHours, type AdminState } from "@/app/actions/admin";
import { WEEKDAYS } from "@/lib/config";
import { SubmitButton } from "./SubmitButton";
import { FormMessage } from "./FormMessage";

type Row = { weekday: number; open: boolean; from: string; to: string };

export function HoursForm({ rows }: { rows: Row[] }) {
  const [state, action] = useActionState<AdminState, FormData>(saveBusinessHours, undefined);
  return (
    <form action={action} className="max-w-xl space-y-6">
      <ul className="divide-y divide-rule border-y border-rule">
        {rows.map((r) => (
          <li key={r.weekday} className="group grid grid-cols-[1fr_auto] items-center gap-3 py-3 sm:grid-cols-[9rem_6rem_1fr]">
            <span className="font-semibold">{WEEKDAYS[r.weekday]}</span>
            <label className="flex items-center gap-2 font-normal">
              <input type="checkbox" className="open-toggle" name={`open-${r.weekday}`} defaultChecked={r.open} /> Abierto
            </label>
            {/* Si el día está cerrado, las horas se atenúan: no se guardan. */}
            <div className="col-span-2 flex items-center gap-2 sm:col-span-1 group-has-[.open-toggle:not(:checked)]:opacity-40">
              <input type="time" name={`from-${r.weekday}`} defaultValue={r.from} aria-label={`Apertura del ${WEEKDAYS[r.weekday]}`} />
              <span className="text-slate">a</span>
              <input type="time" name={`to-${r.weekday}`} defaultValue={r.to} aria-label={`Cierre del ${WEEKDAYS[r.weekday]}`} />
            </div>
          </li>
        ))}
      </ul>
      <FormMessage state={state} />
      <SubmitButton pendingText="Guardando…">Guardar horario</SubmitButton>
    </form>
  );
}
