import { FC, useState, useRef, useCallback } from "react"
import {
  ScrollView,
  View,
  ViewStyle,
  TextStyle,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from "react-native"
import { router, useFocusEffect } from "expo-router"
import ViewShot from "react-native-view-shot"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { wrappedApi, type WrappedSlide, playerApi } from "@/services/api/requests"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { getStoredPlayers } from "@/utils/storage/statsStorage"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")
const CURRENT_YEAR = 2025

export const WrappedScreen: FC = function WrappedScreen() {
  const { themed } = useAppTheme()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<WrappedSlide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const scrollViewRef = useRef<ScrollView>(null)
  const cardRef = useRef<ViewShot>(null)

  const loadWrapped = useCallback(async () => {
    setIsLoading(true)
    setSlides([])
    setCurrentSlide(0)

    try {
      // Get the first player from stored players to get memberId
      const storedPlayers = await getStoredPlayers()
      if (!storedPlayers || storedPlayers.length === 0) {
        Alert.alert("No Players", "Please add a player in Stats first to view your wrapped.")
        router.back()
        return
      }

      // Get the first player's name and search for their memberId
      const playerName = storedPlayers[0].name
      const searchResult = await playerApi.search({ name: playerName })

      if (!searchResult.player || !searchResult.player.memberNumber) {
        Alert.alert("Error", "Could not find player information.")
        router.back()
        return
      }

      const result = await wrappedApi.get({
        memberId: searchResult.player.memberNumber,
        year: CURRENT_YEAR,
      })

      if (result.error) {
        Alert.alert("Error", result.error)
        router.back()
        return
      }

      if (result.slides) {
        setSlides(result.slides)
      }
    } catch (error) {
      console.error("Error loading wrapped:", error)
      Alert.alert("Error", "Failed to load wrapped data. Please try again.")
      router.back()
    } finally {
      setIsLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadWrapped()
    }, [loadWrapped]),
  )

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const slideIndex = Math.round(offsetX / SCREEN_WIDTH)
    setCurrentSlide(slideIndex)
  }

  const handleClose = () => {
    router.back()
  }

  const handleShare = async () => {
    try {
      if (!cardRef.current || !cardRef.current.capture) {
        Alert.alert("Error", "Unable to capture card. Please try again.")
        return
      }

      // Capture the card as an image
      const uri = await cardRef.current.capture()

      // Share the image only
      const shareOptions: any = {}

      if (Platform.OS === "ios") {
        shareOptions.url = uri
      } else {
        shareOptions.url = `file://${uri}`
      }

      await Share.share(shareOptions)
    } catch (error) {
      console.error("Error sharing:", error)
      Alert.alert("Error", "Failed to share. Please try again.")
    }
  }

  const getPositionOrdinal = (position: number): string => {
    const ordinals = ["first", "second", "third", "fourth", "fifth"]
    return ordinals[position - 1] || `${position}th`
  }

  const renderSlide = (slide: WrappedSlide, index: number) => {
    switch (slide.type) {
      case "welcome":
        return (
          <View key={index} style={themed($slideContainer)}>
            <ScrollView
              contentContainerStyle={themed($slideScrollContent)}
              showsVerticalScrollIndicator={false}
            >
              <Text style={themed($slideEmoji)} text="🎱" />
              <Text style={themed($slideTitle)} text="Your 2025 Wrapped" />
              <Text style={themed($slideSubtitle)} text="Let's see how you played this year" />
              <View style={themed($bigNumberContainer)}>
                <Text style={themed($bigNumber)} text={`${slide.totalGames}`} />
                <Text style={themed($bigNumberLabel)} text="matches" />
              </View>
            </ScrollView>
          </View>
        )

      case "howdYouDo":
        return (
          <View key={index} style={themed($slideContainer)}>
            <ScrollView
              contentContainerStyle={themed($slideScrollContent)}
              showsVerticalScrollIndicator={false}
            >
              <Text style={themed($slideEmoji)} text="📊" />
              <Text style={themed($slideTitle)} text="How'd You Do?" />
              <Card
                style={themed($mainCard)}
                ContentComponent={
                  <View style={themed($cardInner)}>
                    <View style={themed($statsGroup)}>
                      <View style={themed($statRow)}>
                        <Text style={themed($statLabel)} text="Record" />
                        <Text
                          style={themed($statValue)}
                          text={`${slide.wins}W - ${slide.losses}L`}
                        />
                      </View>
                      <View style={themed($statRow)}>
                        <Text style={themed($statLabel)} text="Longest Streak" />
                        <Text
                          style={themed($statValue)}
                          text={`${slide.longestWinStreak} matches`}
                        />
                      </View>
                    </View>
                    <View style={themed($divider)} />
                    <View style={themed($statsGroup)}>
                      <View style={themed($statRow)}>
                        <Text style={themed($statLabel)} text="Starting Skill Level" />
                        <Text style={themed($statValue)} text={`${slide.startingSkill}`} />
                      </View>
                      <View style={themed($statRow)}>
                        <Text style={themed($statLabel)} text="Ending Skill Level" />
                        <Text style={themed($statValue)} text={`${slide.endingSkill}`} />
                      </View>
                      <View style={themed($statRow)}>
                        <Text style={themed($statLabel)} text="Highest Skill Level" />
                        <Text style={themed($statValue)} text={`${slide.highestSkill}`} />
                      </View>
                    </View>
                  </View>
                }
              />
            </ScrollView>
          </View>
        )

      case "yourTeams":
        return (
          <View key={index} style={themed($slideContainer)}>
            <ScrollView
              contentContainerStyle={themed($slideScrollContent)}
              showsVerticalScrollIndicator={false}
            >
              <Text style={themed($slideEmoji)} text="🏆" />
              <Text style={themed($slideTitle)} text="Your Teams" />
              {slide.bestTeam && (
                <Card
                  style={themed($mainCard)}
                  ContentComponent={
                    <View style={themed($cardInner)}>
                      <Text style={themed($highlightLabel)} text="Best Season" />
                      <Text style={themed($highlightValue)} text={slide.bestTeam.teamName} />
                      <Text
                        style={themed($highlightDetail)}
                        text={`${slide.bestTeam.season} ${slide.bestTeam.seasonYear}`}
                      />
                      <Text
                        style={themed($highlightDetail)}
                        text={`${slide.bestTeam.wins}W - ${slide.bestTeam.losses}L`}
                      />
                    </View>
                  }
                />
              )}
              {slide.teams && slide.teams.length > 0 && (
                <Card
                  style={themed($mainCard)}
                  ContentComponent={
                    <View style={themed($cardInner)}>
                      <Text style={themed($sectionLabel)} text="All Teams" />
                      {slide.teams.map((team: any, i: number) => (
                        <View
                          key={i}
                          style={themed([$listItem, i < slide.teams.length - 1 && $listItemBorder])}
                        >
                          <View style={themed($listItemLeft)}>
                            <Text style={themed($listItemTitle)} text={team.teamName} />
                            <Text
                              style={themed($listItemSubtitle)}
                              text={`${team.season} ${team.seasonYear} • ${team.teamType.replace("_", " ")}`}
                            />
                          </View>
                          <Text
                            style={themed($listItemValue)}
                            text={`${team.wins}W - ${team.losses}L`}
                          />
                        </View>
                      ))}
                    </View>
                  }
                />
              )}
            </ScrollView>
          </View>
        )

      case "happyPlace":
        return (
          <View key={index} style={themed($slideContainer)}>
            <ScrollView
              contentContainerStyle={themed($slideScrollContent)}
              showsVerticalScrollIndicator={false}
            >
              <Text style={themed($slideEmoji)} text="📍" />
              <Text style={themed($slideTitle)} text="Your Time and Place" />
              {slide.bestLocations && slide.bestLocations.length > 0 && (
                <Card
                  style={themed($mainCard)}
                  ContentComponent={
                    <View style={themed($cardInner)}>
                      <Text style={themed($sectionLabel)} text="Best Locations" />
                      {slide.bestLocations.map((loc: any, i: number) => (
                        <View
                          key={i}
                          style={themed([
                            $listItem,
                            i < slide.bestLocations.length - 1 && $listItemBorder,
                          ])}
                        >
                          <View style={themed($listItemLeft)}>
                            <Text style={themed($listItemTitle)} text={loc.location} />
                            <Text
                              style={themed($listItemSubtitle)}
                              text={`${loc.totalMatches} matches`}
                            />
                          </View>
                          <Text
                            style={themed($listItemValue)}
                            text={`${loc.wins}W - ${loc.losses}L`}
                          />
                        </View>
                      ))}
                    </View>
                  }
                />
              )}
              {slide.worstLocations && slide.worstLocations.length > 0 && (
                <Card
                  style={themed($mainCard)}
                  ContentComponent={
                    <View style={themed($cardInner)}>
                      <Text style={themed($sectionLabel)} text="Worst Locations" />
                      {slide.worstLocations.map((loc: any, i: number) => (
                        <View
                          key={i}
                          style={themed([
                            $listItem,
                            i < slide.worstLocations.length - 1 && $listItemBorder,
                          ])}
                        >
                          <View style={themed($listItemLeft)}>
                            <Text style={themed($listItemTitle)} text={loc.location} />
                            <Text
                              style={themed($listItemSubtitle)}
                              text={`${loc.totalMatches} matches`}
                            />
                          </View>
                          <Text
                            style={themed($listItemValue)}
                            text={`${loc.wins}W - ${loc.losses}L`}
                          />
                        </View>
                      ))}
                    </View>
                  }
                />
              )}
              {(slide.bestPosition || slide.worstPosition) && (
                <Card
                  style={themed($mainCard)}
                  ContentComponent={
                    <View style={themed($cardInner)}>
                      <Text style={themed($sectionLabel)} text="Shooting Order" />
                      {slide.bestPosition && (
                        <View style={themed([$listItem, slide.worstPosition && $listItemBorder])}>
                          <View style={themed($listItemLeft)}>
                            <Text
                              style={themed($listItemTitle)}
                              text={`Shooting ${getPositionOrdinal(slide.bestPosition.position)}`}
                            />
                            <Text style={themed($listItemSubtitle)} text="Best" />
                          </View>
                          <Text
                            style={themed($listItemValue)}
                            text={`${slide.bestPosition.wins}W - ${slide.bestPosition.losses}L`}
                          />
                        </View>
                      )}
                      {slide.worstPosition && (
                        <View style={themed($listItem)}>
                          <View style={themed($listItemLeft)}>
                            <Text
                              style={themed($listItemTitle)}
                              text={`Shooting ${getPositionOrdinal(slide.worstPosition.position)}`}
                            />
                            <Text style={themed($listItemSubtitle)} text="Worst" />
                          </View>
                          <Text
                            style={themed($listItemValue)}
                            text={`${slide.worstPosition.wins}W - ${slide.worstPosition.losses}L`}
                          />
                        </View>
                      )}
                    </View>
                  }
                />
              )}
            </ScrollView>
          </View>
        )

      case "rivals":
        return (
          <View key={index} style={themed($slideContainer)}>
            <ScrollView
              contentContainerStyle={themed($slideScrollContent)}
              showsVerticalScrollIndicator={false}
            >
              <Text style={themed($slideEmoji)} text="⚔️" />
              <Text style={themed($slideTitle)} text="Your Rivals" />
              {slide.mostPlayed && slide.mostPlayed.length > 0 && (
                <Card
                  style={themed($mainCard)}
                  ContentComponent={
                    <View style={themed($cardInner)}>
                      <Text style={themed($sectionLabel)} text="Most Played" />
                      {slide.mostPlayed.map((opp: any, i: number) => (
                        <View
                          key={i}
                          style={themed([
                            $listItem,
                            i < slide.mostPlayed.length - 1 && $listItemBorder,
                          ])}
                        >
                          <View style={themed($listItemLeft)}>
                            <Text style={themed($listItemTitle)} text={opp.opponentName} />
                            <Text
                              style={themed($listItemSubtitle)}
                              text={`${opp.totalMatches} matches`}
                            />
                          </View>
                          <Text
                            style={themed($listItemValue)}
                            text={`${opp.wins}W - ${opp.losses}L`}
                          />
                        </View>
                      ))}
                    </View>
                  }
                />
              )}
              {(slide.seasonOpener || slide.seasonCloser) && (
                <Card
                  style={themed($mainCard)}
                  ContentComponent={
                    <View style={themed($cardInner)}>
                      <Text style={themed($sectionLabel)} text="Season Bookends" />
                      {slide.seasonOpener && (
                        <View style={themed([$listItem, slide.seasonCloser && $listItemBorder])}>
                          <View style={themed($listItemLeft)}>
                            <Text style={themed($listItemTitle)} text="Opener" />
                            <Text
                              style={themed($listItemSubtitle)}
                              text={slide.seasonOpener.opponentName}
                            />
                          </View>
                          <Text
                            style={themed($listItemValue)}
                            text={slide.seasonOpener.isWin ? "W" : "L"}
                          />
                        </View>
                      )}
                      {slide.seasonCloser && (
                        <View style={themed($listItem)}>
                          <View style={themed($listItemLeft)}>
                            <Text style={themed($listItemTitle)} text="Closer" />
                            <Text
                              style={themed($listItemSubtitle)}
                              text={slide.seasonCloser.opponentName}
                            />
                          </View>
                          <Text
                            style={themed($listItemValue)}
                            text={slide.seasonCloser.isWin ? "W" : "L"}
                          />
                        </View>
                      )}
                    </View>
                  }
                />
              )}
              {slide.lowestSkillOpp && slide.lowestSkillOpp.length > 0 && (
                <Card
                  style={themed($mainCard)}
                  ContentComponent={
                    <View style={themed($cardInner)}>
                      <Text style={themed($sectionLabel)} text="Lowest Skill Level Opponents" />
                      {slide.lowestSkillOpp.map((opp: any, i: number) => (
                        <View
                          key={i}
                          style={themed([
                            $listItem,
                            i < slide.lowestSkillOpp.length - 1 && $listItemBorder,
                          ])}
                        >
                          <View style={themed($listItemLeft)}>
                            <Text style={themed($listItemTitle)} text={opp.opponentName} />
                            <Text
                              style={themed($listItemSubtitle)}
                              text={`Skill Level ${opp.opponentSkill}`}
                            />
                          </View>
                          <Text
                            style={themed($listItemValue)}
                            text={`${opp.wins}W - ${opp.losses}L`}
                          />
                        </View>
                      ))}
                    </View>
                  }
                />
              )}
              {slide.highestSkillOpp && slide.highestSkillOpp.length > 0 && (
                <Card
                  style={themed($mainCard)}
                  ContentComponent={
                    <View style={themed($cardInner)}>
                      <Text style={themed($sectionLabel)} text="Highest Skill Level Opponents" />
                      {slide.highestSkillOpp.map((opp: any, i: number) => (
                        <View
                          key={i}
                          style={themed([
                            $listItem,
                            i < slide.highestSkillOpp.length - 1 && $listItemBorder,
                          ])}
                        >
                          <View style={themed($listItemLeft)}>
                            <Text style={themed($listItemTitle)} text={opp.opponentName} />
                            <Text
                              style={themed($listItemSubtitle)}
                              text={`Skill Level ${opp.opponentSkill}`}
                            />
                          </View>
                          <Text
                            style={themed($listItemValue)}
                            text={`${opp.wins}W - ${opp.losses}L`}
                          />
                        </View>
                      ))}
                    </View>
                  }
                />
              )}
            </ScrollView>
          </View>
        )

      case "archetype":
        return (
          <View key={index} style={themed($slideContainer)}>
            <ScrollView
              contentContainerStyle={themed($slideScrollContent)}
              showsVerticalScrollIndicator={false}
            >
              <Text style={themed($slideEmoji)} text="🎭" />
              <Text style={themed($slideTitle)} text="Your Archetypes" />
              {slide.top5 && slide.top5.length > 0 && (
                <Card
                  style={themed($mainCard)}
                  ContentComponent={
                    <View style={themed($cardInner)}>
                      {slide.top5.map((arch: any, i: number) => (
                        <View key={i} style={themed([i < slide.top5.length - 1 && $archetypeItem])}>
                          <Text style={themed($archetypeName)} text={arch.name} />
                          <Text style={themed($archetypeDescription)} text={arch.description} />
                          <Text style={themed($archetypeExplanation)} text={arch.explanation} />
                        </View>
                      ))}
                    </View>
                  }
                />
              )}
            </ScrollView>
          </View>
        )

      case "summary": {
        // Get top archetype from archetype slide
        const archetypeSlide = slides.find((s) => s.type === "archetype")
        const topArchetype =
          archetypeSlide && archetypeSlide.top5 && archetypeSlide.top5.length > 0
            ? archetypeSlide.top5[0]
            : null

        // Get stats from howdYouDo slide
        const statsSlide = slides.find((s) => s.type === "howdYouDo")

        return (
          <View key={index} style={themed($slideContainer)}>
            <ScrollView
              contentContainerStyle={themed($slideScrollContent)}
              showsVerticalScrollIndicator={false}
            >
              {/* Shareable Summary Card */}
              <View style={themed($summaryCardWrapper)}>
                <ViewShot ref={cardRef} options={{ format: "png", quality: 1.0 }}>
                  <View style={themed($summaryCardContainer)}>
                    <Card
                      style={themed($summaryCard)}
                  ContentComponent={
                    <View style={themed($summaryCardInner)}>
                      {/* Title */}
                      <Text style={themed($summaryCardTitle)} text="My 2025 APA Wrapped" />

                      {/* Stats Grid - 2 Columns */}
                      {statsSlide && (
                        <View style={themed($summaryGrid)}>
                          <View style={themed($summaryGridItem)}>
                            <View style={themed($summaryGridHeader)}>
                              <Text style={themed($summaryGridEmoji)} text="📊" />
                              <Text style={themed($summaryGridLabel)} text="Record" />
                            </View>
                            <Text
                              style={themed($summaryGridValue)}
                              text={`${statsSlide.wins}-${statsSlide.losses}`}
                            />
                          </View>
                          <View style={themed($summaryGridItem)}>
                            <View style={themed($summaryGridHeader)}>
                              <Text style={themed($summaryGridEmoji)} text="🔥" />
                              <Text style={themed($summaryGridLabel)} text="Best Streak" />
                            </View>
                            <Text
                              style={themed($summaryGridValue)}
                              text={`${statsSlide.longestWinStreak}`}
                            />
                          </View>
                          <View style={themed($summaryGridItem)}>
                            <View style={themed($summaryGridHeader)}>
                              <Text style={themed($summaryGridEmoji)} text="📈" />
                              <Text style={themed($summaryGridLabel)} text="Starting SL" />
                            </View>
                            <Text
                              style={themed($summaryGridValue)}
                              text={`${statsSlide.startingSkill}`}
                            />
                          </View>
                          <View style={themed($summaryGridItem)}>
                            <View style={themed($summaryGridHeader)}>
                              <Text style={themed($summaryGridEmoji)} text="🎯" />
                              <Text style={themed($summaryGridLabel)} text="Ending SL" />
                            </View>
                            <Text
                              style={themed($summaryGridValue)}
                              text={`${statsSlide.endingSkill}`}
                            />
                          </View>
                        </View>
                      )}

                      {/* Top Archetype */}
                      {topArchetype && (
                        <View style={themed($summaryArchetypeSection)}>
                          <View style={themed($summaryArchetypeHeader)}>
                            <Text style={themed($summaryArchetypeEmoji)} text="🎭" />
                            <Text style={themed($summaryArchetypeTitle)} text="Your Archetype" />
                          </View>
                          <Text style={themed($summaryArchetypeName)} text={topArchetype.name} />
                          <Text
                            style={themed($summaryArchetypeDesc)}
                            text={topArchetype.explanation || topArchetype.description}
                          />
                        </View>
                      )}

                      {/* Top Highlights */}
                      {slide.top3Highlights && slide.top3Highlights.length > 0 && (
                        <View style={themed($summaryHighlightsSection)}>
                          <View style={themed($summaryHighlightsHeader)}>
                            <Text style={themed($summaryHighlightsEmoji)} text="✨" />
                            <Text style={themed($summaryHighlightsTitle)} text="Highlights" />
                          </View>
                          {slide.top3Highlights.map((highlight: string, i: number) => (
                            <Text
                              key={i}
                              style={themed($summaryHighlight)}
                              text={`• ${highlight}`}
                            />
                          ))}
                        </View>
                      )}

                      {/* Footer */}
                      <View style={themed($summaryFooter)}>
                        <Text
                          style={themed($summaryFooterText)}
                          text={`Get yours with the "On The Hill" app! 🎱`}
                        />
                      </View>
                    </View>
                  }
                />
                  </View>
                </ViewShot>
              </View>
            </ScrollView>
          </View>
        )
      }

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
        <View style={themed($loadingContainer)}>
          <ActivityIndicator size="large" />
          <Text style={themed($loadingText)} text="Loading your wrapped..." />
        </View>
      </Screen>
    )
  }

  if (slides.length === 0) {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
        <View style={themed($loadingContainer)}>
          <Text style={themed($loadingText)} text="No wrapped data available" />
          <Button
            text="Go Back"
            onPress={handleClose}
            style={themed($doneButton)}
            textStyle={themed($doneButtonText)}
          />
        </View>
      </Screen>
    )
  }

  return (
    <Screen preset="fixed" contentContainerStyle={themed($contentContainer)}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={themed($scrollView)}
        contentContainerStyle={themed($scrollContent)}
      >
        {slides.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>

      <View
        style={themed([
          $footerContainer,
          currentSlide === slides.length - 1 && $footerContainerSummary,
        ])}
      >
        <View style={themed($dotsContainer)}>
          {slides.map((_, index) => (
            <View key={index} style={themed([$dot, index === currentSlide && $dotActive])} />
          ))}
        </View>

        {currentSlide === slides.length - 1 && (
          <View style={themed($fixedButtonsContainer)}>
            <Button
              text="Share"
              onPress={handleShare}
              style={themed($fixedShareButton)}
              textStyle={themed($fixedShareButtonText)}
            />
            <Button
              text="Bye now!"
              onPress={handleClose}
              style={themed($doneButton)}
              textStyle={themed($doneButtonText)}
            />
          </View>
        )}
      </View>
    </Screen>
  )
}

