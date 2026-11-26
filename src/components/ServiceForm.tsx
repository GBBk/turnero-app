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
    <form ref={ref} action={action} className="mt-6 space-y-4">
      <div className="space-y-1">
        <label htmlFor="name">Nombre</label>
        <input id="name" name="name" required placeholder="Corte de pelo" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="durationMin">Duración en minutos</label>
          <input id="durationMin" name="durationMin" type="number" min={5} max={480} step={5} required />
        </div>
        <div className="space-y-1">
          <label htmlFor="price">Precio en pesos</label>
          <input id="price" name="price" type="number" min={0} step="0.01" required />
        </div>
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Agregando…">Agregar servicio</SubmitButton>
    </form>
  );
}
