"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function cancelSlotAction(slotId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_cancel_slot", {
    p_slot_id: slotId,
  });
  revalidatePath(`/admin/aulas/${slotId}`);
  revalidatePath("/admin/aulas");
  revalidatePath("/agenda");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminCancelBookingAction(bookingId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_cancel_booking", {
    p_booking_id: bookingId,
  });
  revalidatePath("/admin/aulas");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
