import "./globals.css"
import { Inter } from "next/font/google"
import AuthTokenSync from "@/features/auth/components/AuthTokenSync"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} relative h-full bg-black`}>
        {/* Video o imagen de fondo global */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="fixed inset-0 w-full h-full object-cover object-center -z-10 opacity-60"
          poster="/assets/images/hero-poster.jpg"
        >
          <source src="/videos/background.mp4" type="video/mp4" />
        </video>
        {/* Overlay para oscurecer */}
        <div className="fixed inset-0 bg-black/70 -z-10" />

        {/* Sincroniza token de callback OAuth con el estado de auth */}
        <AuthTokenSync />

        {/* Contenido */}
        {children}
      </body>
    </html>
  )
}