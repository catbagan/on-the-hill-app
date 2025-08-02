import { FC } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { router } from "expo-router"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export const WelcomeScreen: FC = function WelcomeScreen() {
  const { themed } = useAppTheme()

  const handleGetStarted = () => {
    router.push("/(auth)/signup" as any)
  }

  const handleSignIn = () => {
    router.push("/(auth)/signin" as any)
  }

  return (
    <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
      <View style={themed($topContainer)}>
        <Text
          testID="welcome-heading"
          style={themed($welcomeHeading)}
          text="👋 Welcome to On The Hill"
        />
      </View>

      <View style={themed([$bottomContainer])}>
        <Button
          text="🎱 Get Started"
          onPress={handleGetStarted}
          style={themed($primaryButton)}
          textStyle={themed($primaryButtonText)}
        />
        <Text
          onPress={handleSignIn}
          style={themed($secondaryText)}
          text="🤗 I already have an account"
        />
      </View>
    </Screen>
  )
}
const $contentContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $topContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.xl,
})

const $bottomContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
  alignItems: "center",
  gap: spacing.md,
})

const $welcomeHeading: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 24,
  lineHeight: 32,
  fontWeight: "900",
  textAlign: "center",
  marginBottom: spacing.md,
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

const $secondaryText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.palette.primary500,
  fontSize: 16,
  paddingVertical: spacing.sm,
})
