import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Bienvenido</h1>
      <p className="text-zinc-400 mb-8 text-sm">
        Entra con tu cuenta o usa el acceso demo para inversores.
      </p>

      <LoginForm />

      <p className="mt-6 text-sm text-zinc-400 text-center">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="text-white hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
