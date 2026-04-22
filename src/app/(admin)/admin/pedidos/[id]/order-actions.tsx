"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { approveOrderAction, rejectOrderAction, invalidateOrderAction } from "./actions";

export function OrderActions({ orderId, status }: { orderId: string, status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  if (status === "approved") {
    return (
      <div className="mt-3">
        {!showReject ? (
          <Button variant="outline" size="sm" onClick={() => setShowReject(true)}>
            <XCircle className="h-4 w-4" /> Cancelar comprovante e invalidar
          </Button>
        ) : (
          <div className="rounded-lg border border-destructive/30 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium mb-2 text-destructive">
              Tem certeza? Isso cancela o comprovante aprovado e zera os
              créditos atrelados a este pedido.
            </p>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo da invalidação (ex: fraude no pix, estorno)"
              className="bg-white"
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowReject(false)}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={() => {
                if (!confirm("Isso é irreversível. Confirmar invalidação?")) return;
                startTransition(async () => {
                  const r = await invalidateOrderAction(orderId, reason);
                  if (!r.ok) toast.error(r.error ?? "Erro ao invalidar");
                  else {
                    toast.success("Pedido invalidado e créditos zerados.");
                    router.refresh();
                  }
                });
              }}>
                Confirmar Invalidação
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="success"
          disabled={pending}
          onClick={() => {
            if (!confirm("Aprovar pagamento e liberar créditos para a aluna?"))
              return;
            startTransition(async () => {
              const r = await approveOrderAction(orderId);
              if (!r.ok) toast.error(r.error ?? "Erro");
              else {
                toast.success("Pagamento aprovado e créditos liberados!");
                router.refresh();
              }
            });
          }}
        >
          <CheckCircle2 className="h-4 w-4" />
          Aprovar e liberar créditos
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => setShowReject((s) => !s)}
        >
          <XCircle className="h-4 w-4" />
          Rejeitar
        </Button>
      </div>

      {showReject && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (opcional, vai aparecer para a aluna)"
            className="bg-white"
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowReject(false);
                setReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={() => {
                if (!confirm("Confirmar rejeição?")) return;
                startTransition(async () => {
                  const r = await rejectOrderAction(orderId, reason);
                  if (!r.ok) toast.error(r.error ?? "Erro");
                  else {
                    toast.success("Pedido rejeitado.");
                    router.refresh();
                  }
                });
              }}
            >
              Confirmar rejeição
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