export default WrappedScreen

const $contentContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $loadingContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  gap: spacing.lg,
  paddingHorizontal: spacing.xl,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  color: colors.textDim,
  textAlign: "center",
})

const $scrollView: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $scrollContent: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
})

const $slideContainer: ThemedStyle<ViewStyle> = () => ({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT * 0.85,
})

const $slideScrollContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  paddingTop: 60,
  paddingBottom: spacing.xxxl,
  gap: spacing.md,
})

const $slideEmoji: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 48,
  lineHeight: 58,
  textAlign: "center",
  marginBottom: spacing.xs,
})

const $slideTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 24,
  lineHeight: 32,
  fontWeight: "900",
  color: colors.text,
  textAlign: "center",
  marginBottom: spacing.sm,
})

const $slideSubtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.textDim,
  textAlign: "center",
  marginBottom: spacing.md,
})

const $bigNumberContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginTop: spacing.xl,
})

const $bigNumber: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 72,
  fontWeight: "900",
  color: colors.palette.primary500,
  lineHeight: 80,
})

const $bigNumberLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 24,
  fontWeight: "600",
  color: colors.textDim,
  marginTop: spacing.xs,
})

const $mainCard: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  marginBottom: spacing.md,
  padding: 0,
  minHeight: 0,
})

