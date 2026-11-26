"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, register, type FormState } from "@/app/actions/auth";
import { SubmitButton } from "./SubmitButton";
import { FormMessage } from "./FormMessage";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(mode === "login" ? login : register, undefined);
  return (
    <form action={action} className="mx-auto max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold">{mode === "login" ? "Ingresar" : "Crear cuenta"}</h1>
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
      <p className="text-center text-sm text-slate-500">
        {mode === "login" ? (
          <>¿No tenés cuenta? <Link href="/registro" className="text-indigo-700 hover:underline">Registrate</Link></>
        ) : (
          <>¿Ya tenés cuenta? <Link href="/login" className="text-indigo-700 hover:underline">Ingresá</Link></>
        )}
      </p>
    </form>
  );
}
