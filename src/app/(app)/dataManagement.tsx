import { FC, useState } from "react"
import { TextStyle, View, ViewStyle, Alert } from "react-native"
import { router } from "expo-router"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { authApi } from "@/services/api/requests"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { clearStatsData } from "@/utils/storage/statsStorage"
import { clearScorekeeperData } from "@/utils/storage/scorekeeperStorage"

export const DataManagementScreen: FC = function DataManagementScreen() {
  const { themed } = useAppTheme()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleClearScorekeeperData = () => {
    Alert.alert(
      "Clear Scorekeeper Data",
      "This will clear all your recent matches and game history. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: () => {
            clearScorekeeperData()
            Alert.alert("Success", "Scorekeeper data has been cleared.")
          },
        },
      ],
    )
  }

  const handleClearStatsData = () => {
    Alert.alert(
      "Clear Stats Data",
      "This will clear all your player statistics and match history. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: () => {
            clearStatsData()
            Alert.alert("Success", "Stats data has been cleared.")
          },
        },
      ],
    )
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

      // Clear all data and show success message
      clearStatsData()
      clearScorekeeperData()
      Alert.alert("Account Deleted", "Your account has been successfully deleted.")
      router.push("/(auth)/signin" as any)
    } catch (error) {
      console.error("Delete account error:", error)
      Alert.alert("Error", "Failed to delete account. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
      <View style={themed($topContainer)}>
        <Text style={themed($title)} text="🗂️ Data Management" />

        <View style={themed($cardContainer)}>
          <Card
            style={themed($card)}
            ContentComponent={
              <View style={themed($cardContent)}>
                <Text style={themed($cardTitle)} text="Clear Data" />
                <Text style={themed($cardSubtitle)} text="Remove specific data from your account" />

                <View style={themed($buttonContainer)}>
                  <Button
                    text="Clear Scorekeeper Data"
                    onPress={handleClearScorekeeperData}
                    style={themed($clearButton)}
                    textStyle={themed($clearButtonText)}
                  />
                  <Button
                    text="Clear Stats Data"
                    onPress={handleClearStatsData}
                    style={themed($clearButton)}
                    textStyle={themed($clearButtonText)}
                  />
                </View>
              </View>
            }
          />

          <Card
            style={themed($dangerCard)}
            ContentComponent={
              <View style={themed($cardContent)}>
                <Text style={themed($dangerTitle)} text="Danger Zone" />
                <Text style={themed($dangerSubtitle)} text="Permanently delete your account and all data" />

                <Button
                  text={isDeleting ? "Deleting..." : "Delete Account"}
                  onPress={handleDeleteAccount}
                  style={themed($deleteButton)}
                  textStyle={themed($deleteButtonText)}
                  disabled={isDeleting}
                />
              </View>
            }
          />
        </View>
      </View>
    </Screen>
  )
}

export default DataManagementScreen

const $contentContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $topContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  paddingTop: "20%",
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 24,
  lineHeight: 32,
  fontWeight: "900",
  textAlign: "center",
  marginBottom: spacing.xl,
})

const $cardContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  maxWidth: 400,
  gap: spacing.lg,
})

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 24,
  padding: spacing.xl,
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
})

const $dangerCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 24,
  padding: spacing.xl,
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
  borderWidth: 2,
  borderColor: colors.error,
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

const $dangerTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 20,
  lineHeight: 28,
  fontWeight: "700",
  textAlign: "center",
  marginBottom: spacing.xs,
  color: "#DC2626",
})

const $dangerSubtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  lineHeight: 20,
  color: colors.palette.neutral600,
  textAlign: "center",
  marginBottom: spacing.lg,
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  gap: spacing.sm,
})

const $clearButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.palette.neutral200,
  paddingVertical: spacing.md,
})

const $clearButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  lineHeight: 24,
  textAlignVertical: "center",
  color: colors.text,
})

const $deleteButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.error,
  paddingVertical: spacing.md,
})

const $deleteButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 18,
  lineHeight: 24,
  textAlignVertical: "center",
  color: "white",
}) 