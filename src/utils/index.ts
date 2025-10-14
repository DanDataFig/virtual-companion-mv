/**
 * Utility functions for the WE Emotional AI Companion application
 * Contains pure functions for data processing, formatting, and calculations
 */

import { MOOD_CONFIG, INTENSITY_KEYWORDS } from '@/constants'
import type { MoodLevel, IntensityLevel } from '@/types'

// ============================================================================
// MOOD UTILITIES
// ============================================================================

/**
 * Get emoji representation for mood level
 */
export const getMoodEmoji = (level: number): string => {
  const moodLevel = Math.max(1, Math.min(5, Math.round(level))) as MoodLevel
  return MOOD_CONFIG.EMOJIS[moodLevel]
}

/**
 * Get text label for mood level
 */
export const getMoodLabel = (level: number): string => {
  const moodLevel = Math.max(1, Math.min(5, Math.round(level))) as MoodLevel
  return MOOD_CONFIG.LABELS[moodLevel]
}

/**
 * Calculate average mood from recent entries
 */
export const calculateAverageMood = (moodEntries: Array<{ level: number }>, count = 3): number => {
  if (moodEntries.length === 0) return 3
  
  const recent = moodEntries.slice(0, count)
  const sum = recent.reduce((total, entry) => total + entry.level, 0)
  return Math.round(sum / recent.length)
}

// ============================================================================
// CONVERSATION INTENSITY ANALYSIS
// ============================================================================

/**
 * Analyze conversation intensity based on message content
 * Returns intensity level from 0-100
 */
export const analyzeConversationIntensity = (content: string): IntensityLevel => {
  const words = content.toLowerCase().split(/\s+/)
  let intensity = 20 // Base intensity
  
  // Length factor (longer messages = more intensity)
  intensity += Math.min(words.length * 0.5, 20)
  
  // Keyword analysis
  words.forEach(word => {
    if (INTENSITY_KEYWORDS.high.some(hw => word.includes(hw))) {
      intensity += 15
    } else if (INTENSITY_KEYWORDS.medium.some(mw => word.includes(mw))) {
      intensity += 8
    } else if (INTENSITY_KEYWORDS.low.some(lw => word.includes(lw))) {
      intensity += 3
    }
  })
  
  // Punctuation intensity
  const exclamationCount = (content.match(/!/g) || []).length
  const questionCount = (content.match(/\?/g) || []).length
  intensity += exclamationCount * 5 + questionCount * 3
  
  // Capital letters intensity
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
  if (capsRatio > 0.3) intensity += 20
  
  return Math.min(Math.max(intensity, 10), 100)
}

/**
 * Calculate animation speed based on intensity
 */
export const calculateAnimationSpeed = (intensity: IntensityLevel, baseSpeed = 3000): number => {
  const intensityMultiplier = Math.max(0.3, 1 - (intensity / 150))
  return baseSpeed * intensityMultiplier
}

/**
 * Calculate dynamic particle configuration based on conversation intensity
 * Returns configuration for particle count, speed, opacity, and size
 */
export const calculateParticleConfig = (intensity: IntensityLevel) => {
  const normalizedIntensity = intensity / 100
  
  const particleCount = {
    primary: Math.max(3, Math.floor(4 + normalizedIntensity * 8)),
    trail: Math.max(0, Math.floor(normalizedIntensity * 6))
  }
  
  const particleSpeed = {
    primary: Math.max(1.5, 3 - normalizedIntensity * 1.5),
    trail: Math.max(2, 3.5 - normalizedIntensity * 1.8)
  }
  
  const particleOpacity = {
    base: Math.max(0.5, 0.6 + normalizedIntensity * 0.4),
    peak: Math.min(1, 0.8 + normalizedIntensity * 0.2)
  }
  
  const particleSize = {
    primary: Math.max(6, 8 + normalizedIntensity * 4),
    trail: Math.max(3, 4 + normalizedIntensity * 2)
  }
  
  const glowIntensity = Math.max(8, 8 + normalizedIntensity * 12)
  
  const delayVariation = Math.max(0.2, 0.5 - normalizedIntensity * 0.3)
  
  return {
    particleCount,
    particleSpeed,
    particleOpacity,
    particleSize,
    glowIntensity,
    delayVariation,
    shouldShowCrossRing: intensity > 70,
    shouldShowTrails: intensity > 40,
    ringScaleFactor: 1 + (normalizedIntensity * 0.15),
    coreScaleFactor: 0.8 + (normalizedIntensity * 0.4)
  }
}

