"use client"
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout"

export default function ClientAppLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
