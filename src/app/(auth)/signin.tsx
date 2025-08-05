import { useState } from "react"
import { TextStyle, View, ViewStyle, Alert } from "react-native"
import { router } from "expo-router"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { authApi } from "@/services/api/requests"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export default function SignInScreen() {
  const { themed } = useAppTheme()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both username and password")
      return
    }

    setIsLoading(true)

    try {
      const result = await authApi.signIn({
        username: username.trim(),
        password: password.trim(),
      })

      // Check if the response contains an error
      if (result.error) {
        Alert.alert("Error", result.error)
        return
      }

      console.log("Sign in successful:", result)
      router.push("/(app)/stats" as any)
    } catch (error) {
      console.error("Sign in error:", error)
      Alert.alert("Error", "Failed to sign in. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
      <View style={themed($topContainer)}>
        <Text style={themed($title)} text="🔑 Sign In" />

        <TextField
          value={username}
          onChangeText={setUsername}
          containerStyle={themed($inputContainer)}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Username"
        />

        <TextField
          value={password}
          onChangeText={setPassword}
          containerStyle={themed($inputContainer)}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="Password"
        />
      </View>

      <View style={themed($bottomContainer)}>
        <Button
          text={isLoading ? "Signing in..." : "🎱 Let's go!"}
          onPress={handleSignIn}
          style={themed($primaryButton)}
          textStyle={themed($primaryButtonText)}
          disabled={isLoading}
        />
        <Text
          onPress={() => router.push("/signup")}
          style={themed($secondaryText)}
          text="🤗 I don't have an account yet"
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
})

const $bottomContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
  alignItems: "center",
  gap: spacing.md,
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 24,
  lineHeight: 32,
  fontWeight: "900",
  textAlign: "center",
  marginBottom: spacing.xl,
})

const $inputContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
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

const $secondaryText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.palette.primary500,
  fontSize: 16,
  paddingVertical: spacing.sm,
})
