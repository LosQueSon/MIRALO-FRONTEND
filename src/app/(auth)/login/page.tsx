import LoginForm from "@/features/auth/components/LoginForm"

export default function LoginPage() {
  return (
    <main className="h-screen w-screen overflow-hidden flex items-center justify-center px-6 sm:px-8 md:px-12">
      <section className="w-full max-w-3xl text-center space-y-8 animate-fade-in">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-tight text-white">
          Iniciar sesión
        </h1>

        <div className="space-y-2">
          <p className="text-xl sm:text-xl text-white/75 font-medium">
            Accede con tu cuenta de Google
          </p>
          <p className="text-base sm:text-xl text-white/75">
            Sin registros complicados. Un clic y listo.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <LoginForm />
        </div>
      </section>
    </main>
  )
}