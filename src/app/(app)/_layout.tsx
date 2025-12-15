import { Tabs } from "expo-router"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"

export default function AppLayout() {
  const { themed } = useAppTheme()

  return (
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
  )
}

// Simple tab bar icon component using emoji
function TabBarIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return <Text style={{ fontSize: size, color, lineHeight: size + 8 }}>{name}</Text>
} 