import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ensureWeeklySchedule } from "@/lib/schedule";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensureWeeklySchedule(supabase);

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) redirect("/agenda");

  const tabs = [
    { href: "/admin", label: "Visão geral" },
    { href: "/admin/pedidos", label: "Pedidos" },
    { href: "/admin/aulas", label: "Aulas" },
    { href: "/admin/datas", label: "Datas variáveis" },
    { href: "/admin/alunas", label: "Alunas" },
  ];

  return (
    <>
      <SiteHeader />
      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 pb-24 sm:px-6 sm:py-10 sm:pb-10">
        {children}
      </main>
      <MobileBottomNav isAdmin />
    </>
  );
}
