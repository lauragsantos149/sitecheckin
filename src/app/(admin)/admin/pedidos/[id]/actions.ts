"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function approveOrderAction(orderId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_order", {
    p_order_id: orderId,
  });
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function rejectOrderAction(orderId: string, reason: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_order", {
    p_order_id: orderId,
    p_reason: reason,
  });
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function invalidateOrderAction(orderId: string, reason: string) {
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { error: orderErr } = await supabaseAdmin
    .from("orders")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", orderId)
    .eq("status", "approved");

  if (orderErr) return { ok: false, error: orderErr.message };

  await supabaseAdmin
    .from("credit_batches")
    .update({ remaining_credits: 0, expires_at: new Date().toISOString() })
    .eq("order_id", orderId);

  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/alunas");
  return { ok: true };
}
