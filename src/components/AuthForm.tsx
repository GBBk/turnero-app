"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, register, type FormState } from "@/app/actions/auth";
import { SubmitButton } from "./SubmitButton";
import { FormMessage } from "./FormMessage";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(mode === "login" ? login : register, undefined);
  return (
    <form action={action} className="max-w-sm space-y-5">
      <div className="space-y-2">
        <h1 className="font-display text-5xl font-extrabold">{mode === "login" ? "Ingresar" : "Crear cuenta"}</h1>
        <p className="text-slate">
          {mode === "login" ? "Entrá para reservar o ver tus turnos." : "Con una cuenta podés reservar y cancelar tus turnos."}
        </p>
      </div>
      <input type="hidden" name="next" value={next ?? "/"} />
      {mode === "register" && (
        <div className="space-y-1">
          <label htmlFor="name">Nombre</label>
          <input id="name" name="name" required autoComplete="name" defaultValue={state?.name} />
        </div>
      )}
      <div className="space-y-1">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={state?.email} />
      </div>
      <div className="space-y-1">
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="w-full">{mode === "login" ? "Ingresar" : "Crear cuenta"}</SubmitButton>
      <p className="text-sm text-slate">
        {mode === "login" ? (
          <>¿No tenés cuenta? <Link href="/registro" className="font-semibold text-ink underline underline-offset-4 hover:text-pole">Registrate</Link></>
        ) : (
          <>¿Ya tenés cuenta? <Link href="/login" className="font-semibold text-ink underline underline-offset-4 hover:text-pole">Ingresá</Link></>
        )}
      </p>
    </form>
  );
}
