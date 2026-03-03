import { useState, useRef, useCallback, useEffect } from "react"
import { Audio } from "expo-av"
import * as Haptics from "expo-haptics"

export function useWrappedAudio() {
  const [isMuted, setIsMuted] = useState(false)
  const sound = useRef<Audio.Sound | null>(null)

  const playBackgroundMusic = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      })

      const { sound: loadedSound } = await Audio.Sound.createAsync(
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("@assets/wrapped-music.mp3"),
        {
          isLooping: true,
          volume: 0.3,
          shouldPlay: !isMuted,
        },
      )
      sound.current = loadedSound
    } catch (error) {
      console.error("Error playing background music:", error)
    }
  }, [isMuted])

  const stopBackgroundMusic = useCallback(async () => {
    try {
      if (sound.current) {
        await sound.current.stopAsync()
        await sound.current.unloadAsync()
        sound.current = null
      }
    } catch (error) {
      console.error("Error stopping background music:", error)
    }
  }, [])

  const toggleMute = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      if (sound.current) {
        if (isMuted) {
          await sound.current.playAsync()
        } else {
          await sound.current.pauseAsync()
        }
      }
      setIsMuted((prev) => !prev)
    } catch (error) {
      console.error("Error toggling mute:", error)
    }
  }, [isMuted])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sound.current) {
        sound.current.stopAsync().then(() => sound.current?.unloadAsync())
      }
    }
  }, [])

  return {
    isMuted,
    playBackgroundMusic,
    stopBackgroundMusic,
    toggleMute,
  }
}
