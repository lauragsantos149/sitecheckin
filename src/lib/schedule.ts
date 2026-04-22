import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureWeeklySchedule(
  supabase: SupabaseClient,
  weeksAhead = 12,
) {
  const { error } = await supabase.rpc("ensure_weekly_schedule_rollover", {
    p_weeks_ahead: weeksAhead,
  });

  if (error) {
    console.error("Falha ao atualizar grade semanal automaticamente:", error.message);
  }
}
