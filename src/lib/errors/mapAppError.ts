const APP_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Tu sesion expiro. Inicia sesion nuevamente.",
  USER_RESOLVE_ERROR: "No fue posible resolver tu usuario. Intenta de nuevo.",
  INVALID_BODY: "La solicitud no cumple con el formato esperado.",
  ROOM_NOT_FOUND: "La sala ya no existe o no esta disponible.",
  ROOM_FINISHED: "La sala ya finalizo.",
  ROOM_FULL: "La sala esta llena.",
  ROOM_INVALID_ACCESS_CODE: "El codigo de acceso es incorrecto.",
  ROOM_FORBIDDEN: "No tienes permiso para controlar esta sala.",
  ROOM_ACCESS_CODE_REQUIRED: "Esta sala privada requiere codigo de acceso.",
  ROOM_INVALID_MAX_USERS: "La capacidad de la sala debe estar entre 2 y 100.",
  INVALID_HOST_ID: "No se pudo validar el host de la sala.",
  INVALID_POSITION_MS: "El tiempo enviado para reproduccion no es valido.",
  USER_NOT_FOUND: "No se encontro el usuario asociado a esta sesion.",
  INTERNAL_SERVER_ERROR: "Ocurrio un error inesperado en el servidor.",
}

export interface AppErrorShape {
  code?: string
  message?: string
}

export const mapAppError = (error: AppErrorShape | null | undefined, fallbackMessage: string): string => {
  const code = error?.code?.trim()
  if (code && APP_ERROR_MESSAGES[code]) {
    return APP_ERROR_MESSAGES[code]
  }

  if (error?.message?.trim()) {
    return error.message
  }

  return fallbackMessage
}
