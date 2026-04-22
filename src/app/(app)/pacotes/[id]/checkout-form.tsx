"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CheckoutForm({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success("Chave PIX copiada!");
        setTimeout(() => setCopied(false), 2000);
      }}
      className="grid h-8 w-8 place-items-center rounded-md border border-border bg-white hover:bg-muted"
      aria-label="Copiar chave PIX"
    >
      {copied ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}
