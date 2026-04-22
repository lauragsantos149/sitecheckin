import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />
      <div className="pointer-events-none absolute -top-32 -left-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-10 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          ← Voltar para o início
        </Link>
        <div className="rounded-2xl border border-border bg-white/90 p-8 shadow-xl shadow-primary/10 backdrop-blur">
          {children}
        </div>
      </div>
    </main>
  );
}
