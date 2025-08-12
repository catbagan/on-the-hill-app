import { FC, useState, useEffect, useCallback } from "react"
import { TextStyle, View, ViewStyle, Alert, TouchableOpacity, ScrollView } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import {
  storeRecentMatches,
  getStoredRecentMatches,
  type StoredMatch,
} from "@/utils/storage/scorekeeperStorage"

interface Player {
  id: string
  name: string
}

interface Match {
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

interface NineBallState {
  [key: number]: "onTable" | "pocketed" | "dead" | "alreadyPocketed" | "alreadyDead"
}

export const ScorekeeperScreen: FC = function ScorekeeperScreen() {
  const { themed } = useAppTheme()
  const [currentView, setCurrentView] = useState<
    "start" | "8ball" | "9ball" | "gameSetup" | "breakSelection"
  >("start")
  const [selectedGameType, setSelectedGameType] = useState<"8ball" | "9ball" | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null)
  const [recentMatches, setRecentMatches] = useState<Match[]>([])
  const [player1Name, setPlayer1Name] = useState("")
  const [player2Name, setPlayer2Name] = useState("")
  const [player1GamesToWin, setPlayer1GamesToWin] = useState(2)
  const [player2GamesToWin, setPlayer2GamesToWin] = useState(2)
  const [player1PointsToWin, setPlayer1PointsToWin] = useState(25)
  const [player2PointsToWin, setPlayer2PointsToWin] = useState(25)
  const [nineBallState, setNineBallState] = useState<NineBallState>({
    0: "onTable",
    1: "onTable",
    2: "onTable",
    3: "onTable",
    4: "onTable",
    5: "onTable",
    6: "onTable",
    7: "onTable",
    8: "onTable",
  })

  // Load recent matches from storage on mount and when screen comes into focus
  useEffect(() => {
    const loadRecentMatches = async () => {
      const storedMatches = getStoredRecentMatches()
      if (storedMatches.length > 0) {
        // Convert stored matches back to Match objects with Date objects
        const matches: Match[] = storedMatches.map((stored) => ({
          ...stored,
          player1GamesToWin: (stored as any).player1GamesToWin || 5,
          player2GamesToWin: (stored as any).player2GamesToWin || 5,
          createdAt: new Date(stored.createdAt),
        }))
        setRecentMatches(matches)
      } else {
        setRecentMatches([])
      }
    }

    loadRecentMatches()
  }, [])

