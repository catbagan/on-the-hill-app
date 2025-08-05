import { FC } from "react"
import { TextStyle, View, ViewStyle } from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export const ScorekeeperScreen: FC = function ScorekeeperScreen() {
  const { themed } = useAppTheme()

  return (
    <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
      <View style={themed($centerContainer)}>
        <Text style={themed($comingSoonTitle)} text="Scorekeeper" />
        <Text style={themed($comingSoonText)} text="Coming Soon!" />
      </View>
    </Screen>
  )
}

export default ScorekeeperScreen

const $contentContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $centerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.lg,
})

const $comingSoonTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 32,
  lineHeight: 40,
  fontWeight: "900",
  textAlign: "center",
  marginBottom: spacing.lg,
})

const $comingSoonText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 24,
  lineHeight: 32,
  fontWeight: "700",
  color: colors.palette.primary500,
  textAlign: "center",
  marginBottom: spacing.md,
})

const $comingSoonSubtext: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  lineHeight: 24,
  color: colors.textDim,
  textAlign: "center",
})
