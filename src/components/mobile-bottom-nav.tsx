"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CreditCard, FileText, LayoutGrid, Shield } from "lucide-react";

type MobileBottomNavProps = {
  isAdmin?: boolean;
};

export function MobileBottomNav({ isAdmin = false }: MobileBottomNavProps) {
  const pathname = usePathname();

  const items = [
    { href: "/agenda", label: "Agenda", icon: CalendarDays },
    { href: "/minhas-aulas", label: "Aulas", icon: LayoutGrid },
    { href: "/pacotes", label: "Créditos", icon: CreditCard },
    { href: "/pedidos", label: "Pedidos", icon: FileText },
  ];

  if (isAdmin) {
    items.push({ href: "/admin", label: "Admin", icon: Shield });
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] md:hidden"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex max-w-6xl items-stretch justify-between gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors " +
                (active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted")
              }
            >
              <Icon className="mb-1 h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