  // Refresh recent matches when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadRecentMatches = async () => {
        const storedMatches = getStoredRecentMatches()
        if (storedMatches.length > 0) {
          // Convert stored matches back to Match objects with Date objects
          const matches: Match[] = storedMatches.map((stored) => ({
            ...stored,
            player1GamesToWin: (stored as any).player1GamesToWin || 5,
            player2GamesToWin: (stored as any).player2GamesToWin || 5,
            createdAt: new Date(stored.createdAt),
          }))
          setRecentMatches(matches)
        } else {
          setRecentMatches([])
        }
      }

      loadRecentMatches()
    }, [])
  )

  const addPlayer = (name: string): Player => {
    const newPlayer: Player = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
    }
    setPlayers((prev) => [...prev, newPlayer])
    return newPlayer
  }

  const createMatch = (
    gameType: "8ball" | "9ball",
    player1: Player,
    player2: Player,
    breakFirst: "player1" | "player2",
  ) => {
    const match: Match = {
      id: Date.now().toString(),
      gameType,
      player1,
      player2,
      player1GamesWon: 0,
      player2GamesWon: 0,
      player1GamesToWin: gameType === "8ball" ? player1GamesToWin : player1PointsToWin,
      player2GamesToWin: gameType === "8ball" ? player2GamesToWin : player2PointsToWin,
      currentGame: 1,
      currentPlayer: breakFirst === "player1" ? player1 : player2,
      currentInning: 1,
      createdAt: new Date(),
      isActive: true,
    }
    setCurrentMatch(match)
    setCurrentView(gameType)
  }

  const endTurn = () => {
    if (!currentMatch) return

    // Check if 9 ball is marked as dead before ending turn
    if (currentMatch.gameType === "9ball" && nineBallState[8] === "dead") {
      Alert.alert(
        "9 Ball Rule",
        "9 ball cannot be marked dead. It should be spotted if pocketed illegally.",
        [{ text: "OK" }],
      )
      return
    }

    setCurrentMatch((prev) => {
      if (!prev) return prev
      const newCurrentPlayer =
        prev.currentPlayer.id === prev.player1.id ? prev.player2 : prev.player1

      // For 9 ball, handle scoring and ball state management
      if (prev.gameType === "9ball") {
        // Calculate points for current player
        let pointsEarned = 0
        let nineBallPocketed = false

        // Count pocketed balls and check for 9 ball
        Object.entries(nineBallState).forEach(([ballIndex, state]) => {
          if (state === "pocketed") {
            const ballNum = parseInt(ballIndex) + 1
            if (ballNum === 9) {
              pointsEarned += 2 // 9 ball is worth 2 points
              nineBallPocketed = true
            } else {
              pointsEarned += 1 // Other balls are worth 1 point
            }
          }
        })

        // Update player scores
        const isPlayer1 = prev.currentPlayer.id === prev.player1.id
        const newPlayer1GamesWon = isPlayer1
          ? prev.player1GamesWon + pointsEarned
          : prev.player1GamesWon
        const newPlayer2GamesWon = !isPlayer1
          ? prev.player2GamesWon + pointsEarned
          : prev.player2GamesWon

        // Move pocketed and dead balls to already states
        const newNineBallState = { ...nineBallState }
        Object.keys(newNineBallState).forEach((ballIndex) => {
          const state = newNineBallState[parseInt(ballIndex)]
          if (state === "pocketed") {
            newNineBallState[parseInt(ballIndex)] = "alreadyPocketed"
          } else if (state === "dead") {
            newNineBallState[parseInt(ballIndex)] = "alreadyDead"
          }
        })

        // If 9 ball was pocketed, reset all balls to on table and keep same player's turn
        if (nineBallPocketed) {
          Object.keys(newNineBallState).forEach((ballIndex) => {
            newNineBallState[parseInt(ballIndex)] = "onTable"
          })
        }

        setNineBallState(newNineBallState)

        // Check if a player has won the match
        const player1WonMatch = newPlayer1GamesWon >= prev.player1GamesToWin
        const player2WonMatch = newPlayer2GamesWon >= prev.player2GamesToWin

        if (player1WonMatch || player2WonMatch) {
          // Match is over, show winner and end match
          const winner = player1WonMatch ? prev.player1 : prev.player2
          Alert.alert("Match Complete!", `${winner.name} wins the match!`, [
            {
              text: "OK",
              onPress: () => {
                const completedMatch = { ...prev, isActive: false }
                const updatedMatches = [completedMatch, ...recentMatches.slice(0, 9)]
                setRecentMatches(updatedMatches)

                // Save to storage
                const matchesToStore: StoredMatch[] = updatedMatches.map((match) => ({
                  ...match,
                  createdAt: match.createdAt.toISOString(),
                }))
                storeRecentMatches(matchesToStore)

                setCurrentMatch(null)
                setCurrentView("start")
                setNineBallState({
                  0: "onTable",
                  1: "onTable",
                  2: "onTable",
                  3: "onTable",
                  4: "onTable",
                  5: "onTable",
                  6: "onTable",
                  7: "onTable",
                  8: "onTable",
                })
              },
            },
          ])
        }

        return {
          ...prev,
          currentPlayer: nineBallPocketed ? prev.currentPlayer : newCurrentPlayer,
          currentInning: prev.currentInning + 1,
          player1GamesWon: newPlayer1GamesWon,
          player2GamesWon: newPlayer2GamesWon,
        }
      }

      // For 8 ball, just switch players
      return {
        ...prev,
        currentPlayer: newCurrentPlayer,
        currentInning: prev.currentInning + 1,
      }
    })
  }

  const markGameOver = (winnerId: string) => {
    if (!currentMatch) return

    setCurrentMatch((prev) => {
      if (!prev) return prev
      const isPlayer1Winner = winnerId === prev.player1.id
      const newPlayer1GamesWon = isPlayer1Winner ? prev.player1GamesWon + 1 : prev.player1GamesWon
      const newPlayer2GamesWon = !isPlayer1Winner ? prev.player2GamesWon + 1 : prev.player2GamesWon

      // Check if match is over
      const player1WonMatch = newPlayer1GamesWon >= prev.player1GamesToWin
      const player2WonMatch = newPlayer2GamesWon >= prev.player2GamesToWin

      if (player1WonMatch || player2WonMatch) {
        // Match is over, show winner and end match
        const winner = player1WonMatch ? prev.player1 : prev.player2
        Alert.alert("Match Complete!", `${winner.name} wins the match!`, [
          {
            text: "OK",
            onPress: () => {
              const completedMatch = { ...prev, isActive: false }
              const updatedMatches = [completedMatch, ...recentMatches.slice(0, 9)]
              setRecentMatches(updatedMatches)

              // Save to storage
              const matchesToStore: StoredMatch[] = updatedMatches.map((match) => ({
                ...match,
                createdAt: match.createdAt.toISOString(),
              }))
              storeRecentMatches(matchesToStore)

              setCurrentMatch(null)
              setCurrentView("start")
              setNineBallState({
                0: "onTable",
                1: "onTable",
                2: "onTable",
                3: "onTable",
                4: "onTable",
                5: "onTable",
                6: "onTable",
                7: "onTable",
                8: "onTable",
              })
            },
          },
        ])
      }

      return {
        ...prev,
        player1GamesWon: newPlayer1GamesWon,
        player2GamesWon: newPlayer2GamesWon,
        currentGame: prev.currentGame + 1,
        currentInning: 1,
      }
    })
  }

  const endMatch = () => {
    if (!currentMatch) return

    const completedMatch = { ...currentMatch, isActive: false }
    const updatedMatches = [completedMatch, ...recentMatches.slice(0, 9)] // Keep last 10 matches
    setRecentMatches(updatedMatches)

    // Save to storage
    const matchesToStore: StoredMatch[] = updatedMatches.map((match) => ({
      ...match,
      createdAt: match.createdAt.toISOString(),
    }))
    storeRecentMatches(matchesToStore)

    setCurrentMatch(null)
    setCurrentView("start")
    setNineBallState({
      0: "onTable",
      1: "onTable",
      2: "onTable",
      3: "onTable",
      4: "onTable",
      5: "onTable",
      6: "onTable",
      7: "onTable",
      8: "onTable",
    })
  }

  const cancelMatch = () => {
    Alert.alert(
      "Cancel Match",
      "Are you sure you want to cancel this match? This action cannot be undone.",
      [
        { text: "No, Continue", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            setCurrentMatch(null)
            setCurrentView("start")
            setNineBallState({
              0: "onTable",
              1: "onTable",
              2: "onTable",
              3: "onTable",
              4: "onTable",
              5: "onTable",
              6: "onTable",
              7: "onTable",
              8: "onTable",
            })
          },
        },
      ],
    )
  }

  const handleBallPress = (ballIndex: number) => {
    if (!currentMatch || currentMatch.gameType !== "9ball") return

    const currentState = nineBallState[ballIndex]
    console.log(`Ball ${ballIndex + 1} pressed, current state: ${currentState}`)

    // Don't allow changes for balls that are already pocketed or dead
    if (currentState === "alreadyPocketed" || currentState === "alreadyDead") {
      console.log(`Ball ${ballIndex + 1} is already ${currentState}, ignoring`)
      return
    }

    // Cycle through states: onTable -> pocketed -> dead -> onTable
    let newState: "onTable" | "pocketed" | "dead" | "alreadyPocketed" | "alreadyDead"

    if (currentState === "onTable") {
      newState = "pocketed"
    } else if (currentState === "pocketed") {
      newState = "dead"
    } else if (currentState === "dead") {
      newState = "onTable"
    } else {
      newState = "onTable"
    }

    console.log(`Ball ${ballIndex + 1} changing from ${currentState} to ${newState}`)

    setNineBallState((prev) => ({
      ...prev,
      [ballIndex]: newState,
    }))
  }

  const getBallColor = (state: string, ballIndex: number) => {
    const colors = [
      "#FFD700", // 1 - Yellow
      "#0000FF", // 2 - Blue
      "#FF0000", // 3 - Red
      "#800080", // 4 - Purple
      "#FFA500", // 5 - Orange
      "#008000", // 6 - Green
      "#8B4513", // 7 - Brown
      "#000000", // 8 - Black
      "#FFD700", // 9 - Yellow (same as 1)
    ]

    switch (state) {
      case "pocketed":
        return "#00F500"
      case "dead":
        return "#CCCCCC"
      case "alreadyPocketed":
        return "#D3FFD3"
      case "alreadyDead":
        return "#FFD3D3"
      default:
        return colors[ballIndex]
    }
  }

  const handleQuickStart = (match: Match) => {
    Alert.alert(
      "Quick Start",
      `Start a new ${match.gameType} game with ${match.player1.name} vs ${match.player2.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Game",
          onPress: () => {
            setPlayer1Name(match.player1.name)
            setPlayer2Name(match.player2.name)
            setSelectedGameType(match.gameType)
            setCurrentView("breakSelection")
          },
        },
      ],
    )
  }

  const showGamesToWinPicker = (player: "player1" | "player2") => {
    const options = ["1", "2", "3", "4", "5", "6", "7"]

    Alert.alert("Select number of games needed to win", "", [
      ...options.map((option) => ({
        text: option,
        onPress: () => {
          if (player === "player1") {
            setPlayer1GamesToWin(parseInt(option))
          } else {
            setPlayer2GamesToWin(parseInt(option))
          }
        },
      })),
      { text: "Cancel", style: "cancel" },
    ])
  }

  const showPointsToWinPicker = (player: "player1" | "player2") => {
    const options = ["14", "19", "25", "31", "38", "46", "55", "65", "75", "Other"]

    Alert.alert("Select points needed to win", "", [
      ...options.map((option) => ({
        text: option,
        onPress: () => {
          if (option === "Other") {
            // Show custom input prompt for "Other" option
            Alert.prompt(
              "Enter custom points",
              "Enter the number of points needed to win:",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "OK",
                  onPress: (value) => {
                    const points = parseInt(value || "25")
                    if (points > 0) {
                      if (player === "player1") {
                        setPlayer1PointsToWin(points)
                      } else {
                        setPlayer2PointsToWin(points)
                      }
                    }
                  },
                },
              ],
              "plain-text",
              "25",
            )
          } else {
            const points = parseInt(option)
            if (player === "player1") {
              setPlayer1PointsToWin(points)
            } else {
              setPlayer2PointsToWin(points)
            }
          }
        },
      })),
      { text: "Cancel", style: "cancel" },
    ])
  }

  // Start Match View
  if (currentView === "start") {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
        <View style={themed($topContainer)}>
          <Text style={themed($title)} text="📋 Scorekeeper" />

          <View style={themed($gameTypeContainer)}>
            <Card
              style={themed($gameTypeCard)}
              ContentComponent={
                <View style={themed($cardContent)}>
                  <Text style={themed($cardTitle)} text="Select Game Type" />
                  <Text
                    style={themed($cardSubtitle)}
                    text="Choose the type of pool game to track"
                  />

                  <View style={themed($buttonContainer)}>
                    <Button
                      text="8 Ball"
                      onPress={() => {
                        setSelectedGameType("8ball")
                        setCurrentView("gameSetup")
                      }}
                      style={themed($gameTypeButton)}
                      textStyle={themed($gameTypeButtonText)}
                    />
                    <Button
                      text="9 Ball"
                      onPress={() => {
                        setSelectedGameType("9ball")
                        setCurrentView("gameSetup")
                      }}
                      style={themed($gameTypeButton)}
                      textStyle={themed($gameTypeButtonText)}
                    />
                  </View>
                </View>
              }
            />
          </View>

          <View style={themed($recentMatchesContainer)}>
            <Card
              style={themed($recentMatchesCard)}
              ContentComponent={
                <View style={themed($cardContent)}>
                  <Text style={themed($cardTitle)} text="Recent Matches" />
                  {recentMatches.length > 0 ? (
                    <>
                      <Text
                        style={themed($cardSubtitle)}
                        text="Tap to quick start with same players"
                      />

                      <ScrollView style={themed($matchesList)} showsVerticalScrollIndicator={true}>
                        {recentMatches.map((match) => (
                          <TouchableOpacity
                            key={match.id}
                            style={themed($matchItem)}
                            onPress={() => handleQuickStart(match)}
                          >
                            <View style={themed($matchInfo)}>
                              <Text
                                style={themed($matchPlayers)}
                                text={`${match.player1.name} vs ${match.player2.name}`}
                              />
                              <Text
                                style={themed($matchDate)}
                                text={match.createdAt.toLocaleDateString()}
                              />
                            </View>
                            <View style={themed($matchType)}>
                              <MaterialCommunityIcons
                                name={
                                  match.gameType === "8ball"
                                    ? "numeric-8-circle"
                                    : "numeric-9-circle"
                                }
                                size={20}
                                color="#666"
                              />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  ) : (
                    <Text
                      style={themed($emptyStateText)}
                      text="No recent matches yet. Start your first game to see it here!"
                    />
                  )}
                </View>
              }
            />
          </View>
        </View>
      </Screen>
    )
  }

  // Game Setup View
  if (currentView === "gameSetup") {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
        <View style={themed($headerContainer)}>
          <Text
            style={themed($title)}
            text={`${selectedGameType === "8ball" ? "8" : "9"} Ball Setup`}
          />
        </View>

        <View style={themed($gameSetupContainer)}>
          <Card
            style={themed($gameSetupCard)}
            ContentComponent={
              <View style={themed($cardContent)}>
                <Text style={themed($cardTitle)} text={"Configure players"} />

                <View style={themed($playerRowContainer)}>
                  <View style={themed($playerLabelRow)}>
                    <Text style={themed($playerLabel)} text="Player 1" />
                    <Text
                      style={themed($gamesReqLabel)}
                      text={selectedGameType === "8ball" ? "Games req" : "Points req"}
                    />
                  </View>
                  <View style={themed($playerRow)}>
                    <TextField
                      value={player1Name}
                      onChangeText={setPlayer1Name}
                      containerStyle={themed($nameInput)}
                      autoCapitalize="words"
                      autoCorrect={false}
                      placeholder="Spongebob"
                    />
                    {selectedGameType === "8ball" ? (
                      <TouchableOpacity
                        style={themed($gamesDropdown)}
                        onPress={() => showGamesToWinPicker("player1")}
                      >
                        <Text style={themed($gamesDropdownText)} text={`${player1GamesToWin}`} />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={themed($gamesDropdown)}
                        onPress={() => showPointsToWinPicker("player1")}
                      >
                        <Text style={themed($gamesDropdownText)} text={`${player1PointsToWin}`} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={themed($playerRowContainer)}>
                  <View style={themed($playerLabelRow)}>
                    <Text style={themed($playerLabel)} text="Player 2" />
                    <Text
                      style={themed($gamesReqLabel)}
                      text={selectedGameType === "8ball" ? "Games req" : "Points req"}
                    />
                  </View>
                  <View style={themed($playerRow)}>
                    <TextField
                      value={player2Name}
                      onChangeText={setPlayer2Name}
                      containerStyle={themed($nameInput)}
                      autoCapitalize="words"
                      autoCorrect={false}
                      placeholder="Patrick"
                    />
                    {selectedGameType === "8ball" ? (
                      <TouchableOpacity
                        style={themed($gamesDropdown)}
                        onPress={() => showGamesToWinPicker("player2")}
                      >
                        <Text style={themed($gamesDropdownText)} text={`${player2GamesToWin}`} />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={themed($gamesDropdown)}
                        onPress={() => showPointsToWinPicker("player2")}
                      >
                        <Text style={themed($gamesDropdownText)} text={`${player2PointsToWin}`} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={themed($buttonContainer)}>
                  <Button
                    text="Continue"
                    onPress={() => {
                      if (!player1Name.trim() || !player2Name.trim()) {
                        Alert.alert("Error", "Please enter both player names")
                        return
                      }

                      if (player1Name.trim().toLowerCase() === player2Name.trim().toLowerCase()) {
                        Alert.alert("Error", "Players must have different names")
                        return
                      }

                      setCurrentView("breakSelection")
                    }}
                    style={themed($startButton)}
                    textStyle={themed($startButtonText)}
                  />
                  <Button
                    text="Back"
                    onPress={() => setCurrentView("start")}
                    style={themed($backButtonStyle)}
                    textStyle={themed($backButtonTextStyle)}
                  />
                </View>
              </View>
            }
          />
        </View>
      </Screen>
    )
  }

  // Break Selection View
  if (currentView === "breakSelection") {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
        <View style={themed($headerContainer)}>
          <Text style={themed($title)} text="Who Breaks First?" />
        </View>

        <View style={themed($gameSetupContainer)}>
          <Card
            style={themed($gameSetupCard)}
            ContentComponent={
              <View style={themed($cardContent)}>
                <Text style={themed($cardTitle)} text="Select the player who will break first" />
                <Text style={themed($cardSubtitle)} text={`${player1Name} vs ${player2Name}`} />

                <View style={themed($buttonContainer)}>
                  <Button
                    text={player1Name}
                    onPress={() => {
                      let player1 = players.find(
                        (p) => p.name.toLowerCase() === player1Name.trim().toLowerCase(),
                      )
                      let player2 = players.find(
                        (p) => p.name.toLowerCase() === player2Name.trim().toLowerCase(),
                      )

                      if (!player1) {
                        player1 = addPlayer(player1Name.trim())
                      }
                      if (!player2) {
                        player2 = addPlayer(player2Name.trim())
                      }

                      createMatch(selectedGameType!, player1!, player2!, "player1")
                    }}
                    style={themed($gameTypeButton)}
                    textStyle={themed($gameTypeButtonText)}
                  />
                  <Button
                    text={player2Name}
                    onPress={() => {
                      let player1 = players.find(
                        (p) => p.name.toLowerCase() === player1Name.trim().toLowerCase(),
                      )
                      let player2 = players.find(
                        (p) => p.name.toLowerCase() === player2Name.trim().toLowerCase(),
                      )

                      if (!player1) {
                        player1 = addPlayer(player1Name.trim())
                      }
                      if (!player2) {
                        player2 = addPlayer(player2Name.trim())
                      }

                      createMatch(selectedGameType!, player1!, player2!, "player2")
                    }}
                    style={themed($gameTypeButton)}
                    textStyle={themed($gameTypeButtonText)}
                  />
                  <Button
                    text="Back"
                    onPress={() => setCurrentView("gameSetup")}
                    style={themed($backButtonStyle)}
                    textStyle={themed($backButtonTextStyle)}
                  />
                </View>
              </View>
            }
          />
        </View>
      </Screen>
    )
  }

  // 8 Ball View
  if (currentView === "8ball") {
    console.log("currentMatch", currentMatch)
    if (!currentMatch) {
      return (
        <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
          <View style={themed($headerContainer)}>
            <Text style={themed($title)} text="8 Ball" />
          </View>

          <View style={themed($gameSetupContainer)}>
            <Card
              style={themed($gameSetupCard)}
              ContentComponent={
                <View style={themed($cardContent)}>
                  <Text style={themed($cardTitle)} text="Start 8 Ball Match" />
                  <Text style={themed($cardSubtitle)} text="Enter player names to begin" />

                  <TextField
                    value={player1Name}
                    onChangeText={setPlayer1Name}
                    containerStyle={themed($inputContainer)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    placeholder="Player 1 name"
                  />

                  <TextField
                    value={player2Name}
                    onChangeText={setPlayer2Name}
                    containerStyle={themed($inputContainer)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    placeholder="Player 2 name"
                  />

                  <View style={themed($buttonContainer)}>
                    <Button
                      text="Start Match"
                      onPress={() => {
                        setSelectedGameType("8ball")
                        setCurrentView("gameSetup")
                      }}
                      style={themed($startButton)}
                      textStyle={themed($startButtonText)}
                    />
                    <Button
                      text="Back"
                      onPress={() => setCurrentView("start")}
                      style={themed($backButtonStyle)}
                      textStyle={themed($backButtonTextStyle)}
                    />
                  </View>
                </View>
              }
            />
          </View>
        </Screen>
      )
    }

    return (
      <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
        <View style={themed($headerContainer)}>
          <Text style={themed($title)} text="8 Ball" />
        </View>

        <View style={themed($matchContainer)}>
          {/* First Row - Player Cards */}
          <View style={themed($playerCardsRow)}>
            <Card
              style={themed(
                currentMatch.currentPlayer.id === currentMatch.player1.id
                  ? $playerCardActive
                  : $playerCard,
              )}
              ContentComponent={
                <View style={themed($playerCardContentLeft)}>
                  <Text style={themed($playerName)} text={currentMatch.player1.name} />
                  <Text
                    style={themed($playerStats)}
                    text={`Games won: ${currentMatch.player1GamesWon}`}
                  />
                  <Text
                    style={themed($playerStats)}
                    text={`Games req: ${currentMatch.player1GamesToWin}`}
                  />
                  {/* <Text style={themed($playerStats)} text="Defensive shots: 0" />
                  <Text style={themed($playerStats)} text="Innings per win: 0" /> */}
                </View>
              }
            />
            <Card
              style={themed(
                currentMatch.currentPlayer.id === currentMatch.player2.id
                  ? $playerCardActive
                  : $playerCard,
              )}
              ContentComponent={
                <View style={themed($playerCardContentRight)}>
                  <Text style={themed($playerName)} text={currentMatch.player2.name} />
                  <Text
                    style={themed($playerStats)}
                    text={`Games won: ${currentMatch.player2GamesWon}`}
                  />
                  <Text
                    style={themed($playerStats)}
                    text={`Games req: ${currentMatch.player2GamesToWin}`}
                  />
                  {/* <Text style={themed($playerStats)} text="Defensive shots: 0" />
                  <Text style={themed($playerStats)} text="Innings per win: 0" /> */}
                </View>
              }
            />
          </View>

          {/* Second Row - Current Turn Card */}
          <Card
            style={themed($turnCard)}
            ContentComponent={
              <View style={themed($cardContent)}>
                <Text
                  style={themed($currentPlayerTurn)}
                  text={`${currentMatch.currentPlayer.name}'s turn`}
                />
                <View style={themed($turnButtonsRow)}>
                  {/* <Button
                    text="Defensive Shot"
                    onPress={() => {
                      // TODO: Implement defensive shot logic
                      console.log("Defensive shot")
                    }}
                    style={themed($turnButton)}
                    textStyle={themed($turnButtonText)}
                  /> */}
                  <Button
                    text={`End ${currentMatch.currentPlayer.name}'s Turn`}
                    onPress={endTurn}
                    style={themed($turnButton)}
                    textStyle={themed($turnButtonText)}
                  />
                </View>
              </View>
            }
          />

          {/* Third Row - Game Actions Card */}
          <Card
            style={themed($gameActionsCard)}
            ContentComponent={
              <View style={themed($cardContent)}>
                <Text style={themed($cardTitle)} text="Game actions" />
                <View style={themed($gameActionButtons)}>
                  <Button
                    text="End Game"
                    onPress={() => {
                      Alert.alert("Game Over", "Who won?", [
                        {
                          text: currentMatch.player1.name,
                          onPress: () => markGameOver(currentMatch.player1.id),
                        },
                        {
                          text: currentMatch.player2.name,
                          onPress: () => markGameOver(currentMatch.player2.id),
                        },
                        { text: "Cancel", style: "cancel" },
                      ])
                    }}
                    style={themed($actionButton)}
                    textStyle={themed($actionButtonText)}
                  />
                  <Button
                    text="Cancel Match"
                    onPress={cancelMatch}
                    style={themed($cancelMatchButton)}
                    textStyle={themed($cancelMatchButtonText)}
                  />
                </View>
              </View>
            }
          />
        </View>
      </Screen>
    )
  }

  // 9 Ball View
  if (currentView === "9ball") {
    if (!currentMatch) {
      return (
        <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
          <View style={themed($headerContainer)}>
            <Text style={themed($title)} text="9 Ball" />
          </View>

          <View style={themed($gameSetupContainer)}>
            <Card
              style={themed($gameSetupCard)}
              ContentComponent={
                <View style={themed($cardContent)}>
                  <Text style={themed($cardTitle)} text="Start 9 Ball Match" />
                  <Text style={themed($cardSubtitle)} text="Enter player names to begin" />

                  <TextField
                    value={player1Name}
                    onChangeText={setPlayer1Name}
                    containerStyle={themed($inputContainer)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    placeholder="Player 1 name"
                  />

                  <TextField
                    value={player2Name}
                    onChangeText={setPlayer2Name}
                    containerStyle={themed($inputContainer)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    placeholder="Player 2 name"
                  />

                  <View style={themed($buttonContainer)}>
                    <Button
                      text="Start Match"
                      onPress={() => {
                        setSelectedGameType("9ball")
                        setCurrentView("gameSetup")
                      }}
                      style={themed($startButton)}
                      textStyle={themed($startButtonText)}
                    />
                    <Button
                      text="Back"
                      onPress={() => setCurrentView("start")}
                      style={themed($backButtonStyle)}
                      textStyle={themed($backButtonTextStyle)}
                    />
                  </View>
                </View>
              }
            />
          </View>
        </Screen>
      )
    }

    return (
      <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
        <View style={themed($headerContainer)}>
          <Text style={themed($title)} text="9 Ball" />
        </View>

        <View style={themed($matchContainer)}>
          {/* First Row - Player Cards */}
          <View style={themed($playerCardsRow)}>
            <Card
              style={themed(
                currentMatch.currentPlayer.id === currentMatch.player1.id
                  ? $playerCardActive
                  : $playerCard,
              )}
              ContentComponent={
                <View style={themed($playerCardContentLeft)}>
                  <Text style={themed($playerName)} text={currentMatch.player1.name} />
                  <Text
                    style={themed($playerStats)}
                    text={`Points: ${currentMatch.player1GamesWon}`}
                  />
                  <Text
                    style={themed($playerStats)}
                    text={`Points req: ${currentMatch.player1GamesToWin}`}
                  />
                </View>
              }
            />
            <Card
              style={themed(
                currentMatch.currentPlayer.id === currentMatch.player2.id
                  ? $playerCardActive
                  : $playerCard,
              )}
              ContentComponent={
                <View style={themed($playerCardContentRight)}>
                  <Text style={themed($playerName)} text={currentMatch.player2.name} />
                  <Text
                    style={themed($playerStats)}
                    text={`Points: ${currentMatch.player2GamesWon}`}
                  />
                  <Text
                    style={themed($playerStats)}
                    text={`Points req: ${currentMatch.player2GamesToWin}`}
                  />
                </View>
              }
            />
          </View>

          {/* Second Row - Ball States and Turn Card */}
          <Card
            style={themed($turnCard)}
            ContentComponent={
              <View style={themed($cardContent)}>
                <Text
                  style={themed($currentPlayerTurn)}
                  text={`${currentMatch.currentPlayer.name}'s Turn`}
                />

                {/* Ball State Legend */}
                <View>
                  <Text style={{ fontSize: 10, color: "#666", textAlign: "center" }}>
                    Tap to mark balls at pocketed or dead. Ending the turn will update score and
                    mark the pocketd or dead balls as off table.
                  </Text>
                </View>

                {/* Ball States */}
                <View style={themed($ballsGrid)}>
                  {Array.from({ length: 9 }, (_, i) => {
                    const state = nineBallState[i]
                    const isAlready = state === "alreadyPocketed" || state === "alreadyDead"
                    const ballStyle = {
                      backgroundColor: getBallColor(state, i),
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      justifyContent: "center" as const,
                      alignItems: "center" as const,
                      margin: 8,
                      borderWidth: 1,
                      borderColor: "#000",
                      opacity: isAlready ? 0.3 : 1,
                    }

                    return (
                      <TouchableOpacity
                        key={i}
                        style={ballStyle}
                        onPress={() => handleBallPress(i)}
                        disabled={isAlready}
                      >
                        <Text
                          style={[
                            themed($ballText),
                            { opacity: isAlready ? 0.3 : 1, color: isAlready ? "#000" : "#fff" },
                          ]}
                          text={
                            state === "pocketed" || state === "alreadyPocketed"
                              ? "P"
                              : state === "dead" || state === "alreadyDead"
                                ? "D"
                                : (i + 1).toString()
                          }
                        />
                      </TouchableOpacity>
                    )
                  })}
                </View>

                <View style={themed($turnButtonsRow)}>
                  <Button
                    text={`End ${currentMatch.currentPlayer.name}'s Turn`}
                    onPress={endTurn}
                    style={themed($turnButton)}
                    textStyle={themed($turnButtonText)}
                  />
                </View>
              </View>
            }
          />

          {/* Third Row - Game Actions Card */}
          <Card
            style={themed($gameActionsCard)}
            ContentComponent={
              <View style={themed($cardContent)}>
                <Text style={themed($cardTitle)} text="Game actions" />
                <View style={themed($gameActionButtons)}>
                  <Button
                    text="End Game"
                    onPress={() => {
                      Alert.alert("Game Over", "Who won?", [
                        {
                          text: currentMatch.player1.name,
                          onPress: () => markGameOver(currentMatch.player1.id),
                        },
                        {
                          text: currentMatch.player2.name,
                          onPress: () => markGameOver(currentMatch.player2.id),
                        },
                        { text: "Cancel", style: "cancel" },
                      ])
                    }}
                    style={themed($actionButton)}
                    textStyle={themed($actionButtonText)}
                  />
                  <Button
                    text="Cancel Match"
                    onPress={cancelMatch}
                    style={themed($cancelMatchButton)}
                    textStyle={themed($cancelMatchButtonText)}
                  />
                </View>
              </View>
            }
          />
        </View>
      </Screen>
    )
  }

  return null
}

export default ScorekeeperScreen

const $contentContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $topContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  gap: spacing.sm,
  paddingTop: "20%",
})

