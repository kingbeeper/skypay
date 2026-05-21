import Link from "next/link";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Crear cuenta</h1>
      <p className="text-zinc-400 mb-8 text-sm">
        Empieza con saldo simulado de $0 — añade fondos desde el dashboard.
      </p>

      <SignupForm />

      <p className="mt-6 text-sm text-zinc-400 text-center">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-white hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
