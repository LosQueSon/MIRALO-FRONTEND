import RequireAuth from "@/features/auth/components/RequireAuth"
import MyRoomsView from "@/features/my-rooms/components/MyRoomsView"

export default function MyRoomsPage() {
  return (
    <RequireAuth>
      <MyRoomsView />
    </RequireAuth>
  )
}
