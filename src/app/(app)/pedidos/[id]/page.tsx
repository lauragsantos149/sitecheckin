import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, FileText, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import { CheckoutForm } from "../../pacotes/[id]/checkout-form";
import { ReceiptUpload } from "./receipt-upload";

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .maybeSingle();
  if (!order) notFound();

  const snap = order.package_snapshot as {
    name: string;
    credits: number;
    price_cents: number;
    validity_days: number;
  };

  let receiptSignedUrl: string | null = null;
  if (order.receipt_url) {
    const { data: signed } = await supabase.storage
      .from("receipts")
      .createSignedUrl(order.receipt_url, 60 * 60);
    receiptSignedUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/pedidos"
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← Meus pedidos
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{snap.name}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Pedido criado em {new Date(order.created_at).toLocaleString("pt-BR")}
      </p>

      <Card className="mt-6 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-primary sm:text-3xl">
              {formatBRL(snap.price_cents)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {snap.credits} {snap.credits === 1 ? "crédito" : "créditos"} ·
              valem {snap.validity_days} dias após a aprovação
            </p>
          </div>
        </div>
      </Card>

      {order.status === "pending" && (
        <>
          <Card className="mt-6 border-primary ring-2 ring-primary p-4 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-primary sm:text-2xl">
              Realize o pagamento
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Siga os passos abaixo para liberar seus créditos automaticamente.
            </p>

            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary">1</span>
                  Faça um PIX
                </h3>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-primary">
                  <Image src="/pix-logo.svg" alt="PIX" width={16} height={16} />
                  PIX
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Abra o app do seu banco e faça um PIX de <strong>{formatBRL(snap.price_cents)}</strong> para:
                </p>
                <div className="mt-3 rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs uppercase text-muted-foreground mb-1">Chave Celular</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-base font-mono font-semibold sm:text-xl">
                      (21) 98860-0208
                    </code>
                    <CheckoutForm value="21988600208" />
                  </div>
                  <p className="mt-3 text-sm font-medium">Nome: Laura Gonzalez</p>
                </div>
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary">2</span>
                  Envie o comprovante
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Faça o upload do comprovante (PDF, JPEG ou PNG). Seus créditos serão liberados <strong>na hora</strong>.
                </p>

                {order.receipt_url && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <div className="flex-1">
                      Comprovante enviado em{" "}
                      {new Date(order.receipt_uploaded_at).toLocaleString("pt-BR")}
                    </div>
                    {receiptSignedUrl && (
                      <a
                        href={receiptSignedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" /> Ver
                      </a>
                    )}
                  </div>
                )}

                <div className="mt-4">
                  <ReceiptUpload orderId={order.id} hasReceipt={!!order.receipt_url} />
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {order.status === "approved" && (
        <Card className="mt-6 border-success/40 bg-success/5 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 text-success" />
            <div>
              <p className="font-display text-xl font-semibold">
                Pagamento aprovado!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Seus {snap.credits}{" "}
                {snap.credits === 1 ? "crédito está" : "créditos estão"}{" "}
                disponíveis.{" "}
                <Link
                  href="/agenda"
                  className="font-medium text-primary hover:underline"
                >
                  Ver agenda →
                </Link>
              </p>
            </div>
          </div>
        </Card>
      )}

      {order.status === "rejected" && (
        <Card className="mt-6 border-destructive/40 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-6 w-6 text-destructive" />
            <div>
              <p className="font-display text-xl font-semibold">
                Pagamento rejeitado
              </p>
              {order.rejection_reason && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Motivo: {order.rejection_reason}
                </p>
              )}
              <p className="mt-2 text-sm">
                Fale com a Laura no WhatsApp{" "}
                <a
                  href="https://wa.me/5521988600208"
                  className="font-medium text-primary hover:underline"
                >
                  (21) 98860-0208
                </a>{" "}
                para resolver.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" }> = {
    pending: { label: "Aguardando", variant: "warning" },
    approved: { label: "Aprovado", variant: "success" },
    rejected: { label: "Rejeitado", variant: "destructive" },
    cancelled: { label: "Cancelado", variant: "default" },
  };
  const m = map[status] ?? map.pending;
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
