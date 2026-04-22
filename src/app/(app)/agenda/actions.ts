"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function checkInAction(slotId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("book_class", {
    p_slot_id: slotId,
  });
  revalidatePath("/agenda");
  revalidatePath("/minhas-aulas");
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function cancelBookingAction(slotId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_booking", {
    p_slot_id: slotId,
  });
  revalidatePath("/agenda");
  revalidatePath("/minhas-aulas");
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}
