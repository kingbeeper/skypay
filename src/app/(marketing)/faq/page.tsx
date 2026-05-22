const FAQS = [
  {
    q: "¿Skypay es un banco?",
    a: "No. Skypay es una plataforma fintech que combina exchange de cripto con una tarjeta de gasto Visa. Los fondos fiat están bajo custodia de un banco partner; los cripto, en custodia segregada multi-firma.",
  },
  {
    q: "¿Cómo funciona la tarjeta con cripto?",
    a: "Eliges qué activo gastar (BTC, ETH, USDC, SOL o USD). Cuando pagas, convertimos al instante al precio de mercado y se cobra del saldo elegido. Sin pre-conversión necesaria.",
  },
  {
    q: "¿Hay comisión por swap?",
    a: "En el plan Free hay un spread mínimo de mercado. En Pro el spread es cero. Ningún plan cobra fee fijo por swap.",
  },
  {
    q: "¿Cómo funciona la rifa de 1 BTC?",
    a: "Cada mes hay una ronda abierta. Compras tickets a $20 cada uno desde tu saldo USD. Al cerrar el plazo, se selecciona un ticket ganador con probabilidad proporcional al número de tickets que tengas.",
  },
  {
    q: "¿Mi dinero está seguro?",
    a: "Sí. Cripto en custodia con segregación de fondos y proof-of-reserves mensual. Fiat en bancos partner asegurados. Sesiones cifradas con iron-session. Soporte para 2FA TOTP.",
  },
  {
    q: "¿Puedo retirar mis cripto a otra wallet?",
    a: "Sí, desde Enviar puedes transferir a cualquier wallet externa. Te mostramos un resumen y la red detectada antes de confirmar para evitar errores.",
  },
  {
    q: "¿Qué redes soporta la app?",
    a: "Bitcoin (mainnet), Ethereum, Polygon, Base y Solana. USDC funciona en cualquiera de las redes EVM y en Solana SPL.",
  },
  {
    q: "¿Cuánto tarda un depósito?",
    a: "Transferencia bancaria: 1-2 días laborables. Tarjeta: instantáneo con 1.5% fee. Cripto: depende de la red (Bitcoin ~10 min, Solana <1 seg).",
  },
  {
    q: "¿Cómo cancelo mi cuenta?",
    a: "Desde Ajustes → Zona peligrosa → Eliminar mi cuenta. Te pediremos confirmar con tu email. Se borran todos tus datos. Asegúrate de retirar los fondos antes.",
  },
  {
    q: "¿Tenéis app móvil?",
    a: "Esta misma web funciona perfectamente desde el móvil. Pronto la haremos instalable como PWA con notificaciones push.",
  },
];

export default function FaqPage() {
  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <div className="text-center">
        <p className="text-sm font-mono text-cyan-400 mb-2">/ faq</p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Preguntas frecuentes
        </h1>
        <p className="mt-3 text-zinc-400">
          Las dudas más habituales. ¿Falta algo? Escríbenos a soporte@skypay.app.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((f, i) => (
          <details
            key={i}
            className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden"
          >
            <summary className="flex items-start gap-3 px-5 py-4 cursor-pointer list-none hover:bg-white/[0.02] transition-colors">
              <span className="font-mono text-xs text-zinc-500 mt-1 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 font-medium">{f.q}</span>
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 mt-1 shrink-0 text-zinc-500 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <div className="px-5 pb-5 pl-[3.25rem] text-sm text-zinc-400 leading-relaxed">
              {f.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
