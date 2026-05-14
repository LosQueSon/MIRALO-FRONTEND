import RequireAuth from "@/features/auth/components/RequireAuth"
import { WatchPartyView } from "@/features/watch-party/components/WatchPartyView"

export default function WatchPartyPage() {
  return (
    <RequireAuth>
      <WatchPartyView />
    </RequireAuth>
  )
}
