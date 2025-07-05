import Dashboard from "./dashboard"
import { AuthProvider } from "../components/auth-provider"

export default function Page() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  )
}
