import { useState } from "react"
import { TextStyle, View, ViewStyle, Alert } from "react-native"
import { router } from "expo-router"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { authApi } from "@/services/api/requests"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export default function SignUpScreen() {
  const { themed } = useAppTheme()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignUp = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match")
      return
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long")
      return
    }

    setIsLoading(true)

    try {
      const result = await authApi.signUp({
        email: email.trim(),
        givenName: firstName.trim(),
        familyName: lastName.trim(),
        password: password.trim(),
      })

      // Check if the response contains an error
      if (result.error) {
        Alert.alert("Error", result.error)
        return
      }

      console.log("Sign up successful:", result)
      console.log("User data from signup:", result.user)
      router.push("/(app)/stats" as any)
    } catch (error) {
      console.error("Sign up error:", error)
      Alert.alert("Error", "Failed to create account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
      <View style={themed($topContainer)}>
        <View style={themed($signUpContainer)}>
          <Card
            style={themed($signUpCard)}
            ContentComponent={
              <View style={themed($cardContent)}>
                <Text style={themed($cardTitle)} text="🚀 Join On The Hill" />
                <Text
                  style={themed($cardSubtitle)}
                  text="Create your account to glean insights from your APA pool statistics"
                />

                <View style={themed($nameRow)}>
                  <TextField
                    value={firstName}
                    onChangeText={setFirstName}
                    containerStyle={themed($nameInputContainer)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    placeholder="Given name"
                  />
                  <TextField
                    value={lastName}
                    onChangeText={setLastName}
                    containerStyle={themed($nameInputContainer)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    placeholder="Family name"
                  />
                </View>

                <TextField
                  value={email}
                  onChangeText={setEmail}
                  containerStyle={themed($inputContainer)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="Email address"
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

                <TextField
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  containerStyle={themed($inputContainer)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  placeholder="Confirm password"
                />

                {isLoading ? (
                  <View style={themed($statusContainer)}>
                    <Text style={themed($loadingText)} text="🚀 Creating your account..." />
                  </View>
                ) : (
                  <Button
                    text="Create Account"
                    onPress={handleSignUp}
                    style={themed($signUpButton)}
                    textStyle={themed($signUpButtonText)}
                    disabled={isLoading}
                  />
                )}
              </View>
            }
          />
        </View>
      </View>

      <View style={themed($bottomContainer)}>
        <Text
          onPress={() => router.push("/(auth)/signin" as any)}
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
})

const $bottomContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
  alignItems: "center",
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 24,
  lineHeight: 32,
  fontWeight: "900",
  textAlign: "center",
  marginBottom: spacing.xl,
})

const $signUpContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  maxWidth: 400,
})

const $signUpCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
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

const $nameRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  width: "100%",
  gap: spacing.sm,
})

const $nameInputContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $inputContainer: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
})

const $statusContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.md,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.palette.neutral600,
})

const $signUpButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 24,
  backgroundColor: colors.palette.primary100,
  width: "100%",
  paddingVertical: spacing.md,
  marginTop: spacing.sm,
})

const $signUpButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 18,
  lineHeight: 24,
  textAlignVertical: "center",
})

const $secondaryText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.palette.primary500,
  fontSize: 16,
  paddingVertical: spacing.sm,
})
