import { FC, useState, useEffect } from "react"
import { Alert, ScrollView, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { playerApi, PlayerSearchResponse, reportApi } from "@/services/api/requests"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import {
  storePlayers,
  getStoredPlayers,
  storePlayerReportDates,
  getStoredPlayerReportDates,
  storeSelectedPlayerIndex,
  getStoredSelectedPlayerIndex,
  type PlayerStats,
} from "@/utils/storage/statsStorage"

interface SortOption {
  value: string
  label: string
}

interface SortableCardProps<T> {
  heading: string
  data: T
  sortState: any
  onSortChange: (sort: any) => void
  renderItem: (item: [string, any]) => React.ReactNode
  sortOptions: SortOption[]
  sortFunction: (a: [string, any], b: [string, any], sortType: any) => number
}

const SortableCard = <T extends Record<string, any>>({
  heading,
  data,
  sortState,
  onSortChange,
  renderItem,
  sortOptions,
  sortFunction,
}: SortableCardProps<T>) => {
  const { themed } = useAppTheme()

  const getCurrentSortLabel = () => {
    const option = sortOptions.find((opt) => opt.value === sortState)
    return option?.label || sortOptions[0]?.label || "Sort"
  }

  const cycleSort = () => {
    const currentIndex = sortOptions.findIndex((opt) => opt.value === sortState)
    const nextIndex = (currentIndex + 1) % sortOptions.length
    onSortChange(sortOptions[nextIndex].value)
  }

  return (
    <Card
      style={themed($statCard)}
      HeadingComponent={
        <View style={themed($cardHeaderRow)}>
          <Text weight="bold" text={heading} />
          <Text style={themed($sortButton)} text={getCurrentSortLabel()} onPress={cycleSort} />
        </View>
      }
      ContentComponent={
        <View style={themed($cardContent)}>
          {Object.entries(data)
            .sort((a, b) => sortFunction(a, b, sortState))
            .map(renderItem)}
        </View>
      }
    />
  )
}

export const StatsScreen: FC = function StatsScreen() {
  const { themed } = useAppTheme()
  const [playerName, setPlayerName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number>(-1)
  const [activeTab, setActiveTab] = useState<"overall" | "headToHead" | "skill">("overall")
  const [showInputForm, setShowInputForm] = useState<boolean>(true)
  const [gameType, setGameType] = useState<"8ball" | "9ball">("8ball")
  const [headToHeadSort, setHeadToHeadSort] = useState<
    "name-asc" | "name-desc" | "matches-asc" | "matches-desc" | "winrate-asc" | "winrate-desc"
  >("name-asc")
  const [mySkillSort, setMySkillSort] = useState<
    "skill-asc" | "skill-desc" | "winrate-asc" | "winrate-desc"
  >("skill-asc")
  const [oppSkillSort, setOppSkillSort] = useState<
    "skill-asc" | "skill-desc" | "winrate-asc" | "winrate-desc"
  >("skill-asc")
  const [skillDiffSort, setSkillDiffSort] = useState<
    "diff-asc" | "diff-desc" | "winrate-asc" | "winrate-desc"
  >("diff-asc")
  const [locationSort, setLocationSort] = useState<
    "name-asc" | "name-desc" | "winrate-asc" | "winrate-desc"
  >("name-asc")
  const [positionSort, setPositionSort] = useState<
    "position-asc" | "position-desc" | "winrate-asc" | "winrate-desc"
  >("position-asc")
  const [playerSearchResult, setPlayerSearchResult] = useState<PlayerSearchResponse | null>(null)
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false)
  const [showEditView, setShowEditView] = useState<boolean>(false)
  const [playerReportDates, setPlayerReportDates] = useState<{ [playerName: string]: string }>({})

  // Load persisted data on component mount
  useEffect(() => {
    const loadPersistedData = () => {
      const storedPlayers = getStoredPlayers()
      const storedReportDates = getStoredPlayerReportDates()
      const storedSelectedIndex = getStoredSelectedPlayerIndex()

      if (storedPlayers.length > 0) {
        setPlayers(storedPlayers)
        setPlayerReportDates(storedReportDates)
        setSelectedPlayerIndex(
          storedSelectedIndex >= 0 && storedSelectedIndex < storedPlayers.length
            ? storedSelectedIndex
            : 0,
        )
        setShowInputForm(false)
      }
    }

    loadPersistedData()
  }, [])

  // Persist data whenever it changes
  useEffect(() => {
    if (players.length > 0) {
      storePlayers(players)
      storePlayerReportDates(playerReportDates)
      storeSelectedPlayerIndex(selectedPlayerIndex)
    }
  }, [players, playerReportDates, selectedPlayerIndex])

  const handleSubmitPlayer = async () => {
    if (!playerName.trim()) {
      setError("Please enter a player name")
      return
    }

    // Check if player already exists
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
      const result = await playerApi.search({ name: playerName.trim() })

      console.log("Player search result:", result)

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
    } catch (error) {
      console.error("Player search error:", error)
      setError("Failed to search for player. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPlayer = () => {
    setPlayerName("")
    setError("")
    setShowInputForm(true) // Show input form
    setPlayerSearchResult(null)
    setShowConfirmation(false)
    setShowEditView(false)
  }

  const handleEditPlayers = () => {
    setShowEditView(true)
    setShowInputForm(false)
    setShowConfirmation(false)
    // Reset loading state when entering edit view
    setIsLoading(false)
  }

  const handleRefreshPlayer = async (playerName: string) => {
    console.log("🔄 Refresh button pressed for player:", playerName)

    // Find the player in the list
    const playerIndex = players.findIndex((p) => p.name === playerName)
    if (playerIndex === -1) {
      console.log("❌ Player not found in list:", playerName)
      return
    }

    console.log("✅ Player found at index:", playerIndex)
    setIsLoading(true)

    try {
      console.log("🔍 Searching for player:", playerName)

      // Search for the player to get their member number
      const searchResult = await playerApi.search({ name: playerName })
      console.log("🔍 Search result:", searchResult)

      if (searchResult.error || !searchResult.player) {
        console.log("❌ Search failed:", searchResult.error)
        Alert.alert("Error", "Unable to find player. Please try again.")
        return
      }

      console.log("✅ Player found, member number:", searchResult.player.memberNumber)
      console.log("📊 Getting fresh report data...")

      // Get fresh report data
      const reportResult = await reportApi.get({ memberId: searchResult.player.memberNumber })
      console.log("📊 Report result:", reportResult)

      if (!reportResult || reportResult.error || !reportResult.report) {
        console.log("❌ Report failed:", reportResult?.error)
        Alert.alert("Error", "Failed to get updated player statistics. Please try again.")
        return
      }

      console.log("✅ Report data received, updating player stats...")

      // Convert report data to PlayerStats format with null checks
      const updatedPlayerStats: PlayerStats = {
        name: playerName,
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
      }

      // Update the player in the list
      const updatedPlayers = [...players]
      updatedPlayers[playerIndex] = updatedPlayerStats
      setPlayers(updatedPlayers)

      // Update the report date
      const currentDate = new Date().toLocaleDateString()
      setPlayerReportDates((prev) => ({
        ...prev,
        [playerName]: currentDate,
      }))

      console.log("✅ Player stats updated successfully!")
      Alert.alert("Success", `${playerName}'s statistics have been refreshed!`)
    } catch (error) {
      console.error("❌ Refresh player error:", error)
      Alert.alert("Error", "Failed to refresh player data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePlayer = (playerName: string) => {
    Alert.alert("Delete Player", `Are you sure you want to delete ${playerName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const newPlayers = players.filter((p) => p.name !== playerName)
          setPlayers(newPlayers)
          if (selectedPlayerIndex >= newPlayers.length) {
            setSelectedPlayerIndex(newPlayers.length - 1)
          }
          setPlayerReportDates((prev) => {
            const newDates = { ...prev }
            delete newDates[playerName]
            return newDates
          })
        },
      },
    ])
  }

  const handleConfirmPlayer = async () => {
    if (!playerSearchResult || !playerSearchResult.player) return

    setIsLoading(true)

    try {
      const reportResult = await reportApi.get({ memberId: playerSearchResult.player.memberNumber })

      console.log("Report API response:", reportResult)

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

      // Convert report data to PlayerStats format with null checks
      const playerStats: PlayerStats = {
        name: `${playerSearchResult.player.firstName} ${playerSearchResult.player.lastName}`,
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
      }

      const newPlayers = [...players, playerStats]
      setPlayers(newPlayers)
      setSelectedPlayerIndex(newPlayers.length - 1)

      // Set the report date for the new player
      const currentDate = new Date().toLocaleDateString()
      setPlayerReportDates((prev) => ({
        ...prev,
        [playerStats.name]: currentDate,
      }))

      setPlayerName("")
      setShowInputForm(false)
      setPlayerSearchResult(null)
      setShowConfirmation(false)
    } catch (error) {
      console.error("Report get error:", error)
      Alert.alert("Error", "Failed to get player statistics. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPlayer = (index: number) => {
    setSelectedPlayerIndex(index)
  }

  const handleGameTypeSelect = (type: "8ball" | "9ball") => {
    if (type === "9ball") {
      Alert.alert("Coming Soon!", "9 Ball stats coming soon!")
      return
    }
    setGameType(type)
  }

  const getSortLabel = (sort: typeof headToHeadSort) => {
    switch (sort) {
      case "name-asc":
        return "Name A-Z"
      case "name-desc":
        return "Name Z-A"
      case "matches-asc":
        return "Matches ↑"
      case "matches-desc":
        return "Matches ↓"
      case "winrate-asc":
        return "Win % ↑"
      case "winrate-desc":
        return "Win % ↓"
      default:
        return "Name A-Z"
    }
  }

  // View 1: Player Name Input (when no players exist or adding new player)
  if (players.length === 0 || showInputForm) {
    // Show confirmation card if we have search results
    if (showConfirmation && playerSearchResult) {
      console.log("Showing confirmation card with:", {
        showConfirmation,
        playerSearchResult,
        hasPlayer: !!playerSearchResult.player,
        hasTeams: !!playerSearchResult.teams,
        teamsLength: playerSearchResult.teams?.length,
      })
      return (
        <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
          <View style={themed($topContainer)}>
            <Text style={themed($title)} text="📊 Confirm Player" />

            <Card
              style={themed($confirmationCard)}
              ContentComponent={
                <View style={themed($cardContent)}>
                  {playerSearchResult.player ? (
                    <>
                      <Text
                        style={themed($playerName)}
                        text={`${playerSearchResult.player.firstName} ${playerSearchResult.player.lastName}`}
                      />
                      <Text
                        style={themed($playerLocation)}
                        text={`${playerSearchResult.player.city}, ${playerSearchResult.player.state}`}
                      />
                      <Text
                        style={themed($playerMemberNumber)}
                        text={`Member #: ${playerSearchResult.player.memberNumber}`}
                      />
                    </>
                  ) : (
                    <Text style={themed($playerName)} text="No player data found" />
                  )}

                  {playerSearchResult.teams && playerSearchResult.teams.length > 0 ? (
                    <View style={themed($teamsSection)}>
                      <Text style={themed($teamsTitle)} text="Teams:" />
                      {playerSearchResult.teams.slice(0, 3).map((team) => (
                        <Text
                          key={team.id}
                          style={themed($teamText)}
                          text={`• ${team.name} (${team.season} ${team.seasonYear})`}
                        />
                      ))}
                      {playerSearchResult.teams.length > 3 && (
                        <Text
                          style={themed($moreTeamsText)}
                          text={`${playerSearchResult.teams.length - 3} more teams since ${playerSearchResult.teams[playerSearchResult.teams.length - 1].season} ${playerSearchResult.teams[playerSearchResult.teams.length - 1].seasonYear}`}
                        />
                      )}
                    </View>
                  ) : (
                    <Text style={themed($teamsTitle)} text="No teams found" />
                  )}

                  <Text style={themed($confirmationText)} text="Does this look right?" />
                </View>
              }
            />
          </View>

          <View style={themed($bottomContainer)}>
            <Button
              text={isLoading ? "Getting stats..." : "✅ Yes, get stats!"}
              onPress={handleConfirmPlayer}
              style={themed($primaryButton)}
              textStyle={themed($primaryButtonText)}
              disabled={isLoading}
            />
            <Button
              text="❌ No, search again"
              onPress={() => {
                setShowConfirmation(false)
                setPlayerSearchResult(null)
              }}
              style={themed($secondaryButton)}
              textStyle={themed($secondaryButtonText)}
              disabled={isLoading}
            />
          </View>
        </Screen>
      )
    }
    return (
      <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
        <View style={themed($headerContainer)}>
          <View style={themed($searchHeaderRow)}>
            <TouchableOpacity onPress={() => setShowInputForm(false)} style={themed($backButton)}>
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            <View style={themed($backButton)} />
          </View>
        </View>

        <View style={themed($searchContainer)}>
          <View style={themed($searchCard)}>
            <Text style={themed($searchTitle)} text="Find Player Stats" />
            <Text
              style={themed($searchSubtitle)}
              text="Search by player name to get their pool statistics"
            />

            <TextField
              value={playerName}
              onChangeText={(text) => {
                setPlayerName(text)
                if (error) setError("")
              }}
              containerStyle={themed($searchInputContainer)}
              autoCapitalize="words"
              autoCorrect={false}
              placeholder="Enter player name..."
            />

            {isLoading ? (
              <View style={themed($statusContainer)}>
                <Text style={themed($loadingText)} text="🔍 Searching for player..." />
              </View>
            ) : error ? (
              <View style={themed($statusContainer)}>
                <Text style={themed($errorText)} text={`❌ ${error}`} />
              </View>
            ) : (
              <Button
                text="🔍 Search Player"
                onPress={handleSubmitPlayer}
                style={themed($searchButton)}
                textStyle={themed($searchButtonText)}
                disabled={isLoading}
              />
            )}
          </View>
        </View>
      </Screen>
    )
  }

  // View 2: Edit Players View
  if (showEditView) {
    console.log("Edit view is showing, players count:", players.length)
    console.log("Players:", players)
    console.log("Player report dates:", playerReportDates)

    return (
      <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
        <View style={themed($headerContainer)}>
          <Text style={themed($title)} text="✏️ Manage Players" />
        </View>

        <View style={themed($statsContainer)}>
          {isLoading && <Text style={themed($loadingText)} text="Refreshing player data..." />}
          <ScrollView showsVerticalScrollIndicator={false}>
            {players.length > 0 ? (
              players.map((player) => (
                <View key={player.name} style={themed($playerManagementRow)}>
                  <View style={themed($playerInfo)}>
                    <Text style={themed($playerName)} text={player.name} />
                    <Text
                      style={themed($reportDate)}
                      text={`Report: ${playerReportDates[player.name] || "Not available"}`}
                    />
                  </View>
                  <View style={themed($playerActions)}>
                    <Button
                      text={isLoading ? "Loading..." : "Refresh"}
                      onPress={() => {
                        console.log("🔄 Refresh button tapped for:", player.name)
                        console.log("isLoading state:", isLoading)
                        handleRefreshPlayer(player.name)
                      }}
                      style={themed($actionButton)}
                      textStyle={themed($actionButtonText)}
                      disabled={isLoading}
                    />
                    <Button
                      text="Delete"
                      onPress={() => handleDeletePlayer(player.name)}
                      style={themed($deleteButton)}
                      textStyle={themed($actionButtonText)}
                      disabled={isLoading}
                    />
                  </View>
                </View>
              ))
            ) : (
              <Text style={themed($emptyStateText)} text="No players added yet" />
            )}
          </ScrollView>
        </View>

        <View style={themed($bottomContainer)}>
          <Button
            text="← Back to Stats"
            onPress={() => setShowEditView(false)}
            style={themed($primaryButton)}
            textStyle={themed($primaryButtonText)}
          />
        </View>
      </Screen>
    )
  }

  // View 3: Stats Display
  const selectedPlayer = players[selectedPlayerIndex]

  return (
    <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
      <View style={themed($headerContainer)}>
        <Text style={themed($title)} text="📊 Statistics" />

        <View style={themed($tabsContainer)}>
          <View style={themed($playerRowContainer)}>
            <TouchableOpacity onPress={handleAddPlayer} style={themed($iconButton)}>
              <Ionicons name="add-circle-outline" size={20} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleEditPlayers} style={themed($iconButton)}>
              <Ionicons name="settings-outline" size={16} color="#000000" />
            </TouchableOpacity>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={themed($playerTabsScrollContainer)}
            >
              {players.map((player, index) => {
                // Create shortened name for tab display
                const nameParts = player.name.split(" ")
                const shortName =
                  nameParts.length > 1 ? `${nameParts[0]} ${nameParts[1].charAt(0)}` : player.name

                return (
                  <Text
                    key={player.name}
                    style={themed([$playerTab, selectedPlayerIndex === index && $activePlayerTab])}
                    text={shortName}
                    onPress={() => handleSelectPlayer(index)}
                  />
                )
              })}
            </ScrollView>
          </View>

          <View style={themed($statsTabsContainer)}>
            <TouchableOpacity
              style={themed([$gameTypeButton, gameType === "8ball" && $activeGameTypeButton])}
              onPress={() => handleGameTypeSelect("8ball")}
            >
              <MaterialCommunityIcons
                name="numeric-8-circle"
                size={18}
                color={gameType === "8ball" ? "#000000" : "#666666"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={themed([$gameTypeButton, gameType === "9ball" && $activeGameTypeButton])}
              onPress={() => handleGameTypeSelect("9ball")}
            >
              <MaterialCommunityIcons
                name="numeric-9-circle"
                size={18}
                color={gameType === "9ball" ? "#000000" : "#666666"}
              />
            </TouchableOpacity>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={themed($statsTabsScrollContainer)}
            >
              <Text
                style={themed([$tab, activeTab === "overall" && $activeTab])}
                text="Overall"
                onPress={() => setActiveTab("overall")}
              />
              <Text
                style={themed([$tab, activeTab === "skill" && $activeTab])}
                text="Skill"
                onPress={() => setActiveTab("skill")}
              />
              <Text
                style={themed([$tab, activeTab === "headToHead" && $activeTab])}
                text="Head to Head"
                onPress={() => setActiveTab("headToHead")}
              />
            </ScrollView>
          </View>
        </View>
      </View>

      <View style={themed($statsContainer)}>
        {activeTab === "overall" && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Card
              style={themed($statCard)}
              heading="Overall Record"
              ContentComponent={
                <View style={themed($cardContent)}>
                  <View style={themed($overallRow)}>
                    <Text style={themed($statLabel)} text="Overall" />
                    <View style={themed($statValues)}>
                      <Text style={themed($winText)} text={`${selectedPlayer.overall.wins}W`} />
                      <Text style={themed($lossText)} text={`${selectedPlayer.overall.losses}L`} />
                      <Text
                        style={themed($winPercentText)}
                        text={`(${Math.round((selectedPlayer.overall.wins / (selectedPlayer.overall.wins + selectedPlayer.overall.losses)) * 100)}%)`}
                      />
                    </View>
                  </View>
                </View>
              }
            />

            <Card
              style={themed($statCard)}
              heading="By Session"
              ContentComponent={
                <View style={themed($cardContent)}>
                  {Object.entries(selectedPlayer.bySeason).map(([season, stats]) => (
                    <View key={season} style={themed($statRow)}>
                      <Text style={themed($statLabel)} text={season} />
                      <View style={themed($statValues)}>
                        <Text style={themed($winText)} text={`${stats.wins}W`} />
                        <Text style={themed($lossText)} text={`${stats.losses}L`} />
                        <Text
                          style={themed($winPercentText)}
                          text={`(${Math.round((stats.wins / (stats.wins + stats.losses)) * 100)}%)`}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              }
            />

            <SortableCard
              heading="By Location"
              data={selectedPlayer.byLocation}
              sortState={locationSort}
              onSortChange={setLocationSort}
              renderItem={([location, stats]) => (
                <View key={location} style={themed($statRow)}>
                  <Text style={themed($statLabel)} text={location} />
                  <View style={themed($statValues)}>
                    <Text style={themed($winText)} text={`${stats.wins}W`} />
                    <Text style={themed($lossText)} text={`${stats.losses}L`} />
                    <Text
                      style={themed($winPercentText)}
                      text={`(${Math.round((stats.wins / (stats.wins + stats.losses)) * 100)}%)`}
                    />
                  </View>
                </View>
              )}
              sortOptions={[
                { value: "name-asc", label: "Name A-Z" },
                { value: "name-desc", label: "Name Z-A" },
                { value: "winrate-asc", label: "Win % ↑" },
                { value: "winrate-desc", label: "Win % ↓" },
              ]}
              sortFunction={(a, b, sortType) => {
                const [aName, aStats] = a
                const [bName, bStats] = b
                const aWinRate = aStats.wins / (aStats.wins + aStats.losses)
                const bWinRate = bStats.wins / (bStats.wins + bStats.losses)

                switch (sortType) {
                  case "name-asc":
                    return aName.localeCompare(bName)
                  case "name-desc":
                    return bName.localeCompare(aName)
                  case "winrate-asc":
                    return aWinRate - bWinRate
                  case "winrate-desc":
                    return bWinRate - aWinRate
                  default:
                    return 0
                }
              }}
            />

            <SortableCard
              heading="By Position"
              data={selectedPlayer.byPosition}
              sortState={positionSort}
              onSortChange={setPositionSort}
              renderItem={([position, stats]) => {
                const positionNames = ["First", "Second", "Third", "Fourth", "Fifth"]
                const positionName = positionNames[parseInt(position) - 1] || position
                return (
                  <View key={position} style={themed($statRow)}>
                    <Text style={themed($statLabel)} text={positionName} />
                    <View style={themed($statValues)}>
                      <Text style={themed($winText)} text={`${stats.wins}W`} />
                      <Text style={themed($lossText)} text={`${stats.losses}L`} />
                      <Text
                        style={themed($winPercentText)}
                        text={`(${Math.round((stats.wins / (stats.wins + stats.losses)) * 100)}%)`}
                      />
                    </View>
                  </View>
                )
              }}
              sortOptions={[
                { value: "position-asc", label: "Position ↑" },
                { value: "position-desc", label: "Position ↓" },
                { value: "winrate-asc", label: "Win % ↑" },
                { value: "winrate-desc", label: "Win % ↓" },
              ]}
              sortFunction={(a, b, sortType) => {
                const [aPos, aStats] = a
                const [bPos, bStats] = b
                const aWinRate = aStats.wins / (aStats.wins + aStats.losses)
                const bWinRate = bStats.wins / (bStats.wins + bStats.losses)

                switch (sortType) {
                  case "position-asc":
                    return parseInt(aPos) - parseInt(bPos)
                  case "position-desc":
                    return parseInt(bPos) - parseInt(aPos)
                  case "winrate-asc":
                    return aWinRate - bWinRate
                  case "winrate-desc":
                    return bWinRate - aWinRate
                  default:
                    return 0
                }
              }}
            />

            <Card
              style={themed($statCard)}
              heading="Score Distribution"
              ContentComponent={
                <View style={themed($cardContent)}>
                  {Object.entries(selectedPlayer.scoreDistribution)
                    .sort(([a], [b]) => {
                      const aScore = a.split("-").map(Number)
                      const bScore = b.split("-").map(Number)
                      // Sort by wins first (descending), then by losses (ascending)
                      if (aScore[0] !== bScore[0]) return bScore[0] - aScore[0]
                      return aScore[1] - bScore[1]
                    })
                    .map(([score, count]) => {
                      const [wins, losses] = score.split("-").map(Number)
                      const isWinningScore = wins > losses
                      const totalForCategory = isWinningScore
                        ? selectedPlayer.overall.wins
                        : selectedPlayer.overall.losses
                      const percentage = Math.round((count / totalForCategory) * 100)
                      const categoryLabel = isWinningScore ? "wins" : "losses"
                      return (
                        <View key={score} style={themed($statRow)}>
                          <Text style={themed($statLabel)} text={score} />
                          <View style={themed($statValues)}>
                            <Text
                              style={themed($winPercentText)}
                              text={`${count} matches (${percentage}% of ${categoryLabel})`}
                            />
                          </View>
                        </View>
                      )
                    })}
                </View>
              }
            />

            <Card
              style={themed($statCard)}
              heading="By Innings"
              ContentComponent={
                <View style={themed($cardContent)}>
                  {Object.entries(selectedPlayer.byInnings)
                    .sort(([a], [b]) => {
                      const aRange = a.split("-")[0]
                      const bRange = b.split("-")[0]
                      return parseInt(aRange) - parseInt(bRange)
                    })
                    .map(([innings, stats]) => (
                      <View key={innings} style={themed($statRow)}>
                        <Text style={themed($statLabel)} text={innings} />
                        <View style={themed($statValues)}>
                          <Text style={themed($winText)} text={`${stats.wins}W`} />
                          <Text style={themed($lossText)} text={`${stats.losses}L`} />
                          <Text
                            style={themed($winPercentText)}
                            text={`(${Math.round((stats.wins / (stats.wins + stats.losses)) * 100)}%)`}
                          />
                        </View>
                      </View>
                    ))}
                </View>
              }
            />

            <Card
              style={themed($statCard)}
              heading="By Team Situation"
              ContentComponent={
                <View style={themed($cardContent)}>
                  {Object.entries(selectedPlayer.byTeamSituation).map(([situation, stats]) => {
                    const situationNames: { [key: string]: string } = {
                      team_winning: "Team Winning",
                      team_losing: "Team Losing",
                      team_tied: "Team Tied",
                    }
                    const situationName = situationNames[situation] || situation
                    return (
                      <View key={situation} style={themed($statRow)}>
                        <Text style={themed($statLabel)} text={situationName} />
                        <View style={themed($statValues)}>
                          <Text style={themed($winText)} text={`${stats.wins}W`} />
                          <Text style={themed($lossText)} text={`${stats.losses}L`} />
                          <Text
                            style={themed($winPercentText)}
                            text={`(${Math.round((stats.wins / (stats.wins + stats.losses)) * 100)}%)`}
                          />
                        </View>
                      </View>
                    )
                  })}
                </View>
              }
            />
          </ScrollView>
        )}

        {activeTab === "headToHead" && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <SortableCard
              heading="Head to Head"
              data={selectedPlayer.headToHead}
              sortState={headToHeadSort}
              onSortChange={setHeadToHeadSort}
              renderItem={([playerName, stats]) => (
                <View key={playerName} style={themed($statRow)}>
                  <Text style={themed($statLabel)} text={playerName} />
                  <View style={themed($statValues)}>
                    <Text style={themed($winText)} text={`${stats.wins}W`} />
                    <Text style={themed($lossText)} text={`${stats.losses}L`} />
                    <Text
                      style={themed($winPercentText)}
                      text={`(${Math.round((stats.wins / (stats.wins + stats.losses)) * 100)}%)`}
                    />
                  </View>
                </View>
              )}
              sortOptions={[
                { value: "name-asc", label: "Name A-Z" },
                { value: "name-desc", label: "Name Z-A" },
                { value: "matches-asc", label: "Matches ↑" },
                { value: "matches-desc", label: "Matches ↓" },
                { value: "winrate-asc", label: "Win % ↑" },
                { value: "winrate-desc", label: "Win % ↓" },
              ]}
              sortFunction={(a, b, sortType) => {
                const [aName, aStats] = a
                const [bName, bStats] = b
                const aTotal = aStats.wins + aStats.losses
                const bTotal = bStats.wins + bStats.losses
                const aWinRate = aStats.wins / aTotal
                const bWinRate = bStats.wins / bTotal

                switch (sortType) {
                  case "name-asc":
                    return aName.localeCompare(bName)
                  case "name-desc":
                    return bName.localeCompare(aName)
                  case "matches-asc":
                    return aTotal - bTotal
                  case "matches-desc":
                    return bTotal - aTotal
                  case "winrate-asc":
                    return aWinRate - bWinRate
                  case "winrate-desc":
                    return bWinRate - aWinRate
                  default:
                    return 0
                }
              }}
            />
          </ScrollView>
        )}

        {activeTab === "skill" && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <SortableCard
              heading="By My Skill"
              data={selectedPlayer.byMySkill}
              sortState={mySkillSort}
              onSortChange={setMySkillSort}
              renderItem={([skill, stats]) => (
                <View key={skill} style={themed($statRow)}>
                  <Text style={themed($statLabel)} text={`Skill ${skill}`} />
                  <View style={themed($statValues)}>
                    <Text style={themed($winText)} text={`${stats.wins}W`} />
                    <Text style={themed($lossText)} text={`${stats.losses}L`} />
                    <Text
                      style={themed($winPercentText)}
                      text={`(${Math.round((stats.wins / (stats.wins + stats.losses)) * 100)}%)`}
                    />
                  </View>
                </View>
              )}
              sortOptions={[
                { value: "skill-asc", label: "Skill ↑" },
                { value: "skill-desc", label: "Skill ↓" },
                { value: "winrate-asc", label: "Win % ↑" },
                { value: "winrate-desc", label: "Win % ↓" },
              ]}
              sortFunction={(a, b, sortType) => {
                const [aSkill, aStats] = a
                const [bSkill, bStats] = b
                const aWinRate = aStats.wins / (aStats.wins + aStats.losses)
                const bWinRate = bStats.wins / (bStats.wins + bStats.losses)

                switch (sortType) {
                  case "skill-asc":
                    return parseInt(aSkill) - parseInt(bSkill)
                  case "skill-desc":
                    return parseInt(bSkill) - parseInt(aSkill)
                  case "winrate-asc":
                    return aWinRate - bWinRate
                  case "winrate-desc":
                    return bWinRate - aWinRate
                  default:
                    return 0
                }
              }}
            />

            <SortableCard
              heading="By Opponent Skill"
              data={selectedPlayer.byOpponentSkill}
              sortState={oppSkillSort}
              onSortChange={setOppSkillSort}
              renderItem={([skill, stats]) => (
                <View key={skill} style={themed($statRow)}>
                  <Text style={themed($statLabel)} text={`Opponent Skill ${skill}`} />
                  <View style={themed($statValues)}>
                    <Text style={themed($winText)} text={`${stats.wins}W`} />
                    <Text style={themed($lossText)} text={`${stats.losses}L`} />
                    <Text
                      style={themed($winPercentText)}
                      text={`(${Math.round((stats.wins / (stats.wins + stats.losses)) * 100)}%)`}
                    />
                  </View>
                </View>
              )}
              sortOptions={[
                { value: "skill-asc", label: "Skill ↑" },
                { value: "skill-desc", label: "Skill ↓" },
                { value: "winrate-asc", label: "Win % ↑" },
                { value: "winrate-desc", label: "Win % ↓" },
              ]}
              sortFunction={(a, b, sortType) => {
                const [aSkill, aStats] = a
                const [bSkill, bStats] = b
                const aWinRate = aStats.wins / (aStats.wins + aStats.losses)
                const bWinRate = bStats.wins / (bStats.wins + bStats.losses)

                switch (sortType) {
                  case "skill-asc":
                    return parseInt(aSkill) - parseInt(bSkill)
                  case "skill-desc":
                    return parseInt(bSkill) - parseInt(aSkill)
                  case "winrate-asc":
                    return aWinRate - bWinRate
                  case "winrate-desc":
                    return bWinRate - aWinRate
                  default:
                    return 0
                }
              }}
            />

            <SortableCard
              heading="By Difference (Me vs Opp)"
              data={selectedPlayer.bySkillDifference}
              sortState={skillDiffSort}
              onSortChange={setSkillDiffSort}
              renderItem={([difference, stats]) => (
                <View key={difference} style={themed($statRow)}>
                  <Text style={themed($statLabel)} text={`${difference} Difference`} />
                  <View style={themed($statValues)}>
                    <Text style={themed($winText)} text={`${stats.wins}W`} />
                    <Text style={themed($lossText)} text={`${stats.losses}L`} />
                    <Text
                      style={themed($winPercentText)}
                      text={`(${Math.round((stats.wins / (stats.wins + stats.losses)) * 100)}%)`}
                    />
                  </View>
                </View>
              )}
              sortOptions={[
                { value: "diff-asc", label: "Difference ↑" },
                { value: "diff-desc", label: "Difference ↓" },
                { value: "winrate-asc", label: "Win % ↑" },
                { value: "winrate-desc", label: "Win % ↓" },
              ]}
              sortFunction={(a, b, sortType) => {
                const [aDiff, aStats] = a
                const [bDiff, bStats] = b
                const aWinRate = aStats.wins / (aStats.wins + aStats.losses)
                const bWinRate = bStats.wins / (bStats.wins + bStats.losses)

                switch (sortType) {
                  case "diff-asc":
                    return parseInt(aDiff) - parseInt(bDiff)
                  case "diff-desc":
                    return parseInt(bDiff) - parseInt(aDiff)
                  case "winrate-asc":
                    return aWinRate - bWinRate
                  case "winrate-desc":
                    return bWinRate - aWinRate
                  default:
                    return 0
                }
              }}
            />
          </ScrollView>
        )}
      </View>
    </Screen>
  )
}

