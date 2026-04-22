import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ensureWeeklySchedule } from "@/lib/schedule";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
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

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-10 sm:pb-10">
        {children}
      </main>
      <footer className="hidden border-t border-border py-6 sm:block">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground sm:px-6">
          Movimento &amp; Bem-Estar · Laura Gonzalez · (21) 98860-0208
        </div>
      </footer>
      <MobileBottomNav isAdmin={!!profile?.is_admin} />
    </>
  );
}
