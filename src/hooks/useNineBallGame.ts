import { useState, useCallback } from "react"

export type BallState = "onTable" | "pocketed" | "dead" | "alreadyPocketed" | "alreadyDead"

export type NineBallState = {
  [key: number]: BallState
}

const INITIAL_NINE_BALL_STATE: NineBallState = {
  0: "onTable",
  1: "onTable",
  2: "onTable",
  3: "onTable",
  4: "onTable",
  5: "onTable",
  6: "onTable",
  7: "onTable",
  8: "onTable",
}

const BALL_COLORS: Record<number, string> = {
  0: "#FFD700", // 1 ball - Yellow
  1: "#1E90FF", // 2 ball - Blue
  2: "#FF4444", // 3 ball - Red
  3: "#9B59B6", // 4 ball - Purple
  4: "#FF8C00", // 5 ball - Orange
  5: "#2ECC71", // 6 ball - Green
  6: "#8B4513", // 7 ball - Brown
  7: "#333333", // 8 ball - Black
  8: "#FFD700", // 9 ball - Yellow (striped)
}

export function getBallColor(state: string, ballIndex: number): string {
  switch (state) {
    case "pocketed":
      return "#22c55e"
    case "dead":
      return "#9ca3af"
    case "alreadyPocketed":
      return "#86efac"
    case "alreadyDead":
      return "#fca5a5"
    default:
      return BALL_COLORS[ballIndex] || "#FFD700"
  }
}

export function useNineBallGame() {
  const [nineBallState, setNineBallState] = useState<NineBallState>(INITIAL_NINE_BALL_STATE)

  const resetBalls = useCallback(() => {
    setNineBallState(INITIAL_NINE_BALL_STATE)
  }, [])

  const handleBallPress = useCallback(
    (ballIndex: number) => {
      const currentState = nineBallState[ballIndex]
      if (currentState === "alreadyPocketed" || currentState === "alreadyDead") return

      setNineBallState((prev) => {
        const newState = { ...prev }
        switch (currentState) {
          case "onTable":
            newState[ballIndex] = "pocketed"
            break
          case "pocketed":
            newState[ballIndex] = "dead"
            break
          case "dead":
            newState[ballIndex] = "onTable"
            break
        }
        return newState
      })
    },
    [nineBallState],
  )

  /**
   * Calculate points scored this turn and update ball states.
   * Returns: { points, isNineBallPocketed, updatedState }
   */
  const endTurn = useCallback(() => {
    let points = 0
    let isNineBallPocketed = false
    const updatedState = { ...nineBallState }

    for (let i = 0; i < 9; i++) {
      if (updatedState[i] === "pocketed") {
        points += i === 8 ? 2 : 1 // 9-ball worth 2 points
        if (i === 8) isNineBallPocketed = true
        updatedState[i] = "alreadyPocketed"
      } else if (updatedState[i] === "dead") {
        updatedState[i] = "alreadyDead"
      }
    }

    // If 9-ball pocketed, reset all balls for new rack
    if (isNineBallPocketed) {
      for (let i = 0; i < 9; i++) {
        updatedState[i] = "onTable"
      }
    }

    setNineBallState(updatedState)
    return { points, isNineBallPocketed }
  }, [nineBallState])

  const isNineBallDead = nineBallState[8] === "dead"

  return {
    nineBallState,
    handleBallPress,
    getBallColor,
    endTurn,
    resetBalls,
    isNineBallDead,
  }
}
