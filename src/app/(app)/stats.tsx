import { FC, useState } from "react"
import {
  ActivityIndicator,
  ScrollView,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Screen } from "@/components/Screen"
import { SortableCard } from "@/components/SortableCard"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { usePlayerReport } from "@/hooks/usePlayerReport"
import { useSortState } from "@/hooks/useSortState"
import { StatsEvents } from "@/services/analytics"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export const StatsScreen: FC = function StatsScreen() {
  const { themed } = useAppTheme()
  const [activeTab, setActiveTab] = useState<"overall" | "trending" | "headToHead" | "skill">(
    "overall",
  )
  const { sorts, setSort, resetSorts } = useSortState()
  const {
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
    handleSubmitPlayer,
    handleAddPlayer,
    handleEditPlayers,
    handleRefreshPlayer,
    handleDeletePlayer,
    handleConfirmPlayer,
    handleGameTypeSelect,
    handleSelectSeason,
    handleSelectPlayer,
  } = usePlayerReport()

  // View 1: Player Name Input (when no players exist or adding new player)
  if (players.length === 0 || showInputForm) {
    // Show confirmation card if we have search results
    if (showConfirmation && playerSearchResult) {
      return (
        <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
          <View style={themed($headerContainer)}>
            <Text style={themed($title)} text="🚀 Confirm Player" />

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

                  <View style={themed($buttonContainer)}>
                    <Button
                      text={isLoading ? "Loading..." : "Add Player"}
                      onPress={handleConfirmPlayer}
                      style={themed([
                        $primaryButton,
                        !(userEmail === "daniel@catbagan.me") &&
                          players.length >= 3 &&
                          $primaryButtonDisabled,
                      ])}
                      textStyle={themed([
                        $primaryButtonText,
                        !(userEmail === "daniel@catbagan.me") &&
                          players.length >= 3 &&
                          $primaryButtonTextDisabled,
                      ])}
                      disabled={isLoading}
                      RightAccessory={
                        isLoading
                          ? ({ style }) => (
                              <View style={style}>
                                <ActivityIndicator size="small" color="#000" />
                              </View>
                            )
                          : undefined
                      }
                    />
                    <Button
                      text="Search Again"
                      onPress={handleAddPlayer}
                      style={themed($secondaryButton)}
                      textStyle={themed($secondaryButtonText)}
                      disabled={isLoading}
                    />
                  </View>
                </View>
              }
            />
          </View>
        </Screen>
      )
    }

    // Show search form
    return (
      <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
        <View style={themed($headerContainer)}>
          <Text style={themed($title)} text="📈 Player Stats" />
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
                <Text style={themed($loadingText)} text="Gathering your pool statistics..." />
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

            <Button
              text="Back"
              onPress={() => setShowInputForm(false)}
              style={themed($backButtonStyle)}
              textStyle={themed($backButtonTextStyle)}
            />
          </View>
        </View>
      </Screen>
    )
  }

  // View 2: Player Management (when editing players)
  if (showEditView) {
    return (
      <Screen preset="scroll" contentContainerStyle={themed($contentContainer)}>
        <View style={themed($headerContainer)}>
          <Text style={themed($title)} text="Manage Players" />
        </View>

        <View style={themed($statsContainer)}>
          {players.map((player) => (
            <View key={player.name} style={themed($playerManagementRow)}>
              <View style={themed($playerInfo)}>
                <Text style={themed($playerName)} text={player.name} />
                {playerReportDates[player.name] && (
                  <Text
                    style={themed($reportDate)}
                    text={`Last updated: ${playerReportDates[player.name]}`}
                  />
                )}
              </View>
              <View style={themed($playerActions)}>
                <TouchableOpacity
                  onPress={() => handleRefreshPlayer(player.name)}
                  style={themed($actionButton)}
                  disabled={isLoading}
                >
                  <MaterialCommunityIcons name="refresh" size={20} color="#007AFF" />
                  <Text style={themed($actionButtonText)} text="Refresh" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeletePlayer(player.name)}
                  style={themed($actionButton)}
                >
                  <MaterialCommunityIcons name="delete" size={20} color="#FF3B30" />
                  <Text style={themed($actionButtonText)} text="Delete" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {isLoading ? (
            <View style={themed($buttonContainer)}>
              <Text style={themed($loadingText)} text="Loading..." />
            </View>
          ) : (
            <View style={themed($buttonContainer)}>
              <Button
                text="Back to Stats"
                onPress={() => setShowEditView(false)}
                style={themed($backButtonStyle)}
                textStyle={themed($backButtonTextStyle)}
                disabled={isLoading}
              />
            </View>
          )}
        </View>
      </Screen>
    )
  }

  // View 3: Main Stats Display
  if (!selectedPlayer) {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
        <View style={themed($topContainer)}>
          <Text style={themed($title)} text="📈 Player Stats" />
          <Text
            style={themed($emptyStateText)}
            text="No players found. Please add a player to view statistics."
          />
        </View>
      </Screen>
    )
  }

  return (
    <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
      <View style={themed($headerContainer)}>
        <View style={themed($tabsContainer)}>
          <View style={themed($playerRowContainer)}>
            <TouchableOpacity
              onPress={handleAddPlayer}
              style={themed([
                $iconButton,
                !(userEmail === "daniel@catbagan.me") && players.length >= 3 && $iconButtonDisabled,
              ])}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={
                  !(userEmail === "daniel@catbagan.me") && players.length >= 3
                    ? "#999999"
                    : "#000000"
                }
              />
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
                const nameParts = player.name.split(" ")
                const shortName =
                  nameParts.length > 1 ? `${nameParts[0]} ${nameParts[1].charAt(0)}` : player.name

                return (
                  <Text
                    key={player.name}
                    style={themed([$playerTab, selectedPlayerIndex === index && $activePlayerTab])}
                    text={shortName}
                    onPress={() => handleSelectPlayer(index, resetSorts)}
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
                size={16}
                color={gameType === "8ball" ? "#000000" : "#666666"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={themed([$gameTypeButton, gameType === "9ball" && $activeGameTypeButton])}
              onPress={() => handleGameTypeSelect("9ball")}
            >
              <MaterialCommunityIcons
                name="numeric-9-circle"
                size={16}
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
                onPress={() => {
                  setActiveTab("overall")
                  StatsEvents.tabChanged("overall")
                }}
              />
              <Text
                style={themed([$tab, activeTab === "trending" && $activeTab])}
                text="Trending"
                onPress={() => {
                  setActiveTab("trending")
                  StatsEvents.tabChanged("trending")
                }}
              />
              <Text
                style={themed([$tab, activeTab === "skill" && $activeTab])}
                text="Skill"
                onPress={() => {
                  setActiveTab("skill")
                  StatsEvents.tabChanged("skill")
                }}
              />
              <Text
                style={themed([$tab, activeTab === "headToHead" && $activeTab])}
                text="Head to Head"
                onPress={() => {
                  setActiveTab("headToHead")
                  StatsEvents.tabChanged("headToHead")
                }}
              />
            </ScrollView>
          </View>

          {availableSeasons.length > 0 && (
            <View style={themed($seasonFilterContainer)}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={themed($seasonScrollContainer)}
              >
                <TouchableOpacity
                  style={themed([$seasonToggle, selectedSeason === "all" && $seasonToggleActive])}
                  onPress={() => handleSelectSeason("all", resetSorts)}
                >
                  <Text
                    style={themed([
                      $seasonToggleText,
                      selectedSeason === "all" && $seasonToggleTextActive,
                    ])}
                    text="All"
                  />
                </TouchableOpacity>
                {availableSeasons.map((season) => (
                  <TouchableOpacity
                    key={season}
                    style={themed([
                      $seasonToggle,
                      selectedSeason === season && $seasonToggleActive,
                    ])}
                    onPress={() => handleSelectSeason(season, resetSorts)}
                  >
                    <Text
                      style={themed([
                        $seasonToggleText,
                        selectedSeason === season && $seasonToggleTextActive,
                      ])}
                      text={season}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <View style={themed($contentContainer)}>
        {isLoading && selectedPlayerIndex >= 0 && (
          <View style={themed($loadingOverlay)}>
            <ActivityIndicator size="large" />
            <Text style={themed($loadingText)} text="Loading stats..." />
          </View>
        )}
        {(
          <View style={themed($statsContainer)}>
            {activeTab === "overall" && (
              <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
                {/* Overall Stats */}
                <Card
                  style={themed($overallStatCard)}
                  ContentComponent={
                    <View style={themed($overallRow)}>
                      <Text weight="bold" text="Overall Record" />
                      <View style={themed($statValues)}>
                        <Text style={themed($winText)} text={`${selectedPlayer.overall.wins}W`} />
                        <Text
                          style={themed($lossText)}
                          text={`${selectedPlayer.overall.losses}L`}
                        />
                        <Text
                          style={themed($winPercentText)}
                          text={`(${Math.round((selectedPlayer.overall.wins / (selectedPlayer.overall.wins + selectedPlayer.overall.losses)) * 100)}%)`}
                        />
                      </View>
                    </View>
                  }
                />

                {/* By Location */}
                {Object.keys(selectedPlayer.byLocation).length > 0 && (
                  <SortableCard
                    heading="By Location"
                    data={selectedPlayer.byLocation}
                    sortState={sorts.location}
                    onSortChange={(sort) => {
                      setSort("location", sort)
                      StatsEvents.sortChanged("location", sort)
                    }}
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
                      const [nameA, statsA] = a
                      const [nameB, statsB] = b
                      const winRateA = statsA.wins / (statsA.wins + statsA.losses)
                      const winRateB = statsB.wins / (statsB.wins + statsB.losses)
                      const matchesA = statsA.wins + statsA.losses
                      const matchesB = statsB.wins + statsB.losses

                      switch (sortType) {
                        case "name-asc":
                          return nameA.localeCompare(nameB)
                        case "name-desc":
                          return nameB.localeCompare(nameA)
                        case "winrate-asc":
                          if (winRateA === winRateB) return matchesB - matchesA
                          return winRateA - winRateB
                        case "winrate-desc":
                          if (winRateB === winRateA) return matchesB - matchesA
                          return winRateB - winRateA
                        default:
                          return nameA.localeCompare(nameB)
                      }
                    }}
                  />
                )}

                {/* By Position */}
                {Object.keys(selectedPlayer.byPosition).length > 0 && (
                  <SortableCard
                    heading="By Position"
                    data={selectedPlayer.byPosition}
                    sortState={sorts.position}
                    onSortChange={(sort) => {
                      setSort("position", sort)
                      StatsEvents.sortChanged("position", sort)
                    }}
                    renderItem={([position, stats]) => (
                      <View key={position} style={themed($statRow)}>
                        <Text style={themed($statLabel)} text={position} />
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
                      { value: "position-asc", label: "Position ↑" },
                      { value: "position-desc", label: "Position ↓" },
                      { value: "winrate-asc", label: "Win % ↑" },
                      { value: "winrate-desc", label: "Win % ↓" },
                    ]}
                    sortFunction={(a, b, sortType) => {
                      const [positionA, statsA] = a
                      const [positionB, statsB] = b
                      const winRateA = statsA.wins / (statsA.wins + statsA.losses)
                      const winRateB = statsB.wins / (statsB.wins + statsB.losses)
                      const matchesA = statsA.wins + statsA.losses
                      const matchesB = statsB.wins + statsB.losses

                      switch (sortType) {
                        case "position-asc":
                          return positionA.localeCompare(positionB)
                        case "position-desc":
                          return positionB.localeCompare(positionA)
                        case "winrate-asc":
                          if (winRateA === winRateB) return matchesB - matchesA
                          return winRateA - winRateB
                        case "winrate-desc":
                          if (winRateB === winRateA) return matchesB - matchesA
                          return winRateB - winRateA
                        default:
                          return positionA.localeCompare(positionB)
                      }
                    }}
                  />
                )}

                {/* Score Distribution */}
                {Object.keys(selectedPlayer.scoreDistribution || {}).length > 0 && (
                  <SortableCard
                    heading="Score Distribution"
                    data={selectedPlayer.scoreDistribution}
                    sortState={sorts.score}
                    onSortChange={(sort) => {
                      setSort("score", sort)
                      StatsEvents.sortChanged("score", sort)
                    }}
                    renderItem={([score, count]) => (
                      <View key={score} style={themed($statRow)}>
                        <Text style={themed($statLabel)} text={score} />
                        <View style={themed($statValues)}>
                          <Text style={themed($winPercentText)} text={`${count} matches`} />
                        </View>
                      </View>
                    )}
                    sortOptions={[
                      { value: "score-asc", label: "Score" },
                      { value: "count-asc", label: "Count ↑" },
                      { value: "count-desc", label: "Count ↓" },
                    ]}
                    sortFunction={(a, b, sortType) => {
                      const [scoreA, countA] = a
                      const [scoreB, countB] = b

                      if (sortType === "count-asc") {
                        return countA - countB
                      }
                      if (sortType === "count-desc") {
                        return countB - countA
                      }

                      // Default: Sort by score (your score desc, then opponent score asc)
                      // Parse scores like "3-0", "2-1", etc.
                      const [yourScoreA, oppScoreA] = scoreA.split("-").map((n) => parseInt(n))
                      const [yourScoreB, oppScoreB] = scoreB.split("-").map((n) => parseInt(n))

                      // Sort by your score descending first
                      if (yourScoreA !== yourScoreB) {
                        return yourScoreB - yourScoreA
                      }
                      // Then by opponent score ascending
                      return oppScoreA - oppScoreB
                    }}
                  />
                )}

                {/* By Innings */}
                {Object.keys(selectedPlayer.byInnings || {}).length > 0 && (
                  <SortableCard
                    heading="By Innings"
                    data={selectedPlayer.byInnings}
                    sortState={sorts.innings}
                    onSortChange={(sort) => {
                      setSort("innings", sort)
                      StatsEvents.sortChanged("innings", sort)
                    }}
                    renderItem={([innings, stats]) => (
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
                    )}
                    sortOptions={[
                      { value: "innings-asc", label: "Innings ↑" },
                      { value: "innings-desc", label: "Innings ↓" },
                      { value: "winrate-asc", label: "Win % ↑" },
                      { value: "winrate-desc", label: "Win % ↓" },
                    ]}
                    sortFunction={(a, b, sortType) => {
                      const [inningsA, statsA] = a
                      const [inningsB, statsB] = b
                      const winRateA = statsA.wins / (statsA.wins + statsA.losses)
                      const winRateB = statsB.wins / (statsB.wins + statsB.losses)
                      const matchesA = statsA.wins + statsA.losses
                      const matchesB = statsB.wins + statsB.losses

                      switch (sortType) {
                        case "innings-asc":
                          return parseInt(inningsA) - parseInt(inningsB)
                        case "innings-desc":
                          return parseInt(inningsB) - parseInt(inningsA)
                        case "winrate-asc":
                          if (winRateA === winRateB) return matchesB - matchesA
                          return winRateA - winRateB
                        case "winrate-desc":
                          if (winRateB === winRateA) return matchesB - matchesA
                          return winRateB - winRateA
                        default:
                          return parseInt(inningsA) - parseInt(inningsB)
                      }
                    }}
                  />
                )}

                {/* By Team Situation */}
                {Object.keys(selectedPlayer.byTeamSituation || {}).length > 0 && (
                  <SortableCard
                    heading="By Team Situation"
                    data={selectedPlayer.byTeamSituation}
                    sortState={sorts.teamSituation}
                    onSortChange={(sort) => {
                      setSort("teamSituation", sort)
                      StatsEvents.sortChanged("teamSituation", sort)
                    }}
                    renderItem={([situation, stats]) => {
                      const formattedSituation = situation
                        .split("_")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")
                      return (
                        <View key={situation} style={themed($statRow)}>
                          <Text style={themed($statLabel)} text={formattedSituation} />
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
                      { value: "name-asc", label: "Name A-Z" },
                      { value: "name-desc", label: "Name Z-A" },
                      { value: "winrate-asc", label: "Win % ↑" },
                      { value: "winrate-desc", label: "Win % ↓" },
                    ]}
                    sortFunction={(a, b, sortType) => {
                      const [situationA, statsA] = a
                      const [situationB, statsB] = b
                      const winRateA = statsA.wins / (statsA.wins + statsA.losses)
                      const winRateB = statsB.wins / (statsB.wins + statsB.losses)
                      const matchesA = statsA.wins + statsA.losses
                      const matchesB = statsB.wins + statsB.losses

                      switch (sortType) {
                        case "name-asc":
                          return situationA.localeCompare(situationB)
                        case "name-desc":
                          return situationB.localeCompare(situationA)
                        case "winrate-asc":
                          if (winRateA === winRateB) return matchesB - matchesA
                          return winRateA - winRateB
                        case "winrate-desc":
                          if (winRateB === winRateA) return matchesB - matchesA
                          return winRateB - winRateA
                        default:
                          return situationA.localeCompare(situationB)
                      }
                    }}
                  />
                )}
              </ScrollView>
            )}

            {activeTab === "trending" && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Current Streak */}
                {selectedPlayer.currentStreak !== undefined && (
                  <Card
                    style={themed($overallStatCard)}
                    ContentComponent={
                      <View style={themed($overallRow)}>
                        <Text weight="bold" text="Current Streak" />
                        <View style={themed($statValues)}>
                          <Text
                            style={themed(selectedPlayer.currentStreak >= 0 ? $winText : $lossText)}
                            text={`${selectedPlayer.currentStreak >= 0 ? "+" : ""}${selectedPlayer.currentStreak}`}
                          />
                          <Text
                            style={themed($winPercentText)}
                            text={selectedPlayer.currentStreak >= 0 ? "Wins" : "Losses"}
                          />
                        </View>
                      </View>
                    }
                  />
                )}

                {/* Trending Status */}
                {selectedPlayer.trending && (
                  <Card
                    style={themed($overallStatCard)}
                    ContentComponent={
                      <View style={themed($overallRow)}>
                        <Text weight="bold" text="Trending" />
                        <View style={themed($statValues)}>
                          <Text
                            style={themed(
                              selectedPlayer.trending === "UP"
                                ? $winText
                                : selectedPlayer.trending === "DOWN"
                                  ? $lossText
                                  : $winPercentText,
                            )}
                            text={selectedPlayer.trending}
                          />
                        </View>
                      </View>
                    }
                  />
                )}

                {/* Recent Performance */}
                {(selectedPlayer.last3Matches ||
                  selectedPlayer.last5Matches ||
                  selectedPlayer.last10Matches) && (
                  <Card
                    style={themed($statCard)}
                    ContentComponent={
                      <View style={themed($cardContent)}>
                        <View style={themed($cardHeaderRow)}>
                          <Text weight="bold" text="Recent Performance" />
                        </View>
                        {selectedPlayer.last3Matches && (
                          <View style={themed($statRow)}>
                            <Text style={themed($statLabel)} text="Last 3 Matches" />
                            <View style={themed($statValues)}>
                              <Text
                                style={themed($winText)}
                                text={`${selectedPlayer.last3Matches.wins}W`}
                              />
                              <Text
                                style={themed($lossText)}
                                text={`${selectedPlayer.last3Matches.losses}L`}
                              />
                              <Text
                                style={themed($winPercentText)}
                                text={`(${Math.round((selectedPlayer.last3Matches.wins / (selectedPlayer.last3Matches.wins + selectedPlayer.last3Matches.losses)) * 100)}%)`}
                              />
                            </View>
                          </View>
                        )}
                        {selectedPlayer.last5Matches && (
                          <View style={themed($statRow)}>
                            <Text style={themed($statLabel)} text="Last 5 Matches" />
                            <View style={themed($statValues)}>
                              <Text
                                style={themed($winText)}
                                text={`${selectedPlayer.last5Matches.wins}W`}
                              />
                              <Text
                                style={themed($lossText)}
                                text={`${selectedPlayer.last5Matches.losses}L`}
                              />
                              <Text
                                style={themed($winPercentText)}
                                text={`(${Math.round((selectedPlayer.last5Matches.wins / (selectedPlayer.last5Matches.wins + selectedPlayer.last5Matches.losses)) * 100)}%)`}
                              />
                            </View>
                          </View>
                        )}
                        {selectedPlayer.last10Matches && (
                          <View style={themed($statRow)}>
                            <Text style={themed($statLabel)} text="Last 10 Matches" />
                            <View style={themed($statValues)}>
                              <Text
                                style={themed($winText)}
                                text={`${selectedPlayer.last10Matches.wins}W`}
                              />
                              <Text
                                style={themed($lossText)}
                                text={`${selectedPlayer.last10Matches.losses}L`}
                              />
                              <Text
                                style={themed($winPercentText)}
                                text={`(${Math.round((selectedPlayer.last10Matches.wins / (selectedPlayer.last10Matches.wins + selectedPlayer.last10Matches.losses)) * 100)}%)`}
                              />
                            </View>
                          </View>
                        )}
                      </View>
                    }
                  />
                )}

                {/* Longest Win Streak */}
                {selectedPlayer.longestWinStreak && (
                  <Card
                    style={themed($statCard)}
                    ContentComponent={
                      <View style={themed($cardContent)}>
                        <View style={themed($cardHeaderRow)}>
                          <Text weight="bold" text="Longest Win Streak" />
                        </View>
                        <View style={themed($statRow)}>
                          <Text style={themed($statLabel)} text="Count" />
                          <View style={themed($statValues)}>
                            <Text
                              style={themed($winText)}
                              text={`${selectedPlayer.longestWinStreak.count}W`}
                            />
                          </View>
                        </View>
                        <View style={themed($statRow)}>
                          <Text style={themed($statLabel)} text="Season" />
                          <View style={themed($statValues)}>
                            <Text
                              style={themed($winPercentText)}
                              text={selectedPlayer.longestWinStreak.season}
                            />
                          </View>
                        </View>
                      </View>
                    }
                  />
                )}

                {/* Longest Loss Streak */}
                {selectedPlayer.longestLossStreak && (
                  <Card
                    style={themed($statCard)}
                    ContentComponent={
                      <View style={themed($cardContent)}>
                        <View style={themed($cardHeaderRow)}>
                          <Text weight="bold" text="Longest Loss Streak" />
                        </View>
                        <View style={themed($statRow)}>
                          <Text style={themed($statLabel)} text="Count" />
                          <View style={themed($statValues)}>
                            <Text
                              style={themed($lossText)}
                              text={`${selectedPlayer.longestLossStreak.count}L`}
                            />
                          </View>
                        </View>
                        <View style={themed($statRow)}>
                          <Text style={themed($statLabel)} text="Season" />
                          <View style={themed($statValues)}>
                            <Text
                              style={themed($winPercentText)}
                              text={selectedPlayer.longestLossStreak.season}
                            />
                          </View>
                        </View>
                      </View>
                    }
                  />
                )}
              </ScrollView>
            )}

            {activeTab === "headToHead" && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <SortableCard
                  heading="Head to Head"
                  data={selectedPlayer.headToHead}
                  sortState={sorts.headToHead}
                  onSortChange={(sort) => {
                    setSort("headToHead", sort)
                    StatsEvents.sortChanged("headToHead", sort)
                  }}
                  renderItem={([opponent, stats]) => (
                    <View key={opponent} style={themed($statRow)}>
                      <Text style={themed($statLabel)} text={opponent} />
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
                    const [nameA, statsA] = a
                    const [nameB, statsB] = b
                    const totalMatchesA = statsA.wins + statsA.losses
                    const totalMatchesB = statsB.wins + statsB.losses
                    const winRateA = statsA.wins / totalMatchesA
                    const winRateB = statsB.wins / totalMatchesB

                    switch (sortType) {
                      case "name-asc":
                        return nameA.localeCompare(nameB)
                      case "name-desc":
                        return nameB.localeCompare(nameA)
                      case "matches-asc":
                        return totalMatchesA - totalMatchesB
                      case "matches-desc":
                        return totalMatchesB - totalMatchesA
                      case "winrate-asc":
                        if (winRateA === winRateB) return totalMatchesB - totalMatchesA
                        return winRateA - winRateB
                      case "winrate-desc":
                        if (winRateB === winRateA) return totalMatchesB - totalMatchesA
                        return winRateB - winRateA
                      default:
                        return nameA.localeCompare(nameB)
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
                  sortState={sorts.mySkill}
                  onSortChange={(sort) => {
                    setSort("mySkill", sort)
                    StatsEvents.sortChanged("mySkill", sort)
                  }}
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
                    const [skillA, statsA] = a
                    const [skillB, statsB] = b
                    const skillLevelA = parseInt(skillA)
                    const skillLevelB = parseInt(skillB)
                    const winRateA = statsA.wins / (statsA.wins + statsA.losses)
                    const winRateB = statsB.wins / (statsB.wins + statsB.losses)
                    const matchesA = statsA.wins + statsA.losses
                    const matchesB = statsB.wins + statsB.losses

                    switch (sortType) {
                      case "skill-asc":
                        return skillLevelA - skillLevelB
                      case "skill-desc":
                        return skillLevelB - skillLevelA
                      case "winrate-asc":
                        if (winRateA === winRateB) return matchesB - matchesA
                        return winRateA - winRateB
                      case "winrate-desc":
                        if (winRateB === winRateA) return matchesB - matchesA
                        return winRateB - winRateA
                      default:
                        return skillLevelA - skillLevelB
                    }
                  }}
                />

                <SortableCard
                  heading="By Opponent Skill"
                  data={selectedPlayer.byOpponentSkill}
                  sortState={sorts.oppSkill}
                  onSortChange={(sort) => {
                    setSort("oppSkill", sort)
                    StatsEvents.sortChanged("opponentSkill", sort)
                  }}
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
                    const [skillA, statsA] = a
                    const [skillB, statsB] = b
                    const skillLevelA = parseInt(skillA)
                    const skillLevelB = parseInt(skillB)
                    const winRateA = statsA.wins / (statsA.wins + statsA.losses)
                    const winRateB = statsB.wins / (statsB.wins + statsB.losses)
                    const matchesA = statsA.wins + statsA.losses
                    const matchesB = statsB.wins + statsB.losses

                    switch (sortType) {
                      case "skill-asc":
                        return skillLevelA - skillLevelB
                      case "skill-desc":
                        return skillLevelB - skillLevelA
                      case "winrate-asc":
                        if (winRateA === winRateB) return matchesB - matchesA
                        return winRateA - winRateB
                      case "winrate-desc":
                        if (winRateB === winRateA) return matchesB - matchesA
                        return winRateB - winRateA
                      default:
                        return skillLevelA - skillLevelB
                    }
                  }}
                />

                <SortableCard
                  heading="By Skill Difference"
                  data={selectedPlayer.bySkillDifference}
                  sortState={sorts.skillDiff}
                  onSortChange={(sort) => {
                    setSort("skillDiff", sort)
                    StatsEvents.sortChanged("skillDifference", sort)
                  }}
                  renderItem={([difference, stats]) => {
                    const diffNum = parseInt(difference)
                    let diffLabel = ""

                    if (diffNum === 0) {
                      diffLabel = "Same skill level"
                    } else if (diffNum > 0) {
                      diffLabel = `Playing down ${diffNum} level${diffNum > 1 ? "s" : ""}`
                    } else {
                      diffLabel = `Playing up ${Math.abs(diffNum)} level${Math.abs(diffNum) > 1 ? "s" : ""}`
                    }

                    return (
                      <View key={difference} style={themed($statRow)}>
                        <Text style={themed($statLabel)} text={diffLabel} />
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
                    { value: "diff-asc", label: "Difference ↑" },
                    { value: "diff-desc", label: "Difference ↓" },
                    { value: "winrate-asc", label: "Win % ↑" },
                    { value: "winrate-desc", label: "Win % ↓" },
                  ]}
                  sortFunction={(a, b, sortType) => {
                    const [diffA, statsA] = a
                    const [diffB, statsB] = b
                    const diffLevelA = parseInt(diffA)
                    const diffLevelB = parseInt(diffB)
                    const winRateA = statsA.wins / (statsA.wins + statsA.losses)
                    const winRateB = statsB.wins / (statsB.wins + statsB.losses)
                    const matchesA = statsA.wins + statsA.losses
                    const matchesB = statsB.wins + statsB.losses

                    switch (sortType) {
                      case "diff-asc":
                        return diffLevelA - diffLevelB
                      case "diff-desc":
                        return diffLevelB - diffLevelA
                      case "winrate-asc":
                        if (winRateA === winRateB) return matchesB - matchesA
                        return winRateA - winRateB
                      case "winrate-desc":
                        if (winRateB === winRateA) return matchesB - matchesA
                        return winRateB - winRateA
                      default:
                        return diffLevelA - diffLevelB
                    }
                  }}
                />
              </ScrollView>
            )}
          </View>
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

const $headerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingTop: "20%",
})

const $statsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
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

const $playerTabsScrollContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  paddingHorizontal: spacing.sm,
  paddingLeft: 0,
  marginBottom: spacing.xxs,
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
  paddingHorizontal: spacing.sm,
})

const $playerRowContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  alignContent: "flex-start",
  gap: spacing.xs,
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

const $gameTypeButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 24,
  height: 24,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: spacing.xxxs,
  paddingHorizontal: spacing.xxs,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 24,
})

const $activeGameTypeButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.secondary100,
})

