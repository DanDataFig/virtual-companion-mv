/**
 * Application constants and configuration
 * Centralizes all static values, configurations, and default settings
 */

import type { Presence, BackgroundOption, UserPreferences } from '@/types'

// ============================================================================
// CHAT CONFIGURATION
// ============================================================================

export const CHAT_CONFIG = {
  MESSAGES_PER_PAGE: 6,
  SWIPE_THRESHOLD: 50, // Minimum distance in pixels for swipe detection
  DEBOUNCE_DELAY: 300,
  MAX_MESSAGE_LENGTH: 2000,
} as const

// ============================================================================
// ANIMATION CONFIGURATION
// ============================================================================

export const ANIMATION_CONFIG = {
  BASE_ANIMATION_SPEED: 3000,
  INTENSITY_MULTIPLIER_MIN: 0.3,
  INTENSITY_MULTIPLIER_MAX: 1.5,
  PULSE_DELAY_OFFSET: 500,
  TRANSITION_DURATION: 300,
} as const

// ============================================================================
// PRESENCE DEFINITIONS
// ============================================================================

export const PRESENCES: Presence[] = [
  {
    id: 'nebula',
    name: 'Nebula',
    description: 'Mystical and dreamy, for exploration and wonder',
    colors: {
      circle1: 'from-purple-400 to-violet-500',
      circle2: 'from-pink-400 to-purple-400',
      glow: 'rgba(168, 85, 247, 0.4)'
    },
    personality: 'I am Nebula, a gentle cosmic presence. I love to explore the mysteries of your inner world and help you discover new perspectives through wonder and imagination.'
  },
  {
    id: 'luma',
    name: 'Luma',
    description: 'Bright and uplifting, for encouragement and joy',
    colors: {
      circle1: 'from-yellow-400 to-orange-500',
      circle2: 'from-amber-400 to-yellow-400',
      glow: 'rgba(251, 191, 36, 0.4)'
    },
    personality: 'I am Luma, your radiant companion. I bring warmth and light to your journey, celebrating your victories and illuminating the path forward with optimism and encouragement.'
  },
  {
    id: 'terra',
    name: 'Terra',
    description: 'Grounding and nurturing, for stability and growth',
    colors: {
      circle1: 'from-emerald-400 to-green-500',
      circle2: 'from-teal-400 to-emerald-400',
      glow: 'rgba(16, 185, 129, 0.4)'
    },
    personality: 'I am Terra, your grounding presence. I help you find balance and stability, nurturing your growth with patience and wisdom drawn from the natural rhythms of life.'
  },
  {
    id: 'nova',
    name: 'Nova',
    description: 'Dynamic and transformative, for breakthroughs and change',
    colors: {
      circle1: 'from-cyan-400 to-blue-500',
      circle2: 'from-indigo-400 to-cyan-400',
      glow: 'rgba(59, 130, 246, 0.4)'
    },
    personality: 'I am Nova, your catalyst for transformation. I help you embrace change and breakthrough moments, guiding you through transitions with courage and clarity.'
  }
] as const

// ============================================================================
// BACKGROUND OPTIONS
// ============================================================================

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { id: 'none', name: 'None', preview: 'transparent' },
  { id: 'forest', name: 'Forest', preview: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' },
  { id: 'ocean', name: 'Ocean', preview: 'linear-gradient(135deg, #667db6 0%, #0082c8 100%)' },
  { id: 'sunset', name: 'Sunset', preview: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { id: 'space', name: 'Space', preview: 'linear-gradient(135deg, #2c3e50 0%, #000428 100%)' },
  { id: 'aurora', name: 'Aurora', preview: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)' }
] as const

// ============================================================================
// DEFAULT USER PREFERENCES
// ============================================================================

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  // Voice settings defaults
  voiceEnabled: true,
  voiceVolume: 80,
  voiceSpeed: 90,
  voicePitch: 110,
  preferredVoice: undefined,
  
  // Theme settings defaults
  theme: 'auto',
  primaryColor: 'purple',
  animationSpeed: 'normal',
  reduceMotion: false,
  
  // Notification settings defaults
  notificationsEnabled: true,
  dailyCheckIns: true,
  moodReminders: true,
  conversationSummaries: false,
  notificationTime: '09:00',
  
  // Social settings defaults
  socialEnabled: true,
  shareJourney: false,
  allowConnections: true,
  anonymousMode: false
} as const