const $cardInner: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  padding: spacing.md,
})

const $statsGroup: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
})

const $statRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

const $statLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "500",
  color: colors.textDim,
})

const $statValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 15,
  fontWeight: "700",
  color: colors.text,
})

const $divider: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  height: 1,
  backgroundColor: colors.palette.neutral300,
  marginVertical: spacing.md,
})

const $sectionLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 11,
  fontWeight: "700",
  color: colors.textDim,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: spacing.sm,
})

const $highlightLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 10,
  fontWeight: "600",
  color: colors.textDim,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: spacing.xxs,
})

const $highlightValue: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 20,
  fontWeight: "700",
  color: colors.text,
  marginBottom: spacing.xxs,
  flexWrap: "wrap",
})

const $highlightDetail: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "500",
  color: colors.textDim,
  flexWrap: "wrap",
})

const $listItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.sm,
})

const $listItemBorder: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral200,
})

const $listItemLeft: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  marginRight: spacing.md,
  flexShrink: 1,
})

const $listItemTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "600",
  color: colors.text,
  marginBottom: 2,
  flexWrap: "wrap",
  flexShrink: 1,
})

const $listItemSubtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  fontWeight: "400",
  color: colors.textDim,
  flexWrap: "wrap",
  flexShrink: 1,
})

