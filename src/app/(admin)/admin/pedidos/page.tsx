import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "pending" } = await searchParams;
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, status, created_at, package_snapshot, receipt_url, receipt_uploaded_at, profile:profiles!orders_user_id_fkey(full_name, phone)",
    )
    .eq("status", status)
    .order("created_at", { ascending: false });

  const tabs = [
    { key: "pending", label: "Aguardando" },
    { key: "approved", label: "Aprovados" },
    { key: "rejected", label: "Rejeitados" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Pedidos</h1>
      <div className="mt-4 flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/pedidos?status=${t.key}`}
            className={
              t.key === status
                ? "rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground"
                : "rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium hover:bg-muted"
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {(orders ?? []).map((o) => {
          const snap = o.package_snapshot as {
            name: string;
            credits: number;
            price_cents: number;
          };
          const profile = Array.isArray(o.profile) ? o.profile[0] : o.profile;
          return (
            <Link key={o.id} href={`/admin/pedidos/${o.id}`}>
              <Card className="p-5 transition-colors hover:border-primary hover:bg-primary/5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold">
                      {profile?.full_name ?? "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {snap.name} · {formatBRL(snap.price_cents)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pedido em{" "}
                      {new Date(o.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {o.receipt_url ? (
                      <Badge variant="success">Comprovante anexado</Badge>
                    ) : (
                      <Badge variant="warning">Sem comprovante</Badge>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
        {(!orders || orders.length === 0) && (
          <Card className="p-10 text-center text-muted-foreground">
            Nenhum pedido nesta categoria.
          </Card>
        )}
      </div>
    </div>
  );
}
