import { requireUser } from "@/lib/auth";
import { getTheme } from "@/lib/theme";
import { NameForm } from "./NameForm";
import { PasswordForm } from "./PasswordForm";
import { ThemePreference } from "./ThemePreference";
import { DeleteAccount } from "./DeleteAccount";
import { TwoFactor } from "./TwoFactor";
import { ReplayTourButton } from "./ReplayTourButton";
import { RecoveryCodes } from "./RecoveryCodes";
import { KycVerification } from "./KycVerification";
import { prisma } from "@/lib/db";
import { ACHIEVEMENTS } from "@/lib/achievements";

export default async function SettingsPage() {
  const user = await requireUser();
  const theme = await getTheme();
  const earned = await prisma.achievement.findMany({
    where: { userId: user.id },
  });
  const earnedCodes = new Set(earned.map((e) => e.code));

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
        title="Verificación de identidad"
        subtitle="KYC necesario para desbloquear todos los límites de operación."
      >
        <KycVerification status={user.kycStatus} />
      </Section>

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
        title={`Logros · ${earnedCodes.size} / ${ACHIEVEMENTS.length}`}
        subtitle="Insignias que ganas usando la app. Se desbloquean automáticamente."
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const earned = earnedCodes.has(a.code);
            return (
              <div
                key={a.code}
                className={`rounded-2xl border p-4 text-center transition-opacity ${
                  earned
                    ? "border-white/[0.08] bg-white/[0.02]"
                    : "border-white/[0.04] bg-white/[0.01] opacity-40"
                }`}
              >
                <div
                  className="mx-auto h-10 w-10 rounded-full inline-flex items-center justify-center text-base font-mono font-bold"
                  style={{
                    backgroundColor: a.color + (earned ? "22" : "0a"),
                    color: a.color,
                  }}
                >
                  {a.icon}
                </div>
                <div className="mt-2 text-xs font-medium">{a.title}</div>
                <div className="text-[10px] text-zinc-500 mt-1 leading-tight">
                  {a.description}
                </div>
              </div>
            );
          })}
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
