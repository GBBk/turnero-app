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
    <form action={action} className="space-y-4">
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {rows.map((r) => (
          <div key={r.weekday} className="grid grid-cols-[1fr_auto] items-center gap-3 p-3 sm:grid-cols-[10rem_auto_8rem_8rem]">
            <span className="font-medium">{WEEKDAYS[r.weekday]}</span>
            <label className="flex items-center gap-2 font-normal">
              <input type="checkbox" name={`open-${r.weekday}`} defaultChecked={r.open} /> Abierto
            </label>
            <input type="time" name={`from-${r.weekday}`} defaultValue={r.from} aria-label={`Apertura ${WEEKDAYS[r.weekday]}`} />
            <input type="time" name={`to-${r.weekday}`} defaultValue={r.to} aria-label={`Cierre ${WEEKDAYS[r.weekday]}`} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton>Guardar horarios</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
