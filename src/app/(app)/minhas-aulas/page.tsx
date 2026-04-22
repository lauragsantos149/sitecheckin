import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/card";
import { CancelButton } from "./cancel-button";

export default async function MinhasAulasPage() {
  const supabase = await createClient();
  const now = new Date();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, status, booked_at, cancelled_at, attended, class_slot:class_slots(id, starts_at, class_type:class_types(name))",
    )
    .eq("user_id", user!.id)
    .order("booked_at", { ascending: false });

  const upcoming: typeof bookings = [];
  const past: typeof bookings = [];
  (bookings ?? []).forEach((b) => {
    const slot = Array.isArray(b.class_slot) ? b.class_slot[0] : b.class_slot;
    if (!slot) return;
    if (b.status === "active" && new Date(slot.starts_at) >= now) {
      upcoming!.push(b);
    } else {
      past!.push(b);
    }
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Minhas aulas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Próximas reservas e histórico.
      </p>

      <h2 className="mt-8 mb-3 font-display text-xl font-semibold">
        Próximas
      </h2>
      {(!upcoming || upcoming.length === 0) ? (
        <Card className="p-8 text-center text-muted-foreground">
          <CalendarDays className="mx-auto mb-2 h-7 w-7 text-primary/60" />
          Nenhuma aula reservada.{" "}
          <Link
            href="/agenda"
            className="font-medium text-primary hover:underline"
          >
            Ver agenda
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {upcoming!.map((b) => {
            const slot = Array.isArray(b.class_slot)
              ? b.class_slot[0]
              : b.class_slot;
            const ct = Array.isArray(slot.class_type)
              ? slot.class_type[0]
              : slot.class_type;
            const start = new Date(slot.starts_at);
            const minutesUntil = Math.floor(
              (start.getTime() - now.getTime()) / 60000,
            );
            const canCancel = minutesUntil >= 60;
            return (
              <Card key={b.id} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold capitalize">
                      {start.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      })}{" "}
                      ·{" "}
                      {start.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">{ct?.name}</p>
                  </div>
                  <CancelButton slotId={slot.id} canCancel={canCancel} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {past!.length > 0 && (
        <>
          <h2 className="mt-10 mb-3 font-display text-xl font-semibold">
            Histórico
          </h2>
          <div className="space-y-2">
            {past!.map((b) => {
              const slot = Array.isArray(b.class_slot)
                ? b.class_slot[0]
                : b.class_slot;
              const ct = Array.isArray(slot.class_type)
                ? slot.class_type[0]
                : slot.class_type;
              const start = new Date(slot.starts_at);
              const variant =
                b.status === "active"
                  ? "success"
                  : b.status === "cancelled_refund"
                    ? "default"
                    : "destructive";
              const label =
                b.status === "active"
                  ? "Realizada"
                  : b.status === "cancelled_refund"
                    ? "Cancelada (crédito devolvido)"
                    : b.status === "cancelled_no_refund"
                      ? "Cancelada (crédito consumido)"
                      : b.status;
              return (
                <Card key={b.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm">
                      <span className="font-medium capitalize">
                        {start.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        ·{" "}
                        {start.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        — {ct?.name}
                      </span>
                    </div>
                    <Badge variant={variant}>{label}</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