const $headerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingTop: "20%",
  flexDirection: "row",
  alignItems: "center",
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 24,
  lineHeight: 32,
  fontWeight: "900",
  textAlign: "center",
  marginBottom: spacing.sm,
  flex: 1,
})

const $gameTypeContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  maxWidth: 400,
})

const $gameTypeCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 24,
  padding: spacing.xl,
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
})

const $cardContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  gap: spacing.sm,
})

const $cardTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 20,
  lineHeight: 24,
  fontWeight: "700",
  textAlign: "center",
  marginBottom: spacing.xxxs,
})

const $cardSubtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  lineHeight: 16,
  color: colors.palette.neutral600,
  textAlign: "center",
  marginBottom: spacing.xxs,
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
  width: "100%",
})

const $gameActionButtons: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
  width: "100%",
  flexDirection: "row",
})

const $gameTypeButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.palette.primary100,
  width: "100%",
  paddingVertical: spacing.md,
})

const $gameTypeButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 18,
  lineHeight: 24,
  textAlignVertical: "center",
  fontWeight: "600",
})

const $recentMatchesContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  maxWidth: 400,
  marginBottom: spacing.md,
})

const $recentMatchesCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 24,
  padding: spacing.xl,
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
})

const $matchesList: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  height: 200,
  gap: spacing.sm,
})

