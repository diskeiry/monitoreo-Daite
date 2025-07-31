// lib/auth/auth-client.ts
export async function logout() {
  // Borra datos del usuario, token, etc.
  localStorage.clear()
  sessionStorage.clear()
  // Redirecciona al login
  window.location.href = "/login"
}
