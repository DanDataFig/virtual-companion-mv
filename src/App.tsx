/**
 * Main Application Component - WE Emotional AI Companion
 * 
 * This is the root component that orchestrates the entire application experience.
 * It manages global state, handles onboarding flow, and renders the main interface.
 * 
 * Architecture:
 * - Uses custom hooks for complex state management
 * - Follows React patterns for component composition
 * - Implements responsive design for mobile-first experience
 * - Manages real-time AI conversation with emotional awareness
 * 
 * @version 2.0.0
 * @author WE Team
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useKV } from '@github/spark/hooks'

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Icons
import { 
  PaperPlaneTilt, 
  VideoCamera, 
  Microphone, 
  MicrophoneSlash, 
  Smiley, 
  CameraRotate, 
  Image, 
  X, 
  SpeakerHigh, 
  SpeakerX, 
  CaretLeft, 
  CaretRight, 
  Swap, 
  House, 
  Gear, 
  User, 
  Users 
} from "@phosphor-icons/react"

// Type definitions
import type { 
  Message, 
  OnboardingData, 
  UserAccount,
  MoodEntry,
  Presence,
  OnboardingStep,
  SocialSection 
} from '@/types'

// Constants and utilities
import { 
  PRESENCES, 
  BACKGROUND_OPTIONS, 
  DEFAULT_USER_PREFERENCES,
  TIMING_CONFIG,
  ERROR_MESSAGES,
  MOOD_CONFIG 
} from '@/constants'
import { 
  getMoodEmoji, 
  formatRelativeTime,
  generateId,
  getPresenceColors,
  calculateAnimationSpeed,
  analyzeConversationIntensity
} from '@/utils'

// Custom hooks
import { 
  useConversationIntensity,
  useVoiceSynthesis,
  useCamera,
  useSwipeGesture,
  useChatPagination,
  useMoodTracking,
  useUserPreferences,
  useLoadingState
} from '@/hooks'

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

const App: React.FC = () => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Persistent state (using KV storage)
  const [messages, setMessages] = useKV<Message[]>("chat-messages", [])
  const [onboardingData, setOnboardingData] = useKV<OnboardingData>("onboarding-data", { completed: false })
  const [userAccount, setUserAccount] = useKV<UserAccount | null>("user-account", null)
  
  // Local component state
  const [inputMessage, setInputMessage] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [showMoodSelector, setShowMoodSelector] = useState(false)
  const [showPresenceSelector, setShowPresenceSelector] = useState(false)
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [showSocialHub, setShowSocialHub] = useState(false)
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome')
  const [socialSection, setSocialSection] = useState<SocialSection>('community')
  const [isListening, setIsListening] = useState(false)
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  // ============================================================================
  // CUSTOM HOOKS WITH SAFE DEFAULTS
  // ============================================================================
  
  const { intensity: conversationIntensity } = useConversationIntensity(messages || [])
  const { preferences, updatePreferences } = useUserPreferences()
  const { isSpeaking, speak: speakText, stop: stopSpeaking } = useVoiceSynthesis(preferences || DEFAULT_USER_PREFERENCES)
  const { isActive: isVideoActive, currentFacing, startCamera, stopCamera, switchCamera } = useCamera()
  const { moodEntries, registerMood, currentMood } = useMoodTracking()
  const { isLoading, startLoading, stopLoading } = useLoadingState()
  
  // Chat pagination
  const { 
    visibleMessages, 
    canScrollBack, 
    canScrollForward, 
    navigateBack: navigateChatBack, 
    navigateForward: navigateChatForward 
  } = useChatPagination(messages || [])
  
  // Swipe gestures for chat navigation
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeGesture(
    navigateChatForward, // Swipe left = newer messages
    navigateChatBack     // Swipe right = older messages
  )
  
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  /**
   * Get the currently active presence based on onboarding data
   */
  const getCurrentPresence = useCallback((): Presence => {
    const presenceId = onboardingData?.selectedPresence || 'nebula'
    return PRESENCES.find(p => p.id === presenceId) || PRESENCES[0]
  }, [onboardingData?.selectedPresence])
  
  /**
   * Calculate dynamic colors based on presence and conversation intensity
   */
  const circleColors = getPresenceColors(getCurrentPresence(), conversationIntensity, isLoading)
  
  /**
   * Calculate animation speed based on conversation intensity
   */
  const animationSpeed = calculateAnimationSpeed(conversationIntensity)
  
  // ============================================================================
  // INITIALIZATION & LIFECYCLE
  // ============================================================================
  
  /**
   * Initialize the application on mount
   */
  useEffect(() => {
    const initializeApp = async () => {
      // Simulate initial loading
      await new Promise(resolve => setTimeout(resolve, TIMING_CONFIG.INITIAL_LOADING_DURATION))
      
      if (!onboardingData?.completed) {
        setOnboardingStep('welcome')
      }
      
      setIsLoadingInitial(false)
    }
    
    initializeApp()
  }, [onboardingData?.completed])
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopCamera()
      stopSpeaking()
    }
  }, [stopCamera, stopSpeaking])
  
  // ============================================================================
  // CORE FUNCTIONALITY
  // ============================================================================
  
  /**
   * Send message to AI companion with context awareness
   */
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return
    
    const userMessage: Message = {
      id: generateId('msg'),
      content: inputMessage.trim(),
      timestamp: new Date(),
      sender: 'user'
    }
    
    setMessages(current => [...(current || []), userMessage])
    setInputMessage('')
    startLoading()
    
    try {
      // Build context-aware prompt
      const presence = getCurrentPresence()
      const recentMoodContext = moodEntries.length > 0 
        ? `User's recent mood: ${getMoodEmoji(moodEntries[0].level)} (${moodEntries[0].level}/5)`
        : 'No recent mood data'
      
      const conversationContext = (messages || []).slice(-4).map(msg => 
        `${msg.sender}: ${msg.content}`
      ).join('\n')
      
      const prompt = (window as any).spark.llmPrompt`You are ${presence.name}, a compassionate AI emotional companion. You are ${presence.personality.toLowerCase()} Respond empathetically and supportively to the user.

Context:
${recentMoodContext}

Recent conversation:
${conversationContext}

User: ${userMessage.content}

Respond naturally and warmly as ${presence.name}, showing you understand their emotional state. Keep responses concise but meaningful.`
      
      const response = await (window as any).spark.llm(prompt)
      
      const companionMessage: Message = {
        id: generateId('msg'),
        content: response,
        timestamp: new Date(),
        sender: 'companion'
      }
      
      setMessages(current => [...(current || []), companionMessage])
      
      // Speak response if voice is enabled
      if (preferences?.voiceEnabled) {
        speakText(response)
      }
      
    } catch (error) {
      console.error('Error getting AI response:', error)
      
      const errorMessage: Message = {
        id: generateId('msg'),
        content: ERROR_MESSAGES.AI_RESPONSE_FAILED,
        timestamp: new Date(),
        sender: 'companion'
      }
      
      setMessages(current => [...(current || []), errorMessage])
    } finally {
      stopLoading()
    }
  }, [
    inputMessage, 
    isLoading, 
    messages, 
    moodEntries, 
    preferences?.voiceEnabled,
    getCurrentPresence,
    setMessages,
    startLoading,
    stopLoading,
    speakText
  ])
  
  /**
   * Handle keyboard input (Enter to send)
   */
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])
  
  /**
   * Handle input change with real-time intensity analysis
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value)
  }, [])
  
  /**
   * Complete onboarding process
   */
  const completeOnboarding = useCallback(() => {
    const updatedOnboardingData: OnboardingData = {
      completed: true,
      selectedPresence: onboardingData?.selectedPresence || 'nebula',
      userName: onboardingData?.userName,
      supportStyle: onboardingData?.supportStyle,
      checkinFrequency: onboardingData?.checkinFrequency
    }
    
    setOnboardingData(updatedOnboardingData)
    
    // Send welcome message from presence
    const presence = getCurrentPresence()
    const displayName = userAccount?.userName || onboardingData?.userName
    const greeting = `Hi${displayName ? `, ${displayName}` : ''}! I'm ${presence.name}. ${presence.personality} Whenever you're ready, just say hello.`
    
    const welcomeMessage: Message = {
      id: generateId('msg'),
      content: greeting,
      timestamp: new Date(),
      sender: 'companion'
    }
    
    setMessages([welcomeMessage])
    setShowChat(true)
    
    if (preferences?.voiceEnabled) {
      setTimeout(() => speakText(greeting), TIMING_CONFIG.SPEECH_SYNTHESIS_DELAY)
    }
  }, [
    onboardingData,
    userAccount,
    preferences?.voiceEnabled,
    getCurrentPresence,
    setOnboardingData,
    setMessages,
    speakText
  ])
  
  /**
   * Reset application to initial state
   */
  const returnToStart = useCallback(() => {
    // Clear all data
    setOnboardingData({ completed: false })
    setUserAccount(null)
    setMessages([])
    
    // Reset UI state
    setShowChat(false)
    setShowMoodSelector(false)
    setShowPresenceSelector(false)
    setShowBackgroundSelector(false)
    setShowSettings(false)
    setShowAccountSettings(false)
    setShowSocialHub(false)
    setInputMessage('')
    setOnboardingStep('welcome')
    setIsLoadingInitial(true)
    
    // Stop active features
    stopCamera()
    stopSpeaking()
    setIsListening(false)
    
    // Show loading screen briefly
    setTimeout(() => {
      setIsLoadingInitial(false)
    }, TIMING_CONFIG.INITIAL_LOADING_DURATION)
  }, [
    setOnboardingData,
    setUserAccount,
    setMessages,
    stopCamera,
    stopSpeaking
  ])
  
  // ============================================================================
  // RENDER CONDITIONS
  // ============================================================================
  
  // Show initial loading screen
  if (isLoadingInitial) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          {/* WE Logo with breathing animation */}
          <div className="relative mb-8">
            <div className="text-6xl font-light text-white animate-breathe-glow">
              WE
            </div>
            <div className="absolute inset-0 text-6xl font-light text-white/20 animate-pulse-slow">
              WE
            </div>
          </div>
          
          {/* Loading infinity symbol */}
          <div className="relative">
            <div className="w-16 h-8 mx-auto">
              <div className="absolute inset-0 border-2 border-white/30 rounded-full animate-spin" 
                   style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }} />
              <div className="absolute inset-0 border-2 border-white/60 rounded-full animate-spin" 
                   style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)', animationDirection: 'reverse' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Show simplified onboarding if not completed (temporary)
  if (!onboardingData?.completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <Card className="p-8 bg-black/40 border-white/10 backdrop-blur-md max-w-md w-full">
          <div className="text-center space-y-6">
            <h1 className="text-2xl text-white font-light">Welcome to WE</h1>
            <p className="text-white/70">Your emotional AI companion is ready to meet you.</p>
            <Button 
              onClick={completeOnboarding}
              className="w-full bg-purple-600/90 hover:bg-purple-700 text-white"
            >
              Begin Journey
            </Button>
          </div>
        </Card>
      </div>
    )
  }
  
  // ============================================================================
  // MAIN INTERFACE RENDER
  // ============================================================================
  
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      
      {/* Video Background */}
      {isVideoActive && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
      )}
      
      <div className="flex-1 flex flex-col relative z-10">
        
        {/* Header Controls */}
        <div className="absolute top-4 left-4 z-30 flex space-x-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-black/40 hover:bg-black/60 active:bg-black/80 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all duration-300 touch-manipulation shadow-lg"
                title="Return to start"
              >
                <House size={18} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-black/90 border-white/20 backdrop-blur-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Return to Home?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/70 leading-relaxed">
                  This will reset your session and return you to the home screen. 
                  Your conversation history and mood entries will be cleared.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-gray-600/90 text-white hover:bg-gray-700 border-white/20">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={returnToStart}
                  className="bg-purple-600/90 hover:bg-purple-700 text-white"
                >
                  Return Home
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        {/* Main Avatar Area - Takes up most of the screen */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden px-4">
          
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-transparent to-slate-900/50" />
          
          {/* Infinity Ring Avatar - Responsive sizing */}
          <div className="relative flex items-center justify-center" style={{ width: '320px', height: '180px' }}>
            {/* Left Ring Tube */}
            <div 
              className={`absolute rounded-full animate-infinity-flow transition-all duration-500`}
              style={{
                width: '160px',
                height: '160px',
                left: '20px',
                top: '50%',
                transform: `translateY(-50%) scale(${1 + (conversationIntensity / 1000)})`,
                animationDuration: `${animationSpeed}ms`,
                background: `conic-gradient(from 0deg, 
                  ${circleColors.circle1.includes('purple') ? '#a855f7' : circleColors.circle1.includes('yellow') ? '#f59e0b' : circleColors.circle1.includes('emerald') ? '#10b981' : '#3b82f6'}20 0deg, 
                  transparent 30deg, 
                  ${circleColors.circle1.includes('purple') ? '#a855f7' : circleColors.circle1.includes('yellow') ? '#f59e0b' : circleColors.circle1.includes('emerald') ? '#10b981' : '#3b82f6'}40 90deg,
                  transparent 120deg,
                  ${circleColors.circle1.includes('purple') ? '#a855f7' : circleColors.circle1.includes('yellow') ? '#f59e0b' : circleColors.circle1.includes('emerald') ? '#10b981' : '#3b82f6'}20 180deg,
                  transparent 210deg,
                  ${circleColors.circle1.includes('purple') ? '#a855f7' : circleColors.circle1.includes('yellow') ? '#f59e0b' : circleColors.circle1.includes('emerald') ? '#10b981' : '#3b82f6'}40 270deg,
                  transparent 300deg)`,
                filter: `drop-shadow(0 0 25px ${circleColors.glow}) drop-shadow(inset 0 0 20px rgba(0,0,0,0.3))`,
                border: '2px solid rgba(255,255,255,0.1)',
                boxShadow: `
                  inset 0 0 20px rgba(255,255,255,0.1),
                  inset 0 0 40px rgba(0,0,0,0.2),
                  0 0 30px ${circleColors.glow}40,
                  0 0 60px ${circleColors.glow}20
                `
              }}
            >
              {/* Inner tube highlight */}
              <div 
                className="absolute inset-2 rounded-full"
                style={{
                  background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
                  filter: 'blur(1px)'
                }}
              />
              {/* Inner shadow for depth */}
              <div 
                className="absolute inset-4 rounded-full"
                style={{
                  background: `radial-gradient(circle at 70% 70%, rgba(0,0,0,0.4) 0%, transparent 70%)`,
                }}
              />
              
              {/* Flowing Particles - only during active conversation */}
              {(conversationIntensity > 20 || isLoading) && (
                <>
                  {/* Primary particles */}
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={`primary-${i}`}
                      className="absolute w-2 h-2 rounded-full animate-tube-particle-flow-left"
                      style={{
                        background: `radial-gradient(circle, ${circleColors.circle1.includes('purple') ? '#a855f7' : circleColors.circle1.includes('yellow') ? '#f59e0b' : circleColors.circle1.includes('emerald') ? '#10b981' : '#3b82f6'} 0%, transparent 70%)`,
                        filter: `drop-shadow(0 0 8px ${circleColors.glow})`,
                        animationDelay: `${i * 0.3}s`,
                        animationDuration: `${2 + (conversationIntensity / 50)}s`,
                        opacity: 0.8 + (conversationIntensity / 500)
                      }}
                    />
                  ))}
                  
                  {/* Secondary trail particles for enhanced effect */}
                  {conversationIntensity > 50 && [...Array(4)].map((_, i) => (
                    <div
                      key={`trail-${i}`}
                      className="absolute w-1 h-1 rounded-full animate-tube-particle-flow-left"
                      style={{
                        background: `radial-gradient(circle, ${circleColors.circle1.includes('purple') ? '#a855f7' : circleColors.circle1.includes('yellow') ? '#f59e0b' : circleColors.circle1.includes('emerald') ? '#10b981' : '#3b82f6'}80 0%, transparent 60%)`,
                        filter: `drop-shadow(0 0 4px ${circleColors.glow})`,
                        animationDelay: `${i * 0.45 + 0.15}s`,
                        animationDuration: `${2.5 + (conversationIntensity / 60)}s`,
                        opacity: 0.6
                      }}
                    />
                  ))}
                </>
              )}
            </div>
            
            {/* Right Ring Tube - overlapping */}
            <div 
              className={`absolute rounded-full animate-infinity-counter-flow transition-all duration-500`}
              style={{
                width: '160px',
                height: '160px',
                right: '20px',
                top: '50%',
                transform: `translateY(-50%) scale(${1 + (conversationIntensity / 1200)})`,
                background: `conic-gradient(from 180deg, 
                  ${circleColors.circle2.includes('pink') ? '#ec4899' : circleColors.circle2.includes('amber') ? '#f59e0b' : circleColors.circle2.includes('teal') ? '#14b8a6' : '#6366f1'}20 0deg, 
                  transparent 30deg, 
                  ${circleColors.circle2.includes('pink') ? '#ec4899' : circleColors.circle2.includes('amber') ? '#f59e0b' : circleColors.circle2.includes('teal') ? '#14b8a6' : '#6366f1'}40 90deg,
                  transparent 120deg,
                  ${circleColors.circle2.includes('pink') ? '#ec4899' : circleColors.circle2.includes('amber') ? '#f59e0b' : circleColors.circle2.includes('teal') ? '#14b8a6' : '#6366f1'}20 180deg,
                  transparent 210deg,
                  ${circleColors.circle2.includes('pink') ? '#ec4899' : circleColors.circle2.includes('amber') ? '#f59e0b' : circleColors.circle2.includes('teal') ? '#14b8a6' : '#6366f1'}40 270deg,
                  transparent 300deg)`,
                filter: `drop-shadow(0 0 20px ${circleColors.glow}) drop-shadow(inset 0 0 20px rgba(0,0,0,0.3))`,
                border: '2px solid rgba(255,255,255,0.1)',
                boxShadow: `
                  inset 0 0 20px rgba(255,255,255,0.1),
                  inset 0 0 40px rgba(0,0,0,0.2),
                  0 0 30px ${circleColors.glow}40,
                  0 0 60px ${circleColors.glow}20
                `
              }}
            >
              {/* Inner tube highlight */}
              <div 
                className="absolute inset-2 rounded-full"
                style={{
                  background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
                  filter: 'blur(1px)'
                }}
              />
              {/* Inner shadow for depth */}
              <div 
                className="absolute inset-4 rounded-full"
                style={{
                  background: `radial-gradient(circle at 70% 70%, rgba(0,0,0,0.4) 0%, transparent 70%)`,
                }}
              />
              
              {/* Flowing Particles - only during active conversation */}
              {(conversationIntensity > 20 || isLoading) && (
                <>
                  {/* Primary particles */}
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={`primary-${i}`}
                      className="absolute w-2 h-2 rounded-full animate-tube-particle-flow-right"
                      style={{
                        background: `radial-gradient(circle, ${circleColors.circle2.includes('pink') ? '#ec4899' : circleColors.circle2.includes('amber') ? '#f59e0b' : circleColors.circle2.includes('teal') ? '#14b8a6' : '#6366f1'} 0%, transparent 70%)`,
                        filter: `drop-shadow(0 0 8px ${circleColors.glow})`,
                        animationDelay: `${i * 0.4}s`,
                        animationDuration: `${2.5 + (conversationIntensity / 40)}s`,
                        opacity: 0.7 + (conversationIntensity / 400)
                      }}
                    />
                  ))}
                  
                  {/* Secondary trail particles for enhanced effect */}
                  {conversationIntensity > 50 && [...Array(4)].map((_, i) => (
                    <div
                      key={`trail-${i}`}
                      className="absolute w-1 h-1 rounded-full animate-tube-particle-flow-right"
                      style={{
                        background: `radial-gradient(circle, ${circleColors.circle2.includes('pink') ? '#ec4899' : circleColors.circle2.includes('amber') ? '#f59e0b' : circleColors.circle2.includes('teal') ? '#14b8a6' : '#6366f1'}80 0%, transparent 60%)`,
                        filter: `drop-shadow(0 0 4px ${circleColors.glow})`,
                        animationDelay: `${i * 0.5 + 0.2}s`,
                        animationDuration: `${3 + (conversationIntensity / 45)}s`,
                        opacity: 0.5
                      }}
                    />
                  ))}
                </>
              )}
            </div>
            
            {/* Center intersection core */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div 
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${circleColors.circle1} animate-ring-core-breathe transition-all duration-300`}
                style={{
                  filter: `drop-shadow(0 0 20px ${circleColors.glow})`,
                  transform: `scale(${0.8 + (conversationIntensity / 150)})`,
                  opacity: 0.8 + (conversationIntensity / 200)
                }}
              />
              
              {/* Cross-ring particle exchange during high intensity */}
              {conversationIntensity > 70 && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={`exchange-${i}`}
                      className="absolute w-1.5 h-1.5 rounded-full animate-cross-ring-exchange"
                      style={{
                        background: `radial-gradient(circle, #ffffff 0%, ${circleColors.glow} 50%, transparent 80%)`,
                        filter: `drop-shadow(0 0 6px ${circleColors.glow})`,
                        animationDelay: `${i * 0.6}s`,
                        animationDuration: '1.8s',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  ))}
                </>
              )}
            </div>
            
            {/* Activity indicator */}
            <div className="absolute -bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2">
              {isLoading ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-2 text-white/80">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-sm ml-2">Thinking...</span>
                  </div>
                  
                  {/* Loading particle burst */}
                  <div className="relative w-8 h-8">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={`loading-particle-${i}`}
                        className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-loading-burst"
                        style={{
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '2s',
                          filter: 'drop-shadow(0 0 4px #22d3ee)',
                          top: '50%',
                          left: '50%',
                          transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateX(0px)`
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-white/60">
                  <div className="text-sm">{getCurrentPresence().name}</div>
                  <div className="text-xs">
                    {conversationIntensity > 70 ? 'Deeply engaged' : 
                     conversationIntensity > 50 ? 'Actively listening' : 
                     'Tap to chat or speak'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Chat Messages Overlay - Lower 1/4 of screen */}
        {showChat && (messages || []).length > 0 && (
          <div className="absolute inset-x-2 sm:inset-x-4 bottom-28 sm:bottom-32 h-1/4 min-h-[160px]">
            <Card className="h-full bg-black/40 border-white/10 backdrop-blur-md relative">
              {/* Chat Navigation Header */}
              <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-2 bg-black/20 backdrop-blur-sm border-b border-white/10 rounded-t-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={navigateChatBack}
                  disabled={!canScrollBack}
                  className={`text-white/70 hover:text-white hover:bg-white/10 min-w-[36px] h-8 ${
                    !canScrollBack ? 'opacity-30' : ''
                  }`}
                >
                  <CaretLeft size={16} />
                </Button>
                
                <div className="text-center text-white/60 text-xs">
                  Recent messages
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={navigateChatForward}
                  disabled={!canScrollForward}
                  className={`text-white/70 hover:text-white hover:bg-white/10 min-w-[36px] h-8 ${
                    !canScrollForward ? 'opacity-30' : ''
                  }`}
                >
                  <CaretRight size={16} />
                </Button>
              </div>

              {/* Chat Messages with Swipe Support */}
              <div 
                className="h-full pt-10 pb-2"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <ScrollArea ref={scrollAreaRef} className="h-full p-2 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    {visibleMessages.map((message, index) => (
                      <div 
                        key={message.id} 
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in-${message.sender === 'user' ? 'right' : 'left'}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          message.sender === 'user' 
                            ? 'bg-white/20 text-white backdrop-blur-sm' 
                            : 'bg-purple-500/30 text-white backdrop-blur-sm'
                        }`}>
                          {message.content}
                          {message.sender === 'companion' && isSpeaking && index === visibleMessages.length - 1 && (
                            <div className="flex items-center mt-1 space-x-1">
                              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"></div>
                              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </Card>
          </div>
        )}
        
        {/* Mood Selector Overlay */}
        {showMoodSelector && (
          <div className="absolute inset-x-2 sm:inset-x-4 bottom-28 sm:bottom-32">
            <Card className="p-4 sm:p-4 bg-black/40 border-white/10 backdrop-blur-md">
              <h3 className="text-white text-sm font-medium mb-3 text-center">How are you feeling?</h3>
              <div className="flex justify-between gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <Button
                    key={level}
                    variant="ghost"
                    onClick={() => {
                      registerMood(level)
                      setShowMoodSelector(false)
                    }}
                    className="h-16 w-16 min-w-[60px] flex flex-col items-center justify-center hover:bg-white/10 rounded-xl touch-manipulation"
                  >
                    <span className="text-2xl sm:text-xl">{getMoodEmoji(level)}</span>
                    <span className="text-xs text-white/60">{level}</span>
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 pb-safe">
          
          {/* Call-style Controls */}
          <div className="flex justify-center items-center space-x-3 sm:space-x-4">
            {/* Voice Chat */}
            <Button
              size="lg"
              variant="ghost"
              onClick={() => setIsListening(!isListening)}
              className={`w-14 h-14 sm:w-16 sm:h-16 min-w-[56px] min-h-[56px] rounded-full text-white backdrop-blur-sm transition-colors touch-manipulation ${
                isListening 
                  ? 'bg-red-600/90 hover:bg-red-700 active:bg-red-800' 
                  : 'bg-blue-600/90 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isListening ? <MicrophoneSlash size={20} /> : <Microphone size={20} />}
            </Button>
            
            {/* Voice Response Toggle */}
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking()
                } else {
                  updatePreferences({ voiceEnabled: !preferences?.voiceEnabled })
                }
              }}
              className={`w-14 h-14 sm:w-16 sm:h-16 min-w-[56px] min-h-[56px] rounded-full text-white backdrop-blur-sm transition-colors touch-manipulation ${
                preferences?.voiceEnabled && !isSpeaking
                  ? 'bg-green-600/90 hover:bg-green-700 active:bg-green-800' 
                  : isSpeaking
                  ? 'bg-red-600/90 hover:bg-red-700 active:bg-red-800'
                  : 'bg-gray-600/90 hover:bg-gray-700 active:bg-gray-800'
              }`}
            >
              {isSpeaking ? <SpeakerX size={20} /> : <SpeakerHigh size={20} />}
            </Button>
            
            {/* Mood Check */}
            <Button
              size="lg"
              variant="ghost"
              onClick={() => setShowMoodSelector(!showMoodSelector)}
              className="w-14 h-14 sm:w-16 sm:h-16 min-w-[56px] min-h-[56px] rounded-full bg-purple-600/90 hover:bg-purple-700 active:bg-purple-800 text-white backdrop-blur-sm touch-manipulation"
            >
              <Smiley size={20} />
            </Button>
          </div>

          {/* Text Input */}
          <div className="flex space-x-2 sm:space-x-3">
            <Input
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={() => setShowChat(true)}
              placeholder="Type your message..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 backdrop-blur-sm rounded-full px-4 sm:px-6 py-3 min-h-[48px] text-base"
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isLoading}
              className={`bg-purple-600/90 hover:bg-purple-700 active:bg-purple-800 rounded-full px-4 sm:px-6 backdrop-blur-sm transition-all duration-300 min-w-[48px] min-h-[48px] touch-manipulation ${
                conversationIntensity > 60 ? 'animate-pulse shadow-lg shadow-purple-500/30' : ''
              }`}
            >
              <PaperPlaneTilt size={18} />
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="flex justify-center space-x-2 sm:space-x-4 flex-wrap gap-2">
            {/* Current Presence Indicator */}
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-200 border-orange-400/30 backdrop-blur-sm text-xs px-2 py-1">
              {getCurrentPresence().name}
            </Badge>
            
            {/* Current Mood Indicator */}
            {moodEntries.length > 0 && (
              <Badge variant="secondary" className="bg-white/10 text-white/80 border-white/20 backdrop-blur-sm text-xs px-2 py-1">
                Mood: {getMoodEmoji(moodEntries[0].level)} {moodEntries[0].level}/5
              </Badge>
            )}
            
            {/* Voice Status */}
            <Badge variant="secondary" className={`border-white/20 backdrop-blur-sm text-xs px-2 py-1 ${
              preferences?.voiceEnabled ? 'bg-green-500/20 text-green-200' : 'bg-gray-500/20 text-gray-200'
            }`}>
              Voice: {preferences?.voiceEnabled ? 'On' : 'Off'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App