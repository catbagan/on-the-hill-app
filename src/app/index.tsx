import { useEffect, useState } from "react"

import { router } from "expo-router"

import { WelcomeScreen } from "@/screens/WelcomeScreen"
import { isAuthenticated } from "@/services/api/requests"

export default function Index() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = isAuthenticated()
        if (authenticated) {
          // User is already logged in, redirect to stats
          router.replace("/(app)/stats")
        }
      } catch (error) {
        console.error("Auth check error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Show loading state while checking authentication
  if (isLoading) {
    return null // or a loading spinner if you prefer
  }

  return <WelcomeScreen />
}
