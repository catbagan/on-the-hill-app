import { useState, useCallback } from "react"
import { useFocusEffect } from "@react-navigation/native"

import {
  storeRecentMatches,
  getStoredRecentMatches,
  type StoredMatch,
} from "@/utils/storage/scorekeeperStorage"

export interface Player {
  id: string
  name: string
}

export interface Match {
  id: string
  gameType: "8ball" | "9ball"
  player1: Player
  player2: Player
  player1GamesWon: number
  player2GamesWon: number
  player1GamesToWin: number
  player2GamesToWin: number
  currentGame: number
  currentPlayer: Player
  currentInning: number
  createdAt: Date
  isActive: boolean
}

function loadMatchesFromStorage(): Match[] {
  const stored = getStoredRecentMatches()
  return stored.map((m) => ({
    ...m,
    createdAt: new Date(m.createdAt),
  }))
}

function matchToStored(match: Match): StoredMatch {
  return {
    ...match,
    createdAt: match.createdAt.toISOString(),
  }
}

export function useRecentMatches() {
  const [recentMatches, setRecentMatches] = useState<Match[]>([])

  const loadRecentMatches = useCallback(() => {
    try {
      const matches = loadMatchesFromStorage()
      setRecentMatches(matches)
    } catch (error) {
      console.error("Error loading recent matches:", error)
      setRecentMatches([])
    }
  }, [])

  // Load on mount
  useFocusEffect(
    useCallback(() => {
      loadRecentMatches()
    }, [loadRecentMatches]),
  )

  const saveMatch = useCallback(
    (match: Match) => {
      const updated = [matchToStored(match), ...recentMatches.map(matchToStored)].slice(0, 10)
      storeRecentMatches(updated)
      setRecentMatches(updated.map((m) => ({ ...m, createdAt: new Date(m.createdAt) })))
    },
    [recentMatches],
  )

  return { recentMatches, loadRecentMatches, saveMatch }
}
