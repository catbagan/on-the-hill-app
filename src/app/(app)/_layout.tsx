import { useEffect, useState, useRef } from "react"
import { Tabs, usePathname, router } from "expo-router"

import { Text } from "@/components/Text"
import { WrappedPromoModal } from "@/components/WrappedPromoModal"
import { useAppTheme } from "@/theme/context"
import { AppEvents, WrappedEvents } from "@/services/analytics"
import { hasViewedWrapped2025, markWrapped2025AsViewed } from "@/utils/storage/wrappedPromoStorage"

export default function AppLayout() {
  const { themed } = useAppTheme()
  const pathname = usePathname()
  const [showWrappedPromo, setShowWrappedPromo] = useState(false)
  const hasShownPromoThisSession = useRef(false)

  // Track screen views
  useEffect(() => {
    if (pathname) {
      const screenName = pathname.split('/').filter(Boolean).pop() || 'home'
      AppEvents.screenViewed(screenName)
    }
  }, [pathname])

  // Show wrapped promo modal after 4 seconds if not viewed yet
  useEffect(() => {
    const checkAndShowPromo = async () => {
      // Only show once per session
      if (hasShownPromoThisSession.current) return

      // Don't show if already viewed wrapped
      const hasViewed = hasViewedWrapped2025()
      if (hasViewed) return

      // Wait 4 seconds before showing
      const timer = setTimeout(() => {
        setShowWrappedPromo(true)
        hasShownPromoThisSession.current = true
        WrappedEvents.promoShown()
      }, 4000)

      return () => clearTimeout(timer)
    }

    checkAndShowPromo()
  }, [])

  const handleCheckItOut = () => {
    setShowWrappedPromo(false)
    markWrapped2025AsViewed()
    WrappedEvents.promoClicked()
    router.push("/(app)/profile")
  }

  const handleDismiss = () => {
    setShowWrappedPromo(false)
    WrappedEvents.promoDismissed()
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: themed({
            backgroundColor: "colors.background",
            borderTopColor: "colors.border",
          }),
          tabBarActiveTintColor: themed("colors.palette.primary500"),
          tabBarInactiveTintColor: themed("colors.text"),
        }}
      >
        <Tabs.Screen
          name="stats"
          options={{
            title: "Stats",
            tabBarIcon: ({ color, size }) => <TabBarIcon name="📈" color={color} size={size} />,
          }}
        />
        {/*<Tabs.Screen
          name="teams"
          options={{
            title: "Teams",
            tabBarIcon: ({ color, size }) => <TabBarIcon name="👥" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color, size }) => <TabBarIcon name="💬" color={color} size={size} />,
          }}
        />*/}
        <Tabs.Screen
          name="scorekeeper"
          options={{
            title: "Scorekeeper",
            tabBarIcon: ({ color, size }) => <TabBarIcon name="📋" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => <TabBarIcon name="👤" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="dataManagement"
          options={{
            title: "Data Management",
            tabBarIcon: ({ color, size }) => <TabBarIcon name="🗂️" color={color} size={size} />,
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="wrapped"
          options={{
            title: "Wrapped",
            tabBarIcon: ({ color, size }) => <TabBarIcon name="🎁" color={color} size={size} />,
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>

      <WrappedPromoModal
        visible={showWrappedPromo}
        onDismiss={handleDismiss}
        onCheckItOut={handleCheckItOut}
      />
    </>
  )
}

// Simple tab bar icon component using emoji
function TabBarIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return <Text style={{ fontSize: size, color, lineHeight: size + 8 }}>{name}</Text>
} 