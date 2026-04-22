import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
};

export default async function AdminAlunasPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone, created_at")
    .eq("is_admin", false)
    .order("full_name", { ascending: true });

  const { data: creditTotals } = await supabase
    .from("user_credit_totals")
    .select("user_id, total_remaining");
  const creditMap = new Map(
    (creditTotals ?? []).map((c) => [c.user_id, c.total_remaining]),
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Alunas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Lista de cadastradas e saldo de créditos válidos.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr className="text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">Cadastro</th>
              <th className="px-4 py-3 text-right">Créditos</th>
            </tr>
          </thead>
          <tbody>
            {((profiles ?? []) as ProfileRow[]).map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{p.full_name}</td>
                <td className="px-4 py-3">
                  {p.phone ? (
                    <a
                      href={`https://wa.me/55${p.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {p.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {creditMap.get(p.id) ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!profiles || profiles.length === 0) && (
          <Card className="m-4 p-6 text-center text-muted-foreground">
            Nenhuma aluna cadastrada ainda.
          </Card>
        )}
      </div>
    </div>
  );
}
