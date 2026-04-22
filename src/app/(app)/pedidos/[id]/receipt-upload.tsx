"use client";

import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { processAutoApproval } from "./actions";

const ALLOWED = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
const MAX_SIZE = 5 * 1024 * 1024;

export function ReceiptUpload({
  orderId,
  hasReceipt,
}: {
  orderId: string;
  hasReceipt: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!ALLOWED.includes(file.type)) {
      toast.error("Formato não aceito. Envie PDF, JPG ou PNG.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Arquivo acima de 5 MB. Comprima e tente novamente.");
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sessão expirou. Faça login novamente.");
      setUploading(false);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${user.id}/${orderId}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("receipts")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) {
      toast.error("Erro ao subir arquivo: " + upErr.message);
      setUploading(false);
      return;
    }
    try {
      await processAutoApproval(orderId, path);
      toast.success("Pagamento confirmado e créditos liberados!");
      router.refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "erro inesperado";
      toast.error("Erro ao processar o pagamento: " + message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <Button
        type="button"
        variant={hasReceipt ? "secondary" : "primary"}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        <Upload className="h-4 w-4" />
        {uploading
          ? "Enviando..."
          : hasReceipt
            ? "Enviar outro comprovante"
            : "Escolher arquivo"}
      </Button>
    </div>
  );
}
