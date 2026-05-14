"use client"

import { useCallback, useEffect, useState } from "react"

import RequireAuth from "@/features/auth/components/RequireAuth"
import FeaturePageShell from "@/components/layout/FeaturePageShell"
import { useAuthStore } from "@/store/auth.store"
import type { User } from "@/features/auth/types"

type ValidationStatus = "idle" | "loading" | "ok" | "error"

function SettingsContent() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)

  const [validatedUser, setValidatedUser] = useState<User | null>(null)
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>("idle")
  const [validationMessage, setValidationMessage] = useState<string>("")

  const validateSession = useCallback(async () => {
    if (!token) {
      setValidationStatus("error")
      setValidationMessage("Sin sesión activa")
      return
    }

    try {
      setValidationStatus("loading")
      setValidationMessage("")

      const response = await fetch("/api/discovery/session-user", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const payload = (await response.json()) as { id?: string; name?: string; email?: string }
      setValidatedUser({
        id: payload.id ?? "",
        name: payload.name ?? "",
        email: payload.email ?? "",
      })
      setValidationStatus("ok")
      setValidationMessage("Validado")
    } catch (error) {
      setValidationStatus("error")
      setValidationMessage(error instanceof Error ? error.message : "No validado")
    }
  }, [token])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      await validateSession()
      if (cancelled) {
        return
      }
    })()

    return () => {
      cancelled = true
    }
  }, [validateSession])

  const displayUser = validatedUser ?? user

  const statusLabel =
    validationStatus === "loading"
      ? "Validando"
      : validationStatus === "ok"
        ? "Conectado"
        : validationStatus === "error"
          ? "Error"
          : "Sin validar"

  return (
    <FeaturePageShell
      title="Configuración"
      description="Cuenta"
    >
      <section className="max-w-2xl space-y-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Datos de cuenta</p>
            <span className={`rounded-full px-2 py-1 text-xs ${validationStatus === "ok" ? "bg-emerald-500/20 text-emerald-300" : validationStatus === "loading" ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"}`}>
              {statusLabel}
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-white/45">Nombre</p>
              <p className="text-sm text-white/90">{displayUser?.name || "-"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-white/45">Correo</p>
              <p className="text-sm text-white/90">{displayUser?.email || "-"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-white/45">User ID</p>
              <p className="break-all text-sm text-white/90">{displayUser?.id || "-"}</p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => void validateSession()}
              disabled={validationStatus === "loading"}
              className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-white/80 transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validationStatus === "loading" ? "Validando..." : "Revalidar"}
            </button>
          </div>
        </div>

        {validationStatus === "error" && validationMessage ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{validationMessage}</div>
        ) : null}
      </section>
    </FeaturePageShell>
  )
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  )
}
