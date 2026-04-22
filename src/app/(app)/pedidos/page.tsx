import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

const statusLabel: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" }> = {
  pending: { label: "Aguardando confirmação", variant: "warning" },
  approved: { label: "Aprovado", variant: "success" },
  rejected: { label: "Rejeitado", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "default" },
};

export default async function PedidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, created_at, package_snapshot, receipt_url")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Meus pedidos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Histórico de compras e status de cada pagamento.
          </p>
        </div>
        <Link
          href="/pacotes"
          className="text-sm font-medium text-primary hover:underline"
        >
          Novo pedido →
        </Link>
      </div>

      {(!orders || orders.length === 0) && (
        <Card className="p-10 text-center text-muted-foreground">
          Você ainda não fez nenhum pedido.{" "}
          <Link href="/pacotes" className="font-medium text-primary hover:underline">
            Ver pacotes
          </Link>
        </Card>
      )}

      <div className="space-y-3">
        {(orders ?? []).map((o) => {
          const snap = o.package_snapshot as {
            name: string;
            credits: number;
            price_cents: number;
          };
          const st = statusLabel[o.status] ?? statusLabel.pending;
          return (
            <Link
              key={o.id}
              href={`/pedidos/${o.id}`}
              className="block"
            >
              <Card className="p-5 transition-colors hover:border-primary hover:bg-primary/5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-display text-lg font-semibold">
                        {snap.name}
                      </p>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("pt-BR")}
                      {!o.receipt_url && o.status === "pending" && (
                        <span className="ml-2 text-warning">
                          · falta enviar o comprovante
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="font-display text-xl font-semibold">
                    {formatBRL(snap.price_cents)}
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
