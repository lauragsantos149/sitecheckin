"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelBookingAction } from "../agenda/actions";

const errorLabels: Record<string, string> = {
  cancel_too_late: "Cancela só até 1h antes do início.",
  not_booked: "Você não tem reserva nesta aula.",
};

export function CancelButton({
  slotId,
  canCancel,
}: {
  slotId: string;
  canCancel: boolean;
}) {
  const [pending, startTransition] = useTransition();
  if (!canCancel) {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        Não pode mais cancelar
      </Button>
    );
  }
  return (
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
          if (!r.ok) toast.error(errorLabels[r.error ?? ""] ?? r.error);
          else toast.success("Reserva cancelada.");
        });
      }}
    >
      Cancelar
    </Button>
  );
}
