import { MMKV } from "react-native-mmkv"
import { clearStatsData } from "./statsStorage"

// Create a secure storage instance for authentication data
const authStorage = new MMKV({
  id: "auth-storage",
  encryptionKey: "auth-key", // In production, use a more secure key
})

// Storage keys
const STORAGE_KEYS = {
  AUTH_COOKIE: "auth_cookie",
  USER_DATA: "user_data",
  IS_AUTHENTICATED: "is_authenticated",
} as const

// Types
export interface StoredUserData {
  id: string
  username: string
}

export interface AuthData {
  cookie: string
  user: StoredUserData
}

// Store authentication data
export const storeAuthData = (cookie: string, user: StoredUserData): void => {
  // Ensure cookie is a string
  const cookieString = typeof cookie === "string" ? cookie : JSON.stringify(cookie)
  authStorage.set(STORAGE_KEYS.AUTH_COOKIE, cookieString)
  authStorage.set(STORAGE_KEYS.USER_DATA, JSON.stringify(user))
  authStorage.set(STORAGE_KEYS.IS_AUTHENTICATED, "true")
}

// Get stored authentication cookie
export const getAuthCookie = (): string | null => {
  return authStorage.getString(STORAGE_KEYS.AUTH_COOKIE) || null
}

// Get stored user data
export const getStoredUserData = (): StoredUserData | null => {
  const userData = authStorage.getString(STORAGE_KEYS.USER_DATA)
  if (!userData) return null

  try {
    return JSON.parse(userData) as StoredUserData
  } catch {
    return null
  }
}

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const authStatus = authStorage.getString(STORAGE_KEYS.IS_AUTHENTICATED)
  return authStatus === "true"
}

// Clear all authentication data
export const clearAuthData = (): void => {
  authStorage.delete(STORAGE_KEYS.AUTH_COOKIE)
  authStorage.delete(STORAGE_KEYS.USER_DATA)
  authStorage.delete(STORAGE_KEYS.IS_AUTHENTICATED)
  // Also clear stats data when logging out
  clearStatsData()
}

// Get current user info
export const getCurrentUser = (): StoredUserData | null => {
  if (!isAuthenticated()) return null
  return getStoredUserData()
}
