import { MMKV } from "react-native-mmkv"

// Create a storage instance for stats data
const statsStorage = new MMKV({
  id: "stats-storage",
})

// Storage keys
const STORAGE_KEYS = {
  PLAYERS: "players",
  PLAYER_REPORT_DATES: "player_report_dates",
  SELECTED_PLAYER_INDEX: "selected_player_index",
  REPORT_CACHE_PREFIX: "report_cache_",
} as const

// Cache duration in milliseconds (1 day)
const CACHE_DURATION = 24 * 60 * 60 * 1000

interface CachedReport {
  timestamp: number
  data: any
}

// Types
export interface PlayerStats {
  name: string
  overall: { wins: number; losses: number }
  byLocation: { [location: string]: { wins: number; losses: number } }
  bySeason: { [season: string]: { wins: number; losses: number } }
  byPosition: { [position: string]: { wins: number; losses: number } }
  scoreDistribution: { [score: string]: number }
  byInnings: { [innings: string]: { wins: number; losses: number } }
  byTeamSituation: { [situation: string]: { wins: number; losses: number } }
  headToHead: { [playerName: string]: { wins: number; losses: number } }
  byMySkill: { [skill: string]: { wins: number; losses: number } }
  byOpponentSkill: { [skill: string]: { wins: number; losses: number } }
  bySkillDifference: { [difference: string]: { wins: number; losses: number } }
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
}

// Store players data
export const storePlayers = (players: PlayerStats[]): void => {
  try {
    statsStorage.set(STORAGE_KEYS.PLAYERS, JSON.stringify(players))
  } catch (error) {
    console.error("Failed to store players:", error)
  }
}

// Get stored players data
export const getStoredPlayers = (): PlayerStats[] => {
  try {
    const playersData = statsStorage.getString(STORAGE_KEYS.PLAYERS)
    if (!playersData) return []
    return JSON.parse(playersData) as PlayerStats[]
  } catch (error) {
    console.error("Failed to get stored players:", error)
    return []
  }
}

// Store player report dates
export const storePlayerReportDates = (dates: { [playerName: string]: string }): void => {
  try {
    statsStorage.set(STORAGE_KEYS.PLAYER_REPORT_DATES, JSON.stringify(dates))
  } catch (error) {
    console.error("Failed to store player report dates:", error)
  }
}

// Get stored player report dates
export const getStoredPlayerReportDates = (): { [playerName: string]: string } => {
  try {
    const datesData = statsStorage.getString(STORAGE_KEYS.PLAYER_REPORT_DATES)
    if (!datesData) return {}
    return JSON.parse(datesData) as { [playerName: string]: string }
  } catch (error) {
    console.error("Failed to get stored player report dates:", error)
    return {}
  }
}

// Store selected player index
export const storeSelectedPlayerIndex = (index: number): void => {
  try {
    statsStorage.set(STORAGE_KEYS.SELECTED_PLAYER_INDEX, index.toString())
  } catch (error) {
    console.error("Failed to store selected player index:", error)
  }
}

// Get stored selected player index
export const getStoredSelectedPlayerIndex = (): number => {
  try {
    const indexData = statsStorage.getString(STORAGE_KEYS.SELECTED_PLAYER_INDEX)
    if (!indexData) return -1
    return parseInt(indexData, 10)
  } catch (error) {
    console.error("Failed to get stored selected player index:", error)
    return -1
  }
}

// Clear all stats data
export const clearStatsData = (): void => {
  try {
    statsStorage.delete(STORAGE_KEYS.PLAYERS)
    statsStorage.delete(STORAGE_KEYS.PLAYER_REPORT_DATES)
    statsStorage.delete(STORAGE_KEYS.SELECTED_PLAYER_INDEX)
    
    // Clear all cached reports
    const allKeys = statsStorage.getAllKeys()
    allKeys.forEach(key => {
      if (key.startsWith(STORAGE_KEYS.REPORT_CACHE_PREFIX)) {
        statsStorage.delete(key)
      }
    })
  } catch (error) {
    console.error("Failed to clear stats data:", error)
  }
}

// Check if stats data exists
export const hasStatsData = (): boolean => {
  try {
    const playersData = statsStorage.getString(STORAGE_KEYS.PLAYERS)
    return !!playersData
  } catch {
    return false
  }
}

// Get cached report for a player/season combination
export const getCachedReport = (memberId: string, season?: string): any | null => {
  try {
    const cacheKey = `${STORAGE_KEYS.REPORT_CACHE_PREFIX}${memberId}_${season || "all"}`
    const cachedData = statsStorage.getString(cacheKey)
    
    if (!cachedData) return null
    
    const cached: CachedReport = JSON.parse(cachedData)
    const now = Date.now()
    
    // Check if cache is still valid (within 1 day)
    if (now - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    
    // Cache expired, delete it
    statsStorage.delete(cacheKey)
    return null
  } catch (error) {
    console.error("Failed to get cached report:", error)
    return null
  }
}

// Store report in cache
export const cacheReport = (memberId: string, season: string | undefined, data: any): void => {
  try {
    const cacheKey = `${STORAGE_KEYS.REPORT_CACHE_PREFIX}${memberId}_${season || "all"}`
    const cached: CachedReport = {
      timestamp: Date.now(),
      data,
    }
    statsStorage.set(cacheKey, JSON.stringify(cached))
  } catch (error) {
    console.error("Failed to cache report:", error)
  }
}

// Clear all cached reports for a specific player
export const clearPlayerCache = (memberId: string): void => {
  try {
    const allKeys = statsStorage.getAllKeys()
    allKeys.forEach(key => {
      if (key.startsWith(`${STORAGE_KEYS.REPORT_CACHE_PREFIX}${memberId}_`)) {
        statsStorage.delete(key)
      }
    })
  } catch (error) {
    console.error("Failed to clear player cache:", error)
  }
} 