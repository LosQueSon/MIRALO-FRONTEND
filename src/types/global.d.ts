export {}

interface GoogleCredentialResponse {
  credential: string
  select_by?: string
}

interface GoogleInitializeConfig {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
  ux_mode?: "popup" | "redirect"
}

interface GoogleRenderButtonOptions {
  theme?: "outline" | "filled_blue" | "filled_black"
  size?: "large" | "medium" | "small"
  shape?: "pill" | "rectangular" | "square" | "circle"
  text?: "signin_with" | "signup_with" | "continue_with" | "signin"
  logo_alignment?: "left" | "center"
  width?: number
}

interface GoogleAccounts {
  id: {
    initialize: (config: GoogleInitializeConfig) => void
    renderButton: (parent: HTMLElement, options: GoogleRenderButtonOptions) => void
  }
}

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts
    }
  }
}
