import Link from "next/link";
import { CalendarDays, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAvailableCredits } from "@/lib/credits";
import { Card, Badge } from "@/components/ui/card";
import { ClassActions } from "./class-actions";

export default async function AgendaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { total: creditsTotal, batches } = await getAvailableCredits(
    supabase,
    user!.id,
  );
  const nextExpiry = batches[0]?.expires_at
    ? new Date(batches[0].expires_at)
    : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 60);
  const now = new Date();

  const { data: slots } = await supabase
    .from("class_slots_with_counts")
    .select("*")
    .gte("starts_at", today.toISOString())
    .lte("starts_at", horizon.toISOString())
    .eq("status", "open")
    .order("starts_at", { ascending: true });

  const { data: myBookings } = await supabase
    .from("bookings")
    .select("class_slot_id, status")
    .eq("user_id", user!.id)
    .eq("status", "active");
  const myBookingMap = new Map(
    (myBookings ?? []).map((b) => [b.class_slot_id, b.status]),
  );

  const grouped = new Map<string, typeof slots>();
  (slots ?? []).forEach((s) => {
    const day = new Date(s.starts_at).toISOString().slice(0, 10);
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day)!.push(s);
  });

  const dayKeys = Array.from(grouped.keys());

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">
            Agenda
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Faça seu check-in com 1 toque. Cancela até 1h antes para manter o
            crédito.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-sm font-semibold text-primary">
            {creditsTotal} {creditsTotal === 1 ? "crédito" : "créditos"}
          </span>
          {nextExpiry && (
            <span className="text-xs text-muted-foreground">
              vence em{" "}
              {nextExpiry.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          )}
          {creditsTotal === 0 && (
            <Link
              href="/pacotes"
              className="text-xs font-medium text-primary hover:underline"
            >
              Comprar créditos →
            </Link>
          )}
        </div>
      </div>

      {dayKeys.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-primary/60" />
          Nenhuma aula publicada para os próximos 60 dias.
        </Card>
      )}

      <div className="space-y-6">
        {dayKeys.map((day) => {
          const date = new Date(day + "T00:00:00");
          const dayLabel = date.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          });
          return (
            <div key={day}>
              <h2 className="mb-3 font-display text-lg font-semibold capitalize">
                {dayLabel}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {grouped.get(day)!.map((slot) => {
                  const start = new Date(slot.starts_at);
                  const time = start.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const occupancy = slot.bookings_count ?? 0;
                  const remaining = slot.capacity - occupancy;
                  const minutesUntil = Math.floor(
                    (start.getTime() - now.getTime()) / 60000,
                  );
                  const myStatus = myBookingMap.get(slot.id);
                  const isBooked = !!myStatus;
                  const canBook =
                    !isBooked && remaining > 0 && minutesUntil >= 0;
                  const canCancel = isBooked && minutesUntil >= 60;

                  return (
                    <Card
                      key={slot.id}
                      className={
                        isBooked
                          ? "border-primary bg-primary/5 p-5 ring-1 ring-primary"
                          : "p-5"
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-display text-2xl font-semibold">
                              {time}
                            </p>
                            {isBooked && (
                              <Badge variant="success">Você está dentro</Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm font-medium text-foreground/80">
                            {slot.class_type_name}
                          </p>
                          {slot.notes && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {slot.notes}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {occupancy}/{slot.capacity}
                            </span>
                            {remaining === 0 && !isBooked && (
                              <Badge variant="destructive">Lotada</Badge>
                            )}
                            {remaining > 0 && remaining <= 2 && !isBooked && (
                              <Badge variant="warning">
                                Últimas {remaining}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ClassActions
                          slotId={slot.id}
                          isBooked={isBooked}
                          canBook={canBook}
                          canCancel={canCancel}
                          remaining={remaining}
                          minutesUntil={minutesUntil}
                          creditsTotal={creditsTotal}
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
