"use client"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"
import {
  continueWatchingItems,
  featuredItem,
  recommendedItems,
  trendingItems,
} from "@/features/home/data/home.mock"

const navItems = ["Home", "Discovery", "Coming Soon", "Watch Party", "Settings"]

export default function LoggedHomeView() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  return (
    <main className="min-h-screen w-full px-4 pb-8 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1400px] gap-5">
        <aside className="hidden w-64 shrink-0 rounded-3xl border border-white/10 bg-black/60 p-5 backdrop-blur-xl lg:block">
          <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-red-500">MIRALO</h2>
          <nav className="space-y-2">
            {navItems.map((item, index) => (
              <button
                key={item}
                type="button"
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${index === 0 ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="mt-10 space-y-3 border-t border-white/10 pt-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Signed in as</p>
            <p className="text-sm font-semibold text-white">{user?.name || user?.email || "Viewer"}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-black/55 p-4 backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Welcome back</p>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{user?.name || "Movie lover"}</h1>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/75">
              Continue where you left off
            </div>
          </div>

          <article className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.26),transparent_42%)]" />
            <div className="relative z-10 max-w-xl space-y-3">
              <p className="inline-flex rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300">
                {featuredItem.genre}
              </p>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">{featuredItem.title}</h2>
              <p className="text-sm text-white/70">
                Reanuda tu watch party con sincronizacion en tiempo real y chat integrado para no perderte ninguna escena.
              </p>
              <div className="flex gap-3">
                <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">Watch now</button>
                <button className="rounded-full border border-white/25 px-5 py-2 text-sm font-semibold text-white/90">Details</button>
              </div>
            </div>
          </article>

          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Trending now</h3>
              <button className="text-sm text-white/65 hover:text-white">See all</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {trendingItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-red-500/35 hover:bg-white/[0.06]"
                >
                  <p className="text-xs uppercase tracking-[0.15em] text-red-300">{item.genre}</p>
                  <h4 className="mt-2 text-lg font-semibold text-white">{item.title}</h4>
                  <p className="mt-1 text-xs text-white/60">{item.duration}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-[2fr_1fr]">
            <div>
              <h3 className="mb-3 text-xl font-semibold text-white">Recommended movies</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {recommendedItems.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-red-500/35 hover:bg-white/[0.06]"
                  >
                    <p className="text-xs uppercase tracking-[0.15em] text-white/45">{item.genre}</p>
                    <h4 className="mt-2 text-lg font-semibold text-white">{item.title}</h4>
                    <p className="mt-1 text-xs text-white/60">{item.duration}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="mb-3 text-lg font-semibold text-white">Continue watching</h3>
              <div className="space-y-3">
                {continueWatchingItems.map((item) => (
                  <article key={item.id} className="rounded-xl border border-white/10 bg-black/35 p-3">
                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    <p className="mt-1 text-xs text-white/60">{item.episode || "Now playing"}</p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-white/15">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </aside>
          </section>
        </section>
      </div>
    </main>
  )
}
