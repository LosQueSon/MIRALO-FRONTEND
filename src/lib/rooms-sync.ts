export const ROOMS_UPDATED_EVENT = "miralo:rooms-updated"
export const ROOMS_UPDATED_STORAGE_KEY = "miralo:rooms-updated"

export const notifyRoomsUpdated = (): void => {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(ROOMS_UPDATED_EVENT))

  try {
    window.localStorage.setItem(ROOMS_UPDATED_STORAGE_KEY, String(Date.now()))
  } catch {
    // Ignorar si localStorage no está disponible.
  }
}