// ============================================================================
// TIME FORMATTING UTILITIES
// ============================================================================

/**
 * Format relative time (e.g., "2 hours ago", "Just now")
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInHours === 1) return '1 hour ago'
  if (diffInHours < 24) return `${diffInHours} hours ago`
  if (diffInDays === 1) return '1 day ago'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  
  return date.toLocaleDateString()
}

/**
 * Format time for display (e.g., "2:30 PM")
 */
export const formatDisplayTime = (date: Date): string => {
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  })
}

/**
 * Format date for display (e.g., "March 15, 2024")
 */
export const formatDisplayDate = (date: Date): string => {
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate username format
 */
export const isValidUsername = (username: string): boolean => {
  return username.length >= 2 && username.length <= 50 && /^[a-zA-Z0-9_\s]+$/.test(username)
}

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim()
}

/**
 * Validate mood level
 */
export const isValidMoodLevel = (level: number): level is MoodLevel => {
  return Number.isInteger(level) && level >= 1 && level <= 5
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Get circle colors based on presence and intensity
 */
export const getPresenceColors = (
  presence: { colors: { circle1: string; circle2: string; glow: string } },
  intensity: IntensityLevel,
  isLoading = false
) => {
  if (isLoading) {
    return {
      circle1: 'from-cyan-400 to-blue-500',
      circle2: 'from-purple-400 to-pink-500',
      glow: 'rgba(59, 130, 246, 0.4)'
    }
  }
  
  const intensityFactor = intensity / 100
  const baseGlow = presence.colors.glow
  const enhancedGlow = baseGlow.replace('0.4)', `${0.3 + intensityFactor * 0.4})`)
  
  return {
    circle1: presence.colors.circle1,
    circle2: presence.colors.circle2,
    glow: enhancedGlow
  }
}

/**
 * Get post type styling
 */
export const getPostTypeColor = (type: string): string => {
  switch (type) {
    case 'gratitude': return 'bg-red-500/20 text-red-200 border-red-400/30'
    case 'milestone': return 'bg-amber-500/20 text-amber-200 border-amber-400/30'
    case 'support': return 'bg-blue-500/20 text-blue-200 border-blue-400/30'
    case 'reflection': return 'bg-purple-500/20 text-purple-200 border-purple-400/30'
    default: return 'bg-gray-500/20 text-gray-200 border-gray-400/30'
  }
}

// ============================================================================
// TEXT PROCESSING UTILITIES
// ============================================================================

/**
 * Truncate text to specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Extract tags from text content
 */
export const extractTags = (content: string): string[] => {
  const words = content.toLowerCase().split(/\s+/)
  const tags: string[] = []
  
  // Extract hashtags
  const hashtags = content.match(/#\w+/g)
  if (hashtags) {
    tags.push(...hashtags.map(tag => tag.substring(1)))
  }
  
  // Extract emotion-related keywords
  const emotionKeywords = [
    'grateful', 'gratitude', 'thankful', 'blessed',
    'anxious', 'anxiety', 'worried', 'stressed',
    'happy', 'joy', 'excited', 'celebration',
    'breakthrough', 'milestone', 'achievement',
    'support', 'help', 'community', 'connection'
  ]
  
  emotionKeywords.forEach(keyword => {
    if (words.some(word => word.includes(keyword))) {
      tags.push(keyword)
    }
  })
  
  return [...new Set(tags)].slice(0, 5) // Remove duplicates and limit to 5
}

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * Generate unique ID with timestamp
 */
export const generateId = (prefix = ''): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`
}

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Merge objects deeply
 */
export const deepMerge = <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
  const result = { ...target }
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {} as any, source[key])
    } else {
      result[key] = source[key] as T[Extract<keyof T, string>]
    }
  }
  
  return result
}

// ============================================================================
// DEVICE UTILITIES
// ============================================================================

/**
 * Check if device is mobile
 */
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Check if device supports touch
 */
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Get viewport dimensions
 */
export const getViewportDimensions = () => {
  return {
    width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  }
}

// ============================================================================
// ACCESSIBILITY UTILITIES
// ============================================================================

/**
 * Generate accessible ID for form elements
 */
export const generateAccessibleId = (base: string): string => {
  return `${base}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Create aria-label for mood selection
 */
export const createMoodAriaLabel = (level: number): string => {
  const emoji = getMoodEmoji(level)
  const label = getMoodLabel(level)
  return `Select mood level ${level} out of 5: ${label} ${emoji}`
}

// ============================================================================
// DEBOUNCE UTILITY
// ============================================================================

/**
 * Debounce function to limit rapid function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}