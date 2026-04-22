import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let creditsTotal = 0;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = !!profile?.is_admin;

    const { data: credits } = await supabase
      .from("credit_batches")
      .select("remaining_credits, expires_at")
      .eq("user_id", user.id)
      .gt("remaining_credits", 0)
      .gt("expires_at", new Date().toISOString());
    creditsTotal = (credits ?? []).reduce(
      (acc, b) => acc + b.remaining_credits,
      0,
    );
  }

  const userLinks = [
    { href: "/agenda", label: "Agenda" },
    { href: "/minhas-aulas", label: "Minhas aulas" },
    { href: "/pacotes", label: "Comprar créditos" },
    { href: "/pedidos", label: "Meus pedidos" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex min-h-16 items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo_laura.png" alt="Laura Gonzalez" className="h-10 w-auto object-contain" />
        </Link>

        <nav className="hidden gap-1 md:flex">
          {user ? (
            <>
              {userLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
                >
                  Admin
                </Link>
              )}
            </>
          ) : (
            <Link
              href="/#agenda"
              className="rounded-full px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Como funciona
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary sm:inline-flex">
                {creditsTotal} {creditsTotal === 1 ? "crédito" : "créditos"}
              </span>
              <span className="inline-flex rounded-full border border-primary/30 bg-primary/5 px-2 py-1 text-[11px] font-medium text-primary sm:hidden">
                {creditsTotal} {creditsTotal === 1 ? "crédito" : "créditos"}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link href="/cadastro">
                <Button size="sm">Criar conta</Button>
              </Link>
            </>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}
