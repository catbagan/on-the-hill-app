import { View, ViewStyle, TextStyle } from "react-native"

import { Card } from "@/components/Card"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface SortOption {
  value: string
  label: string
}

export interface SortableCardProps<T> {
  heading: string
  data: T
  sortState: any
  onSortChange: (sort: any) => void
  renderItem: (item: [string, any]) => React.ReactNode
  sortOptions: SortOption[]
  sortFunction: (a: [string, any], b: [string, any], sortType: any) => number
}

export const SortableCard = <T extends Record<string, any>>({
  heading,
  data,
  sortState,
  onSortChange,
  renderItem,
  sortOptions,
  sortFunction,
}: SortableCardProps<T>) => {
  const { themed } = useAppTheme()

  const getCurrentSortLabel = () => {
    const option = sortOptions.find((opt) => opt.value === sortState)
    return option?.label || sortOptions[0]?.label || "Sort"
  }

  const cycleSort = () => {
    const currentIndex = sortOptions.findIndex((opt) => opt.value === sortState)
    const nextIndex = (currentIndex + 1) % sortOptions.length
    onSortChange(sortOptions[nextIndex].value)
  }

  return (
    <Card
      style={themed($statCard)}
      HeadingComponent={
        <View style={themed($cardHeaderRow)}>
          <Text weight="bold" text={heading} />
          <Text style={themed($sortButton)} text={getCurrentSortLabel()} onPress={cycleSort} />
        </View>
      }
      ContentComponent={
        <View style={themed($cardContent)}>
          {Object.entries(data)
            .sort((a, b) => sortFunction(a, b, sortState))
            .map(renderItem)}
        </View>
      }
    />
  )
}

const $statCard: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
  marginBottom: spacing.sm,
  shadowOpacity: 0,
  elevation: 0,
})

const $cardHeaderRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
})

const $cardContent: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
  width: "100%",
})

const $sortButton: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 12,
  fontWeight: "500",
  color: colors.palette.primary500,
  backgroundColor: colors.palette.primary100,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxxs,
  borderRadius: 24,
  textAlign: "center",
  borderWidth: 1,
  borderColor: colors.palette.primary300,
})
