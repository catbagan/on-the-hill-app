import { save, load, remove } from "./index"

export interface StoredMatch {
  id: string
  gameType: "8ball" | "9ball"
  player1: { id: string; name: string }
  player2: { id: string; name: string }
  player1GamesWon: number
  player2GamesWon: number
  player1GamesToWin: number
  player2GamesToWin: number
  currentGame: number
  currentPlayer: { id: string; name: string }
  currentInning: number
  createdAt: string // ISO string
  isActive: boolean
}

const RECENT_MATCHES_KEY = "recent_matches"

/**
 * Stores recent matches to local storage
 */
export function storeRecentMatches(matches: StoredMatch[]): boolean {
  return save(RECENT_MATCHES_KEY, matches)
}

/**
 * Loads recent matches from local storage
 */
export function getStoredRecentMatches(): StoredMatch[] {
  const matches = load<StoredMatch[]>(RECENT_MATCHES_KEY)
  return matches || []
}

/**
 * Clears all scorekeeper data from storage
 */
export function clearScorekeeperData(): void {
  remove(RECENT_MATCHES_KEY)
} 