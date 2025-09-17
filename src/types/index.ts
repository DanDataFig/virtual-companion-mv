/**
 * Core type definitions for the WE Emotional AI Companion application
 * Centralizes all TypeScript interfaces and types for better maintainability
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export interface Message {
  id: string
  content: string
  timestamp: Date
  sender: 'user' | 'companion'
}

export interface MoodEntry {
  id: string
  level: number // 1-5 scale (1=sad, 5=happy)
  timestamp: Date
}

export interface ConversationIntensity {
  level: number // 0-100 scale
  timestamp: Date
}

// ============================================================================
// PRESENCE SYSTEM
// ============================================================================

export interface Presence {
  id: 'nebula' | 'luma' | 'terra' | 'nova'
  name: string
  description: string
  colors: {
    circle1: string
    circle2: string
    glow: string
  }
  personality: string
}

// ============================================================================
// USER SYSTEM
// ============================================================================

export interface OnboardingData {
  completed: boolean
  selectedPresence?: Presence['id']
  userName?: string
  supportStyle?: 'listen' | 'encourage' | 'ground'
  checkinFrequency?: 'daily' | 'reach-out' | 'surprise'
}

export interface UserAccount {
  id: string
  userName: string
  email?: string
  avatar?: string
  createdAt: Date
  profileCompleted: boolean
  bio?: string
  timezone?: string
  language?: string
}

export interface UserPreferences {
  // Voice settings
  voiceEnabled: boolean
  voiceVolume: number
  voiceSpeed: number
  voicePitch: number
  preferredVoice?: string
  
  // Theme settings
  theme: 'auto' | 'dark' | 'light'
  primaryColor: string
  animationSpeed: 'slow' | 'normal' | 'fast'
  reduceMotion: boolean
  
  // Notification settings
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
  isRead: boolean
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
  isArchived: boolean
  conversationType: 'direct' | 'group'
  conversationName?: string // For group chats
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export type OnboardingStep = 
  | 'welcome' 
  | 'introduction' 
  | 'presence-selection' 
  | 'questionnaire' 
  | 'account-creation' 
  | 'first-interaction'

export type SocialSection = 
  | 'community' 
  | 'connections' 
  | 'circles' 
  | 'journey' 
  | 'chat'

export type CameraFacing = 'front' | 'back'

export interface TouchPosition {
  x: number
  y: number
}

// ============================================================================
// ANIMATION & VISUAL TYPES
// ============================================================================

export interface BackgroundOption {
  id: string
  name: string
  preview: string
}

export interface CircleColors {
  circle1: string
  circle2: string
  glow: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type MoodLevel = 1 | 2 | 3 | 4 | 5
export type IntensityLevel = number // 0-100