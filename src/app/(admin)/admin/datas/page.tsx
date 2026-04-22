import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { NewSlotForm } from "./new-slot-form";
import { DeleteSlotButton } from "./delete-slot-button";

export default async function AdminDatasPage() {
  const supabase = await createClient();
  const { data: classTypes } = await supabase
    .from("class_types")
    .select("id, name")
    .order("name");

  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 120);
  const { data: slots } = await supabase
    .from("class_slots_with_counts")
    .select("*")
    .gte("starts_at", new Date().toISOString())
    .lte("starts_at", horizon.toISOString())
    .order("starts_at", { ascending: true });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
      <Card className="h-fit p-6">
        <h2 className="font-display text-xl font-semibold">Nova aula</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use para cadastrar domingos ou qualquer aula extra. As aulas fixas de
          sábado (07h e 09h) já são geradas automaticamente.
        </p>
        <div className="mt-4">
          <NewSlotForm classTypes={classTypes ?? []} />
        </div>
      </Card>

      <div>
        <h2 className="font-display text-xl font-semibold">Aulas futuras</h2>
        <div className="mt-3 space-y-2">
          {(slots ?? []).map((s) => {
            const start = new Date(s.starts_at);
            return (
              <Card key={s.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {start.toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })}{" "}
                      ·{" "}
                      {start.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.class_type_name} · {s.bookings_count ?? 0}/{s.capacity}
                    </p>
                  </div>
                  {s.bookings_count === 0 ? (
                    <DeleteSlotButton slotId={s.id} />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      tem alunas — cancele em &quot;Aulas&quot;
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
          {(!slots || slots.length === 0) && (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma aula futura cadastrada.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