const $matchItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: spacing.md,
  backgroundColor: colors.palette.neutral200,
  borderRadius: 16,
  margin: spacing.xxs,
})

const $matchInfo: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
})

const $matchPlayers: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
})

const $matchDate: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  color: colors.textDim,
  marginTop: spacing.xs,
})

const $matchType: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginLeft: spacing.sm,
})

const $gameSetupContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
  justifyContent: "center",
})

const $gameSetupCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 24,
  padding: spacing.xl,
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
})

const $inputContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  width: "100%",
})

const $startButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.palette.primary100,
  width: "100%",
  paddingVertical: spacing.md,
})

const $startButtonText: ThemedStyle<TextStyle> = () => ({
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

const $matchContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.md,
  paddingTop: spacing.sm,
  paddingBottom: spacing.md,
  gap: spacing.sm,
})

const $matchInfoCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 24,
  padding: spacing.lg,
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
})

const $matchTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 20,
  fontWeight: "700",
  color: colors.text,
  textAlign: "center",
  marginBottom: spacing.sm,
})

const $matchDetails: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  color: colors.text,
  textAlign: "center",
  marginBottom: spacing.xs,
})

const $matchScore: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 18,
  fontWeight: "600",
  color: colors.palette.primary500,
  textAlign: "center",
  marginBottom: spacing.xs,
})

