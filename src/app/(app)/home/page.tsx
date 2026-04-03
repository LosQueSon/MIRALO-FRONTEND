import RequireAuth from "@/features/auth/components/RequireAuth"
import LoggedHomeView from "@/features/home/components/LoggedHomeView"

export default function LoggedHomePage() {
  return (
    <RequireAuth>
      <LoggedHomeView />
    </RequireAuth>
  )
}
