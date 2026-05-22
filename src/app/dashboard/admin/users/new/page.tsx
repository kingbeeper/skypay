import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { CreateUserForm } from "./CreateUserForm";

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <Link
          href="/dashboard/admin"
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Volver al panel
        </Link>
        <div className="flex items-center gap-2 mt-3 mb-2">
          <p className="text-sm font-mono text-rose-400">/ admin / nuevo usuario</p>
          <span className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/[0.08] px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-rose-300">
            interno
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Crear usuario
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Crea una cuenta manualmente. Si no especificas contraseña, se
          generará una aleatoria que verás una sola vez al terminar.
        </p>
      </div>

      <CreateUserForm />
    </div>
  );
}
