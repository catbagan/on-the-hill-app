import { MMKV } from "react-native-mmkv"

// Create storage instance for wrapped promo tracking
const wrappedPromoStorage = new MMKV({
  id: "wrapped-promo-storage",
})

// Storage keys
const STORAGE_KEYS = {
  WRAPPED_2025_VIEWED: "wrapped_2025_viewed",
} as const

/**
 * Check if user has viewed the 2025 wrapped
 */
export function hasViewedWrapped2025(): boolean {
  return wrappedPromoStorage.getBoolean(STORAGE_KEYS.WRAPPED_2025_VIEWED) ?? false
}

/**
 * Mark the 2025 wrapped as viewed (permanently)
 */
export function markWrapped2025AsViewed(): void {
  wrappedPromoStorage.set(STORAGE_KEYS.WRAPPED_2025_VIEWED, true)
}

/**
 * Clear wrapped promo data (for testing/reset)
 */
export function clearWrappedPromoData(): void {
  wrappedPromoStorage.delete(STORAGE_KEYS.WRAPPED_2025_VIEWED)
}

