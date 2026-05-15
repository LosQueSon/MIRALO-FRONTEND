import { Suspense } from "react"
import ClientAppLayout from "./ClientAppLayout"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ClientAppLayout>{children}</ClientAppLayout>
    </Suspense>
  )
}