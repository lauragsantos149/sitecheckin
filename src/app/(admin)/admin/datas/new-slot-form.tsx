"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { createSlotAction } from "./actions";

type ClassType = { id: string; name: string };

export function NewSlotForm({ classTypes }: { classTypes: ClassType[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [classTypeId, setClassTypeId] = useState(classTypes[0]?.id ?? "");
  const [capacity, setCapacity] = useState(8);
  const [notes, setNotes] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time || !classTypeId) {
      toast.error("Preencha data, horário e tipo de aula.");
      return;
    }
    startTransition(async () => {
      const r = await createSlotAction({
        date,
        time,
        class_type_id: classTypeId,
        capacity,
        notes,
      });
      if (!r.ok) toast.error(r.error ?? "Erro");
      else {
        toast.success("Aula cadastrada!");
        setDate("");
        setNotes("");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label>Data</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Horário</Label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Vagas</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </div>
      </div>
      <div>
        <Label>Tipo de aula</Label>
        <select
          value={classTypeId}
          onChange={(e) => setClassTypeId(e.target.value)}
          className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {classTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Observação (opcional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: aula de domingo no Parque do Flamengo"
          rows={2}
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Cadastrando..." : "Cadastrar aula"}
      </Button>
    </form>
  );
}
