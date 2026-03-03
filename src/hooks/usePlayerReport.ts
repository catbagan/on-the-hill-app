import { useState, useEffect, useRef, useCallback } from "react"
import { Alert, ScrollView } from "react-native"
import { useLocalSearchParams } from "expo-router"

import { StatsEvents } from "@/services/analytics"
import { playerApi, PlayerSearchResponse, reportApi } from "@/services/api/requests"
import { getCurrentUser } from "@/utils/storage/authStorage"
import {
  storePlayers,
  getStoredPlayers,
  storePlayerReportDates,
  getStoredPlayerReportDates,
  storeSelectedPlayerIndex,
  getStoredSelectedPlayerIndex,
  getCachedReport,
  cacheReport,
  clearPlayerCache,
  type PlayerStats,
} from "@/utils/storage/statsStorage"

function sortSeasons(seasons: string[]): string[] {
  return seasons.sort((a, b) => {
    const [seasonA, yearA] = a.split(" ")
    const [seasonB, yearB] = b.split(" ")
    const seasonOrder: Record<string, number> = { Fall: 0, Summer: 1, Spring: 2, Winter: 3 }

    if (yearA !== yearB) {
      return parseInt(yearB) - parseInt(yearA)
    }
    return (seasonOrder[seasonA] ?? 4) - (seasonOrder[seasonB] ?? 4)
  })
}

function reportToPlayerStats(name: string, reportResult: any): PlayerStats {
  return {
    name,
    overall: {
      wins: reportResult.report.overallWins || 0,
      losses: reportResult.report.overallLosses || 0,
    },
    byLocation: reportResult.report.byLocation || {},
    bySeason: reportResult.report.bySession || {},
    byPosition: reportResult.report.byPosition || {},
    scoreDistribution: reportResult.report.scoreDistribution || {},
    byInnings: reportResult.report.byInnings || {},
    byTeamSituation: reportResult.report.byTeamSituation || {},
    headToHead: reportResult.report.headToHead || {},
    byMySkill: reportResult.report.byMySkill || {},
    byOpponentSkill: reportResult.report.byOpponentSkill || {},
    bySkillDifference: reportResult.report.bySkillDifference || {},
    currentStreak: reportResult.report.currentStreak,
    longestWinStreak: reportResult.report.longestWinStreak,
    longestLossStreak: reportResult.report.longestLossStreak,
    last3Matches: reportResult.report.last3Matches,
    last5Matches: reportResult.report.last5Matches,
    last10Matches: reportResult.report.last10Matches,
    trending: reportResult.report.trending,
  }
}

