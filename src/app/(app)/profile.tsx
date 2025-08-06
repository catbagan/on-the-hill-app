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
  const [isDeleting, setIsDeleting] = useState(false)
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

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDeleteAccount,
        },
      ],
    )
  }

  const confirmDeleteAccount = async () => {
    setIsDeleting(true)

    try {
      const result = await authApi.deleteAccount()

      if (result.error) {
        Alert.alert("Delete Failed", result.error)
        return
      }

      // Clear stats data and show success message
      clearStatsData()
      Alert.alert("Account Deleted", "Your account has been successfully deleted.")
      router.push("/(auth)/signin" as any)
    } catch (error) {
      console.error("Delete account error:", error)
      Alert.alert("Error", "Failed to delete account. Please try again.")
    } finally {
      setIsDeleting(false)
    }
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
        <View style={themed($profileContainer)}>
          <Card
            style={themed($profileCard)}
            ContentComponent={
              <View style={themed($cardContent)}>
                <Text style={themed($cardTitle)} text="👤 Profile" />
                <Text style={themed($cardSubtitle)} text="Your account information" />

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
          text="Contact Us"
          onPress={handleContactUs}
          style={themed($contactButton)}
          textStyle={themed($contactButtonText)}
        />
        <Button
          text={isLoading ? "Signing out..." : "Sign Out"}
          onPress={handleSignOut}
          style={themed($signOutButton)}
          textStyle={themed($signOutButtonText)}
          disabled={isLoading}
        />
        <Button
          text={isDeleting ? "Deleting..." : "Delete Account"}
          onPress={handleDeleteAccount}
          style={themed($deleteButton)}
          textStyle={themed($deleteButtonText)}
          disabled={isDeleting}
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
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.lg,
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

const $contactButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.palette.neutral200,
  paddingVertical: spacing.md,
})

const $contactButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  lineHeight: 24,
  textAlignVertical: "center",
  color: colors.text,
})

const $signOutButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.error,
  paddingVertical: spacing.md,
})

const $signOutButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 18,
  lineHeight: 24,
  textAlignVertical: "center",
  color: "white",
})

const $deleteButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.palette.neutral800,
  paddingVertical: spacing.md,
})

const $deleteButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 18,
  lineHeight: 24,
  textAlignVertical: "center",
  color: "white",
})
