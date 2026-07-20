/**
 * Client-side auth state.
 *
 * Access/refresh tokens are HttpOnly cookies set by the API — never stored here.
 * Only a non-sensitive user snapshot is kept for UI (sessionStorage).
 */

const USER_KEY = "mockmatch.user"

export interface AuthUser {
  readonly id: string
  readonly email: string
  readonly fullName: string | null
}

export function getUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (!parsed.id || !parsed.email) return null
    return parsed
  } catch {
    return null
  }
}

/** Cache user profile for UI after cookie session is established. */
export function setUser(user: AuthUser): void {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearUser(): void {
  sessionStorage.removeItem(USER_KEY)
}