const $listItemValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 15,
  fontWeight: "700",
  color: colors.palette.primary500,
  flexShrink: 0,
})

const $archetypeItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
  paddingBottom: spacing.lg,
  borderBottomWidth: 1,
  borderBottomColor: "#e0e0e0",
})

const $archetypeName: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 18,
  fontWeight: "900",
  color: colors.text,
  marginBottom: spacing.xs,
  flexWrap: "wrap",
  flexShrink: 1,
})

const $archetypeDescription: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 15,
  fontWeight: "600",
  color: colors.textDim,
  marginBottom: spacing.sm,
  flexWrap: "wrap",
})

const $archetypeExplanation: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "400",
  color: colors.textDim,
  lineHeight: 20,
  flexWrap: "wrap",
})

const $footerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.xl,
  paddingBottom: spacing.xl,
  marginTop: spacing.xl,
  gap: spacing.sm,
})

const $footerContainerSummary: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  paddingTop: spacing.sm,
  paddingBottom: spacing.sm,
})

const $dotsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  gap: spacing.xs,
  marginBottom: spacing.md,
})

const $dot: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.palette.neutral300,
})

const $dotActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary500,
  width: 24,
})

const $doneButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 20,
  backgroundColor: colors.palette.primary100,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.lg,
  minWidth: 140,
})

