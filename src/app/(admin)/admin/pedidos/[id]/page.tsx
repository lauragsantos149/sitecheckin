import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import { OrderActions } from "./order-actions";

export default async function AdminPedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "*, profile:profiles!orders_user_id_fkey(full_name, phone)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const profile = Array.isArray(order.profile)
    ? order.profile[0]
    : order.profile;
  const snap = order.package_snapshot as {
    name: string;
    credits: number;
    price_cents: number;
    validity_days: number;
  };

  let signedUrl: string | null = null;
  if (order.receipt_url) {
    const { data: signed } = await supabase.storage
      .from("receipts")
      .createSignedUrl(order.receipt_url, 60 * 60);
    signedUrl = signed?.signedUrl ?? null;
  }

  const statusVariant: Record<string, "warning" | "success" | "destructive" | "default"> = {
    pending: "warning",
    approved: "success",
    rejected: "destructive",
    cancelled: "default",
  };

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/pedidos"
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← Pedidos
      </Link>

      <div className="mt-2 flex items-center gap-3">
        <h1 className="font-display text-3xl font-semibold">
          {profile?.full_name ?? "—"}
        </h1>
        <Badge variant={statusVariant[order.status] ?? "default"}>
          {order.status}
        </Badge>
      </div>

      <Card className="mt-6 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Pacote</p>
            <p className="font-medium">{snap.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Valor</p>
            <p className="font-display text-2xl font-semibold text-primary">
              {formatBRL(snap.price_cents)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Créditos</p>
            <p className="font-medium">
              {snap.credits} · validade {snap.validity_days} dias
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Pedido em</p>
            <p className="font-medium">
              {new Date(order.created_at).toLocaleString("pt-BR")}
            </p>
          </div>
          {profile?.phone && (
            <div className="sm:col-span-2">
              <p className="text-xs uppercase text-muted-foreground">Contato</p>
              <a
                href={`https://wa.me/55${profile.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                {profile.phone}
              </a>
            </div>
          )}
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-xl font-semibold">Comprovante</h2>
        {signedUrl ? (
          <div className="mt-3">
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-sm font-medium hover:bg-primary/5"
            >
              <FileText className="h-4 w-4" />
              Abrir comprovante
            </a>
            <p className="mt-2 text-xs text-muted-foreground">
              Enviado em{" "}
              {new Date(order.receipt_uploaded_at).toLocaleString("pt-BR")}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            A aluna ainda não enviou o comprovante.
          </p>
        )}
      </Card>

      {order.status === "pending" && order.receipt_url && (
        <Card className="mt-6 p-6">
          <h2 className="font-display text-xl font-semibold">Decisão</h2>
          <OrderActions orderId={order.id} status={order.status} />
        </Card>
      )}

      {order.status === "approved" && (
        <Card className="mt-6 border-success/30 bg-success/5 p-5 text-sm">
          <div className="flex flex-col gap-4">
            <div>
              <span className="font-medium">Aprovado em{" "}</span>
              {order.approved_at && new Date(order.approved_at).toLocaleString("pt-BR")}
            </div>
            <OrderActions orderId={order.id} status={order.status} />
          </div>
        </Card>
      )}
      {order.status === "rejected" && (
        <Card className="mt-6 border-destructive/30 bg-destructive/5 p-5 text-sm">
          Rejeitado.
          {order.rejection_reason && (
            <p className="mt-1 text-muted-foreground">
              Motivo: {order.rejection_reason}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