export default StatsScreen

const $contentContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $topContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.lg,
})

const $bottomContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
  alignItems: "center",
  gap: spacing.md,
})

const $headerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingTop: "20%",
  paddingBottom: spacing.xs,
})

const $statsContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flex: 1,
  paddingHorizontal: spacing.md,
  paddingTop: spacing.sm,
  paddingBottom: spacing.md,
  gap: spacing.sm,
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 24,
  lineHeight: 32,
  fontWeight: "900",
  textAlign: "center",
  marginBottom: spacing.lg,
})

const _$inputContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  width: "100%",
})

const $primaryButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.palette.primary100,
  width: "100%",
  paddingVertical: spacing.md,
})

const $primaryButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 18,
  lineHeight: 24,
  textAlignVertical: "center",
})

const _$loadingCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderColor: colors.palette.neutral300,
  padding: spacing.lg,
  borderRadius: 24,
  alignItems: "center",
})

const _$errorCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.error,
  borderColor: colors.error,
  padding: spacing.lg,
  borderRadius: 24,
  alignItems: "center",
})

const $playerTabsScrollContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  paddingHorizontal: spacing.sm,
  paddingLeft: 0,
})

const $playerTab: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xxs,
  borderRadius: 24,
  fontSize: 14,
  fontWeight: "500",
  color: colors.textDim,
  textAlign: "center",
  flex: 1,
})

