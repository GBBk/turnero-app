import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export async function Header() {
  const session = await getSession();
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-indigo-700">Turnero</Link>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {session ? (
            <>
              <Link href="/reservar" className="hover:text-indigo-700">Reservar</Link>
              <Link href="/mis-turnos" className="hover:text-indigo-700">Mis turnos</Link>
              {session.role === "ADMIN" && (
                <Link href="/admin" className="hover:text-indigo-700">Admin</Link>
              )}
              <form action={logout}>
                <button className="text-slate-500 hover:text-slate-800">Salir ({session.name})</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-indigo-700">Ingresar</Link>
              <Link href="/registro" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
