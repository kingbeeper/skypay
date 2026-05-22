import { requireUser } from "@/lib/auth";
import { getTheme } from "@/lib/theme";
import { NameForm } from "./NameForm";
import { PasswordForm } from "./PasswordForm";
import { ThemePreference } from "./ThemePreference";
import { DeleteAccount } from "./DeleteAccount";
import { TwoFactor } from "./TwoFactor";
import { ReplayTourButton } from "./ReplayTourButton";
import { RecoveryCodes } from "./RecoveryCodes";

export default async function SettingsPage() {
  const user = await requireUser();
  const theme = await getTheme();

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div>
        <p className="text-sm font-mono text-cyan-400 mb-2">/ ajustes</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Configuración de la cuenta
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Gestiona tu perfil, seguridad y preferencias de la app.
        </p>
      </div>

      <Section
        title="Apariencia"
        subtitle="Cambia entre tema oscuro y claro. Se guarda en una cookie y se aplica en todo el sitio."
      >
        <ThemePreference current={theme} />
      </Section>

      <Section
        title="Perfil"
        subtitle="Tu nombre aparece en el dashboard y en transacciones públicas."
      >
        <NameForm currentName={user.name ?? ""} />
      </Section>

      <Section
        title="Seguridad"
        subtitle="Cambia tu contraseña. Las sesiones existentes seguirán activas."
      >
        <PasswordForm />
      </Section>

      <Section
        title="Autenticación 2FA"
        subtitle="Pide un código del autenticador al iniciar sesión, además de la contraseña."
      >
        <TwoFactor enabled={user.totpEnabled} />
      </Section>

      {user.totpEnabled && (
        <Section
          title="Códigos de recuperación"
          subtitle="Plan B si pierdes el autenticador. Cada código se usa una sola vez."
        >
          <RecoveryCodes
            available={
              user.recoveryCodes
                ? (JSON.parse(user.recoveryCodes) as string[]).length
                : 0
            }
          />
        </Section>
      )}

      <Section
        title="Actividad"
        subtitle="Información de tu sesión y racha de visitas."
      >
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 grid grid-cols-2 gap-px bg-white/[0.06] -m-px overflow-hidden rounded-2xl">
          <div className="bg-[color:var(--background)] p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Racha de logins
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">
              {user.streakDays}{" "}
              <span className="text-sm font-mono text-zinc-500">
                {user.streakDays === 1 ? "día" : "días"}
              </span>
            </div>
          </div>
          <div className="bg-[color:var(--background)] p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Último login
            </div>
            <div className="mt-1 text-sm font-mono">
              {user.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Tour de bienvenida"
        subtitle="Vuelve a ver el tour interactivo de 5 pasos que se muestra en la primera visita."
      >
        <ReplayTourButton />
      </Section>

      <Section
        title="Zona peligrosa"
        subtitle="Elimina tu cuenta permanentemente. No hay vuelta atrás."
        danger
      >
        <DeleteAccount email={user.email} />
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  danger,
  children,
}: {
  title: string;
  subtitle: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className={`text-xl font-semibold tracking-tight mb-1 ${danger ? "text-rose-300" : ""}`}
      >
        {title}
      </h2>
      <p className="text-sm text-zinc-500 mb-5">{subtitle}</p>
      {children}
    </section>
  );
}
