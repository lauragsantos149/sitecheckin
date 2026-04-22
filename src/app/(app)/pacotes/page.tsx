import Image from "next/image";
import { CheckCircle2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAvailableCredits } from "@/lib/credits";
import { Card } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { buyPackage } from "./actions";
import { CheckoutForm } from "./[id]/checkout-form";
import { ReceiptUpload } from "../pedidos/[id]/receipt-upload";

export default async function PacotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { total } = await getAvailableCredits(supabase, user!.id);

  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const { data: pendingOrder } = await supabase
    .from("orders")
    .select("id, status, receipt_url, package_snapshot")
    .eq("user_id", user!.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const pendingSnap = pendingOrder?.package_snapshot as
    | { name?: string; price_cents?: number }
    | undefined;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold sm:text-4xl">
          Comprar créditos
        </h1>
        <p className="mt-2 text-muted-foreground">
          Você tem <span className="font-semibold text-primary">{total}</span>{" "}
          {total === 1 ? "crédito" : "créditos"} válidos agora. Escolha um
          pacote abaixo, pague via PIX e envie o comprovante — os créditos caem
          na hora.
        </p>
      </div>

      <Card className="mb-6 border-primary/30 bg-primary/5 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Image src="/pix-logo.svg" alt="PIX" width={24} height={24} />
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            PIX da Laura (celular)
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-2">
          <code className="text-sm font-semibold sm:text-base">(21) 98860-0208</code>
          <CheckoutForm value="21988600208" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Laura Gonzalez · Chave PIX celular
        </p>
      </Card>

      <Card className="mb-6 p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold sm:text-xl">Enviar comprovante</h2>
        {pendingOrder ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Pedido pendente: <span className="font-medium text-foreground">{pendingSnap?.name ?? "Pacote"}</span>
              {pendingSnap?.price_cents ? ` · ${formatBRL(pendingSnap.price_cents)}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Formatos aceitos: PDF, JPEG ou PNG (até 5MB).
            </p>
            <div className="mt-4">
              <ReceiptUpload orderId={pendingOrder.id} hasReceipt={!!pendingOrder.receipt_url} />
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Escolha um pacote abaixo e clique em Comprar para gerar um pedido.
              Assim que o pedido existir, o campo de upload aparece aqui.
            </p>
            <Button type="button" variant="outline" className="mt-4 w-full sm:w-auto" disabled>
              <Upload className="h-4 w-4" />
              Sem pedido pendente
            </Button>
          </>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {(packages ?? []).map((p, i) => {
          const featured = i === 1;
          return (
            <Card
              key={p.id}
              className={
                featured
                  ? "relative border-primary p-5 shadow-lg shadow-primary/20 ring-2 ring-primary sm:p-8"
                  : "p-5 sm:p-8"
              }
            >
              {featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Mais escolhido
                </span>
              )}
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {p.name}
              </p>
              <p className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                {formatBRL(p.price_cents)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {p.credits === 1 ? "1 crédito" : `${p.credits} créditos`} ·
                validade {p.validity_days} dias
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatBRL(Math.round(p.price_cents / p.credits))} por aula
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  Funcional e/ou tênis
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  Reserva online na grade
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  Cancela até 1h antes e mantém o crédito
                </li>
              </ul>
              <form action={buyPackage} className="mt-8 block">
                <input type="hidden" name="id" value={p.id} />
                <Button
                  type="submit"
                  className="w-full"
                  variant={featured ? "primary" : "secondary"}
                >
                  Comprar
                </Button>
              </form>
            </Card>
          );
        })}
        {(!packages || packages.length === 0) && (
          <Card className="p-6 text-sm text-muted-foreground md:col-span-3">
            Nenhum pacote ativo no momento. Rode as migrations para publicar os
            pacotes de compra.
          </Card>
        )}
      </div>
    </div>
  );
}
