import { FC, useState, useEffect } from "react"
import { TextStyle, View, ViewStyle, Alert, Linking } from "react-native"
import { router } from "expo-router"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { authApi } from "@/services/api/requests"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { getCurrentUser } from "@/utils/storage/authStorage"
import { clearStatsData } from "@/utils/storage/statsStorage"

export const ProfileScreen: FC = function ProfileScreen() {
  const { themed } = useAppTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState<{
    email: string
    givenName: string
    familyName: string
  } | null>(null)

  // Load current user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        setUserData({
          email: currentUser.email,
          givenName: currentUser.givenName,
          familyName: currentUser.familyName,
        })
      }
    }

    loadUserData()
  }, [])

  const handleContactUs = () => {
    const email = "daniel@catbagan.me"
    const subject = "On The Hill App Inquiry"
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`

    Linking.openURL(mailtoUrl).catch((error) => {
      console.error("Failed to open email client:", error)
      Alert.alert("Error", "Failed to open email client. Please email daniel@catbagan.me manually.")
    })
  }



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

  const handleManageData = () => {
    router.push("/(app)/dataManagement" as any)
  }

  const handleWrapped = () => {
    router.push("/(app)/wrapped" as any)
  }

  if (!userData) {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
        <View style={themed($topContainer)}>
          <View style={themed($loadingContainer)}>
            <Text style={themed($loadingText)} text="Loading profile..." />
          </View>
        </View>
      </Screen>
    )
  }

  return (
    <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
      <View style={themed($topContainer)}>
        <Text style={themed($title)} text="👤 Profile" />

        <View style={themed($profileContainer)}>
          <Card
            style={themed($profileCard)}
            ContentComponent={
              <View style={themed($cardContent)}>
                <View style={themed($infoSection)}>
                  <View style={themed($infoRow)}>
                    <Text style={themed($infoLabel)} text="Email:" />
                    <Text style={themed($infoValue)} text={userData.email} />
                  </View>

                  <View style={themed($infoRow)}>
                    <Text style={themed($infoLabel)} text="Given Name:" />
                    <Text style={themed($infoValue)} text={userData.givenName} />
                  </View>

                  <View style={themed($infoRow)}>
                    <Text style={themed($infoLabel)} text="Family Name:" />
                    <Text style={themed($infoValue)} text={userData.familyName} />
                  </View>
                </View>
              </View>
            }
          />
        </View>
      </View>

      <View style={themed($bottomContainer)}>
        <Button
          text="Your 2025 Wrapped"
          onPress={handleWrapped}
          style={themed($wrappedButton)}
          textStyle={themed($wrappedButtonText)}
        />

        <Button
          text="Contact Us"
          onPress={handleContactUs}
          style={themed($contactButton)}
          textStyle={themed($contactButtonText)}
        />

        <Button
          text="Manage Your Data"
          onPress={handleManageData}
          style={themed($manageDataButton)}
          textStyle={themed($manageDataButtonText)}
        />

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
  justifyContent: "flex-start",
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  paddingTop: "20%",
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 24,
  lineHeight: 32,
  fontWeight: "900",
  textAlign: "center",
  marginBottom: spacing.lg,
})

const $bottomContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
  gap: spacing.md,
})

const $loadingContainer: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.palette.neutral600,
})

const $profileContainer: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
  maxWidth: 400,
})

const $profileCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
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
  gap: spacing.md,
})

const $cardTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 20,
  lineHeight: 28,
  fontWeight: "700",
  textAlign: "center",
  marginBottom: spacing.xs,
})

const $cardSubtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  lineHeight: 20,
  color: colors.palette.neutral600,
  textAlign: "center",
  marginBottom: spacing.lg,
})

const $infoSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  gap: spacing.sm,
})

const $infoRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.xs,
  borderBottomWidth: 1,
  borderBottomColor: "rgba(0, 0, 0, 0.05)",
})

const $infoLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.textDim,
  fontFamily: typography.primary.medium,
})

const $infoValue: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontSize: 16,
  fontWeight: "500",
  color: colors.text,
  fontFamily: typography.primary.normal,
  textAlign: "right",
  flex: 1,
  marginLeft: spacing.sm,
})

const $wrappedButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.palette.primary500,
  paddingVertical: spacing.md,
  width: "100%",
})

const $wrappedButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 18,
  lineHeight: 24,
  textAlignVertical: "center",
  color: "white",
  fontWeight: "700",
})

const $contactButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.palette.neutral200,
  paddingVertical: spacing.md,
  width: "100%",
})

const $contactButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  lineHeight: 24,
  textAlignVertical: "center",
  color: colors.text,
})

const $manageDataButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.palette.primary100,
  paddingVertical: spacing.md,
  width: "100%",
})

const $manageDataButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  lineHeight: 24,
  textAlignVertical: "center",
  color: colors.palette.primary500,
})

const $signOutButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.error,
  paddingVertical: spacing.md,
  width: "100%",
})

const $signOutButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 18,
  lineHeight: 24,
  textAlignVertical: "center",
  color: "white",
})