const $matchTurn: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  color: colors.text,
  textAlign: "center",
  marginBottom: spacing.xs,
})

const $matchInning: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.text,
  textAlign: "center",
})

const _$gameActionsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})

const $gameActionsCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.md,
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
})

const $actionButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.palette.primary100,
  flex: 1,
  paddingVertical: spacing.md,
})

const $actionButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 16,
  lineHeight: 20,
  textAlignVertical: "center",
  fontWeight: "600",
})

const $ballsGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "center",
})

const $ballText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  fontWeight: "bold",
  fontSize: 20,
})

const $emptyStateText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  lineHeight: 20,
  color: colors.palette.neutral600,
  textAlign: "center",
  marginTop: spacing.sm,
  height: 200,
})

const $playerRowContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  flexDirection: "column",
  alignItems: "center",
  gap: spacing.xxxs,
})

const $playerRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.md,
  marginBottom: spacing.sm,
})

const $playerLabelRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  marginBottom: spacing.sm,
})

const $playerLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "600",
  color: colors.text,
  flex: 1,
})

const $gamesReqLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 10,
  fontWeight: "500",
  color: colors.textDim,
  textAlign: "center",
  minWidth: 80,
})

const $nameInput: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $gamesDropdown: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  borderRadius: 8,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  minWidth: 60,
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
})

