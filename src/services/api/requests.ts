import {
  storeAuthData,
  clearAuthData,
  isAuthenticated as checkAuth,
  getCurrentUser as getStoredUser,
  getAuthCookie,
} from "@/utils/storage/authStorage"

import { api } from "./index"

// Types for API requests and responses
export interface SignUpRequest {
  email: string
  password: string
  givenName: string
  familyName: string
}

export interface SignInRequest {
  email: string
  password: string
}

export interface SignUpResponse {
  message?: string
  user?: {
    id: string
    email: string
    givenName: string
    familyName: string
  }
  error?: string
}

export interface SignInResponse {
  message?: string
  user?: {
    id: string
    email: string
    givenName: string
    familyName: string
    profilePicture?: string
  }
  error?: string
}

export interface UpdateProfileRequest {
  email?: string
  givenName?: string
  familyName?: string
  profilePicture?: string
}

export interface UpdateProfileResponse {
  message?: string
  user?: {
    id: string
    email: string
    givenName: string
    familyName: string
    profilePicture?: string
  }
  error?: string
}

export interface DeleteAccountResponse {
  message?: string
  error?: string
}

export interface PlayerSearchRequest {
  name: string
}

export interface Team {
  id: string
  apaId: string
  name: string
  type: "EIGHT_BALL" | "NINE_BALL"
  season: string
  seasonYear: number
  matchIds: string[]
}

export interface Player {
  id: string
  apaId: string
  memberNumber: string
  firstName: string
  lastName: string
  city: string
  state: string
}

export interface PlayerSearchResponse {
  player?: Player
  teams?: Team[]
  error?: string
}

export interface ReportGetRequest {
  memberId: string
  seasons?: string[]
}

export interface ReportStats {
  wins: number
  losses: number
}

export interface Report {
  id: string
  overallWins: number
  overallLosses: number
  bySession: { [session: string]: ReportStats }
  headToHead: { [playerName: string]: ReportStats }
  byPosition: { [position: string]: ReportStats }
  byLocation: { [location: string]: ReportStats }
  scoreDistribution: { [score: string]: number }
  bySkillDifference: { [difference: string]: ReportStats }
  byOpponentSkill: { [skill: string]: ReportStats }
  byMySkill: { [skill: string]: ReportStats }
  byInnings: { [innings: string]: ReportStats }
  byTeamSituation: { [situation: string]: ReportStats }
  currentStreak?: number
  longestWinStreak?: {
    count: number
    season: string
  }
  longestLossStreak?: {
    count: number
    season: string
  }
  last3Matches?: {
    wins: number
    losses: number
  }
  last5Matches?: {
    wins: number
    losses: number
  }
  last10Matches?: {
    wins: number
    losses: number
  }
  trending?: "UP" | "DOWN" | "STABLE"
  totalMatches: number
  totalTeams: number
  generatedAt: string
}

export interface ReportGetResponse {
  report?: Report
  error?: string
}

// API endpoints
const API_BASE_URL = "https://onthehill.app/api"
// const API_BASE_URL = "http://localhost:5173/api"

// Authentication endpoints
export const authApi = {
  /**
   * Register a new user
   */
  signUp: async (data: SignUpRequest): Promise<SignUpResponse> => {
    const response = await api.apisauce.post(`${API_BASE_URL}/auth/signup`, data)
    const result = response.data as SignUpResponse

    // Store auth data if signup successful
    if (result.user) {
      // Extract cookie from response headers if available
      const cookie = response.headers?.["set-cookie"] || ""
      storeAuthData(cookie, result.user)
    }

    return result
  },

  /**
   * Sign in existing user
   */
  signIn: async (data: SignInRequest): Promise<SignInResponse> => {
    const response = await api.apisauce.post(`${API_BASE_URL}/auth/signin`, data)
    const result = response.data as SignInResponse

    // Store auth data if signin successful and no error
    if (result.user && !result.error) {
      // Extract cookie from response headers if available
      const cookie = response.headers?.["set-cookie"] || ""
      console.log("Storing auth data:", { cookie, user: result.user })
      storeAuthData(cookie, result.user)
    }

    return result
  },

  /**
   * Sign out user (clears cookies)
   */
  signOut: async (): Promise<void> => {
    await api.apisauce.post(`${API_BASE_URL}/auth/signout`)
    clearAuthData()
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    const response = await api.apisauce.put(`${API_BASE_URL}/auth/profile`, data)
    const result = response.data as UpdateProfileResponse

    // Update stored auth data if update successful
    if (result.user) {
      const currentUser = getStoredUser()
      const cookie = getAuthCookie()
      if (currentUser && cookie) {
        storeAuthData(cookie, result.user)
      }
    }

    return result
  },

  /**
   * Delete user account
   */
  deleteAccount: async (): Promise<DeleteAccountResponse> => {
    const response = await api.apisauce.post(`${API_BASE_URL}/auth/delete`)
    const result = response.data as DeleteAccountResponse

    // Clear auth data if deletion successful
    if (!result.error) {
      clearAuthData()
    }

    return result
  },
}

// Player endpoints
export const playerApi = {
  /**
   * Search for a player by name
   */
  search: async (data: PlayerSearchRequest): Promise<PlayerSearchResponse> => {
    const response = await api.apisauce.post(`${API_BASE_URL}/player/search`, data)
    return response.data as PlayerSearchResponse
  },
}

// Report endpoints
export const reportApi = {
  /**
   * Get player report by member ID
   */
  get: async (data: ReportGetRequest): Promise<ReportGetResponse> => {
    try {
      console.log("Making report API request with data:", data)
      const response = await api.apisauce.post(`${API_BASE_URL}/report/get`, data, {
        timeout: 5 * 60 * 1000, // Increase timeout to 5 minute - looking at u kieran
      })
      console.log("Report API raw response:", response)

      if (!response.ok) {
        console.error("Report API error response:", response)
        if (response.problem === "TIMEOUT_ERROR") {
          return {
            error: "Request timed out. The server is taking too long to respond. Please try again.",
          }
        }
        return { error: `Server error: ${response.status || "Unknown"}` }
      }

      if (!response.data) {
        console.error("Report API returned null data")
        return { error: "No data received from server" }
      }

      return response.data as ReportGetResponse
    } catch (error) {
      console.error("Report API request failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { error: `Request failed: ${errorMessage}` }
    }
  },
}

// Wrapped endpoints
export interface WrappedGetRequest {
  memberId: string
  year: number
}

export interface WrappedSlide {
  type: string
  [key: string]: any
}

export interface WrappedGetResponse {
  slides?: WrappedSlide[]
  error?: string
}

export const wrappedApi = {
  /**
   * Get wrapped data for a player by member ID and year
   */
  get: async (data: WrappedGetRequest): Promise<WrappedGetResponse> => {
    try {
      console.log("Making wrapped API request with data:", data)
      const response = await api.apisauce.post(`${API_BASE_URL}/wrapped/year/get`, data)
      console.log("Wrapped API raw response:", response)

      if (!response.ok) {
        console.error("Wrapped API error response:", response)
        return { error: `Server error: ${response.status || "Unknown"}` }
      }

      if (!response.data) {
        console.error("Wrapped API returned null data")
        return { error: "No data received from server" }
      }

      return response.data as WrappedGetResponse
    } catch (error) {
      console.error("Wrapped API request failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { error: `Request failed: ${errorMessage}` }
    }
  },
}

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return checkAuth()
}

// Helper function to get current user info
export const getCurrentUser = async (): Promise<SignInResponse["user"] | null> => {
  return getStoredUser()
}