const $activePlayerTab: ThemedStyle<TextStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary100,
  color: colors.palette.primary500,
  fontWeight: "600",
})

const $tabsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  // marginBottom: spacing.sm,
  paddingHorizontal: spacing.sm,
})

const $playerRowContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  alignContent: "flex-start",
  gap: spacing.xs,
  marginBottom: spacing.sm,
})

const $iconButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  paddingHorizontal: spacing.xxs,
  paddingVertical: spacing.xxs,
  borderRadius: 24,
  alignSelf: "flex-start",
  minHeight: 28,
  maxHeight: 28,
  justifyContent: "center",
  alignItems: "center",
})

const $iconText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "600",
  color: colors.text,
})

const $addPlayerButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  borderRadius: 20,
  alignSelf: "flex-start",
  minHeight: 32,
  maxHeight: 32,
})

const $addPlayerButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  fontWeight: "500",
  color: colors.palette.neutral700,
})

const $gameTypeButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 32,
  height: 32,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.xs,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 24,
})

const $activeGameTypeButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.secondary100,
})

const $statsTabsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $statsTabsScrollContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  paddingHorizontal: spacing.xs,
})

const $tab: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  textAlign: "center",
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.md,
  fontSize: 14,
  fontWeight: "500",
  color: colors.textDim,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 24,
})

