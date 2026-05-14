import { mapAppError, type AppErrorShape } from "@/lib/errors/mapAppError"

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object"
}

const parseErrorShape = (payload: unknown): AppErrorShape | null => {
  if (!isRecord(payload)) {
    return null
  }

  return {
    code: typeof payload.code === "string" ? payload.code : undefined,
    message: typeof payload.message === "string" ? payload.message : undefined,
  }
}

export class ApiRequestError extends Error {
  readonly code?: string
  readonly status: number

  constructor(message: string, options: { status: number; code?: string }) {
    super(message)
    this.name = "ApiRequestError"
    this.status = options.status
    this.code = options.code
  }
}

export const parseJsonSafe = async (response: Response): Promise<unknown> => {
  return response.json().catch(() => null)
}

export const ensureOk = async (response: Response, fallbackMessage: string): Promise<unknown> => {
  const payload = await parseJsonSafe(response)

  if (response.ok) {
    return payload
  }

  const parsedError = parseErrorShape(payload)
  const message = mapAppError(parsedError, fallbackMessage)
  throw new ApiRequestError(message, {
    status: response.status,
    code: parsedError?.code,
  })
}
