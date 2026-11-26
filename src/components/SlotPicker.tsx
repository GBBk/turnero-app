"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { book, type BookState } from "@/app/actions/appointments";
import { FormMessage } from "./FormMessage";

type Slot = { iso: string; label: string };

function SlotButton({ slot }: { slot: Slot }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="startsAt"
      value={slot.iso}
      disabled={pending}
      className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
    >
      {slot.label}
    </button>
  );
}

// Un solo formulario: cada horario es un botón submit con su propio value,
// y el navegador envía el del botón que se presionó.
export function SlotPicker({ serviceId, slots }: { serviceId: string; slots: Slot[] }) {
  const [state, action] = useActionState<BookState, FormData>(book, undefined);
  if (slots.length === 0) {
    return <p className="text-slate-500">No hay horarios libres para este día. Probá con otra fecha.</p>;
  }
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="serviceId" value={serviceId} />
      <FormMessage state={state} />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
        {slots.map((s) => (
          <SlotButton key={s.iso} slot={s} />
        ))}
      </div>
    </form>
  );
}
