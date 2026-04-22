import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/card";
import { CancelSlotButton, AdminCancelBookingButton } from "./slot-actions";

export default async function AdminAulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: slot } = await supabase
    .from("class_slots_with_counts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!slot) notFound();

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, status, booked_at, profile:profiles!bookings_user_id_fkey(full_name, phone)",
    )
    .eq("class_slot_id", id)
    .eq("status", "active")
    .order("booked_at", { ascending: true });

  const start = new Date(slot.starts_at);

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/aulas"
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← Aulas
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold capitalize">
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
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {slot.class_type_name}
          </p>
        </div>
        {slot.status === "open" && (
          <CancelSlotButton slotId={slot.id} />
        )}
        {slot.status === "cancelled" && (
          <Badge variant="destructive">Aula cancelada</Badge>
        )}
      </div>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <Users className="h-5 w-5 text-primary" />
            Lista de presença ({bookings?.length ?? 0}/{slot.capacity})
          </h2>
        </div>
        <div className="mt-4 space-y-2">
          {(bookings ?? []).map((b, i) => {
            const profile = Array.isArray(b.profile) ? b.profile[0] : b.profile;
            return (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-4 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium">{profile?.full_name ?? "—"}</p>
                    {profile?.phone && (
                      <a
                        href={`https://wa.me/55${profile.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                      >
                        <Phone className="h-3 w-3" />
                        {profile.phone}
                      </a>
                    )}
                  </div>
                </div>
                <AdminCancelBookingButton bookingId={b.id} />
              </div>
            );
          })}
          {(!bookings || bookings.length === 0) && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Ninguém reservou ainda.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
