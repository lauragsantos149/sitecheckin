import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CreditBatch = {
  id: string;
  remaining_credits: number;
  expires_at: string;
};

export async function getAvailableCredits(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ total: number; batches: CreditBatch[] }> {
  const { data } = await supabase
    .from("credit_batches")
    .select("id, remaining_credits, expires_at")
    .eq("user_id", userId)
    .gt("remaining_credits", 0)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true });
  const batches = (data ?? []) as CreditBatch[];
  const total = batches.reduce((acc, b) => acc + b.remaining_credits, 0);
  return { total, batches };
}
