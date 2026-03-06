export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      
      {/* Header */}
      <header className="flex items-center justify-between px-10 py-6 border-b border-white/10">
        <h1 className="text-xl font-semibold tracking-wide">
          <span className="text-white/90">MIRA</span>
          <span className="text-red-600">LO</span>
        </h1>
      </header>

      <main>{children}</main>

    </div>
  )
}