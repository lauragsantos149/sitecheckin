import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckoutForm } from "./checkout-form";
import { createOrder } from "./actions";

export default async function PacoteCheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pkg } = await supabase
    .from("packages")
    .select("*")
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();
  if (!pkg) notFound();

  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("user_id", user.id)
    .eq("package_id", pkg.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    redirect(`/pedidos/${existing.id}`);
  }

  async function startOrder() {
    "use server";
    const order = await createOrder(id);
    redirect(`/pedidos/${order.id}`);
  }

  return (
    <div className="max-w-3xl">
      <Link href="/pacotes" className="text-sm text-muted-foreground hover:text-primary">
        ← Voltar aos pacotes
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold sm:text-4xl">
        Finalizar compra
      </h1>

      <Card className="mt-6 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pacote selecionado
            </p>
            <p className="mt-1 font-display text-2xl font-semibold">{pkg.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {pkg.credits} {pkg.credits === 1 ? "crédito" : "créditos"} ·
              validade de {pkg.validity_days} dias a partir da aprovação
            </p>
          </div>
          <p className="font-display text-2xl font-semibold text-primary sm:text-3xl">
            {formatBRL(pkg.price_cents)}
          </p>
        </div>
      </Card>

      <Card className="mt-6 p-4 sm:p-6">
        <h2 className="font-display text-lg font-semibold sm:text-xl">Como pagar</h2>
        <ol className="mt-4 space-y-4 text-sm">
          <li className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              1
            </span>
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-primary">
                <Image src="/pix-logo.svg" alt="PIX" width={16} height={16} />
                PIX
              </div>
              Faça um <strong>PIX</strong> de{" "}
              <strong>{formatBRL(pkg.price_cents)}</strong> para a chave
              celular da Laura:
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                <code className="flex-1 font-mono text-sm font-semibold sm:text-base">
                  21 98860-0208
                </code>
                <CopyPixButton value="21988600208" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Laura Gonzalez · PIX chave celular
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              2
            </span>
            <div>
              Na próxima tela, faça o <strong>upload do comprovante</strong>{" "}
              (PDF, JPG ou PNG). Clique abaixo para continuar.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              3
            </span>
            <div>
              Assim que você enviar o comprovante, os créditos caem na hora.
              A Laura pode invalidar depois, se identificar fraude.
            </div>
          </li>
        </ol>

        <form action={startOrder} className="mt-6">
          <Button type="submit" size="lg" className="w-full">
            <Upload className="h-4 w-4" />
            Já paguei — enviar comprovante
          </Button>
        </form>
      </Card>
    </div>
  );
}

function CopyPixButton({ value }: { value: string }) {
  return <CheckoutForm value={value} />;
}
