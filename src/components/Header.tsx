import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

const navLink = "rounded-md px-2 py-1 text-slate hover:text-ink";

export async function Header() {
  const session = await getSession();
  return (
    <header className="border-b border-rule bg-paper">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-3xl font-extrabold leading-none tracking-tight text-ink">
          Turnero
        </Link>
        <div className="flex flex-wrap items-center gap-x-2 text-sm font-medium">
          {session ? (
            <>
              <Link href="/reservar" className={navLink}>Reservar</Link>
              <Link href="/mis-turnos" className={navLink}>Mis turnos</Link>
              {session.role === "ADMIN" && <Link href="/admin" className={navLink}>Agenda</Link>}
              <form action={logout}>
                <button className={navLink}>Salir</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={navLink}>Ingresar</Link>
              <Link href="/registro" className="ml-1 rounded-md bg-ink px-3 py-1.5 text-white hover:bg-ink/90">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