export function usePlayerReport() {
  const params = useLocalSearchParams<{ autoSearch?: string }>()
  const scrollViewRef = useRef<ScrollView>(null)

  const [playerName, setPlayerName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number>(-1)
  const [showInputForm, setShowInputForm] = useState<boolean>(true)
  const [gameType, setGameType] = useState<"8ball" | "9ball">("8ball")
  const [playerSearchResult, setPlayerSearchResult] = useState<PlayerSearchResponse | null>(null)
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false)
  const [showEditView, setShowEditView] = useState<boolean>(false)
  const [playerReportDates, setPlayerReportDates] = useState<{ [playerName: string]: string }>({})
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [hasAutoSearched, setHasAutoSearched] = useState<boolean>(false)
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string>("all")

  const selectedPlayer = selectedPlayerIndex >= 0 ? players[selectedPlayerIndex] : undefined

  // Track stats view when player changes
  useEffect(() => {
    if (selectedPlayerIndex >= 0 && players[selectedPlayerIndex]) {
      StatsEvents.viewed(players[selectedPlayerIndex].name)
    }
  }, [selectedPlayerIndex, players])

  // Load persisted data on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const storedPlayers = await getStoredPlayers()
        const storedDates = await getStoredPlayerReportDates()
        const storedIndex = await getStoredSelectedPlayerIndex()

        if (storedPlayers && storedPlayers.length > 0) {
          setPlayers(storedPlayers)
          setPlayerReportDates(storedDates || {})
          setSelectedPlayerIndex(storedIndex || 0)
          setShowInputForm(false)
        }
      } catch (err) {
        console.error("Error loading persisted data:", err)
      }
    }

    loadPersistedData()

    const currentUser = getCurrentUser()
    if (currentUser) {
      setUserEmail(currentUser.email)
    }
  }, [])

  // Update available seasons when selected player changes
  useEffect(() => {
    if (selectedPlayerIndex >= 0 && players[selectedPlayerIndex]) {
      const currentPlayer = players[selectedPlayerIndex]
      const seasons = sortSeasons(Object.keys(currentPlayer.bySeason || {}))
      setAvailableSeasons(seasons)
      setSelectedSeason("all")
    } else {
      setAvailableSeasons([])
      setSelectedSeason("all")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlayerIndex])

  // Fetch report when season selection changes
  useEffect(() => {
    const fetchSeasonReport = async () => {
      if (selectedPlayerIndex < 0 || !players[selectedPlayerIndex]) return
      if (isLoading) return

      const currentPlayer = players[selectedPlayerIndex]
      setIsLoading(true)

      try {
        const searchResult = await playerApi.search({ name: currentPlayer.name })

        if (!searchResult.player) {
          console.log("Could not find player member ID for season filter")
          setIsLoading(false)
          return
        }

        const memberId = searchResult.player.memberNumber
        const seasonKey = selectedSeason !== "all" ? selectedSeason : undefined

        let reportResult = getCachedReport(memberId, seasonKey)

        if (!reportResult) {
          const seasonsFilter = seasonKey ? [seasonKey] : undefined
          reportResult = await reportApi.get({ memberId, seasons: seasonsFilter })

          if (reportResult && !reportResult.error && reportResult.report) {
            cacheReport(memberId, seasonKey, reportResult)
          }
        }

        if (!reportResult || reportResult.error || !reportResult.report) {
          console.error("Failed to fetch season report:", reportResult?.error)
          setIsLoading(false)
          return
        }

        const updatedPlayerStats = reportToPlayerStats(currentPlayer.name, reportResult)
        const updatedPlayers = [...players]
        updatedPlayers[selectedPlayerIndex] = updatedPlayerStats
        setPlayers(updatedPlayers)
      } catch (err) {
        console.error("Error fetching season report:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSeasonReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeason])

  // Auto-search from route params
  useEffect(() => {
    const performAutoSearch = async () => {
      if (params.autoSearch && !hasAutoSearched && !isLoading) {
        const nameToSearch = params.autoSearch.trim()
        if (nameToSearch) {
          setHasAutoSearched(true)
          setPlayerName(nameToSearch)
          setShowInputForm(true)

          setIsLoading(true)
          setError("")

          try {
            const result = await playerApi.search({ name: nameToSearch })

            if (result.error) {
              setError(result.error)
              return
            }

            if (!result.player) {
              setError("No player found with that name")
              return
            }

            setPlayerSearchResult(result)
            setShowConfirmation(true)
          } catch (err) {
            console.error("Auto-search error:", err)
            setError("Failed to search for player. Please try again.")
          } finally {
            setIsLoading(false)
          }
        }
      }
    }

    performAutoSearch()
  }, [params.autoSearch, hasAutoSearched, isLoading])

  // Persist data whenever it changes
  useEffect(() => {
    if (players.length > 0) {
      storePlayers(players)
      storePlayerReportDates(playerReportDates)
      storeSelectedPlayerIndex(selectedPlayerIndex)
    }
  }, [players, playerReportDates, selectedPlayerIndex])

  const handleSubmitPlayer = useCallback(async () => {
    if (!playerName.trim()) {
      setError("Please enter a player name")
      return
    }

    const existingPlayerIndex = players.findIndex(
      (p) => p.name.toLowerCase() === playerName.trim().toLowerCase(),
    )
    if (existingPlayerIndex !== -1) {
      setError("Player already exists")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const searchTerm = playerName.trim()
      const result = await playerApi.search({ name: searchTerm })

      if (result.error) {
        setError(result.error)
        StatsEvents.playerSearched(searchTerm, 0)
        return
      }

      if (!result.player) {
        setError("No player found with that name")
        StatsEvents.playerSearched(searchTerm, 0)
        return
      }

      StatsEvents.playerSearched(searchTerm, 1)
      setPlayerSearchResult(result)
      setShowConfirmation(true)
    } catch (err) {
      console.error("Player search error:", err)
      setError("Failed to search for player. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [playerName, players])

  const handleAddPlayer = useCallback(() => {
    const isDaniel = userEmail === "daniel@catbagan.me"
    const isAtLimit = !isDaniel && players.length >= 3

    if (isAtLimit) {
      Alert.alert(
        "Player Limit Reached",
        "You can only show stats for up to 3 players. Delete one first.",
        [{ text: "OK" }],
      )
      return
    }

    setPlayerName("")
    setError("")
    setShowInputForm(true)
    setPlayerSearchResult(null)
    setShowConfirmation(false)
    setShowEditView(false)
  }, [userEmail, players.length])

  const handleEditPlayers = useCallback(() => {
    setShowEditView(true)
    setShowInputForm(false)
    setShowConfirmation(false)
  }, [])

  const handleRefreshPlayer = useCallback(
    async (name: string) => {
      const playerIndex = players.findIndex((p) => p.name === name)
      if (playerIndex === -1) return

      setIsLoading(true)

      try {
        const searchResult = await playerApi.search({ name })

        if (searchResult.error || !searchResult.player) {
          Alert.alert("Error", "Unable to find player. Please try again.")
          return
        }

        clearPlayerCache(searchResult.player.memberNumber)

        const reportResult = await reportApi.get({
          memberId: searchResult.player.memberNumber,
          seasons: undefined,
        })

        if (reportResult && !reportResult.error && reportResult.report) {
          cacheReport(searchResult.player.memberNumber, undefined, reportResult)
        }

        if (!reportResult || reportResult.error || !reportResult.report) {
          Alert.alert("Error", "Failed to get updated player statistics. Please try again.")
          return
        }

        const updatedPlayerStats = reportToPlayerStats(name, reportResult)
        const updatedPlayers = [...players]
        updatedPlayers[playerIndex] = updatedPlayerStats
        setPlayers(updatedPlayers)

        const seasons = sortSeasons(Object.keys(updatedPlayerStats.bySeason || {}))
        setAvailableSeasons(seasons)
        setSelectedSeason("all")

        const currentDate = new Date().toLocaleDateString()
        setPlayerReportDates((prev) => ({ ...prev, [name]: currentDate }))

        Alert.alert("Success", `${name}'s statistics have been refreshed!`)
      } catch (err) {
        console.error("Refresh player error:", err)
        Alert.alert("Error", "Failed to refresh player data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    },
    [players],
  )

  const handleDeletePlayer = useCallback(
    (name: string) => {
      Alert.alert("Delete Player", `Are you sure you want to delete ${name}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const newPlayers = players.filter((p) => p.name !== name)
            setPlayers(newPlayers)
            if (selectedPlayerIndex >= newPlayers.length) {
              setSelectedPlayerIndex(newPlayers.length - 1)
            }
            setPlayerReportDates((prev) => {
              const newDates = { ...prev }
              delete newDates[name]
              return newDates
            })
          },
        },
      ])
    },
    [players, selectedPlayerIndex],
  )

  const handleConfirmPlayer = useCallback(async () => {
    if (!playerSearchResult || !playerSearchResult.player) return

    const isDaniel = userEmail === "daniel@catbagan.me"
    const isAtLimit = !isDaniel && players.length >= 3

    if (isAtLimit) {
      Alert.alert(
        "Player Limit Reached",
        "You can only show stats for up to 3 players. Delete one first.",
        [{ text: "OK" }],
      )
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const seasonsFilter = selectedSeason !== "all" ? [selectedSeason] : undefined
      const seasonKey = seasonsFilter?.[0]

      let reportResult = getCachedReport(playerSearchResult.player.memberNumber, seasonKey)

      if (!reportResult) {
        reportResult = await reportApi.get({
          memberId: playerSearchResult.player.memberNumber,
          seasons: seasonsFilter,
        })

        if (!reportResult) {
          Alert.alert("Error", "No response from server. Please try again.")
          return
        }

        if (reportResult.error) {
          Alert.alert("Error", reportResult.error)
          return
        }

        if (!reportResult.report) {
          Alert.alert("Error", "No report data found for this player")
          return
        }

        cacheReport(playerSearchResult.player.memberNumber, seasonKey, reportResult)
      }

      if (!reportResult || reportResult.error || !reportResult.report) {
        Alert.alert("Error", reportResult?.error || "No report data found for this player")
        return
      }

      const playerStats = reportToPlayerStats(
        `${playerSearchResult.player.firstName} ${playerSearchResult.player.lastName}`,
        reportResult,
      )

      const seasons = sortSeasons(Object.keys(playerStats.bySeason))
      setAvailableSeasons(seasons)
      setSelectedSeason("all")

      const newPlayers = [...players, playerStats]
      setPlayers(newPlayers)
      setSelectedPlayerIndex(newPlayers.length - 1)

      const currentDate = new Date().toLocaleDateString()
      setPlayerReportDates((prev) => ({ ...prev, [playerStats.name]: currentDate }))

      StatsEvents.playerSelected(playerStats.name, playerSearchResult.player.memberNumber)
      StatsEvents.reportGenerated(playerStats.name, !!reportResult)

      setPlayerName("")
      setShowInputForm(false)
      setPlayerSearchResult(null)
      setShowConfirmation(false)
    } catch (err) {
      console.error("Report get error:", err)
      Alert.alert("Error", "Failed to get player statistics. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [playerSearchResult, userEmail, players, selectedSeason])

  const handleGameTypeSelect = useCallback((type: "8ball" | "9ball") => {
    if (type === "9ball") {
      Alert.alert("Coming Soon", "9 Ball stats coming soon!")
      return
    }
    setGameType(type)
  }, [])

  const handleSelectSeason = useCallback((season: string, resetSorts: () => void) => {
    setSelectedSeason(season)
    resetSorts()
    scrollViewRef.current?.scrollTo({ y: 0, animated: true })
    StatsEvents.seasonSelected(season)
  }, [])

  const handleSelectPlayer = useCallback(
    (index: number, resetSorts: () => void) => {
      setSelectedPlayerIndex(index)
      storeSelectedPlayerIndex(index)
      setSelectedSeason("all")
      resetSorts()
      scrollViewRef.current?.scrollTo({ y: 0, animated: true })

      if (players[index]) {
        StatsEvents.playerChipTapped(players[index].name, index)
      }
    },
    [players],
  )

  return {
    // State
    playerName,
    setPlayerName,
    isLoading,
    error,
    setError,
    players,
    selectedPlayerIndex,
    selectedPlayer,
    showInputForm,
    setShowInputForm,
    gameType,
    playerSearchResult,
    showConfirmation,
    showEditView,
    setShowEditView,
    playerReportDates,
    userEmail,
    availableSeasons,
    selectedSeason,
    scrollViewRef,

    // Handlers
    handleSubmitPlayer,
    handleAddPlayer,
    handleEditPlayers,
    handleRefreshPlayer,
    handleDeletePlayer,
    handleConfirmPlayer,
    handleGameTypeSelect,
    handleSelectSeason,
    handleSelectPlayer,
  }
}
