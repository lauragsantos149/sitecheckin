import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function AdminAulasPage() {
  const supabase = await createClient();
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 60);
  const past = new Date();
  past.setDate(past.getDate() - 30);

  const { data: slots } = await supabase
    .from("class_slots_with_counts")
    .select("*")
    .gte("starts_at", past.toISOString())
    .lte("starts_at", horizon.toISOString())
    .order("starts_at", { ascending: true });

  const grouped = new Map<string, typeof slots>();
  (slots ?? []).forEach((s) => {
    const day = new Date(s.starts_at).toISOString().slice(0, 10);
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day)!.push(s);
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Aulas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Toque numa aula para ver a lista de presença.
      </p>

      <div className="mt-6 space-y-6">
        {Array.from(grouped.keys()).map((day) => {
          const date = new Date(day + "T00:00:00");
          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
          return (
            <div key={day}>
              <h2
                className={
                  "mb-2 font-display text-base font-semibold capitalize " +
                  (isPast ? "text-muted-foreground" : "")
                }
              >
                {date.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}
              </h2>
              <div className="grid gap-2 md:grid-cols-2">
                {grouped.get(day)!.map((s) => {
                  const start = new Date(s.starts_at);
                  const occ = s.bookings_count ?? 0;
                  return (
                    <Link key={s.id} href={`/admin/aulas/${s.id}`}>
                      <Card className="px-5 py-3 transition-colors hover:border-primary">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-display text-lg font-semibold">
                              {start.toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {s.class_type_name}
                            </p>
                          </div>
                          <p className="text-sm font-medium">
                            {occ}/{s.capacity}
                          </p>
                        </div>
                      </Card>
                    </Link>
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
