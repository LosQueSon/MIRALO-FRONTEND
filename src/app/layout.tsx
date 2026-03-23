import "./globals.css"
import { Inter } from "next/font/google"
import Header from "@/components/header/Header"

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
        {/* Video de fondo persistente */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="fixed inset-0 h-full w-full object-cover -z-10"
        >
          <source src="/videos/background.mp4" type="video/mp4" />
        </video>

        {/* Overlay oscuro persistente */}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10" />

        {/* Header fijo */}
        <Header />

        {/* Contenido */}
        {children}
      </body>
    </html>
  )
}