// ============================================================================
// MOOD CONFIGURATION
// ============================================================================

export const MOOD_CONFIG = {
  SCALE_MIN: 1,
  SCALE_MAX: 5,
  EMOJIS: {
    1: '😢',
    2: '😞', 
    3: '😐',
    4: '🙂',
    5: '😊'
  },
  LABELS: {
    1: 'Very Sad',
    2: 'Sad',
    3: 'Neutral',
    4: 'Happy', 
    5: 'Very Happy'
  }
} as const

// ============================================================================
// INTENSITY ANALYSIS KEYWORDS
// ============================================================================

export const INTENSITY_KEYWORDS = {
  high: [
    'amazing', 'incredible', 'wonderful', 'fantastic', 'terrible', 'awful', 
    'devastating', 'overwhelming', 'excited', 'angry', 'furious', 'ecstatic', 
    'devastated', 'brilliant', 'horrible', 'love', 'hate', 'panic', 'crisis', 
    'emergency', '!!!', '!!'
  ],
  medium: [
    'good', 'bad', 'happy', 'sad', 'worried', 'concerned', 'pleased', 'upset', 
    'frustrated', 'glad', 'sorry', 'proud', 'disappointed', 'nervous', 
    'confident', 'stressed', 'relaxed', '!'
  ],
  low: [
    'okay', 'fine', 'alright', 'maybe', 'perhaps', 'possibly', 'somewhat', 
    'slightly', 'kind of', 'sort of'
  ]
} as const

// ============================================================================
// SOCIAL FEATURES CONFIGURATION
// ============================================================================

export const SOCIAL_CONFIG = {
  MAX_POST_LENGTH: 1000,
  MAX_COMMENT_LENGTH: 500,
  MAX_CONNECTIONS: 100,
  MAX_CIRCLES_JOINED: 20,
  POST_TYPES: [
    'reflection',
    'milestone', 
    'support',
    'gratitude'
  ] as const,
  CONNECTION_TYPES: [
    'journey-buddy',
    'support-circle', 
    'check-in-partner'
  ] as const
} as const

// ============================================================================
// UI DIMENSIONS & BREAKPOINTS
// ============================================================================

export const UI_CONFIG = {
  MIN_TOUCH_TARGET: 44, // Minimum touch target size in pixels
  SAFE_AREA_PADDING: 16,
  CHAT_HEIGHT_RATIO: 0.25, // Chat occupies 1/4 of screen
  AVATAR_AREA_RATIO: 0.75, // Avatar area occupies 3/4 of screen
  MOBILE_BREAKPOINT: 640,
  TABLET_BREAKPOINT: 768,
  DESKTOP_BREAKPOINT: 1024
} as const

// ============================================================================
// LOADING & TIMEOUT CONFIGURATION  
// ============================================================================

export const TIMING_CONFIG = {
  INITIAL_LOADING_DURATION: 2000,
  AI_RESPONSE_TIMEOUT: 30000,
  DEBOUNCE_INPUT: 300,
  ANIMATION_DELAY_INCREMENT: 50,
  SPEECH_SYNTHESIS_DELAY: 500,
  INTENSITY_DECAY_DELAY: 3000,
  INTENSITY_DECAY_FACTOR: 0.8
} as const

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  AI_RESPONSE_FAILED: "I'm sorry, I'm having trouble responding right now. Please try again.",
  VOICE_SYNTHESIS_FAILED: "Unable to speak response. Voice feature may not be available.",
  CAMERA_ACCESS_DENIED: "Camera access denied. Please enable camera permissions in your browser.",
  MICROPHONE_ACCESS_DENIED: "Microphone access denied. Please enable microphone permissions.",
  NETWORK_ERROR: "Network connection error. Please check your internet connection.",
  STORAGE_ERROR: "Unable to save data. Please check your browser storage settings."
} as const

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  MOOD_REGISTERED: "Mood registered successfully",
  ACCOUNT_CREATED: "Account created successfully",
  SETTINGS_SAVED: "Settings saved successfully",
  POST_SHARED: "Post shared with community",
  CONNECTION_ADDED: "New connection added",
  CIRCLE_JOINED: "Successfully joined support circle"
} as const