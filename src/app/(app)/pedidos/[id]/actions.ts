"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function processAutoApproval(orderId: string, receiptPath: string) {
  // Verify user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  // Bypass RLS using service role key
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order || order.user_id !== user.id) {
    throw new Error("Pedido inválido");
  }

  if (order.status !== "pending") {
    return { ok: true };
  }

  // Update order with receipt and approve it simultaneously
  const { data: updatedOrder, error: updateErr } = await supabaseAdmin
    .from("orders")
    .update({
      receipt_url: receiptPath,
      receipt_uploaded_at: new Date().toISOString(),
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateErr) throw new Error("Erro ao aprovar pedido");
  if (!updatedOrder) {
    revalidatePath(`/pedidos/${orderId}`);
    revalidatePath("/pacotes");
    revalidatePath("/agenda");
    return { ok: true };
  }

  const { data: existingBatch } = await supabaseAdmin
    .from("credit_batches")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existingBatch) {
    revalidatePath(`/pedidos/${orderId}`);
    revalidatePath("/pacotes");
    revalidatePath("/agenda");
    return { ok: true };
  }

  // Generate credits
  const snap = order.package_snapshot as {
    validity_days?: number;
    credits: number;
  };
  const validityDays = snap.validity_days || 30;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + validityDays);

  const { error: creditErr } = await supabaseAdmin
    .from("credit_batches")
    .insert({
      user_id: user.id,
      order_id: orderId,
      total_credits: snap.credits,
      remaining_credits: snap.credits,
      expires_at: expiresAt.toISOString(),
    });

  if (creditErr) throw new Error("Erro ao gerar créditos");

  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/pacotes");
  revalidatePath("/agenda");
  return { ok: true };
}