const $activeTab: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary500,
  backgroundColor: colors.palette.primary100,
  fontWeight: "600",
})

const $statCard: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  padding: spacing.md,
  marginBottom: spacing.sm,
  shadowOpacity: 0,
  elevation: 0,
})

const $confirmationCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderColor: colors.palette.neutral300,
  padding: spacing.lg,
  borderRadius: 24,
  alignItems: "center",
  marginBottom: spacing.lg,
})

const $cardContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  width: "100%",
})

const $playerName: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 20,
  fontWeight: "700",
  color: colors.text,
  marginBottom: spacing.sm,
})

const $playerLocation: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  color: colors.textDim,
  marginBottom: spacing.xs,
})

const $playerMemberNumber: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  color: colors.textDim,
  marginBottom: spacing.md,
})

const $teamsSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignSelf: "stretch",
  marginBottom: spacing.md,
})

const $teamsTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
  marginBottom: spacing.sm,
})

const $teamText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  color: colors.textDim,
  marginBottom: spacing.xs,
})

const $moreTeamsText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  color: colors.textDim,
  fontStyle: "italic",
  marginTop: spacing.xs,
})

const $statRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.xs,
  borderBottomWidth: 1,
  borderBottomColor: "rgba(0,0,0,0.1)",
})

