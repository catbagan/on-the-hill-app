import { FC } from "react"
import { Modal, View, ViewStyle, TextStyle, TouchableOpacity } from "react-native"
import { router } from "expo-router"

import { Button } from "./Button"
import { Card } from "./Card"
import { Text } from "./Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface WrappedPromoModalProps {
  visible: boolean
  onDismiss: () => void
  onCheckItOut: () => void
}

export const WrappedPromoModal: FC<WrappedPromoModalProps> = ({
  visible,
  onDismiss,
  onCheckItOut,
}) => {
  const { themed } = useAppTheme()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={themed($modalOverlay)}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <Card
            style={themed($modalCard)}
            ContentComponent={
              <View style={themed($modalContent)}>
                {/* Emoji Header */}
                <Text style={themed($emojiText)} text="🎁" />

                {/* Title */}
                <Text
                  style={themed($titleText)}
                  text="Your 2025 Wrapped is Ready!"
                  weight="bold"
                />

                {/* Description */}
                <Text
                  style={themed($descriptionText)}
                  text="See your year in pool—your best matches, top streaks, and player archetype!"
                />

                {/* CTA */}
                <Text
                  style={themed($ctaText)}
                  text="👉 Find it in the Profile tab"
                />

                {/* Buttons */}
                <View style={themed($buttonContainer)}>
                  <Button
                    text="Check it out"
                    onPress={onCheckItOut}
                    style={themed($primaryButton)}
                    textStyle={themed($primaryButtonText)}
                  />
                  <Button
                    text="Maybe later"
                    onPress={onDismiss}
                    style={themed($secondaryButton)}
                    textStyle={themed($secondaryButtonText)}
                  />
                </View>
              </View>
            }
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

const $modalOverlay: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
})

const $modalCard: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
  maxWidth: 400,
  padding: 0,
})

const $modalContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  alignItems: "center",
  gap: spacing.sm,
})

const $emojiText: ThemedStyle<TextStyle> = () => ({
  fontSize: 48,
  lineHeight: 56,
  textAlign: "center",
})

const $titleText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 22,
  fontWeight: "900",
  color: colors.text,
  textAlign: "center",
  marginTop: spacing.xs,
})

const $descriptionText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 15,
  color: colors.textDim,
  textAlign: "center",
  lineHeight: 22,
  marginTop: spacing.xxs,
})

const $ctaText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  fontWeight: "600",
  color: colors.palette.primary500,
  textAlign: "center",
  marginTop: spacing.xs,
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "column",
  gap: spacing.xs,
  width: "100%",
  marginTop: spacing.md,
})

const $primaryButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary500,
  borderRadius: 8,
  paddingVertical: 14,
})

const $primaryButtonText: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
  fontWeight: "700",
  fontSize: 16,
})

const $secondaryButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: "transparent",
  borderRadius: 8,
  paddingVertical: 14,
  borderWidth: 0,
})

const $secondaryButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontWeight: "600",
  fontSize: 16,
})

