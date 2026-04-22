"use server";

import { createOrder } from "./[id]/actions";
import { redirect } from "next/navigation";

export async function buyPackage(formData: FormData) {
  const id = formData.get("id") as string;
  const order = await createOrder(id);
  redirect(`/pedidos/${order.id}`);
}
