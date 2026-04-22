import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Criar conta</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Experiência exclusiva para mulheres. Leva menos de 1 minuto.
      </p>
      <div className="mt-6">
        <SignupForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
