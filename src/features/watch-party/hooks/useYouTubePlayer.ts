import { useEffect, useRef, useState, useCallback } from "react"

// Tipos de YouTube IFrame API
interface YTPlayerOptions {
  height?: string | number
  width?: string | number
  videoId?: string
  events?: {
    onReady?: (event: YTOnReadyEvent) => void
    onStateChange?: (event: YTOnStateChangeEvent) => void
    onError?: (event: YTOnErrorEvent) => void
  }
  playerVars?: {
    autoplay?: number
    controls?: number
    modestbranding?: number
    rel?: number
    fs?: number
    playsinline?: number
  }
}

interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): number
  destroy(): void
}

interface YTOnReadyEvent {
  target: YTPlayer
}

interface YTOnStateChangeEvent {
  target: YTPlayer
  data: number
}

interface YTOnErrorEvent {
  target: YTPlayer
  data: number
}

// Definir estados del player
const YT_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
}

declare global {
  interface Window {
    YT: {
      Player: new (element: string | HTMLElement, options: YTPlayerOptions) => YTPlayer
      PlayerState: typeof YT_PLAYER_STATE
    }
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
}

interface PlayerState {
  isReady: boolean
  currentTime: number
  isPlaying: boolean
  duration: number
}

type PlayerCommand = "play" | "pause" | "seekTo"

/**
 * Hook para gestionar YouTube IFrame API
 * Encapsula toda la lógica de interacción con YouTube Player
 * Responsabilidad: Controlar el reproductor sin conocer el estado de la app
 */
export function useYouTubePlayer(videoId: string | null, containerId: string) {
  const playerRef = useRef<YTPlayer | null>(null)
  const [state, setState] = useState<PlayerState>({
    isReady: false,
    currentTime: 0,
    isPlaying: false,
    duration: 0,
  })

  // Cargar YouTube API Script
  useEffect(() => {
    if (window.YT) {
      return
    }

    const script = document.createElement("script")
    script.src = "https://www.youtube.com/iframe_api"
    script.async = true
    document.head.appendChild(script)

    // Define la callback global que YouTube requiere
    window.onYouTubeIframeAPIReady = initPlayer
  }, [])

  // Inicializar reproductor cuando videoId cambia
  useEffect(() => {
    if (!videoId || !window.YT) {
      return
    }

    initPlayer()
  }, [videoId])

  const initPlayer = useCallback(() => {
    if (!videoId || !window.YT) {
      return
    }

    playerRef.current = new window.YT.Player(containerId, {
      videoId,
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 0,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        fs: 0,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError,
      },
    })
  }, [videoId, containerId])

  const onPlayerReady = () => {
    setState((prev) => ({
      ...prev,
      isReady: true,
      duration: playerRef.current?.getDuration() || 0,
    }))
  }

  const onPlayerStateChange = (event: YTOnStateChangeEvent) => {
    const isPlaying = event.data === YT_PLAYER_STATE.PLAYING
    setState((prev) => ({
      ...prev,
      isPlaying,
      currentTime: playerRef.current?.getCurrentTime() || 0,
    }))
  }

  const onPlayerError = () => {
    setState((prev) => ({
      ...prev,
      isReady: false,
    }))
  }

  // Ejecutar comando en el reproductor
  const executeCommand = useCallback((command: PlayerCommand, value?: number) => {
    if (!playerRef.current || !state.isReady) {
      return
    }

    switch (command) {
      case "play":
        playerRef.current.playVideo()
        break
      case "pause":
        playerRef.current.pauseVideo()
        break
      case "seekTo":
        if (typeof value === "number") {
          playerRef.current.seekTo(value, true)
        }
        break
    }
  }, [state.isReady])

  // Sincronizar tiempo cuando llega del backend
  const syncTime = useCallback((positionMs: number, shouldPlay: boolean) => {
    if (!playerRef.current || !state.isReady) {
      return
    }

    const targetSeconds = Math.floor(positionMs / 1000)
    const currentSeconds = Math.floor(playerRef.current.getCurrentTime())

    // Solo seekear si hay diferencia significativa (más de 2 segundos)
    if (Math.abs(targetSeconds - currentSeconds) > 2) {
      playerRef.current.seekTo(targetSeconds, true)
    }

    // Sincronizar estado de reproducción
    const isCurrentlyPlaying = playerRef.current.getPlayerState() === YT_PLAYER_STATE.PLAYING

    if (shouldPlay && !isCurrentlyPlaying) {
      playerRef.current.playVideo()
    } else if (!shouldPlay && isCurrentlyPlaying) {
      playerRef.current.pauseVideo()
    }
  }, [state.isReady])

  // Mientras el video esta reproduciendo, refresca el tiempo local para
  // que las acciones play/pause envien una posicion precisa al backend.
  useEffect(() => {
    if (!state.isReady || !state.isPlaying || !playerRef.current) {
      return
    }

    const timer = window.setInterval(() => {
      const current = playerRef.current?.getCurrentTime() ?? 0
      setState((prev) => ({
        ...prev,
        currentTime: current,
      }))
    }, 500)

    return () => {
      window.clearInterval(timer)
    }
  }, [state.isPlaying, state.isReady])

  // Limpiar en desmontaje
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [])

  return {
    state,
    executeCommand,
    syncTime,
  }
}
