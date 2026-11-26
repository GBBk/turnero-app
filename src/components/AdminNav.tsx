"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Agenda" },
  { href: "/admin/servicios", label: "Servicios" },
  { href: "/admin/horarios", label: "Horario de atención" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Administración" className="flex gap-6 border-b border-rule text-sm font-semibold">
      {links.map((l) => {
        const active = path === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-4 pb-2 ${active ? "border-pole text-ink" : "border-transparent text-slate hover:text-ink"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
