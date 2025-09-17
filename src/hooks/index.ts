/**
 * Custom React hooks for the WE Emotional AI Companion application
 * Encapsulates complex state logic and provides reusable functionality
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { 
  analyzeConversationIntensity, 
  debounce, 
  isTouchDevice,
  generateId 
} from '@/utils'
import { CHAT_CONFIG, TIMING_CONFIG, DEFAULT_USER_PREFERENCES } from '@/constants'
import type { 
  Message, 
  MoodEntry, 
  UserAccount, 
  UserPreferences, 
  TouchPosition,
  IntensityLevel 
} from '@/types'

// ============================================================================
// CONVERSATION INTENSITY HOOK
// ============================================================================

/**
 * Manages conversation intensity based on message content and timing
 */
export const useConversationIntensity = (messages: Message[]) => {
  const [intensity, setIntensity] = useState<IntensityLevel>(30)
  
  useEffect(() => {
    if (messages.length === 0) return
    
    const latestMessage = messages[messages.length - 1]
    const newIntensity = analyzeConversationIntensity(latestMessage.content)
    setIntensity(newIntensity)
    
    // Gradually reduce intensity over time
    const timer = setTimeout(() => {
      setIntensity(prev => Math.max(prev * TIMING_CONFIG.INTENSITY_DECAY_FACTOR, 30))
    }, TIMING_CONFIG.INTENSITY_DECAY_DELAY)
    
    return () => clearTimeout(timer)
  }, [messages])
  
  const setManualIntensity = useCallback((newIntensity: IntensityLevel) => {
    setIntensity(Math.max(10, Math.min(100, newIntensity)))
  }, [])
  
  return {
    intensity,
    setIntensity: setManualIntensity
  }
}

// ============================================================================
// VOICE SYNTHESIS HOOK
// ============================================================================

/**
 * Manages text-to-speech functionality with user preferences
 */
export const useVoiceSynthesis = (preferences: UserPreferences) => {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  
  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      setAvailableVoices(voices.filter(voice => voice.lang.startsWith('en')))
    }
    
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
    }
  }, [])
  
  const speak = useCallback((text: string) => {
    if (!preferences.voiceEnabled || !text.trim()) return
    
    // Stop any current speech
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    
    // Configure voice settings
    utterance.rate = preferences.voiceSpeed / 100
    utterance.pitch = preferences.voicePitch / 100
    utterance.volume = preferences.voiceVolume / 100
    
    // Set preferred voice
    if (preferences.preferredVoice) {
      const preferredVoice = availableVoices.find(
        voice => voice.name === preferences.preferredVoice
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }
    } else {
      // Try to find a suitable female voice
      const femaleVoice = availableVoices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('hazel')
      )
      if (femaleVoice) {
        utterance.voice = femaleVoice
      }
    }
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    window.speechSynthesis.speak(utterance)
  }, [preferences, availableVoices])
  
  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])
  
  return {
    isSpeaking,
    availableVoices,
    speak,
    stop
  }
}

// ============================================================================
// CAMERA MANAGEMENT HOOK
// ============================================================================

/**
 * Manages camera access and video streaming
 */
export const useCamera = () => {
  const [isActive, setIsActive] = useState(false)
  const [currentFacing, setCurrentFacing] = useState<'front' | 'back'>('front')
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const constraints = {
        video: {
          facingMode: currentFacing === 'front' ? 'user' : 'environment'
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      setIsActive(true)
    } catch (err) {
      setError('Failed to access camera. Please check permissions.')
      console.error('Camera access error:', err)
    }
  }, [currentFacing])
  
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsActive(false)
    setError(null)
  }, [])
  
  const switchCamera = useCallback(async () => {
    const newFacing = currentFacing === 'front' ? 'back' : 'front'
    setCurrentFacing(newFacing)
    
    if (isActive) {
      stopCamera()
      // Small delay to ensure cleanup
      setTimeout(() => {
        setCurrentFacing(newFacing)
        startCamera()
      }, 100)
    }
  }, [currentFacing, isActive, stopCamera, startCamera])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])
  
  return {
    isActive,
    currentFacing,
    error,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera
  }
}

// ============================================================================
// SWIPE GESTURE HOOK
// ============================================================================

/**
 * Handles swipe gestures for touch devices
 */
export const useSwipeGesture = (onSwipeLeft?: () => void, onSwipeRight?: () => void) => {
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null)
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null)
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      timestamp: Date.now()
    })
  }, [])
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      timestamp: Date.now()
    })
  }, [])
  
  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return
    
    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY)
    
    if (isHorizontalSwipe && Math.abs(distanceX) > CHAT_CONFIG.SWIPE_THRESHOLD) {
      if (distanceX > 0 && onSwipeLeft) {
        onSwipeLeft()
      } else if (distanceX < 0 && onSwipeRight) {
        onSwipeRight()
      }
    }
  }, [touchStart, touchEnd, onSwipeLeft, onSwipeRight])
  
  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}

// ============================================================================
// CHAT PAGINATION HOOK
// ============================================================================

/**
 * Manages chat message pagination and navigation
 */
