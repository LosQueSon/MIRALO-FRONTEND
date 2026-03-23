import Link from "next/link"

type FooterLink = {
  label: string
  href: string
}

interface BrandedVideoShellProps {
  children: React.ReactNode
  footerLinks: FooterLink[]
}

export default function BrandedVideoShell({
  children,
  footerLinks,
}: BrandedVideoShellProps) {
  return (
    <div className="relative min-h-screen w-screen overflow-hidden">
      {/* Logo */}
      <Link href="/" className="absolute left-10 top-8 z-20">
        <h1 className="text-3xl font-extrabold tracking-wide">
          <span className="text-white/90">MIRA</span>
          <span className="text-red-600">LO</span>
        </h1>
      </Link>

      {/* Contenido */}
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4">
        {children}
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 right-10 z-20 flex gap-6 text-sm">
        {footerLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-white/80 transition-colors hover:text-red-600"
          >
            {link.label}
          </Link>
        ))}
      </footer>
    </div>
  )
}