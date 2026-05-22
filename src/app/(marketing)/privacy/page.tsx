export default function PrivacyPage() {
  return (
    <article className="prose prose-invert max-w-3xl mx-auto">
      <p className="text-sm font-mono text-cyan-400 mb-2">/ privacy</p>
      <h1 className="text-4xl font-semibold tracking-tight mb-2">
        Política de privacidad
      </h1>
      <p className="text-xs font-mono text-zinc-600 mb-10">
        Última actualización: 22 de mayo de 2026
      </p>

      <div className="space-y-8 text-zinc-300 leading-relaxed">
        <Section title="1. Datos que recopilamos">
          <p>
            Para crear tu cuenta solo necesitamos tu correo electrónico y una
            contraseña cifrada con bcrypt. Opcionalmente puedes añadir un
            nombre. No pedimos DNI, dirección ni teléfono para usar la demo.
          </p>
          <p>
            Para operaciones en producción, KYC requeriría documento de
            identidad y prueba de domicilio según regulación local.
          </p>
        </Section>

        <Section title="2. Cómo usamos tus datos">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Autenticación y seguridad de la cuenta.</li>
            <li>Mostrar tus balances y transacciones en tu dashboard.</li>
            <li>Procesar swaps, depósitos, retiradas y pagos de tarjeta.</li>
            <li>Notificarte sobre actividad en tu cuenta.</li>
            <li>
              Calcular elegibilidad para la rifa y rastrear participación.
            </li>
          </ul>
          <p>
            <strong>No vendemos tus datos.</strong> No los compartimos con
            terceros excepto para procesar pagos (Visa) o cumplir requerimientos
            legales.
          </p>
        </Section>

        <Section title="3. Cookies y tracking">
          <p>
            Usamos cookies esenciales para mantener tu sesión iniciada
            (iron-session). Una cookie adicional guarda tu preferencia de tema
            (claro/oscuro). No usamos cookies de tracking ni publicidad.
          </p>
        </Section>

        <Section title="4. Tus derechos (GDPR)">
          <p>
            Como usuario europeo tienes derecho a: acceder a tus datos,
            rectificarlos, eliminarlos, exportarlos y oponerte al procesamiento.
          </p>
          <p>
            Puedes eliminar tu cuenta completamente desde Ajustes → Zona
            peligrosa. Todos tus datos se borran de forma irreversible.
          </p>
        </Section>

        <Section title="5. Retención">
          <p>
            Mantenemos tus datos mientras tengas cuenta activa. Tras eliminar
            cuenta, borramos todo en 72 h, excepto registros financieros
            requeridos por ley (5 años para AML/KYC en operación real).
          </p>
        </Section>

        <Section title="6. Contacto">
          <p>
            Para ejercer cualquier derecho o reportar problemas, escribe a{" "}
            <code className="font-mono text-cyan-400">privacy@skypay.app</code>.
          </p>
        </Section>
      </div>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight mb-3">{title}</h2>
      <div className="text-zinc-400 space-y-3">{children}</div>
    </div>
  );
}