export const useChatPagination = (messages: Message[]) => {
  const [scrollOffset, setScrollOffset] = useState(0)
  
  // Reset to latest messages when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setScrollOffset(0)
    }
  }, [messages.length])
  
  const visibleMessages = useCallback(() => {
    const totalMessages = messages.length
    const startIndex = Math.max(0, totalMessages - CHAT_CONFIG.MESSAGES_PER_PAGE - scrollOffset)
    const endIndex = Math.max(CHAT_CONFIG.MESSAGES_PER_PAGE, totalMessages - scrollOffset)
    return messages.slice(startIndex, endIndex)
  }, [messages, scrollOffset])
  
  const canScrollBack = scrollOffset < messages.length - CHAT_CONFIG.MESSAGES_PER_PAGE
  const canScrollForward = scrollOffset > 0
  
  const navigateBack = useCallback(() => {
    if (canScrollBack) {
      setScrollOffset(prev => 
        Math.min(prev + CHAT_CONFIG.MESSAGES_PER_PAGE, messages.length - CHAT_CONFIG.MESSAGES_PER_PAGE)
      )
    }
  }, [canScrollBack, messages.length])
  
  const navigateForward = useCallback(() => {
    if (canScrollForward) {
      setScrollOffset(prev => Math.max(prev - CHAT_CONFIG.MESSAGES_PER_PAGE, 0))
    }
  }, [canScrollForward])
  
  return {
    scrollOffset,
    visibleMessages: visibleMessages(),
    canScrollBack,
    canScrollForward,
    navigateBack,
    navigateForward
  }
}

// ============================================================================
// MOOD TRACKING HOOK
// ============================================================================

/**
 * Manages mood entries and calculations
 */
export const useMoodTracking = () => {
  const [moodEntries, setMoodEntries] = useKV<MoodEntry[]>("mood-entries", [])
  
  const registerMood = useCallback((level: number) => {
    const newEntry: MoodEntry = {
      id: generateId('mood'),
      level: Math.max(1, Math.min(5, Math.round(level))),
      timestamp: new Date()
    }
    setMoodEntries(current => [newEntry, ...(current || []).slice(0, 49)]) // Keep last 50 entries
  }, [setMoodEntries])
  
  const getAverageMood = useCallback((days = 7) => {
    if (!moodEntries || moodEntries.length === 0) return 3
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    const recentEntries = moodEntries.filter(entry => 
      new Date(entry.timestamp) >= cutoffDate
    )
    
    if (recentEntries.length === 0) return 3
    
    const sum = recentEntries.reduce((total, entry) => total + entry.level, 0)
    return Math.round(sum / recentEntries.length)
  }, [moodEntries])
  
  const getMoodTrend = useCallback(() => {
    if (!moodEntries || moodEntries.length < 2) return 'stable'
    
    const recent = moodEntries.slice(0, 3)
    const older = moodEntries.slice(3, 6)
    
    if (recent.length === 0 || older.length === 0) return 'stable'
    
    const recentAvg = recent.reduce((sum, entry) => sum + entry.level, 0) / recent.length
    const olderAvg = older.reduce((sum, entry) => sum + entry.level, 0) / older.length
    
    const diff = recentAvg - olderAvg
    
    if (diff > 0.5) return 'improving'
    if (diff < -0.5) return 'declining'
    return 'stable'
  }, [moodEntries])
  
  return {
    moodEntries: moodEntries || [],
    registerMood,
    currentMood: moodEntries?.[0]?.level ?? 3,
    averageMood: getAverageMood(),
    moodTrend: getMoodTrend()
  }
}

// ============================================================================
// USER PREFERENCES HOOK
// ============================================================================

/**
 * Manages user preferences with validation
 */
export const useUserPreferences = () => {
  const [preferences, setPreferences] = useKV<UserPreferences>(
    "user-preferences", 
    DEFAULT_USER_PREFERENCES
  )
  
  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...(prev || DEFAULT_USER_PREFERENCES),
      [key]: value
    }))
  }, [setPreferences])
  
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({
      ...(prev || DEFAULT_USER_PREFERENCES),
      ...updates
    }))
  }, [setPreferences])
  
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_USER_PREFERENCES)
  }, [setPreferences])
  
  return {
    preferences,
    updatePreference,
    updatePreferences,
    resetPreferences
  }
}

// ============================================================================
// LOADING STATE HOOK
// ============================================================================

/**
 * Manages loading states with automatic timeout
 */
export const useLoadingState = (timeoutMs = TIMING_CONFIG.AI_RESPONSE_TIMEOUT) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const startLoading = useCallback(() => {
    setIsLoading(true)
    setError(null)
    
    // Set timeout for loading state
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false)
      setError('Request timed out. Please try again.')
    }, timeoutMs)
  }, [timeoutMs])
  
  const stopLoading = useCallback((errorMessage?: string) => {
    setIsLoading(false)
    if (errorMessage) {
      setError(errorMessage)
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    clearError: () => setError(null)
  }
}

// ============================================================================
// DEBOUNCED INPUT HOOK
// ============================================================================

/**
 * Provides debounced input handling
 */
export const useDebouncedInput = (
  initialValue = '',
  delay = TIMING_CONFIG.DEBOUNCE_INPUT
) => {
  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)
  
  const debouncedSetValue = useCallback(
    debounce((newValue: string) => {
      setDebouncedValue(newValue)
    }, delay),
    [delay]
  )
  
  const handleChange = useCallback((newValue: string) => {
    setValue(newValue)
    debouncedSetValue(newValue)
  }, [debouncedSetValue])
  
  const reset = useCallback(() => {
    setValue(initialValue)
    setDebouncedValue(initialValue)
  }, [initialValue])
  
  return {
    value,
    debouncedValue,
    setValue: handleChange,
    reset
  }
}

// ============================================================================
// LOCAL STORAGE HOOK (Fallback)
// ============================================================================

/**
 * Provides localStorage functionality with error handling
 */
export const useLocalStorage = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  })
  
  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue
      setValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error saving to localStorage:`, error)
    }
  }, [key, value])
  
  return [value, setStoredValue] as const
}