const $overallRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.xs,
})

const $statLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "500",
  color: colors.text,
  flex: 1,
})

const $statValues: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $winText: ThemedStyle<TextStyle> = () => ({
  fontSize: 16,
  fontWeight: "600",
  color: "#22c55e", // Green color for wins
})

const $lossText: ThemedStyle<TextStyle> = () => ({
  fontSize: 16,
  fontWeight: "600",
  color: "#ef4444", // Red color for losses
})

const $winPercentText: ThemedStyle<TextStyle> = () => ({
  fontSize: 14,
  fontWeight: "500",
  color: "#6b7280", // Grey color for win percentage
})

const $sortContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.md,
})

const $sortLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
  marginBottom: spacing.sm,
})

const $dropdownContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "flex-start",
})

const $dropdownButton: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  fontWeight: "500",
  color: colors.text,
  backgroundColor: colors.palette.neutral100,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
  textAlign: "center",
})

const $cardHeaderRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
})

const $cardTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  fontWeight: "600",
  color: colors.text,
})

const $sortButton: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 12,
  fontWeight: "500",
  color: colors.palette.primary500,
  backgroundColor: colors.palette.primary100,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxxs,
  borderRadius: 24,
  textAlign: "center",
  borderWidth: 1,
  borderColor: colors.palette.primary300,
})

