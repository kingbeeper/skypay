export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto">
      <p className="text-sm font-mono text-cyan-400 mb-2">/ terms</p>
      <h1 className="text-4xl font-semibold tracking-tight mb-2">
        Términos del servicio
      </h1>
      <p className="text-xs font-mono text-zinc-600 mb-10">
        Última actualización: 22 de mayo de 2026
      </p>

      <div className="space-y-8 text-zinc-300 leading-relaxed">
        <Section title="1. Naturaleza de la demo">
          <p>
            Esta versión de Skypay es una <strong>demo privada</strong>{" "}
            destinada a inversores y partners para evaluación. Los balances, las
            transacciones, las direcciones on-chain y los pagos con tarjeta son
            simulados. No hay valor monetario real.
          </p>
        </Section>

        <Section title="2. Uso aceptable">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Una cuenta por persona.</li>
            <li>
              No abusar de la API ni intentar comprometer la infraestructura.
            </li>
            <li>No suplantar identidad de terceros.</li>
            <li>
              No usar para actividades ilegales (en producción aplicaría AML
              completo).
            </li>
          </ul>
        </Section>

        <Section title="3. Rifa">
          <p>
            La rifa es una característica de demostración. En la versión demo
            los premios no se pagan en BTC real. Cada ronda dura un mes
            calendario y el ganador se selecciona aleatoriamente con
            probabilidad proporcional a los tickets comprados.
          </p>
        </Section>

        <Section title="4. Sin garantías">
          <p>
            La demo se proporciona &quot;como está&quot;. No garantizamos
            disponibilidad, precisión ni que los datos persistan. Podemos
            reiniciar la base de datos en cualquier momento.
          </p>
        </Section>

        <Section title="5. Propiedad intelectual">
          <p>
            El código, marca y diseño de Skypay son propiedad del equipo
            fundador. Cualquier feedback que envíes podemos usarlo sin
            compensación.
          </p>
        </Section>

        <Section title="6. Cambios">
          <p>
            Podemos modificar estos términos en cualquier momento. Los cambios
            relevantes se anuncian por email o notificación in-app. Si sigues
            usando Skypay tras un cambio, aceptas los nuevos términos.
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