const $gamesDropdownText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
})

const $gamesToWinButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  borderRadius: 12,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  minWidth: 60,
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
})

const $gamesToWinLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 12,
  fontWeight: "500",
  color: colors.textDim,
  marginBottom: spacing.xs,
})

const $gamesToWinContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "column",
  alignItems: "flex-end",
  gap: spacing.xs,
  justifyContent: "flex-end",
})

const $gamesToWinButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "700",
  color: colors.text,
})

const $gamesToWinIcon: ThemedStyle<TextStyle> = () => ({
  marginLeft: 2,
})

const $cancelMatchButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.errorBackground,
  flex: 1,
  paddingVertical: spacing.md,
})

const $cancelMatchButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 16,
  lineHeight: 20,
  textAlignVertical: "center",
  fontWeight: "600",
})

const $playerCardsRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
})

const $playerCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.sm,
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
  flex: 1,
})

const $playerCardActive: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  borderRadius: 16,
  padding: spacing.sm,
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
  flex: 1,
  borderWidth: 2,
  borderColor: colors.palette.primary500,
})

const $playerCardContentLeft: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "flex-start",
  padding: spacing.xxxs,
})

const $playerCardContentRight: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "flex-end",
  padding: spacing.xxxs,
})

const $playerName: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 20,
  fontWeight: "800",
  color: colors.text,
  textAlign: "center",
  marginBottom: spacing.xs,
})

const $playerStats: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.text,
  textAlign: "left",
})

const $turnCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.md,
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
  marginBottom: spacing.xs,
})

const $currentPlayerTurn: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 18,
  fontWeight: "600",
  textAlign: "center",
})

const $turnButtonsRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.lg,
  width: "100%",
  justifyContent: "center",
})

const $turnButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.palette.primary100,
  width: "100%",
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.sm,
})

const $turnButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 16,
  lineHeight: 20,
  textAlignVertical: "center",
  fontWeight: "600",
})
