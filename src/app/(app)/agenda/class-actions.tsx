"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { checkInAction, cancelBookingAction } from "./actions";

const errorLabels: Record<string, string> = {
  no_credits: "Você não tem créditos disponíveis. Compre um pacote.",
  slot_full: "Esta aula já está lotada.",
  slot_started: "Esta aula já começou.",
  slot_cancelled: "Esta aula foi cancelada.",
  already_booked: "Você já tem reserva nesta aula.",
  daily_limit: "Limite de 2 check-ins por dia atingido.",
  cancel_too_late: "Cancela só até 1h antes do início.",
  not_booked: "Você não tem reserva nesta aula.",
};

function decode(msg: string) {
  return errorLabels[msg] ?? msg;
}

export function ClassActions({
  slotId,
  isBooked,
  canBook,
  canCancel,
  remaining,
  minutesUntil,
  creditsTotal,
}: {
  slotId: string;
  isBooked: boolean;
  canBook: boolean;
  canCancel: boolean;
  remaining: number;
  minutesUntil: number;
  creditsTotal: number;
}) {
  const [pending, startTransition] = useTransition();

  if (isBooked) {
    return (
      <div className="flex flex-col items-end gap-1">
        {canCancel ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => {
              if (
                !confirm(
                  "Cancelar reserva? Seu crédito será devolvido para o lote original.",
                )
              )
                return;
              startTransition(async () => {
                const r = await cancelBookingAction(slotId);
                if (!r.ok) toast.error(decode(r.error ?? ""));
                else toast.success("Reserva cancelada.");
              });
            }}
          >
            Cancelar
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled>
            {minutesUntil < 0 ? "Já começou" : "Cancela só até 1h antes"}
          </Button>
        )}
      </div>
    );
  }

  if (remaining === 0) {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        Lotada
      </Button>
    );
  }
  if (minutesUntil < 0) {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        Encerrada
      </Button>
    );
  }
  if (creditsTotal === 0) {
    return (
      <Link href="/pacotes">
        <Button type="button" variant="secondary" size="sm">
          Sem créditos
        </Button>
      </Link>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={!canBook || pending}
      onClick={() =>
        startTransition(async () => {
          const r = await checkInAction(slotId);
          if (!r.ok) toast.error(decode(r.error ?? ""));
          else toast.success("Check-in feito! Te vejo na aula.");
        })
      }
    >
      {pending ? "..." : "Check-in"}
    </Button>
  );
}
