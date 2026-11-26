"use client";

import { useActionState, useState } from "react";
import { book, type BookState } from "@/app/actions/appointments";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

type Slot = { iso: string; label: string; hour: number };

/**
 * Elegir un horario lo selecciona; reservar es un paso aparte con un resumen
 * visible, para que un toque accidental no cree un turno.
 */
export function SlotPicker({
  serviceId,
  serviceName,
  dayLabel,
  slots,
}: {
  serviceId: string;
  serviceName: string;
  dayLabel: string;
  slots: Slot[];
}) {
  const [state, action] = useActionState<BookState, FormData>(book, undefined);
  const [selected, setSelected] = useState<string | null>(null);

  if (slots.length === 0) {
    return <p className="text-lg text-slate">No quedan horarios libres este día. Elegí otro día arriba.</p>;
  }

  const groups = [
    { name: "Mañana", items: slots.filter((s) => s.hour < 13) },
    { name: "Tarde", items: slots.filter((s) => s.hour >= 13) },
  ].filter((g) => g.items.length > 0);
  const chosen = slots.find((s) => s.iso === selected);

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="serviceId" value={serviceId} />
      {groups.map((g) => (
        <fieldset key={g.name}>
          <legend className="mb-3 text-sm font-semibold text-slate">{g.name}</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
            {g.items.map((s) => (
              <label
                key={s.iso}
                className="cursor-pointer rounded-md border border-rule bg-paper py-2 text-center font-display text-3xl font-semibold text-ink hover:border-ink has-[:checked]:border-pole has-[:checked]:bg-pole has-[:checked]:text-white has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-pole"
              >
                <input
                  type="radio"
                  name="startsAt"
                  value={s.iso}
                  className="sr-only"
                  onChange={() => setSelected(s.iso)}
                  required
                />
                {s.label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="sticky bottom-0 border-t-4 border-ink bg-paper px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-base">
            {chosen ? (
              <>
                <strong>{serviceName}</strong>, {dayLabel} a las <strong>{chosen.label}</strong>
              </>
            ) : (
              <span className="text-slate">Elegí un horario</span>
            )}
          </p>
          <SubmitButton pendingText="Reservando…">Reservar turno</SubmitButton>
        </div>
        <div className="mt-3 empty:hidden">
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}
