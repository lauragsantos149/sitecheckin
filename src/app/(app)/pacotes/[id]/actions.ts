"use server";

import { createClient } from "@/lib/supabase/server";

export async function createOrder(packageId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error: profileErr } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name:
        (user.user_metadata?.full_name as string | undefined) ?? "",
      phone: (user.user_metadata?.phone as string | undefined) ?? null,
    },
    { onConflict: "id" },
  );
  if (profileErr) {
    throw new Error("Não foi possível preparar o perfil para criar o pedido");
  }

  const { data: pkg, error: pkgErr } = await supabase
    .from("packages")
    .select("*")
    .eq("id", packageId)
    .eq("active", true)
    .maybeSingle();
  if (pkgErr || !pkg) throw new Error("Pacote indisponível");

  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("user_id", user.id)
    .eq("package_id", pkg.id)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      package_id: pkg.id,
      package_snapshot: {
        name: pkg.name,
        credits: pkg.credits,
        price_cents: pkg.price_cents,
        validity_days: pkg.validity_days,
      },
      status: "pending",
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Erro ao criar pedido");
  return data;
}
