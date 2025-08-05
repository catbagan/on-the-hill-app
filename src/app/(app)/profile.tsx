import { FC, useState } from "react"
import { TextStyle, View, ViewStyle, Alert } from "react-native"
import { router } from "expo-router"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { authApi } from "@/services/api/requests"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { clearStatsData } from "@/utils/storage/statsStorage"

export const ProfileScreen: FC = function ProfileScreen() {
  const { themed } = useAppTheme()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)

    try {
      await authApi.signOut()
      // Clear stats data when logging out
      clearStatsData()
      console.log("Sign out successful")
      router.push("/(auth)/signin" as any)
    } catch (error) {
      console.error("Sign out error:", error)
      Alert.alert("Error", "Failed to sign out. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
      <View style={themed($topContainer)}>
        <Text testID="profile-heading" style={themed($profileHeading)} text="👤 Profile" />
      </View>

      <View style={themed($bottomContainer)}>
        <Button
          text={isLoading ? "Signing out..." : "Sign Out"}
          onPress={handleSignOut}
          style={themed($signOutButton)}
          textStyle={themed($signOutButtonText)}
          disabled={isLoading}
        />
      </View>
    </Screen>
  )
}

export default ProfileScreen

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

const $profileHeading: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 24,
  lineHeight: 32,
  fontWeight: "900",
  textAlign: "center",
  marginBottom: spacing.lg,
})



const $signOutButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 12,
  backgroundColor: colors.error,
  paddingVertical: spacing.md,
})

const $signOutButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 16,
  fontWeight: "600",
  color: "white",
})