const $doneButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  lineHeight: 20,
  textAlignVertical: "center",
  color: colors.palette.primary500,
  fontWeight: "600",
})

// Summary Card Styles
const $summaryCardWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  marginBottom: spacing.lg,
})

const $summaryCardContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral100,
})

const $summaryCard: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: "100%",
  padding: 0,
  minHeight: 0,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 0,
  borderWidth: 0,
})

const $summaryCardInner: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  gap: spacing.sm,
})

const $summaryCardTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 20,
  fontWeight: "900",
  color: colors.text,
  textAlign: "center",
  marginBottom: spacing.xxs,
})

const $summaryGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
  width: "100%",
})

const $summaryGridItem: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flex: 1,
  minWidth: "45%",
  backgroundColor: colors.background,
  borderRadius: 10,
  padding: spacing.sm,
  alignItems: "center",
  gap: 4,
})

const $summaryGridHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xxs,
})

const $summaryGridEmoji: ThemedStyle<TextStyle> = () => ({
  fontSize: 18,
  lineHeight: 22,
})

const $summaryGridLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  fontWeight: "600",
  color: colors.textDim,
})

const $summaryGridValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 20,
  fontWeight: "900",
  color: colors.palette.primary500,
  textAlign: "center",
})

const $summaryArchetypeSection: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  width: "100%",
  backgroundColor: colors.background,
  borderRadius: 10,
  padding: spacing.sm,
  gap: 4,
})

