/**
 * Core type definitions for the WE Emotional AI Companion application
 * Centralizes all TypeScript interfaces and types for better maintainability
 */

  id: string
  timestamp: 
}

  level: number // 1-5 sca
  id: string
  content: string
  timestamp: Date
  sender: 'user' | 'companion'
/

  id: 'nebula' | 'luma' | 't
  descriptio
    circle1: string
    glow: string
 

// USER SYSTEM

  completed: bool
 


  id: string
  email?: string

  bio?: string
  language?: string

  description: string
  colors: {
    circle1: string
    circle2: string
    glow: string
  }
  
 

  notificationTime: string
  // Social se
  shareJourney: boolean


// SOCIAL FEATURES

  id: string
  authorName: string
  type: 'reflection' | 'milestone' | 'support' | 'grati
 

  tags: string[]

  id: string
  connectedUserI
  connectionType:
  sharedInterests
  lastInteraction: Date

  id: string
  description: stri
 

  tags: string[]

  id: string
  title: string
  mood: number
  isShared: boolean
  timestamp: Date
  

// CHAT SYSTEM

  id: string
  senderName: string
  
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

  messageType: 'text' | 'mood-share' | 'journey-moment' | 'system'

    mood?: number
    journeyMomentId?: string
    systemType?: 'connection-request' | 'connection-accepted' | 'circle-invite'

}

export interface ChatConversation {

  participantIds: string[]
  participantNames: string[]
  lastMessage?: ChatMessage

  unreadCount: number

  conversationType: 'direct' | 'group'


















































