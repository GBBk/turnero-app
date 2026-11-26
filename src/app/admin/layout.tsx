import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <nav className="flex gap-4 border-b border-slate-200 pb-3 text-sm font-medium">
        <Link href="/admin" className="hover:text-indigo-700">Agenda</Link>
        <Link href="/admin/servicios" className="hover:text-indigo-700">Servicios</Link>
        <Link href="/admin/horarios" className="hover:text-indigo-700">Horarios</Link>
      </nav>
      {children}
    </div>
  );
}