const $summaryArchetypeHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xxs,
  marginBottom: spacing.xxs,
})

const $summaryArchetypeEmoji: ThemedStyle<TextStyle> = () => ({
  fontSize: 16,
  lineHeight: 20,
})

const $summaryArchetypeTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 11,
  fontWeight: "700",
  color: colors.palette.primary500,
})

const $summaryArchetypeName: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "900",
  color: colors.text,
})

const $summaryArchetypeDesc: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 11,
  fontWeight: "500",
  color: colors.textDim,
  lineHeight: 15,
})

const $summaryHighlightsSection: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  width: "100%",
  backgroundColor: colors.background,
  borderRadius: 10,
  padding: spacing.xs,
  gap: 2,
})

const $summaryHighlightsHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xxs,
  marginBottom: spacing.xxs,
})

const $summaryHighlightsEmoji: ThemedStyle<TextStyle> = () => ({
  fontSize: 16,
  lineHeight: 20,
})

const $summaryHighlightsTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 11,
  fontWeight: "700",
  color: colors.palette.primary500,
})

const $summaryHighlight: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 11,
  fontWeight: "500",
  color: colors.text,
  lineHeight: 15,
})

const $summaryFooter: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  width: "100%",
  alignItems: "center",
})

const $summaryFooterText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 10,
  fontWeight: "600",
  color: colors.textDim,
  textAlign: "center",
})

const $fixedButtonsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  gap: spacing.md,
  marginTop: spacing.md,
})

const $fixedShareButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 20,
  backgroundColor: colors.palette.primary500,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.lg,
  minWidth: 100,
})

const $fixedShareButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  lineHeight: 20,
  textAlignVertical: "center",
  color: colors.palette.neutral100,
  fontWeight: "600",
})
