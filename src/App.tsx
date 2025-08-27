import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
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
import { PaperPlaneTilt, VideoCamera, Microphone, MicrophoneSlash, Smiley, CameraRotate, Image, X, SpeakerHigh, SpeakerX, CaretLeft, CaretRight, ArrowRight, Swap, House } from "@phosphor-icons/react"
import { useKV } from '@github/spark/hooks'

interface Message {
  id: string
  content: string
  timestamp: Date
  sender: 'user' | 'companion'
}

interface MoodEntry {
  id: string
  level: number // 1-5 scale
  timestamp: Date
}

interface ConversationIntensity {
  level: number // 0-100 scale
  timestamp: Date
}

interface Presence {
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

interface OnboardingData {
  completed: boolean
  selectedPresence?: Presence['id']
  userName?: string
  supportStyle?: 'listen' | 'encourage' | 'ground'
  checkinFrequency?: 'daily' | 'reach-out' | 'surprise'
}

function App() {
  const [messages, setMessages] = useKV<Message[]>("chat-messages", [])
  const [moodEntries, setMoodEntries] = useKV<MoodEntry[]>("mood-entries", [])
  const [onboardingData, setOnboardingData] = useKV<OnboardingData>("onboarding-data", { completed: false })
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showMoodSelector, setShowMoodSelector] = useState(false)
  const [currentMood, setCurrentMood] = useState(3)
  const [showChat, setShowChat] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [conversationIntensity, setConversationIntensity] = useState(30) // Base intensity
  const [isVideoActive, setIsVideoActive] = useState(false)
  const [currentCamera, setCurrentCamera] = useState<'front' | 'back'>('front')
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false)
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [chatScrollOffset, setChatScrollOffset] = useState(0) // For message pagination
  const [showPresenceSelector, setShowPresenceSelector] = useState(false)

  // Onboarding state
  const [onboardingStep, setOnboardingStep] = useState<'welcome' | 'introduction' | 'presence-selection' | 'questionnaire' | 'first-interaction'>('welcome')
  const [selectedPresence, setSelectedPresence] = useState<Presence['id'] | null>(null)
  const [tempOnboardingData, setTempOnboardingData] = useState<Partial<OnboardingData>>({})
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  // Define the four presences
  const presences: Presence[] = [
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
  ]

  // Check if onboarding is completed on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!onboardingData.completed) {
        setOnboardingStep('welcome')
      }
      setIsLoadingInitial(false)
    }, 2000) // 2 second loading screen

    return () => clearTimeout(timer)
  }, [onboardingData.completed])

  // Get current presence
  const getCurrentPresence = (): Presence => {
    const presenceId = onboardingData.selectedPresence || selectedPresence || 'nebula'
    return presences.find(p => p.id === presenceId) || presences[0]
  }

  // Complete onboarding
  const completeOnboarding = () => {
    const updatedOnboardingData: OnboardingData = {
      completed: true,
      selectedPresence: selectedPresence || 'nebula',
      ...tempOnboardingData
    }
    setOnboardingData(updatedOnboardingData)
    
    // Send initial greeting from the presence
    const presence = getCurrentPresence()
    const greeting = `Hi${updatedOnboardingData.userName ? `, ${updatedOnboardingData.userName}` : ''}! I'm ${presence.name}. ${presence.personality} Whenever you're ready, just say hello.`
    
    const welcomeMessage: Message = {
      id: `msg-${Date.now()}-welcome`,
      content: greeting,
      timestamp: new Date(),
      sender: 'companion'
    }
    
    setMessages([welcomeMessage])
    setShowChat(true)
    
    if (voiceEnabled) {
      setTimeout(() => speakText(greeting), 500)
    }
  }

  // Reset to onboarding
  const returnToStart = () => {
    // Clear all data and return to onboarding
    setOnboardingData({ completed: false })
    setMessages([])
    setMoodEntries([])
    setShowChat(false)
    setShowMoodSelector(false)
    setShowPresenceSelector(false)
    setShowBackgroundSelector(false)
    setSelectedPresence(null)
    setTempOnboardingData({})
    setOnboardingStep('welcome')
    setInputMessage('')
    
    // Stop any active features
    stopVideo()
    stopSpeaking()
    setIsListening(false)
  }
    const newPresence = presences.find(p => p.id === newPresenceId)
    if (!newPresence) return

    // Update onboarding data with new presence
    setOnboardingData(prev => ({
      ...prev,
      selectedPresence: newPresenceId
    }))

    // Create transition message
    const transitionMessage: Message = {
      id: `msg-${Date.now()}-transition`,
      content: `Hello, I'm ${newPresence.name}. I've been following your conversation and I'm here to continue supporting you. ${newPresence.personality}`,
      timestamp: new Date(),
      sender: 'companion'
    }

    setMessages(current => [...current, transitionMessage])
    setShowPresenceSelector(false)
    
    if (voiceEnabled) {
      setTimeout(() => speakText(transitionMessage.content), 500)
    }
  }

  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  // Chat navigation constants
  const MESSAGES_PER_PAGE = 6
  const SWIPE_THRESHOLD = 50 // Minimum distance for swipe detection

  // Calculate visible messages based on scroll offset
  const getVisibleMessages = () => {
    const totalMessages = messages.length
    const startIndex = Math.max(0, totalMessages - MESSAGES_PER_PAGE - chatScrollOffset)
    const endIndex = Math.max(MESSAGES_PER_PAGE, totalMessages - chatScrollOffset)
    return messages.slice(startIndex, endIndex)
  }

  const visibleMessages = getVisibleMessages()
  const canScrollBack = chatScrollOffset < messages.length - MESSAGES_PER_PAGE
  const canScrollForward = chatScrollOffset > 0

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY)

    if (isHorizontalSwipe && Math.abs(distanceX) > SWIPE_THRESHOLD) {
      if (distanceX > 0) {
        // Swipe left - go to newer messages
        navigateChat('forward')
      } else {
        // Swipe right - go to older messages
        navigateChat('back')
      }
    }
  }

  // Chat navigation functions
  const navigateChat = (direction: 'back' | 'forward') => {
    if (direction === 'back' && canScrollBack) {
      setChatScrollOffset(prev => Math.min(prev + MESSAGES_PER_PAGE, messages.length - MESSAGES_PER_PAGE))
    } else if (direction === 'forward' && canScrollForward) {
      setChatScrollOffset(prev => Math.max(prev - MESSAGES_PER_PAGE, 0))
    }
  }

  // Reset scroll offset when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setChatScrollOffset(0) // Always show latest messages when new ones arrive
    }
  }, [messages.length])

  // Text-to-Speech function
  const speakText = (text: string) => {
    if (!voiceEnabled) return
    
    // Stop any current speech
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    
    // Configure voice settings for a more natural companion voice
    utterance.rate = 0.9
    utterance.pitch = 1.1
    utterance.volume = 0.8
    
    // Try to find a female voice for the companion
    const voices = window.speechSynthesis.getVoices()
    const femaleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('woman') ||
      voice.name.toLowerCase().includes('zira') ||
      voice.name.toLowerCase().includes('hazel')
    )
    
    if (femaleVoice) {
      utterance.voice = femaleVoice
    }
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    window.speechSynthesis.speak(utterance)
  }

  // Stop speech
  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  // Camera access functions
  const startVideo = async () => {
    try {
      const constraints = {
        video: {
          facingMode: currentCamera === 'front' ? 'user' : 'environment'
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      setIsVideoActive(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
    }
  }

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsVideoActive(false)
  }

  const switchCamera = async () => {
    const newCamera = currentCamera === 'front' ? 'back' : 'front'
    setCurrentCamera(newCamera)
    
    if (isVideoActive) {
      stopVideo()
      // Small delay to ensure cleanup
      setTimeout(() => {
        startVideo()
      }, 100)
    }
  }

  // Background options
  const backgroundOptions = [
    { id: 'none', name: 'None', preview: 'transparent' },
    { id: 'forest', name: 'Forest', preview: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' },
    { id: 'ocean', name: 'Ocean', preview: 'linear-gradient(135deg, #667db6 0%, #0082c8 100%)' },
    { id: 'sunset', name: 'Sunset', preview: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    { id: 'space', name: 'Space', preview: 'linear-gradient(135deg, #2c3e50 0%, #000428 100%)' },
    { id: 'aurora', name: 'Aurora', preview: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)' }
  ]

  // Cleanup video on unmount
  useEffect(() => {
    return () => {
      stopVideo()
    }
  }, [])

  // Analyze conversation intensity based on message content
  const analyzeIntensity = (content: string): number => {
    const intensityWords = {
      high: ['amazing', 'incredible', 'wonderful', 'fantastic', 'terrible', 'awful', 'devastating', 'overwhelming', 'excited', 'angry', 'furious', 'ecstatic', 'devastated', 'brilliant', 'horrible', 'love', 'hate', 'panic', 'crisis', 'emergency', '!!!', '!!'],
      medium: ['good', 'bad', 'happy', 'sad', 'worried', 'concerned', 'pleased', 'upset', 'frustrated', 'glad', 'sorry', 'proud', 'disappointed', 'nervous', 'confident', 'stressed', 'relaxed', '!'],
      low: ['okay', 'fine', 'alright', 'maybe', 'perhaps', 'possibly', 'somewhat', 'slightly', 'kind of', 'sort of']
    }
    
    const words = content.toLowerCase().split(/\s+/)
    let intensity = 20 // Base intensity
    
    // Length factor (longer messages = more intensity)
    intensity += Math.min(words.length * 0.5, 20)
    
    // Keyword analysis
    words.forEach(word => {
      if (intensityWords.high.some(hw => word.includes(hw))) {
        intensity += 15
      } else if (intensityWords.medium.some(mw => word.includes(mw))) {
        intensity += 8
      } else if (intensityWords.low.some(lw => word.includes(lw))) {
        intensity += 3
      }
    })
    
    // Punctuation intensity
    const exclamationCount = (content.match(/!/g) || []).length
    const questionCount = (content.match(/\?/g) || []).length
    intensity += exclamationCount * 5 + questionCount * 3
    
    // Cap letters intensity
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
    if (capsRatio > 0.3) intensity += 20
    
    return Math.min(Math.max(intensity, 10), 100)
  }

  // Update conversation intensity when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1]
      const newIntensity = analyzeIntensity(latestMessage.content)
      setConversationIntensity(newIntensity)
      
      // Gradually reduce intensity over time
      const timer = setTimeout(() => {
        setConversationIntensity(prev => Math.max(prev * 0.8, 30))
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [messages])

  // Calculate current companion mood based on user's recent mood entries
  const getCompanionMood = () => {
    if (moodEntries.length === 0) return 3
    const recent = moodEntries.slice(0, 3) // Last 3 entries
    return Math.round(recent.reduce((sum, entry) => sum + entry.level, 0) / recent.length)
  }

  const companionMood = getCompanionMood()

  // Get mood emoji
  const getMoodEmoji = (level: number): string => {
    switch (level) {
      case 1: return '😢'
      case 2: return '😞'
      case 3: return '😐'
      case 4: return '🙂'
      case 5: return '😊'
      default: return '😐'
    }
  }

  // Register mood
  const registerMood = (level: number) => {
    const newEntry: MoodEntry = {
      id: `mood-${Date.now()}`,
      level,
      timestamp: new Date()
    }
    setMoodEntries(current => [newEntry, ...current.slice(0, 49)])
    setCurrentMood(level)
    setShowMoodSelector(false)
  }

  // Send message to AI companion
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      content: inputMessage.trim(),
      timestamp: new Date(),
      sender: 'user'
    }

    setMessages(current => [...current, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Create context-aware prompt
      const recentMoodContext = moodEntries.length > 0 
        ? `User's recent mood: ${getMoodEmoji(moodEntries[0].level)} (${moodEntries[0].level}/5)`
        : 'No recent mood data'
      
      const conversationContext = messages.slice(-4).map(msg => 
        `${msg.sender}: ${msg.content}`
      ).join('\n')

      const prompt = spark.llmPrompt`You are ${getCurrentPresence().name}, a compassionate AI emotional companion. You are ${getCurrentPresence().personality.toLowerCase()} Respond empathetically and supportively to the user.

Context:
${recentMoodContext}

Recent conversation:
${conversationContext}

User: ${userMessage.content}

Respond naturally and warmly as ${getCurrentPresence().name}, showing you understand their emotional state. Keep responses concise but meaningful.`

      const response = await spark.llm(prompt)

      const companionMessage: Message = {
        id: `msg-${Date.now()}-companion`,
        content: response,
        timestamp: new Date(),
        sender: 'companion'
      }

      setMessages(current => [...current, companionMessage])
      
      // Speak the companion's response if voice is enabled
      if (voiceEnabled) {
        speakText(response)
      }
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        content: "I'm sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date(),
        sender: 'companion'
      }
      setMessages(current => [...current, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Get dynamic animation speeds based on intensity
  const getAnimationSpeed = () => {
    const baseSpeed = 3000
    const intensityMultiplier = Math.max(0.3, 1 - (conversationIntensity / 150))
    return baseSpeed * intensityMultiplier
  }

  // Get circle colors based on current presence and activity
  const getCircleColors = () => {
    const currentPresence = getCurrentPresence()
    
    if (isLoading) {
      return {
        circle1: 'from-cyan-400 to-blue-500',
        circle2: 'from-purple-400 to-pink-500',
        glow: 'rgba(59, 130, 246, 0.4)'
      }
    }
    
    // Use presence colors with intensity variations
    const intensityFactor = conversationIntensity / 100
    const baseColors = currentPresence.colors
    
    return {
      circle1: baseColors.circle1,
      circle2: baseColors.circle2,
      glow: baseColors.glow.replace('0.4)', `${0.3 + intensityFactor * 0.4})`)
    }
  }

  // Handle enter key in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Update conversation intensity when typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputMessage(value)
    
    // Analyze intensity while typing for real-time feedback
    if (value.length > 0) {
      const typingIntensity = analyzeIntensity(value)
      setConversationIntensity(Math.max(typingIntensity * 0.6, 30)) // Reduced for typing preview
    } else {
      setConversationIntensity(30) // Reset to base when no input
    }
  }

  // Get dynamic background style
  const getBackgroundStyle = () => {
    const baseStyle = "min-h-screen flex flex-col relative overflow-hidden"
    
    if (!selectedBackground || selectedBackground === 'none') {
      return `${baseStyle} bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`
    }
    
    const bgOption = backgroundOptions.find(bg => bg.id === selectedBackground)
    if (bgOption && bgOption.preview !== 'transparent') {
      return `${baseStyle}`
    }
    
    return `${baseStyle} bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`
  }

  const circleColors = getCircleColors()
  const animationSpeed = getAnimationSpeed()

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

  // Show onboarding flow
  if (!onboardingData.completed) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {onboardingStep === 'welcome' && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="relative mb-12">
                <div className="text-8xl font-light text-white animate-breathe-glow">
                  WE
                </div>
                <div className="absolute inset-0 text-8xl font-light text-white/20 animate-pulse-slow">
                  WE
                </div>
              </div>
              
              <h1 className="text-2xl text-white mb-6 font-light leading-relaxed">
                Welcome. WE are here to walk with you.
              </h1>
              
              <Button
                onClick={() => setOnboardingStep('introduction')}
                className="bg-purple-600/90 hover:bg-purple-700 text-white px-8 py-3 rounded-full text-lg font-light backdrop-blur-sm transition-all duration-300"
              >
                Begin
              </Button>
            </div>
          </div>
        )}

        {onboardingStep === 'introduction' && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-lg">
              <div className="mb-8">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-purple-400 to-violet-500 animate-pulse-slow opacity-80 blur-sm"
                     style={{ filter: 'drop-shadow(0 0 30px rgba(168, 85, 247, 0.4))' }} />
              </div>
              
              <h2 className="text-xl text-white mb-6 font-light leading-relaxed">
                We believe everyone deserves a companion who truly understands.
              </h2>
              
              <p className="text-white/70 mb-8 leading-relaxed">
                You're about to meet four unique presences, each with their own way of being with you. 
                Choose the one that feels right for this moment - you can always change later.
              </p>
              
              <Button
                onClick={() => setOnboardingStep('presence-selection')}
                className="bg-purple-600/90 hover:bg-purple-700 text-white px-8 py-3 rounded-full backdrop-blur-sm transition-all duration-300"
              >
                Meet the Presences <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          </div>
        )}

        {onboardingStep === 'presence-selection' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center mb-8">
              <h2 className="text-xl text-white mb-4 font-light">
                Which presence feels right to begin with?
              </h2>
              <p className="text-white/60 text-sm">
                Tap to explore, then choose your companion
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 max-w-2xl w-full mb-8">
              {presences.map((presence) => (
                <Card
                  key={presence.id}
                  className={`p-6 cursor-pointer transition-all duration-300 bg-black/40 border backdrop-blur-md hover:bg-black/60 ${
                    selectedPresence === presence.id 
                      ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20' 
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  onClick={() => setSelectedPresence(presence.id)}
                >
                  <div className="text-center">
                    {/* Presence visualization */}
                    <div className="relative mb-4 h-16 flex items-center justify-center">
                      <div 
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${presence.colors.circle1} animate-pulse-slow opacity-90 transition-all duration-500`}
                        style={{ filter: `drop-shadow(0 0 20px ${presence.colors.glow})` }}
                      />
                      <div 
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${presence.colors.circle2} absolute opacity-80 animate-pulse-slow`}
                        style={{ 
                          filter: `drop-shadow(0 0 15px ${presence.colors.glow})`,
                          animationDelay: '0.5s',
                          transform: 'translateX(8px)'
                        }}
                      />
                    </div>
                    
                    <h3 className="text-white text-lg font-medium mb-2">{presence.name}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {presence.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
            
            {selectedPresence && (
              <Button
                onClick={() => setOnboardingStep('questionnaire')}
                className="bg-purple-600/90 hover:bg-purple-700 text-white px-8 py-3 rounded-full backdrop-blur-sm transition-all duration-300"
              >
                Continue with {presences.find(p => p.id === selectedPresence)?.name}
              </Button>
            )}
          </div>
        )}

        {onboardingStep === 'questionnaire' && selectedPresence && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
              <div className="text-center mb-8">
                <div className="relative mb-6 h-20 flex items-center justify-center">
                  {(() => {
                    const presence = presences.find(p => p.id === selectedPresence)!
                    return (
                      <>
                        <div 
                          className={`w-16 h-16 rounded-full bg-gradient-to-br ${presence.colors.circle1} animate-pulse-slow opacity-90`}
                          style={{ filter: `drop-shadow(0 0 25px ${presence.colors.glow})` }}
                        />
                        <div 
                          className={`w-14 h-14 rounded-full bg-gradient-to-br ${presence.colors.circle2} absolute opacity-80 animate-pulse-slow`}
                          style={{ 
                            filter: `drop-shadow(0 0 20px ${presence.colors.glow})`,
                            animationDelay: '0.5s',
                            transform: 'translateX(10px)'
                          }}
                        />
                      </>
                    )
                  })()}
                </div>
                
                <h2 className="text-xl text-white mb-2 font-light">
                  Let me get to know you
                </h2>
                <p className="text-white/60 text-sm">
                  {presences.find(p => p.id === selectedPresence)?.name} asks gently...
                </p>
              </div>

              <div className="space-y-6">
                {/* Support Style */}
                <Card className="p-4 bg-black/40 border-white/10 backdrop-blur-md">
                  <h3 className="text-white text-sm mb-3">How do you want me to show up for you?</h3>
                  <RadioGroup
                    value={tempOnboardingData.supportStyle || ''}
                    onValueChange={(value: 'listen' | 'encourage' | 'ground') => 
                      setTempOnboardingData(prev => ({ ...prev, supportStyle: value }))
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="listen" id="listen" />
                      <Label htmlFor="listen" className="text-white/80 text-sm">Just listen</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="encourage" id="encourage" />
                      <Label htmlFor="encourage" className="text-white/80 text-sm">Encourage me</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ground" id="ground" />
                      <Label htmlFor="ground" className="text-white/80 text-sm">Keep me grounded</Label>
                    </div>
                  </RadioGroup>
                </Card>

                {/* Check-in Frequency */}
                <Card className="p-4 bg-black/40 border-white/10 backdrop-blur-md">
                  <h3 className="text-white text-sm mb-3">What kind of check-ins feel good to you?</h3>
                  <RadioGroup
                    value={tempOnboardingData.checkinFrequency || ''}
                    onValueChange={(value: 'daily' | 'reach-out' | 'surprise') => 
                      setTempOnboardingData(prev => ({ ...prev, checkinFrequency: value }))
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily" className="text-white/80 text-sm">Daily</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="reach-out" id="reach-out" />
                      <Label htmlFor="reach-out" className="text-white/80 text-sm">Only when I reach out</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="surprise" id="surprise" />
                      <Label htmlFor="surprise" className="text-white/80 text-sm">Surprise me sometimes</Label>
                    </div>
                  </RadioGroup>
                </Card>

                {/* Optional Name */}
                <Card className="p-4 bg-black/40 border-white/10 backdrop-blur-md">
                  <h3 className="text-white text-sm mb-3">Do you want to share your name? (optional)</h3>
                  <Input
                    value={tempOnboardingData.userName || ''}
                    onChange={(e) => setTempOnboardingData(prev => ({ ...prev, userName: e.target.value }))}
                    placeholder="Your name..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
                  />
                </Card>

                {tempOnboardingData.supportStyle && tempOnboardingData.checkinFrequency && (
                  <Button
                    onClick={completeOnboarding}
                    className="w-full bg-purple-600/90 hover:bg-purple-700 text-white py-3 rounded-full backdrop-blur-sm transition-all duration-300"
                  >
                    Begin Our Journey Together
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Main app interface
  return (
    <div 
      className={getBackgroundStyle()}
      style={selectedBackground && selectedBackground !== 'none' ? {
        background: backgroundOptions.find(bg => bg.id === selectedBackground)?.preview
      } : undefined}
    >
      {/* Video background overlay when active */}
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
        {/* Home Button - Top left corner - Always visible */}
        <div className="absolute top-4 left-4 z-30">
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
                <AlertDialogTitle className="text-white">Return to Start?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/70 leading-relaxed">
                  This will reset your session and return you to the welcome screen. 
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
                  Start Over
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

      <div className="flex-1 flex flex-col">
        
        {/* Main Avatar Area - Takes up most of the screen */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden px-4">
          
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-transparent to-slate-900/50" />
          
          {/* Overlapping Circles Avatar - Responsive sizing */}
          <div className="relative">
            {/* First Circle */}
            <div 
              className={`w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full bg-gradient-to-br ${circleColors.circle1} animate-pulse-slow opacity-90 blur-sm transition-all duration-500`}
              style={{
                animationDuration: `${animationSpeed}ms`,
                filter: `drop-shadow(0 0 30px ${circleColors.glow})`,
                transform: `scale(${1 + (conversationIntensity / 1000)})`
              }}
            />
            
            {/* Second Circle - Overlapping */}
            <div 
              className={`w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full bg-gradient-to-br ${circleColors.circle2} animate-pulse-slow opacity-80 absolute top-0 left-12 sm:left-14 md:left-16 blur-sm transition-all duration-500`}
              style={{
                animationDuration: `${animationSpeed * 1.3}ms`,
                animationDelay: '1s',
                filter: `drop-shadow(0 0 30px ${circleColors.glow})`,
                transform: `scale(${1 + (conversationIntensity / 1200)})`
              }}
            />
            
            {/* Center glow effect - responds to intensity */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div 
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-white/20 animate-breathe-glow transition-all duration-300"
                style={{
                  filter: `drop-shadow(0 0 40px ${circleColors.glow})`,
                  transform: `scale(${0.8 + (conversationIntensity / 200)})`,
                  opacity: 0.4 + (conversationIntensity / 250)
                }}
              />
            </div>
            
            {/* Intensity ripples for high-energy conversations */}
            {conversationIntensity > 60 && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div 
                  className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full border-2 border-white/10 animate-ping"
                  style={{
                    animationDuration: `${Math.max(800, 2000 - conversationIntensity * 10)}ms`
                  }}
                />
              </div>
            )}
            
            {/* Activity indicator */}
            <div className="absolute -bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2">
              {isLoading ? (
                <div className="flex items-center space-x-2 text-white/80">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm ml-2">Thinking...</span>
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
        {showChat && messages.length > 0 && (
          <div className="absolute inset-x-2 sm:inset-x-4 bottom-28 sm:bottom-32 h-1/4 min-h-[160px]">
            <Card className="h-full bg-black/40 border-white/10 backdrop-blur-md relative">
              {/* Chat Navigation Header */}
              <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-2 bg-black/20 backdrop-blur-sm border-b border-white/10 rounded-t-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateChat('back')}
                  disabled={!canScrollBack}
                  className={`text-white/70 hover:text-white hover:bg-white/10 min-w-[36px] h-8 ${
                    !canScrollBack ? 'opacity-30' : ''
                  }`}
                >
                  <CaretLeft size={16} />
                </Button>
                
                <div className="text-center text-white/60 text-xs">
                  {chatScrollOffset > 0 ? (
                    <span>Older messages • Swipe to navigate</span>
                  ) : (
                    <span>Recent • Swipe for history</span>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateChat('forward')}
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
                ref={chatContainerRef}
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

              {/* Swipe indicator dots */}
              {messages.length > MESSAGES_PER_PAGE && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {Array.from({ length: Math.ceil(messages.length / MESSAGES_PER_PAGE) }).map((_, index) => {
                    const isActive = index === Math.floor(chatScrollOffset / MESSAGES_PER_PAGE)
                    return (
                      <div
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                          isActive ? 'bg-white/60' : 'bg-white/20'
                        }`}
                      />
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Presence Selector Overlay */}
        {showPresenceSelector && (
          <div className="absolute inset-x-2 sm:inset-x-4 top-16 sm:top-20 bottom-28 sm:bottom-32">
            <Card className="p-4 sm:p-6 bg-black/40 border-white/10 backdrop-blur-md max-h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-base sm:text-lg font-medium">Switch Presence</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPresenceSelector(false)}
                  className="text-white hover:bg-white/10 min-w-[44px] h-11"
                >
                  <X size={18} />
                </Button>
              </div>
              
              <p className="text-white/60 text-sm mb-6 leading-relaxed">
                Choose a different companion to continue your conversation. Your new presence will understand your context and pick up where you left off.
              </p>

              <div className="grid grid-cols-1 gap-4">
                {presences.map((presence) => {
                  const isCurrent = getCurrentPresence().id === presence.id
                  return (
                    <Card
                      key={presence.id}
                      className={`p-4 cursor-pointer transition-all duration-300 bg-black/40 border backdrop-blur-md ${
                        isCurrent
                          ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20 opacity-50 cursor-not-allowed' 
                          : 'border-white/10 hover:border-white/30 hover:bg-black/60'
                      }`}
                      onClick={() => !isCurrent && switchPresence(presence.id)}
                    >
                      <div className="flex items-center space-x-4">
                        {/* Presence visualization */}
                        <div className="relative flex-shrink-0 h-12 w-16 flex items-center justify-center">
                          <div 
                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${presence.colors.circle1} animate-pulse-slow opacity-90`}
                            style={{ filter: `drop-shadow(0 0 15px ${presence.colors.glow})` }}
                          />
                          <div 
                            className={`w-6 h-6 rounded-full bg-gradient-to-br ${presence.colors.circle2} absolute opacity-80 animate-pulse-slow`}
                            style={{ 
                              filter: `drop-shadow(0 0 10px ${presence.colors.glow})`,
                              animationDelay: '0.5s',
                              transform: 'translateX(6px)'
                            }}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-white text-lg font-medium">{presence.name}</h4>
                            {isCurrent && (
                              <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-white/70 text-sm leading-relaxed">
                            {presence.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Background Selector Overlay */}
        {showBackgroundSelector && (
          <div className="absolute inset-x-2 sm:inset-x-4 top-16 sm:top-20 bottom-28 sm:bottom-32">
            <Card className="p-4 sm:p-6 bg-black/40 border-white/10 backdrop-blur-md max-h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-base sm:text-lg font-medium">Choose Background</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBackgroundSelector(false)}
                  className="text-white hover:bg-white/10 min-w-[44px] h-11"
                >
                  <X size={18} />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {backgroundOptions.map((bg) => (
                  <Button
                    key={bg.id}
                    variant="ghost"
                    onClick={() => {
                      setSelectedBackground(bg.id)
                      setShowBackgroundSelector(false)
                    }}
                    className={`h-16 sm:h-20 flex flex-col items-center justify-center space-y-2 border-2 transition-all min-w-[120px] ${
                      selectedBackground === bg.id 
                        ? 'border-purple-400 bg-purple-500/20' 
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div 
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                      style={{ background: bg.preview }}
                    />
                    <span className="text-xs text-white">{bg.name}</span>
                  </Button>
                ))}
              </div>
              
              {/* Camera controls */}
              <div className="mt-4 sm:mt-6 pt-4 border-t border-white/10">
                <h4 className="text-white text-sm font-medium mb-3">Camera</h4>
                <div className="flex space-x-3">
                  <Button
                    variant="ghost"
                    onClick={isVideoActive ? stopVideo : startVideo}
                    className={`flex-1 min-h-[44px] ${isVideoActive ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}
                  >
                    <VideoCamera size={16} className="mr-2" />
                    <span className="text-sm">{isVideoActive ? 'Stop Camera' : 'Start Camera'}</span>
                  </Button>
                  {isVideoActive && (
                    <Button
                      variant="ghost"
                      onClick={switchCamera}
                      className="bg-blue-500/20 text-blue-200 min-w-[44px] min-h-[44px]"
                    >
                      <CameraRotate size={16} />
                    </Button>
                  )}
                </div>
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
                    onClick={() => registerMood(level)}
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
            {/* Presence Switch */}
            <Button
              size="lg"
              variant="ghost"
              onClick={() => setShowPresenceSelector(!showPresenceSelector)}
              className="w-14 h-14 sm:w-16 sm:h-16 min-w-[56px] min-h-[56px] rounded-full bg-orange-600/90 hover:bg-orange-700 active:bg-orange-800 text-white backdrop-blur-sm transition-colors touch-manipulation"
            >
              <Swap size={20} />
            </Button>
            
            {/* Video/Background */}
            <Button
              size="lg"
              variant="ghost"
              onClick={() => setShowBackgroundSelector(!showBackgroundSelector)}
              className={`w-14 h-14 sm:w-16 sm:h-16 min-w-[56px] min-h-[56px] rounded-full text-white backdrop-blur-sm transition-colors touch-manipulation ${
                isVideoActive 
                  ? 'bg-green-600/90 hover:bg-green-700 active:bg-green-800' 
                  : 'bg-blue-600/90 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isVideoActive ? <VideoCamera size={20} /> : <Image size={20} />}
            </Button>
            
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
                  setVoiceEnabled(!voiceEnabled)
                }
              }}
              className={`w-14 h-14 sm:w-16 sm:h-16 min-w-[56px] min-h-[56px] rounded-full text-white backdrop-blur-sm transition-colors touch-manipulation ${
                voiceEnabled && !isSpeaking
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
            
            {/* Chat Navigation Status */}
            {showChat && messages.length > MESSAGES_PER_PAGE && (
              <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-200 border-cyan-400/30 backdrop-blur-sm text-xs px-2 py-1">
                {chatScrollOffset > 0 
                  ? `Viewing older messages (${Math.floor(chatScrollOffset / MESSAGES_PER_PAGE) + 1}/${Math.ceil(messages.length / MESSAGES_PER_PAGE)})`
                  : `Latest messages (${messages.length} total)`
                }
              </Badge>
            )}
            
            {/* Current Mood Indicator */}
            {moodEntries.length > 0 && (
              <Badge variant="secondary" className="bg-white/10 text-white/80 border-white/20 backdrop-blur-sm text-xs px-2 py-1">
                Mood: {getMoodEmoji(moodEntries[0].level)} {moodEntries[0].level}/5
              </Badge>
            )}
            
            {/* Voice Status */}
            <Badge variant="secondary" className={`border-white/20 backdrop-blur-sm text-xs px-2 py-1 ${
              voiceEnabled ? 'bg-green-500/20 text-green-200' : 'bg-gray-500/20 text-gray-200'
            }`}>
              Voice: {voiceEnabled ? 'On' : 'Off'}
            </Badge>
            
            {/* Camera Status */}
            {isVideoActive && (
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 border-white/20 backdrop-blur-sm text-xs px-2 py-1">
                Camera: {currentCamera === 'front' ? 'Front' : 'Back'}
              </Badge>
            )}
          </div>

          {/* Conversation Intensity Debug (for testing) */}
          {conversationIntensity !== 30 && (
            <div className="text-center">
              <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400/30 backdrop-blur-sm text-xs px-2 py-1">
                Intensity: {Math.round(conversationIntensity)}/100
              </Badge>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

export default App