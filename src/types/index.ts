/**
 * Core type definitions for the WE Emotional AI Companion application
 * Centralizes all TypeScript interfaces and types for better maintainability
 */

// ============================================================================
// CORE MESSAGING & CONVERSATION TYPES
// ============================================================================

export interface Message {
  id: string
  content: string
  timestamp: Date
  sender: 'user' | 'companion'
}

export interface MoodEntry {
  id: string
  level: number // 1-5 scale
  timestamp: Date
  note?: string
}

// ============================================================================
// PRESENCE & AVATAR SYSTEM
// ============================================================================

export interface Presence {
  id: 'nebula' | 'luma' | 'terra' | 'nova'
  name: string
  description: string
  personality: string
  colors: {
    circle1: string
    circle2: string
    glow: string
  }
}

// ============================================================================
// USER SYSTEM & ONBOARDING
// ============================================================================

export interface OnboardingData {
  completed: boolean
  selectedPresence?: 'nebula' | 'luma' | 'terra' | 'nova'
  userName?: string
  supportStyle?: string
  checkinFrequency?: string
}

export interface UserAccount {
  id: string
  userName: string
  email?: string
  avatarUrl?: string
  bio?: string
  language?: string
  createdAt: Date
}

export interface UserPreferences {
  voiceEnabled: boolean
  voiceSpeed: number
  voicePitch: number
  voiceVolume: number
  preferredVoice: string
  notificationsEnabled: boolean
  dailyCheckIns: boolean
  moodReminders: boolean
  conversationSummaries: boolean
  notificationTime: string
  
  // Social settings
  socialEnabled: boolean
  shareJourney: boolean
  allowConnections: boolean
  anonymousMode: boolean
}

// ============================================================================
// SOCIAL FEATURES
// ============================================================================

export interface CommunityPost {
  id: string
  authorId: string
  authorName: string
  content: string
  type: 'reflection' | 'milestone' | 'support' | 'gratitude'
  mood?: number
  timestamp: Date
  likes: string[] // user IDs who liked
  supportCount: number
  isAnonymous: boolean
  tags: string[]
}

export interface Connection {
  id: string
  userId: string
  connectedUserId: string
  userName: string
  connectionType: 'journey-buddy' | 'support-circle' | 'check-in-partner'
  status: 'pending' | 'active' | 'paused'
  sharedInterests: string[]
  connectedAt: Date
  lastInteraction: Date
}

export interface SupportCircle {
  id: string
  name: string
  description: string
  type: 'mood-support' | 'life-changes' | 'daily-check-ins' | 'mindfulness' | 'relationships'
  memberCount: number
  isPrivate: boolean
  memberIds: string[]
  recentActivity: Date
  tags: string[]
}

export interface JourneyMoment {
  id: string
  userId: string
  title: string
  content: string
  mood: number
  type: 'breakthrough' | 'gratitude' | 'challenge' | 'reflection' | 'milestone'
  isShared: boolean
  isAnonymous: boolean
  timestamp: Date
  tags: string[]
  reactions: { [userId: string]: 'heart' | 'support' | 'celebrate' }
}

// ============================================================================
// CHAT SYSTEM
// ============================================================================

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  receiverId: string
  content: string
  timestamp: Date
  messageType: 'text' | 'mood-share' | 'journey-moment' | 'system'
  metadata?: {
    mood?: number
    journeyMomentId?: string
    systemType?: 'connection-request' | 'connection-accepted' | 'circle-invite'
  }
}

export interface ChatConversation {
  id: string
  participantIds: string[]
  participantNames: string[]
  lastMessage?: ChatMessage
  lastActivity: Date
  unreadCount: number
  conversationType: 'direct' | 'group'
}

// ============================================================================
// UI & INTERACTION TYPES
// ============================================================================

export type OnboardingStep = 'welcome' | 'name' | 'presence' | 'support-style' | 'checkin' | 'complete'

export type SocialSection = 'community' | 'connections' | 'circles' | 'chat'

export type BackgroundOption = {
  id: string
  name: string
  url?: string
  gradient?: string
  preview?: string
}

// ============================================================================
// ANIMATION & STATE TYPES
// ============================================================================

export interface AnimationState {
  isAnimating: boolean
  animationType: 'pulse' | 'glow' | 'ripple' | 'breathe'
  intensity: number
}

export interface ConversationIntensity {
  level: number // 0-100
  trend: 'rising' | 'falling' | 'stable'
  factors: string[]
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type MoodLevel = 1 | 2 | 3 | 4 | 5
export type IntensityLevel = number // 0-100
export type TouchPosition = {
  x: number
  y: number
  timestamp: number
}