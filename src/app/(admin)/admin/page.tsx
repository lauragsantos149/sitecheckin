import Link from "next/link";
import { CalendarDays, ClipboardList, Users, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { count: pendingCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .not("receipt_url", "is", null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 7);

  const { data: weekClasses } = await supabase
    .from("class_slots_with_counts")
    .select("*")
    .gte("starts_at", today.toISOString())
    .lt("starts_at", horizon.toISOString())
    .order("starts_at", { ascending: true });

  const { count: alunasCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_admin", false);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Painel da Laura</h1>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Link href="/admin/pedidos">
          <Card className="p-6 transition-colors hover:border-primary">
            <div className="flex items-center justify-between">
              <ClipboardList className="h-6 w-6 text-primary" />
              {(pendingCount ?? 0) > 0 && (
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-warning px-1.5 text-xs font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">
              {pendingCount ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">
              pedidos aguardando aprovação
            </p>
          </Card>
        </Link>
        <Card className="p-6">
          <CalendarDays className="h-6 w-6 text-primary" />
          <p className="mt-3 font-display text-2xl font-semibold">
            {weekClasses?.length ?? 0}
          </p>
          <p className="text-sm text-muted-foreground">aulas nos próximos 7 dias</p>
        </Card>
        <Link href="/admin/alunas">
          <Card className="p-6 transition-colors hover:border-primary">
            <Users className="h-6 w-6 text-primary" />
            <p className="mt-3 font-display text-2xl font-semibold">
              {alunasCount ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">alunas cadastradas</p>
          </Card>
        </Link>
      </div>

      <h2 className="mt-10 mb-3 font-display text-xl font-semibold">
        Ações rápidas
      </h2>
      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/admin/datas">
          <Card className="p-5 transition-colors hover:border-primary">
            <p className="font-medium">Criar nova aula</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastrar novos horários e datas especiais.
            </p>
          </Card>
        </Link>
        <Link href="/admin/aulas">
          <Card className="p-5 transition-colors hover:border-primary">
            <p className="font-medium">Editar agenda</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerenciar turmas, presenças e cancelamentos.
            </p>
          </Card>
        </Link>
        <Link href="/admin/pedidos">
          <Card className="p-5 transition-colors hover:border-primary">
            <p className="font-medium">Verificar pedidos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Validar ou cancelar comprovantes enviados.
            </p>
          </Card>
        </Link>
      </div>

      <h2 className="mt-10 mb-3 font-display text-xl font-semibold">
        Próximas aulas
      </h2>
      <div className="space-y-2">
        {(weekClasses ?? []).map((s) => {
          const start = new Date(s.starts_at);
          const occ = s.bookings_count ?? 0;
          return (
            <Link key={s.id} href={`/admin/aulas/${s.id}`}>
              <Card className="px-5 py-3 transition-colors hover:border-primary">
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
                      {s.class_type_name}
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    {occ}/{s.capacity}
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
        {(!weekClasses || weekClasses.length === 0) && (
          <Card className="p-6 text-center text-muted-foreground">
            <AlertCircle className="mx-auto mb-2 h-5 w-5 text-warning" />
            Nenhuma aula nos próximos 7 dias.{" "}
            <Link
              href="/admin/datas"
              className="font-medium text-primary hover:underline"
            >
              Cadastrar datas
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
