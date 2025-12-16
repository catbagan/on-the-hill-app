/**
 * Analytics Service
 * 
 * Tracks events to custom backend endpoint
 */

import { api } from './api'
import { API_BASE_URL } from './api/requests'

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
}

/**
 * Track an analytics event to backend
 */
export async function trackEvent(eventName: string, properties?: Record<string, any>) {
  try {
    const payload = {
      event: eventName,
      properties: properties || {},
      timestamp: new Date().toISOString(),
    }

    // Development logging
    if (__DEV__) {
      console.log('📊 Analytics Event:', eventName, properties)
      console.log('📤 Sending to /api/analytics/track:', payload)
    }

    // Send to custom backend
    const response = await api.apisauce.post(`${API_BASE_URL}/analytics/track`, payload)

    if (__DEV__) {
      console.log('📥 Analytics response:', response.status, response.ok)
      if (!response.ok) {
        console.warn('Analytics request failed:', response.problem, response.data)
      }
    }
  } catch (error) {
    console.error('❌ Analytics tracking error:', error)
  }
}

/**
 * Identify a user (for user-based analytics)
 * You can extend this to send user identification to your backend if needed
 */
export async function identifyUser(userId: string, traits?: Record<string, any>) {
  try {
    // Optional: Send to backend if you want user identification tracking
    // await api.apisauce.post('/api/analytics/identify', { userId, traits })

    if (__DEV__) {
      console.log('👤 User identified:', userId, traits)
    }
  } catch (error) {
    console.error('User identification error:', error)
  }
}

/**
 * App Lifecycle Events
 */
export const AppEvents = {
  opened: () => trackEvent('app_opened'),
  
  backgrounded: () => trackEvent('app_backgrounded'),
  
  foregrounded: () => trackEvent('app_foregrounded'),
  
  sessionStarted: () => trackEvent('session_started'),
  
  sessionEnded: (duration: number) => 
    trackEvent('session_ended', { duration }),
  
  screenViewed: (screenName: string, params?: Record<string, any>) => 
    trackEvent('screen_viewed', { screenName, ...params }),
}

/**
 * Stats Feature Events
 */
export const StatsEvents = {
  viewed: (playerName: string) => 
    trackEvent('stats_viewed', { playerName }),
  
  playerSearched: (searchTerm: string, resultCount?: number) => 
    trackEvent('stats_player_searched', { searchTerm, resultCount }),
  
  playerSelected: (playerName: string, memberNumber?: string) => 
    trackEvent('stats_player_selected', { playerName, memberNumber }),
  
  playerAdded: (playerName: string) => 
    trackEvent('stats_player_added', { playerName }),
  
  tabChanged: (tabName: string) => 
    trackEvent('stats_tab_changed', { tabName }),
  
  sortChanged: (category: string, sortType: string) => 
    trackEvent('stats_sort_changed', { category, sortType }),
  
  seasonSelected: (season: string) => 
    trackEvent('stats_season_selected', { season }),
  
  playerChipTapped: (playerName: string, playerIndex: number) => 
    trackEvent('stats_player_chip_tapped', { playerName, playerIndex }),
  
  reportGenerated: (playerName: string, cacheHit: boolean) => 
    trackEvent('stats_report_generated', { playerName, cacheHit }),
  
  reportFailed: (error: string) => 
    trackEvent('stats_report_failed', { error }),
  
  refreshPulled: () => 
    trackEvent('stats_refresh_pulled'),
}

/**
 * Wrapped-specific tracking events
 */
export const WrappedEvents = {
  viewed: () => trackEvent('wrapped_viewed'),
  
  slideViewed: (slideType: string, slideIndex: number) => 
    trackEvent('wrapped_slide_viewed', { slideType, slideIndex }),
  
  shared: (platform?: string) => 
    trackEvent('wrapped_shared', { platform }),
  
  completed: (totalSlides: number, timeSpent?: number) => 
    trackEvent('wrapped_completed', { totalSlides, timeSpent }),
  
  shareFailed: (error: string) => 
    trackEvent('wrapped_share_failed', { error }),
  
  promoShown: () => 
    trackEvent('wrapped_promo_shown'),
  
  promoClicked: () => 
    trackEvent('wrapped_promo_clicked'),
  
  promoDismissed: () => 
    trackEvent('wrapped_promo_dismissed'),
}

