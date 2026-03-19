"use client";
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/videos/background.mp4" type="video/mp4" />
      </video>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      {/* Logo clickable */}
      <div className="absolute top-8 left-10 z-20 cursor-pointer" onClick={() => window.location.href = "/"}>
        <h1 className="text-3xl font-extrabold tracking-wide">
          <span className="text-white/90">MIRA</span>
          <span className="text-red-600">LO</span>
        </h1>
      </div>
      {/* Content */}
      <div className="relative z-10 flex h-full w-full items-center justify-center flex-col">
        {children}
      </div>
      {/* Footer Buttons */}
      <div className="absolute bottom-6 right-10 z-20 flex gap-6 text-sm">
        <button className="text-white/80 hover:text-red-600 transition-colors">
          Términos
        </button>
        <button className="text-white/80 hover:text-red-600 transition-colors">
          Privacidad
        </button>
      </div>
    </div>
  )
}