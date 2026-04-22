"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteSlotAction } from "./actions";

export function DeleteSlotButton({ slotId }: { slotId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Excluir esta aula? (sem alunas reservadas)")) return;
        startTransition(async () => {
          const r = await deleteSlotAction(slotId);
          if (!r.ok) toast.error(r.error ?? "Erro");
          else {
            toast.success("Aula excluída.");
            router.refresh();
          }
        });
      }}
      className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      aria-label="Excluir"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
