import Link from "next/link";
import {
  CalendarDays,
  Heart,
  Sparkles,
  Trophy,
  CheckCircle2,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/utils";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
          <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="animate-fade-in">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/70 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" />
                  Exclusivo para mulheres
                </span>
                <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  Experiência <br />
                  <span className="text-primary">Movimento</span>{" "}
                  <span className="text-foreground/40">&</span>{" "}
                  <span className="text-primary">Bem-Estar</span>
                </h1>
                <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                  Treinos funcionais e aulas de tênis com foco no público
                  feminino. Compre seus créditos, agende sua vaga e venha
                  treinar comigo.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/cadastro">
                    <Button size="lg">
                      Criar minha conta
                      <Heart className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#pacotes">
                    <Button size="lg" variant="secondary">
                      Ver pacotes
                    </Button>
                  </Link>
                </div>
                <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Turmas de até 8 alunas
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Agenda fácil pelo site
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    Funcional + Tênis
                  </div>
                </div>
              </div>

              <div className="relative animate-fade-in">
                <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/20 via-accent/30 to-primary/10 p-1 shadow-2xl shadow-primary/20">
                  <div className="flex h-full w-full flex-col items-center justify-center gap-6 rounded-[22px] bg-gradient-to-br from-white via-muted to-accent/20 p-8">
                    <div className="grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-5xl font-display font-bold text-white shadow-xl shadow-primary/30">
                      L
                    </div>
                    <div className="text-center">
                      <p className="font-display text-2xl font-semibold">
                        Laura Gonzalez
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Treinos para você se sentir mais forte
                      </p>
                    </div>
                    <div className="grid w-full grid-cols-2 gap-3 text-center text-sm">
                      <div className="rounded-xl bg-white/70 p-3 backdrop-blur">
                        <p className="font-display text-2xl font-semibold text-primary">
                          8
                        </p>
                        <p className="text-xs text-muted-foreground">
                          alunas/turma
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/70 p-3 backdrop-blur">
                        <p className="font-display text-2xl font-semibold text-primary">
                          2x
                        </p>
                        <p className="text-xs text-muted-foreground">
                          aulas/semana
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-12 text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Como funciona
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              Simples como deve ser
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Crie sua conta",
                desc: "Cadastro rápido em menos de 1 minuto. Só precisa de e-mail e senha.",
              },
              {
                step: "2",
                title: "Compre seus créditos",
                desc: "Escolha o pacote que cabe na sua rotina, pague via PIX e envie o comprovante.",
              },
              {
                step: "3",
                title: "Agende a sua aula",
                desc: "Veja a grade da semana e faça check-in com 1 toque. Cancele até 1h antes sem perder o crédito.",
              },
            ].map((s) => (
              <Card key={s.step} className="p-6">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 font-display text-lg font-semibold text-primary">
                  {s.step}
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Pacotes */}
        <section id="pacotes" className="border-y border-border bg-muted/40 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <p className="text-sm font-medium uppercase tracking-widest text-primary">
                Pacotes
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
                Escolha o seu ritmo
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Quanto mais créditos, melhor o valor da aula. Pagamento via PIX
                com liberação automática após envio do comprovante.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {(packages ?? []).map((p, i) => {
                const featured = i === 1;
                return (
                  <Card
                    key={p.id}
                    className={
                      featured
                        ? "relative border-primary bg-white p-8 shadow-lg shadow-primary/20 ring-2 ring-primary"
                        : "p-8"
                    }
                  >
                    {featured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        Mais escolhido
                      </span>
                    )}
                    <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      {p.name}
                    </p>
                    <p className="mt-3 font-display text-4xl font-semibold">
                      {formatBRL(p.price_cents)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {p.credits === 1
                        ? "1 crédito"
                        : `${p.credits} créditos`}{" "}
                      · validade {p.validity_days} dias
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatBRL(Math.round(p.price_cents / p.credits))} por
                      aula
                    </p>
                    <ul className="mt-6 space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        Funcional e/ou tênis
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        Reserva online
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        Cancelamento até 1h antes
                      </li>
                    </ul>
                    <Link href="/cadastro" className="mt-8 block">
                      <Button
                        className="w-full"
                        variant={featured ? "primary" : "secondary"}
                      >
                        Quero esse
                      </Button>
                    </Link>
                  </Card>
                );
              })}
              {(!packages || packages.length === 0) && (
                <p className="col-span-3 text-center text-sm text-muted-foreground">
                  Pacotes serão exibidos assim que o sistema for publicado.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Grade */}
        <section id="agenda" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-12 text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Grade
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              Quando treinamos
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <p className="text-sm font-medium text-primary">Sábado · 07h00</p>
              <h3 className="mt-2 font-display text-xl font-semibold">
                Funcional + Tênis
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Treino funcional para preparar o corpo + aula de tênis.
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm font-medium text-primary">Sábado · 09h00</p>
              <h3 className="mt-2 font-display text-xl font-semibold">
                Funcional
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Treino funcional completo, força e mobilidade.
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm font-medium text-primary">
                Domingo · 09h00
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold">
                Funcional (datas especiais)
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Datas variáveis publicadas conforme disponibilidade.
              </p>
            </Card>
          </div>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-10 text-center text-white shadow-xl shadow-primary/30 sm:p-14">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">
              Bora começar?
            </h2>
            <p className="mt-3 text-white/90">
              Crie sua conta agora e veja as próximas aulas disponíveis.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/cadastro">
                <Button size="lg" variant="secondary" className="bg-white">
                  Criar minha conta
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white hover:bg-white/15"
                >
                  Já tenho conta
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Laura Gonzalez · Movimento &amp; Bem-Estar</p>
          <p>Pagamentos via PIX · (21) 98860-0208</p>
        </div>
      </footer>
    </>
  );
}
