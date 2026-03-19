"use client";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="w-[360px] text-white flex flex-col items-center animate-fade-in">
      <h2 className="text-3xl font-semibold mb-6 text-center">Bienvenido a MIRA<span className="text-red-600">LO</span></h2>
      <p className="text-base text-white/80 mb-8 text-center font-normal">Visualiza y comparte sin límites.<br /><span className="text-sm text-white/60">Accede para comenzar tu experiencia.</span></p>
      <button
        className="w-full min-h-[48px] rounded-full bg-red-600 text-white font-semibold text-lg shadow-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
        onClick={() => router.push("/login")}
        style={{ maxWidth: 320, height: 48 }}
      >
        Iniciar sesión
      </button>
    </div>
  );
}