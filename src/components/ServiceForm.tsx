"use client";

import { useActionState, useEffect, useRef } from "react";
import { createService, type AdminState } from "@/app/actions/admin";
import { SubmitButton } from "./SubmitButton";
import { FormMessage } from "./FormMessage";

export function ServiceForm() {
  const [state, action] = useActionState<AdminState, FormData>(createService, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4 sm:items-end">
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor="name">Nombre</label>
        <input id="name" name="name" required />
      </div>
      <div className="space-y-1">
        <label htmlFor="durationMin">Duración (min)</label>
        <input id="durationMin" name="durationMin" type="number" min={5} max={480} step={5} required />
      </div>
      <div className="space-y-1">
        <label htmlFor="price">Precio ($)</label>
        <input id="price" name="price" type="number" min={0} step="0.01" required />
      </div>
      <div className="sm:col-span-4 flex items-center gap-3">
        <SubmitButton>Agregar servicio</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
