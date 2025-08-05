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
} as const

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