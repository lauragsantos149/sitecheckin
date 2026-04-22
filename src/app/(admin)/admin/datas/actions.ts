"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createSlotAction(input: {
  date: string;
  time: string;
  class_type_id: string;
  capacity: number;
  notes?: string;
}) {
  const supabase = await createClient();
  const startsAt = new Date(`${input.date}T${input.time}:00`);
  if (Number.isNaN(startsAt.getTime())) {
    return { ok: false, error: "Data/hora inválida" };
  }
  const { error } = await supabase.from("class_slots").insert({
    starts_at: startsAt.toISOString(),
    class_type_id: input.class_type_id,
    capacity: input.capacity,
    notes: input.notes || null,
    status: "open",
  });
  revalidatePath("/admin/datas");
  revalidatePath("/admin");
  revalidatePath("/agenda");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteSlotAction(slotId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("class_slots")
    .delete()
    .eq("id", slotId);
  revalidatePath("/admin/datas");
  revalidatePath("/admin");
  revalidatePath("/agenda");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