const $statsTabsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $statsTabsScrollContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  paddingHorizontal: spacing.xs,
  marginBottom: spacing.xxs,
})

const $tab: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  textAlign: "center",
  paddingVertical: spacing.xxxs,
  paddingHorizontal: spacing.xs,
  fontSize: 12,
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

const $statCard: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
  marginBottom: spacing.sm,
  shadowOpacity: 0,
  elevation: 0,
})

const $overallStatCard: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
  marginBottom: spacing.sm,
  shadowOpacity: 0,
  elevation: 0,
  minHeight: 0,
})

const $confirmationCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderColor: colors.palette.neutral300,
  padding: spacing.lg,
  borderRadius: 24,
  alignItems: "center",
  marginBottom: spacing.lg,
})

const $cardContent: ThemedStyle<ViewStyle> = () => ({
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

const $overallRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
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

const $cardHeaderRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
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
  alignContent: "center",
  justifyContent: "center",
})

const $actionButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  borderRadius: 24,
  minHeight: 32,
  maxHeight: 32,
  alignItems: "center",
  justifyContent: "center",
})

const $actionButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  fontWeight: "500",
  color: colors.palette.neutral700,
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
  marginBottom: spacing.sm,
})

const $searchButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 18,
  lineHeight: 24,
  textAlignVertical: "center",
  fontWeight: "600",
})

const $backButtonStyle: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.palette.neutral200,
  width: "100%",
  paddingVertical: spacing.md,
})

const $backButtonTextStyle: ThemedStyle<TextStyle> = () => ({
  fontSize: 18,
  lineHeight: 24,
  textAlignVertical: "center",
  fontWeight: "600",
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.xs,
  paddingBottom: spacing.md,
  width: "100%",
})

const $iconButtonDisabled: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral300,
  opacity: 0.5,
})

const $primaryButtonDisabled: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral300,
  opacity: 0.5,
})

const $primaryButtonTextDisabled: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $seasonFilterContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.sm,
})

const $seasonScrollContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.xs,
})

const $seasonToggle: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxxs,
  borderRadius: 24,
  backgroundColor: colors.palette.neutral100,
})

const $seasonToggleActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary100,
})

const $seasonToggleText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  fontWeight: "500",
  color: colors.textDim,
})

const $seasonToggleTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary500,
  fontWeight: "600",
})

const $loadingOverlay: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: colors.background,
  opacity: 0.95,
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  gap: spacing.md,
})
