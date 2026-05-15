"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface DeleteRoomModalProps {
  isOpen: boolean
  roomName: string
  isSubmitting?: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export default function DeleteRoomModal({
  isOpen,
  roomName,
  isSubmitting = false,
  onClose,
  onConfirm,
}: DeleteRoomModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleConfirm = async () => {
    try {
      await onConfirm()
    } catch {
      // Error is handled by parent
    }
  }

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#0b0b0d] p-5 shadow-2xl shadow-black/40 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Eliminar sala</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Confirmar eliminacion</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Cerrar
          </button>
        </div>

        <div className="mb-6">
          <div className="rounded-2xl border border-red-500/40 bg-red-500/20 p-4">
            <p className="text-white mb-2">
              ¿Estas seguro de que deseas eliminar <span className="font-semibold">"{roomName}"</span>?
            </p>
            <p className="text-sm text-white/70">
              Esta accion es irreversible. Todos los participantes seran removidos de la sala.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 inline-flex h-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 inline-flex h-11 items-center justify-center rounded-full bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
