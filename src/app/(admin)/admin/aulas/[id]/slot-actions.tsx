"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelSlotAction, adminCancelBookingAction } from "./actions";

export function CancelSlotButton({ slotId }: { slotId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            "Cancelar a aula e devolver os créditos de todas as alunas reservadas?",
          )
        )
          return;
        startTransition(async () => {
          const r = await cancelSlotAction(slotId);
          if (!r.ok) toast.error(r.error ?? "Erro");
          else {
            toast.success("Aula cancelada e créditos devolvidos.");
            router.refresh();
          }
        });
      }}
    >
      Cancelar aula
    </Button>
  );
}

export function AdminCancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Remover esta aluna da aula e devolver o crédito?"))
          return;
        startTransition(async () => {
          const r = await adminCancelBookingAction(bookingId);
          if (!r.ok) toast.error(r.error ?? "Erro");
          else {
            toast.success("Aluna removida e crédito devolvido.");
            router.refresh();
          }
        });
      }}
      className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      aria-label="Remover aluna"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
