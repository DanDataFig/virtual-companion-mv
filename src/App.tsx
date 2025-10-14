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
  calculateParticleConfig,
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
  const [isTransitioningPresence, setIsTransitioningPresence] = useState(false)
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
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
  
  // ============================================================================
  // CUSTOM HOOKS WITH SAFE DEFAULTS
  // ============================================================================
  
  const { intensity: conversationIntensity } = useConversationIntensity(messages || [])
  const { preferences, updatePreferences } = useUserPreferences()
  const currentPresence = getCurrentPresence()
  const { isSpeaking, speak: speakText, stop: stopSpeaking } = useVoiceSynthesis(preferences || DEFAULT_USER_PREFERENCES, currentPresence)
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
  // COMPUTED VALUES (CONTINUED)
  // ============================================================================
  
  /**
   * Calculate dynamic colors based on presence and conversation intensity
   */
  const circleColors = getPresenceColors(getCurrentPresence(), conversationIntensity, isLoading)
  
  /**
   * Calculate animation speed based on conversation intensity
   */
  const animationSpeed = calculateAnimationSpeed(conversationIntensity)
  
  /**
   * Calculate dynamic particle configuration based on conversation intensity
   */
  const particleConfig = calculateParticleConfig(conversationIntensity)
  
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
   * Update color scheme when presence changes
   */
  useEffect(() => {
    const presenceId = onboardingData?.selectedPresence || 'nebula'
    document.documentElement.setAttribute('data-presence', presenceId)
  }, [onboardingData?.selectedPresence])
  
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
  
  /**
   * Change presence with smooth transition
   */
  const changePresence = useCallback(async (newPresenceId: 'nebula' | 'luma' | 'terra' | 'nova') => {
    if (newPresenceId === onboardingData?.selectedPresence) {
      setShowPresenceSelector(false)
      return
    }
    
    setIsTransitioningPresence(true)
    stopSpeaking()
    
    // Update presence in onboarding data
    setOnboardingData(prev => ({
      ...prev,
      completed: true,
      selectedPresence: newPresenceId
    }))
    
    // Get the new presence
    const newPresence = PRESENCES.find(p => p.id === newPresenceId)
    if (!newPresence) return
    
    // Wait for transition animation
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Send introduction message from new presence
    const displayName = userAccount?.userName || onboardingData?.userName
    const introMessage = `Hi${displayName ? `, ${displayName}` : ''}! I'm ${newPresence.name}. ${newPresence.personality} I'm here for you now.`
    
    const presenceMessage: Message = {
      id: generateId('msg'),
      content: introMessage,
      timestamp: new Date(),
      sender: 'companion'
    }
    
    setMessages(current => [...(current || []), presenceMessage])
    
    // Speak introduction if voice is enabled
    if (preferences?.voiceEnabled) {
      setTimeout(() => speakText(introMessage), TIMING_CONFIG.SPEECH_SYNTHESIS_DELAY)
    }
    
    setIsTransitioningPresence(false)
    setShowPresenceSelector(false)
  }, [
    onboardingData,
    userAccount,
    preferences?.voiceEnabled,
    setOnboardingData,
    setMessages,
    speakText,
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
  
  // Show onboarding flow if not completed
  if (!onboardingData?.completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <Card className="p-8 bg-black/40 border-white/10 backdrop-blur-md max-w-md w-full">
          
          {/* Welcome Step */}
          {onboardingStep === 'welcome' && (
            <div className="text-center space-y-6 animate-fade-in-up">
              <div className="text-6xl font-light text-white mb-4 animate-breathe-glow">WE</div>
              <h1 className="text-2xl text-white font-light">Welcome</h1>
              <p className="text-white/70 leading-relaxed">
                We're here to support your emotional wellbeing through compassionate AI companionship and community connection.
              </p>
              <p className="text-white/60 text-sm">
                Let's get to know you in a few quick steps.
              </p>
              <Button 
                onClick={() => setOnboardingStep('name')}
                className="w-full bg-purple-600/90 hover:bg-purple-700 text-white"
              >
                Get Started
              </Button>
            </div>
          )}
          
          {/* Name Step */}
          {onboardingStep === 'name' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="text-center">
                <h2 className="text-xl text-white font-light mb-2">What should we call you?</h2>
                <p className="text-white/60 text-sm">You can use your real name or a nickname</p>
              </div>
              <Input
                placeholder="Your name (optional)"
                value={onboardingData?.userName || ''}
                onChange={(e) => setOnboardingData((prev) => ({ completed: false, ...prev, userName: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-base"
              />
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setOnboardingStep('welcome')}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Back
                </Button>
                <Button 
                  onClick={() => setOnboardingStep('presence')}
                  className="flex-1 bg-purple-600/90 hover:bg-purple-700 text-white"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}
          
          {/* Presence Selection Step */}
          {onboardingStep === 'presence' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="text-center">
                <h2 className="text-xl text-white font-light mb-2">Choose Your Companion</h2>
                <p className="text-white/60 text-sm">Each presence has a unique personality and approach</p>
              </div>
              <div className="space-y-3">
                {PRESENCES.map((presence) => (
                  <button
                    key={presence.id}
                    onClick={() => setOnboardingData((prev) => ({ completed: false, ...prev, selectedPresence: presence.id }))}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      onboardingData?.selectedPresence === presence.id
                        ? 'border-purple-400 bg-purple-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-white font-medium mb-1">{presence.name}</div>
                        <div className="text-white/70 text-sm mb-2">{presence.personality.split('.')[0]}.</div>
                        <div className="text-white/50 text-xs">{presence.description}</div>
                      </div>
                      <div 
                        className={`w-12 h-12 rounded-full ml-3 bg-gradient-to-br ${presence.colors.circle1}`}
                        style={{
                          boxShadow: `0 0 20px ${presence.colors.glow}`
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setOnboardingStep('name')}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Back
                </Button>
                <Button 
                  onClick={() => setOnboardingStep('support-style')}
                  disabled={!onboardingData?.selectedPresence}
                  className="flex-1 bg-purple-600/90 hover:bg-purple-700 text-white disabled:opacity-50"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}
          
          {/* Support Style Step */}
          {onboardingStep === 'support-style' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="text-center">
                <h2 className="text-xl text-white font-light mb-2">How can we best support you?</h2>
                <p className="text-white/60 text-sm">Choose the approach that resonates most</p>
              </div>
              <div className="space-y-3">
                {[
                  { id: 'listening', label: 'Active Listening', desc: 'I need someone to hear me without judgment' },
                  { id: 'advice', label: 'Guidance & Advice', desc: 'I want suggestions and actionable steps' },
                  { id: 'motivation', label: 'Motivation & Encouragement', desc: 'I need positive reinforcement and energy' },
                  { id: 'reflection', label: 'Reflective Exploration', desc: 'Help me understand my feelings deeper' }
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setOnboardingData((prev) => ({ completed: false, ...prev, supportStyle: style.id }))}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      onboardingData?.supportStyle === style.id
                        ? 'border-purple-400 bg-purple-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-white font-medium mb-1">{style.label}</div>
                    <div className="text-white/60 text-sm">{style.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setOnboardingStep('presence')}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Back
                </Button>
                <Button 
                  onClick={() => setOnboardingStep('checkin')}
                  disabled={!onboardingData?.supportStyle}
                  className="flex-1 bg-purple-600/90 hover:bg-purple-700 text-white disabled:opacity-50"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}
          
          {/* Check-in Frequency Step */}
          {onboardingStep === 'checkin' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="text-center">
                <h2 className="text-xl text-white font-light mb-2">How often should we check in?</h2>
                <p className="text-white/60 text-sm">We can remind you to share how you're feeling</p>
              </div>
              <div className="space-y-3">
                {[
                  { id: 'multiple', label: 'Multiple times daily', desc: 'Morning, afternoon, and evening' },
                  { id: 'daily', label: 'Once a day', desc: 'A daily moment of reflection' },
                  { id: 'few-times', label: 'A few times a week', desc: 'Regular but not overwhelming' },
                  { id: 'manual', label: "I'll reach out when ready", desc: 'No scheduled reminders' }
                ].map((freq) => (
                  <button
                    key={freq.id}
                    onClick={() => setOnboardingData((prev) => ({ completed: false, ...prev, checkinFrequency: freq.id }))}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      onboardingData?.checkinFrequency === freq.id
                        ? 'border-purple-400 bg-purple-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-white font-medium mb-1">{freq.label}</div>
                    <div className="text-white/60 text-sm">{freq.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setOnboardingStep('support-style')}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Back
                </Button>
                <Button 
                  onClick={() => setOnboardingStep('complete')}
                  disabled={!onboardingData?.checkinFrequency}
                  className="flex-1 bg-purple-600/90 hover:bg-purple-700 text-white disabled:opacity-50"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}
          
          {/* Completion Step */}
          {onboardingStep === 'complete' && (
            <div className="text-center space-y-6 animate-fade-in-up">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-breathe-glow">
                <Smiley size={40} className="text-white" weight="fill" />
              </div>
              <h2 className="text-2xl text-white font-light">You're all set!</h2>
              <p className="text-white/70 leading-relaxed">
                {onboardingData?.userName ? `${onboardingData.userName}, your` : 'Your'} companion {PRESENCES.find(p => p.id === onboardingData?.selectedPresence)?.name || 'Nebula'} is ready to support you.
              </p>
              <p className="text-white/60 text-sm">
                Remember, this is a safe space for your thoughts and feelings. We're here whenever you need us.
              </p>
              <Button 
                onClick={completeOnboarding}
                className="w-full bg-purple-600/90 hover:bg-purple-700 text-white"
              >
                Begin Your Journey
              </Button>
            </div>
          )}
          
        </Card>
      </div>
    )
  }
  
  // ============================================================================
  // MAIN INTERFACE RENDER
  // ============================================================================
  
  return (
    <div 
      className="min-h-screen flex flex-col relative overflow-hidden transition-all duration-1000"
      style={{
        background: `linear-gradient(135deg, ${currentPresence.colors.background.from} 0%, ${currentPresence.colors.background.via} 50%, ${currentPresence.colors.background.to} 100%)`
      }}
    >
      
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
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowPresenceSelector(!showPresenceSelector)}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-black/40 hover:bg-black/60 active:bg-black/80 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all duration-300 touch-manipulation shadow-lg"
            title="Change presence"
          >
            <Swap size={18} />
          </Button>
        </div>
        
        {/* Main Avatar Area - Takes up most of the screen */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden px-4">
          
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-transparent to-slate-900/50" />
          
          {/* Infinity Ring Avatar - Responsive sizing */}
          <div className="relative flex items-center justify-center" style={{ width: '320px', height: '180px' }}>
            {/* Left Ring Tube - Multi-layered glowing design */}
            <div 
              className={`absolute animate-infinity-flow transition-all duration-1000`}
              style={{
                width: '160px',
                height: '160px',
                left: '20px',
                top: '50%',
                transform: `translateY(-50%) scale(${particleConfig.ringScaleFactor})`,
                animationDuration: `${animationSpeed}ms`,
              }}
            >
              {/* Outer glow halo */}
              <div 
                className="absolute inset-0 rounded-full transition-all duration-1000"
                style={{
                  background: `radial-gradient(circle, transparent 40%, ${currentPresence.colors.ring1.glow} 50%, transparent 60%)`,
                  filter: `blur(20px)`,
                  opacity: 0.6
                }}
              />
              
              {/* Main glowing ring - outermost layer */}
              <div 
                className="absolute inset-0 rounded-full transition-all duration-1000"
                style={{
                  background: `transparent`,
                  border: `3px solid ${currentPresence.colors.ring1.primary}`,
                  boxShadow: `
                    0 0 20px ${currentPresence.colors.ring1.primary},
                    0 0 40px ${currentPresence.colors.ring1.primary},
                    inset 0 0 20px ${currentPresence.colors.ring1.primary},
                    inset 0 0 40px ${currentPresence.colors.ring1.primary}33
                  `,
                  opacity: 0.9
                }}
              />
              
              {/* Second bright ring */}
              <div 
                className="absolute rounded-full transition-all duration-1000"
                style={{
                  inset: '6px',
                  background: `transparent`,
                  border: `2px solid ${currentPresence.colors.ring1.secondary}`,
                  boxShadow: `
                    0 0 15px ${currentPresence.colors.ring1.secondary},
                    0 0 30px ${currentPresence.colors.ring1.secondary},
                    inset 0 0 15px ${currentPresence.colors.ring1.secondary}
                  `,
                  opacity: 0.95
                }}
              />
              
              {/* Third inner bright ring */}
              <div 
                className="absolute rounded-full transition-all duration-1000"
                style={{
                  inset: '12px',
                  background: `transparent`,
                  border: `2px solid ${currentPresence.colors.ring1.tertiary}`,
                  boxShadow: `
                    0 0 10px ${currentPresence.colors.ring1.tertiary},
                    0 0 20px ${currentPresence.colors.ring1.tertiary},
                    inset 0 0 10px ${currentPresence.colors.ring1.tertiary}
                  `,
                  opacity: 0.85
                }}
              />
              
              {/* Innermost core glow */}
              <div 
                className="absolute rounded-full transition-all duration-1000"
                style={{
                  inset: '18px',
                  background: `radial-gradient(circle, ${currentPresence.colors.ring1.tertiary}4D 0%, transparent 70%)`,
                  border: `1px solid ${currentPresence.colors.ring1.tertiary}66`,
                  boxShadow: `inset 0 0 20px ${currentPresence.colors.ring1.tertiary}80`
                }}
              />
              
              {/* Flowing Particles - only during active conversation */}
              {(conversationIntensity > 20 || isLoading) && (
                <>
                  {/* Primary particles */}
                  {[...Array(particleConfig.particleCount.primary)].map((_, i) => (
                    <div
                      key={`primary-${i}`}
                      className="absolute rounded-full animate-tube-particle-flow-left transition-all duration-1000"
                      style={{
                        width: `${particleConfig.particleSize.primary}px`,
                        height: `${particleConfig.particleSize.primary}px`,
                        background: `radial-gradient(circle, ${currentPresence.colors.ring1.secondary} 0%, transparent 70%)`,
                        filter: `drop-shadow(0 0 ${particleConfig.glowIntensity}px ${currentPresence.colors.ring1.secondary})`,
                        animationDelay: `${i * particleConfig.delayVariation}s`,
                        animationDuration: `${particleConfig.particleSpeed.primary}s`,
                        opacity: particleConfig.particleOpacity.base
                      }}
                    />
                  ))}
                  
                  {/* Secondary trail particles for enhanced effect */}
                  {particleConfig.shouldShowTrails && [...Array(particleConfig.particleCount.trail)].map((_, i) => (
                    <div
                      key={`trail-${i}`}
                      className="absolute rounded-full animate-tube-particle-flow-left transition-all duration-1000"
                      style={{
                        width: `${particleConfig.particleSize.trail}px`,
                        height: `${particleConfig.particleSize.trail}px`,
                        background: `radial-gradient(circle, ${currentPresence.colors.ring1.tertiary} 0%, transparent 60%)`,
                        filter: `drop-shadow(0 0 ${particleConfig.glowIntensity * 0.5}px ${currentPresence.colors.ring1.tertiary})`,
                        animationDelay: `${i * particleConfig.delayVariation * 1.2 + 0.15}s`,
                        animationDuration: `${particleConfig.particleSpeed.trail}s`,
                        opacity: particleConfig.particleOpacity.base * 0.75
                      }}
                    />
                  ))}
                </>
              )}
            </div>
            
            {/* Right Ring Tube - overlapping with same glowing multi-layer design */}
            <div 
              className={`absolute animate-infinity-counter-flow transition-all duration-1000`}
              style={{
                width: '160px',
                height: '160px',
                right: '20px',
                top: '50%',
                transform: `translateY(-50%) scale(${particleConfig.ringScaleFactor * 0.98})`
              }}
            >
              {/* Outer glow halo */}
              <div 
                className="absolute inset-0 rounded-full transition-all duration-1000"
                style={{
                  background: `radial-gradient(circle, transparent 40%, ${currentPresence.colors.ring2.glow} 50%, transparent 60%)`,
                  filter: `blur(20px)`,
                  opacity: 0.6
                }}
              />
              
              {/* Main glowing ring - outermost layer */}
              <div 
                className="absolute inset-0 rounded-full transition-all duration-1000"
                style={{
                  background: `transparent`,
                  border: `3px solid ${currentPresence.colors.ring2.primary}`,
                  boxShadow: `
                    0 0 20px ${currentPresence.colors.ring2.primary},
                    0 0 40px ${currentPresence.colors.ring2.primary},
                    inset 0 0 20px ${currentPresence.colors.ring2.primary},
                    inset 0 0 40px ${currentPresence.colors.ring2.primary}33
                  `,
                  opacity: 0.9
                }}
              />
              
              {/* Second bright ring */}
              <div 
                className="absolute rounded-full transition-all duration-1000"
                style={{
                  inset: '6px',
                  background: `transparent`,
                  border: `2px solid ${currentPresence.colors.ring2.secondary}`,
                  boxShadow: `
                    0 0 15px ${currentPresence.colors.ring2.secondary},
                    0 0 30px ${currentPresence.colors.ring2.secondary},
                    inset 0 0 15px ${currentPresence.colors.ring2.secondary}
                  `,
                  opacity: 0.95
                }}
              />
              
              {/* Third inner bright ring */}
              <div 
                className="absolute rounded-full transition-all duration-1000"
                style={{
                  inset: '12px',
                  background: `transparent`,
                  border: `2px solid ${currentPresence.colors.ring2.tertiary}`,
                  boxShadow: `
                    0 0 10px ${currentPresence.colors.ring2.tertiary},
                    0 0 20px ${currentPresence.colors.ring2.tertiary},
                    inset 0 0 10px ${currentPresence.colors.ring2.tertiary}
                  `,
                  opacity: 0.85
                }}
              />
              
              {/* Innermost core glow */}
              <div 
                className="absolute rounded-full transition-all duration-1000"
                style={{
                  inset: '18px',
                  background: `radial-gradient(circle, ${currentPresence.colors.ring2.tertiary}4D 0%, transparent 70%)`,
                  border: `1px solid ${currentPresence.colors.ring2.tertiary}66`,
                  boxShadow: `inset 0 0 20px ${currentPresence.colors.ring2.tertiary}80`
                }}
              />
              
              {/* Flowing Particles - only during active conversation */}
              {(conversationIntensity > 20 || isLoading) && (
                <>
                  {/* Primary particles */}
                  {[...Array(particleConfig.particleCount.primary)].map((_, i) => (
                    <div
                      key={`primary-${i}`}
                      className="absolute rounded-full animate-tube-particle-flow-right transition-all duration-1000"
                      style={{
                        width: `${particleConfig.particleSize.primary}px`,
                        height: `${particleConfig.particleSize.primary}px`,
                        background: `radial-gradient(circle, ${currentPresence.colors.ring2.secondary} 0%, transparent 70%)`,
                        filter: `drop-shadow(0 0 ${particleConfig.glowIntensity}px ${currentPresence.colors.ring2.secondary})`,
                        animationDelay: `${i * particleConfig.delayVariation * 1.1}s`,
                        animationDuration: `${particleConfig.particleSpeed.primary * 1.1}s`,
                        opacity: particleConfig.particleOpacity.base * 0.9
                      }}
                    />
                  ))}
                  
                  {/* Secondary trail particles for enhanced effect */}
                  {particleConfig.shouldShowTrails && [...Array(particleConfig.particleCount.trail)].map((_, i) => (
                    <div
                      key={`trail-${i}`}
                      className="absolute rounded-full animate-tube-particle-flow-right transition-all duration-1000"
                      style={{
                        width: `${particleConfig.particleSize.trail}px`,
                        height: `${particleConfig.particleSize.trail}px`,
                        background: `radial-gradient(circle, ${currentPresence.colors.ring2.tertiary} 0%, transparent 60%)`,
                        filter: `drop-shadow(0 0 ${particleConfig.glowIntensity * 0.5}px ${currentPresence.colors.ring2.tertiary})`,
                        animationDelay: `${i * particleConfig.delayVariation * 1.3 + 0.2}s`,
                        animationDuration: `${particleConfig.particleSpeed.trail * 1.15}s`,
                        opacity: particleConfig.particleOpacity.base * 0.65
                      }}
                    />
                  ))}
                </>
              )}
            </div>
            
            {/* Center intersection core */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div 
                className={`w-16 h-16 rounded-full animate-ring-core-breathe transition-all duration-1000`}
                style={{
                  background: `radial-gradient(circle, ${currentPresence.colors.ring2.tertiary} 0%, ${currentPresence.colors.ring2.primary} 50%, ${currentPresence.colors.ring1.primary} 100%)`,
                  filter: `drop-shadow(0 0 30px ${currentPresence.colors.ring2.primary}) drop-shadow(0 0 50px ${currentPresence.colors.ring1.primary})`,
                  opacity: particleConfig.particleOpacity.peak,
                  boxShadow: `
                    0 0 20px ${currentPresence.colors.ring2.primary},
                    0 0 40px ${currentPresence.colors.ring1.primary},
                    inset 0 0 30px ${currentPresence.colors.ring2.primary}CC
                  `
                }}
              />
              
              {/* Cross-ring particle exchange during high intensity */}
              {particleConfig.shouldShowCrossRing && (
                <>
                  {[...Array(Math.floor(3 + conversationIntensity / 50))].map((_, i) => (
                    <div
                      key={`exchange-${i}`}
                      className="absolute rounded-full animate-cross-ring-exchange transition-all duration-1000"
                      style={{
                        width: `${particleConfig.particleSize.trail * 1.5}px`,
                        height: `${particleConfig.particleSize.trail * 1.5}px`,
                        background: `radial-gradient(circle, #ffffff 0%, ${currentPresence.colors.ring1.secondary} 50%, transparent 80%)`,
                        filter: `drop-shadow(0 0 ${particleConfig.glowIntensity * 0.8}px ${currentPresence.colors.ring1.secondary})`,
                        animationDelay: `${i * particleConfig.delayVariation * 1.5}s`,
                        animationDuration: `${1.8 - (conversationIntensity / 200)}s`,
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
                    {conversationIntensity > 85 ? '✨ Deeply engaged' : 
                     conversationIntensity > 70 ? '💫 Highly attentive' :
                     conversationIntensity > 50 ? '🎯 Actively listening' : 
                     conversationIntensity > 30 ? '👂 Attentive' :
                     '💬 Ready to chat'}
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

        {/* Presence Selector Overlay */}
        {showPresenceSelector && (
          <div className="absolute inset-x-2 sm:inset-x-4 bottom-28 sm:bottom-32 max-h-[60vh] overflow-y-auto">
            <Card className="p-4 bg-black/40 border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-sm font-medium">Choose Your Companion</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPresenceSelector(false)}
                  className="h-8 w-8 p-0 hover:bg-white/10 text-white/70 hover:text-white rounded-full"
                >
                  <X size={16} />
                </Button>
              </div>
              
              {isTransitioningPresence ? (
                <div className="py-8 text-center space-y-4">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-400/30 animate-ping"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-purple-400 animate-spin"></div>
                  </div>
                  <p className="text-white/70 text-sm">Transitioning presence...</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {PRESENCES.map((presence) => {
                    const isSelected = onboardingData?.selectedPresence === presence.id
                    return (
                      <button
                        key={presence.id}
                        onClick={() => changePresence(presence.id)}
                        disabled={isSelected}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left touch-manipulation ${
                          isSelected
                            ? 'border-purple-400 bg-purple-500/20 cursor-default'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 active:bg-white/15'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="text-white font-medium">{presence.name}</div>
                              {isSelected && (
                                <Badge variant="secondary" className="bg-purple-500/30 text-purple-200 text-xs px-2 py-0">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <div className="text-white/70 text-sm mb-2">{presence.personality.split('.')[0]}.</div>
                            <div className="text-white/50 text-xs">{presence.description}</div>
                          </div>
                          <div 
                            className={`w-12 h-12 rounded-full ml-3 bg-gradient-to-br ${presence.colors.circle1} flex-shrink-0`}
                            style={{
                              boxShadow: `0 0 20px ${presence.colors.glow}`
                            }}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
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
              className={`w-14 h-14 sm:w-16 sm:h-16 min-w-[56px] min-h-[56px] rounded-full text-white backdrop-blur-sm transition-all duration-500 touch-manipulation ${
                isListening 
                  ? 'bg-red-600/90 hover:bg-red-700 active:bg-red-800' 
                  : `${currentPresence.colors.button.base} ${currentPresence.colors.button.hover} ${currentPresence.colors.button.active}`
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
              className={`w-14 h-14 sm:w-16 sm:h-16 min-w-[56px] min-h-[56px] rounded-full text-white backdrop-blur-sm transition-all duration-500 touch-manipulation ${
                preferences?.voiceEnabled && !isSpeaking
                  ? `${currentPresence.colors.button.base} ${currentPresence.colors.button.hover} ${currentPresence.colors.button.active}` 
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
              className={`w-14 h-14 sm:w-16 sm:h-16 min-w-[56px] min-h-[56px] rounded-full text-white backdrop-blur-sm touch-manipulation transition-all duration-500 ${currentPresence.colors.button.base} ${currentPresence.colors.button.hover} ${currentPresence.colors.button.active}`}
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
              className={`rounded-full px-4 sm:px-6 backdrop-blur-sm transition-all duration-500 min-w-[48px] min-h-[48px] touch-manipulation ${currentPresence.colors.button.base} ${currentPresence.colors.button.hover} ${currentPresence.colors.button.active} ${
                conversationIntensity > 60 ? 'animate-pulse' : ''
              }`}
              style={conversationIntensity > 60 ? {
                boxShadow: `0 0 20px ${currentPresence.colors.ring1.glow}`
              } : {}}
            >
              <PaperPlaneTilt size={18} />
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="flex justify-center space-x-2 sm:space-x-4 flex-wrap gap-2">
            {/* Current Presence Indicator */}
            <Badge variant="secondary" className={`backdrop-blur-sm text-xs px-2 py-1 transition-all duration-500 ${currentPresence.colors.accent}`}>
              {getCurrentPresence().name}
            </Badge>
            
            {/* Engagement Intensity Indicator */}
            {conversationIntensity > 30 && (
              <Badge 
                variant="secondary" 
                className={`backdrop-blur-sm text-xs px-2 py-1 transition-all duration-500 ${
                  conversationIntensity > 70 
                    ? `${currentPresence.colors.accent} animate-pulse` 
                    : conversationIntensity > 50 
                    ? currentPresence.colors.accent.replace('/20', '/15').replace('/30', '/25')
                    : currentPresence.colors.accent.replace('/20', '/10').replace('/30', '/20')
                }`}
              >
                ⚡ {Math.round(conversationIntensity)}% engaged
              </Badge>
            )}
            
            {/* Current Mood Indicator */}
            {moodEntries.length > 0 && (
              <Badge variant="secondary" className="bg-white/10 text-white/80 border-white/20 backdrop-blur-sm text-xs px-2 py-1 transition-all duration-500">
                Mood: {getMoodEmoji(moodEntries[0].level)} {moodEntries[0].level}/5
              </Badge>
            )}
            
            {/* Voice Status */}
            <Badge variant="secondary" className={`border-white/20 backdrop-blur-sm text-xs px-2 py-1 transition-all duration-500 ${
              preferences?.voiceEnabled ? currentPresence.colors.accent : 'bg-gray-500/20 text-gray-200'
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