import RequireAuth from "@/features/auth/components/RequireAuth"
import FeaturePageShell from "@/components/layout/FeaturePageShell"

export default function ComingSoonPage() {
  return (
    <RequireAuth>
      <FeaturePageShell
        title="En construcción"
        description="Sección reservada para funciones que vendrán después: recomendaciones, biblioteca, listas y más componentes conectados al backend."
      >
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm leading-6 text-white/70">
            Esta pantalla existe para que el menú lateral siempre tenga destino y puedas validar navegación mientras construimos las vistas definitivas.
          </p>
        </section>

        <aside className="rounded-3xl border border-white/10 bg-gradient-to-b from-red-500/10 to-black/40 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-red-200">Roadmap</p>
          <p className="mt-3 text-sm leading-6 text-white/70">
            En esta área colocaremos features nuevas sin bloquear el flujo inicial de autenticación y acceso a la app.
          </p>
        </aside>
      </FeaturePageShell>
    </RequireAuth>
  )
}
