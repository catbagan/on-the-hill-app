import { FC, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export const ScorekeeperScreen: FC = function ScorekeeperScreen() {
  const { themed } = useAppTheme()
  const [currentScore, setCurrentScore] = useState("")
  const [gameHistory, setGameHistory] = useState<number[]>([])

  const handleAddScore = () => {
    const score = parseInt(currentScore, 10)
    if (!isNaN(score) && score >= 0 && score <= 300) {
      setGameHistory([...gameHistory, score])
      setCurrentScore("")
    }
  }

  const handleClearHistory = () => {
    setGameHistory([])
  }

  const averageScore = gameHistory.length > 0 
    ? Math.round(gameHistory.reduce((sum, score) => sum + score, 0) / gameHistory.length)
    : 0

  return (
    <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
      <View style={themed($topContainer)}>
        <Text
          testID="scorekeeper-heading"
          style={themed($scorekeeperHeading)}
          text="🎯 Scorekeeper"
        />
        
        <View style={themed($inputSection)}>
          <TextField
            value={currentScore}
            onChangeText={setCurrentScore}
            containerStyle={themed($inputContainer)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numeric"
            placeholder="Enter score (0-300)"
          />
          <Button
            text="Add Score"
            onPress={handleAddScore}
            style={themed($addButton)}
            textStyle={themed($addButtonText)}
          />
        </View>

        <View style={themed($statsSection)}>
          <Text style={themed($statsLabel)} text="Games Played" />
          <Text style={themed($statsValue)} text={gameHistory.length.toString()} />
          
          <Text style={themed($statsLabel)} text="Average Score" />
          <Text style={themed($statsValue)} text={averageScore.toString()} />
        </View>
      </View>

      <View style={themed($bottomContainer)}>
        {gameHistory.length > 0 && (
          <>
            <Text style={themed($historyLabel)} text="Recent Games" />
            <View style={themed($historyContainer)}>
              {gameHistory.slice(-5).reverse().map((score, index) => (
                <View key={index} style={themed($historyItem)}>
                  <Text style={themed($historyScore)} text={score.toString()} />
                </View>
              ))}
            </View>
            <Button
              text="Clear History"
              onPress={handleClearHistory}
              style={themed($clearButton)}
              textStyle={themed($clearButtonText)}
            />
          </>
        )}
      </View>
    </Screen>
  )
}

export default ScorekeeperScreen

const $contentContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $topContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
  paddingTop: "20%",
})

const $bottomContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
})

const $scorekeeperHeading: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 24,
  lineHeight: 32,
  fontWeight: "900",
  textAlign: "center",
  marginBottom: spacing.lg,
})

const $inputSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xl,
  gap: spacing.md,
})

const $inputContainer: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
})

const $addButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 12,
  backgroundColor: colors.palette.primary100,
  paddingVertical: spacing.md,
})

const $addButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 16,
  fontWeight: "600",
})

const $statsSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-around",
  marginBottom: spacing.xl,
})

const $statsLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
})

const $statsValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 20,
  fontWeight: "700",
  color: colors.text,
  textAlign: "center",
})

const $historyLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 18,
  fontWeight: "600",
  color: colors.text,
  marginBottom: spacing.md,
})

const $historyContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
  marginBottom: spacing.lg,
})

const $historyItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.card,
  borderRadius: 8,
  padding: spacing.sm,
  minWidth: 60,
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.border,
})

const $historyScore: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
})

const $clearButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 12,
  backgroundColor: colors.error,
  paddingVertical: spacing.md,
})

const $clearButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 16,
  fontWeight: "600",
  color: "white",
}) 