const $confirmationText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
  marginTop: spacing.sm,
})

const $secondaryButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.palette.neutral200,
  width: "100%",
  paddingVertical: spacing.md,
  marginTop: spacing.sm,
})

const $secondaryButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 18,
  lineHeight: 24,
  textAlignVertical: "center",
  color: "#666",
})

const $playerManagementRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: "rgba(0,0,0,0.1)",
})

const $playerInfo: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  marginRight: spacing.sm,
})

const $reportDate: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 12,
  color: colors.textDim,
  marginTop: spacing.xs,
})

const $playerActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
})

const $actionButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  borderRadius: 24,
  minHeight: 32,
  maxHeight: 32,
})

const $actionButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  fontWeight: "500",
  color: colors.palette.neutral700,
})

const $deleteButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary500,
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  borderRadius: 24,
  minHeight: 32,
  maxHeight: 32,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  color: colors.textDim,
  textAlign: "center",
  paddingVertical: spacing.md,
  marginBottom: spacing.sm,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  color: colors.error,
  textAlign: "center",
  paddingVertical: spacing.md,
  marginBottom: spacing.sm,
})

const $emptyStateText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  color: colors.textDim,
  textAlign: "center",
  paddingVertical: spacing.lg,
})

const $searchContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.xl,
})

const $searchCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 24,
  padding: spacing.xl,
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
})

const $searchTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 24,
  fontWeight: "700",
  color: colors.text,
  textAlign: "center",
  marginBottom: spacing.xs,
})

const $searchSubtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  color: colors.textDim,
  textAlign: "center",
  marginBottom: spacing.xl,
  lineHeight: 22,
})

const $searchInputContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
  width: "100%",
})

const $statusContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.md,
})

const $searchButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.palette.primary100,
  width: "100%",
  paddingVertical: spacing.md,
  marginTop: spacing.sm,
})

const $searchButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 18,
  lineHeight: 24,
  textAlignVertical: "center",
  fontWeight: "600",
})

const $searchHeaderRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
})

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 40,
  height: 40,
  justifyContent: "center",
  alignItems: "center",
})
