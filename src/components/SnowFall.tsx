import { FC, useEffect, useRef } from "react"
import { View, Animated, Dimensions, StyleSheet } from "react-native"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

interface SnowflakeProps {
  delay: number
}

const Snowflake: FC<SnowflakeProps> = ({ delay }) => {
  // Store initial random values in refs so they don't change on re-render
  const initialY = useRef(Math.random() * SCREEN_HEIGHT).current
  const initialXValue = useRef(Math.random() * SCREEN_WIDTH).current
  const initialOpacity = useRef(Math.random() * 0.5 + 0.3).current
  
  const translateY = useRef(new Animated.Value(initialY)).current
  const translateX = useRef(new Animated.Value(initialXValue)).current
  const opacity = useRef(new Animated.Value(initialOpacity)).current
  const isFirstRender = useRef(true)

  useEffect(() => {
    let isActive = true

    // Fall animation - loops forever
    const fall = () => {
      // Stop if component unmounted
      if (!isActive) return

      // Capture first render state before modifying
      const isFirst = isFirstRender.current
      
      // Start from top on subsequent falls, from random position on first render
      let currentX = initialXValue
      if (isFirstRender.current) {
        isFirstRender.current = false
        currentX = initialXValue // Use the initial position
      } else {
        currentX = Math.random() * SCREEN_WIDTH
        translateY.setValue(-50)
        translateX.setValue(currentX)
      }
      
      // Calculate duration based on starting position
      const currentY = isFirst ? initialY : -50
      const remainingDistance = SCREEN_HEIGHT + 50 - currentY
      const fullDistance = SCREEN_HEIGHT + 100
      const baseDuration = Math.random() * 8000 + 12000 // 12-20 seconds
      const fallDuration = (remainingDistance / fullDistance) * baseDuration

      // Simple side-to-side drift
      const driftAmount = (Math.random() - 0.5) * 100

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT + 50,
          duration: fallDuration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: currentX + driftAmount,
            duration: fallDuration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: currentX - driftAmount,
            duration: fallDuration / 2,
            useNativeDriver: true,
          }),
        ]),
      ]).start(({ finished }) => {
        // Loop forever - restart from top when reaches bottom
        if (finished && isActive) {
          fall()
        }
      })
    }

    // Start with a small stagger delay
    const startTimeout = setTimeout(() => {
      if (isActive) {
        fall()
      }
    }, delay * 5)

    // Cleanup on unmount
    return () => {
      isActive = false
      clearTimeout(startTimeout)
    }
  }, [delay])

  const size = Math.random() * 4 + 3 // 3-7px

  return (
    <Animated.View
      style={[
        styles.snowflake,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
          transform: [{ translateX }, { translateY }],
        },
      ]}
    />
  )
}

interface SnowFallProps {
  count?: number
}

export const SnowFall: FC<SnowFallProps> = ({ count = 50 }) => {
  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: count }).map((_, index) => (
        <Snowflake key={index} delay={index} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  snowflake: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
})

