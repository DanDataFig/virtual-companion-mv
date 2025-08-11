import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PaperPlaneTilt, VideoCamera, Microphone, MicrophoneSlash, Smiley, CameraRotate, Image, X, SpeakerHigh, SpeakerX } from "@phosphor-icons/react"
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

function App() {
  const [messages, setMessages] = useKV<Message[]>("chat-messages", [])
  const [moodEntries, setMoodEntries] = useKV<MoodEntry[]>("mood-entries", [])
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
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

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

      const prompt = spark.llmPrompt`You are a compassionate AI emotional companion. Respond empathetically and supportively to the user.

Context:
${recentMoodContext}

Recent conversation:
${conversationContext}

User: ${userMessage.content}

Respond naturally and warmly, showing you understand their emotional state. Keep responses concise but meaningful.`

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

  // Get circle colors based on mood and activity
  const getCircleColors = () => {
    if (isLoading) {
      return {
        circle1: 'from-cyan-400 to-blue-500',
        circle2: 'from-purple-400 to-pink-500',
        glow: 'rgba(59, 130, 246, 0.4)'
      }
    }
    
    // Blend mood with conversation intensity
    const intensityFactor = conversationIntensity / 100
    
    switch (companionMood) {
      case 1:
      case 2:
        return {
          circle1: intensityFactor > 0.7 ? 'from-blue-600 to-indigo-700' : 'from-blue-400 to-indigo-500',
          circle2: intensityFactor > 0.7 ? 'from-slate-600 to-blue-600' : 'from-slate-400 to-blue-400',
          glow: `rgba(99, 102, 241, ${0.3 + intensityFactor * 0.4})`
        }
      case 4:
      case 5:
        return {
          circle1: intensityFactor > 0.7 ? 'from-emerald-600 to-green-700' : 'from-emerald-400 to-green-500',
          circle2: intensityFactor > 0.7 ? 'from-teal-600 to-emerald-600' : 'from-teal-400 to-emerald-400',
          glow: `rgba(16, 185, 129, ${0.3 + intensityFactor * 0.4})`
        }
      default:
        return {
          circle1: intensityFactor > 0.7 ? 'from-purple-600 to-violet-700' : 'from-purple-400 to-violet-500',
          circle2: intensityFactor > 0.7 ? 'from-pink-600 to-purple-600' : 'from-pink-400 to-purple-400',
          glow: `rgba(168, 85, 247, ${0.3 + intensityFactor * 0.4})`
        }
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
      <div className="flex-1 flex flex-col">
        
        {/* Main Avatar Area - Takes up most of the screen */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-transparent to-slate-900/50" />
          
          {/* Overlapping Circles Avatar */}
          <div className="relative">
            {/* First Circle */}
            <div 
              className={`w-80 h-80 rounded-full bg-gradient-to-br ${circleColors.circle1} animate-pulse-slow opacity-90 blur-sm transition-all duration-500`}
              style={{
                animationDuration: `${animationSpeed}ms`,
                filter: `drop-shadow(0 0 40px ${circleColors.glow})`,
                transform: `scale(${1 + (conversationIntensity / 1000)})`
              }}
            />
            
            {/* Second Circle - Overlapping */}
            <div 
              className={`w-80 h-80 rounded-full bg-gradient-to-br ${circleColors.circle2} animate-pulse-slow opacity-80 absolute top-0 left-16 blur-sm transition-all duration-500`}
              style={{
                animationDuration: `${animationSpeed * 1.3}ms`,
                animationDelay: '1s',
                filter: `drop-shadow(0 0 40px ${circleColors.glow})`,
                transform: `scale(${1 + (conversationIntensity / 1200)})`
              }}
            />
            
            {/* Center glow effect - responds to intensity */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div 
                className="w-32 h-32 rounded-full bg-white/20 animate-breathe-glow transition-all duration-300"
                style={{
                  filter: `drop-shadow(0 0 60px ${circleColors.glow})`,
                  transform: `scale(${0.8 + (conversationIntensity / 200)})`,
                  opacity: 0.4 + (conversationIntensity / 250)
                }}
              />
            </div>
            
            {/* Intensity ripples for high-energy conversations */}
            {conversationIntensity > 60 && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div 
                  className="w-96 h-96 rounded-full border-2 border-white/10 animate-ping"
                  style={{
                    animationDuration: `${Math.max(800, 2000 - conversationIntensity * 10)}ms`
                  }}
                />
              </div>
            )}
            
            {/* Activity indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              {isLoading ? (
                <div className="flex items-center space-x-2 text-white/80">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm ml-2">Thinking...</span>
                </div>
              ) : (
                <div className="text-center text-white/60">
                  <div className="text-sm">Your Companion</div>
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

        {/* Chat Messages Overlay */}
        {showChat && messages.length > 0 && (
          <div className="absolute inset-x-4 top-20 bottom-32">
            <Card className="h-full bg-black/40 border-white/10 backdrop-blur-md">
              <ScrollArea ref={scrollAreaRef} className="h-full p-4">
                <div className="space-y-3">
                  {messages.slice(-6).map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        message.sender === 'user' 
                          ? 'bg-white/20 text-white backdrop-blur-sm' 
                          : 'bg-purple-500/30 text-white backdrop-blur-sm'
                      }`}>
                        {message.content}
                        {message.sender === 'companion' && isSpeaking && (
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
            </Card>
          </div>
        )}

        {/* Background Selector Overlay */}
        {showBackgroundSelector && (
          <div className="absolute inset-x-4 top-20 bottom-32">
            <Card className="p-6 bg-black/40 border-white/10 backdrop-blur-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-lg font-medium">Choose Background</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBackgroundSelector(false)}
                  className="text-white hover:bg-white/10"
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
                    className={`h-20 flex flex-col items-center justify-center space-y-2 border-2 transition-all ${
                      selectedBackground === bg.id 
                        ? 'border-purple-400 bg-purple-500/20' 
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-full"
                      style={{ background: bg.preview }}
                    />
                    <span className="text-xs text-white">{bg.name}</span>
                  </Button>
                ))}
              </div>
              
              {/* Camera controls */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <h4 className="text-white text-sm font-medium mb-3">Camera</h4>
                <div className="flex space-x-3">
                  <Button
                    variant="ghost"
                    onClick={isVideoActive ? stopVideo : startVideo}
                    className={`flex-1 ${isVideoActive ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}
                  >
                    <VideoCamera size={16} className="mr-2" />
                    {isVideoActive ? 'Stop Camera' : 'Start Camera'}
                  </Button>
                  {isVideoActive && (
                    <Button
                      variant="ghost"
                      onClick={switchCamera}
                      className="bg-blue-500/20 text-blue-200"
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
          <div className="absolute inset-x-4 bottom-32">
            <Card className="p-4 bg-black/40 border-white/10 backdrop-blur-md">
              <h3 className="text-white text-sm font-medium mb-3 text-center">How are you feeling?</h3>
              <div className="flex justify-between">
                {[1, 2, 3, 4, 5].map((level) => (
                  <Button
                    key={level}
                    variant="ghost"
                    onClick={() => registerMood(level)}
                    className="h-12 w-12 flex flex-col items-center justify-center hover:bg-white/10 rounded-xl"
                  >
                    <span className="text-xl">{getMoodEmoji(level)}</span>
                    <span className="text-xs text-white/60">{level}</span>
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="p-6 space-y-4">
          
          {/* Call-style Controls */}
          <div className="flex justify-center items-center space-x-6">
            {/* Video/Background */}
            <Button
              size="lg"
              variant="ghost"
              onClick={() => setShowBackgroundSelector(!showBackgroundSelector)}
              className={`w-16 h-16 rounded-full text-white backdrop-blur-sm transition-colors ${
                isVideoActive 
                  ? 'bg-green-600/90 hover:bg-green-700' 
                  : 'bg-blue-600/90 hover:bg-blue-700'
              }`}
            >
              {isVideoActive ? <VideoCamera size={24} /> : <Image size={24} />}
            </Button>
            
            {/* Voice Chat */}
            <Button
              size="lg"
              variant="ghost"
              onClick={() => setIsListening(!isListening)}
              className={`w-16 h-16 rounded-full text-white backdrop-blur-sm transition-colors ${
                isListening 
                  ? 'bg-red-600/90 hover:bg-red-700' 
                  : 'bg-blue-600/90 hover:bg-blue-700'
              }`}
            >
              {isListening ? <MicrophoneSlash size={24} /> : <Microphone size={24} />}
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
              className={`w-16 h-16 rounded-full text-white backdrop-blur-sm transition-colors ${
                voiceEnabled && !isSpeaking
                  ? 'bg-green-600/90 hover:bg-green-700' 
                  : isSpeaking
                  ? 'bg-red-600/90 hover:bg-red-700'
                  : 'bg-gray-600/90 hover:bg-gray-700'
              }`}
            >
              {isSpeaking ? <SpeakerX size={24} /> : <SpeakerHigh size={24} />}
            </Button>
            
            {/* Mood Check */}
            <Button
              size="lg"
              variant="ghost"
              onClick={() => setShowMoodSelector(!showMoodSelector)}
              className="w-16 h-16 rounded-full bg-purple-600/90 hover:bg-purple-700 text-white backdrop-blur-sm"
            >
              <Smiley size={24} />
            </Button>
          </div>

          {/* Text Input */}
          <div className="flex space-x-3">
            <Input
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={() => setShowChat(true)}
              placeholder="Type your message..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 backdrop-blur-sm rounded-full px-6 py-3"
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isLoading}
              className={`bg-purple-600/90 hover:bg-purple-700 rounded-full px-6 backdrop-blur-sm transition-all duration-300 ${
                conversationIntensity > 60 ? 'animate-pulse shadow-lg shadow-purple-500/30' : ''
              }`}
            >
              <PaperPlaneTilt size={18} />
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="flex justify-center space-x-4">
            {/* Current Mood Indicator */}
            {moodEntries.length > 0 && (
              <Badge variant="secondary" className="bg-white/10 text-white/80 border-white/20 backdrop-blur-sm">
                Mood: {getMoodEmoji(moodEntries[0].level)} {moodEntries[0].level}/5
              </Badge>
            )}
            
            {/* Voice Status */}
            <Badge variant="secondary" className={`border-white/20 backdrop-blur-sm ${
              voiceEnabled ? 'bg-green-500/20 text-green-200' : 'bg-gray-500/20 text-gray-200'
            }`}>
              Voice: {voiceEnabled ? 'On' : 'Off'}
            </Badge>
            
            {/* Camera Status */}
            {isVideoActive && (
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 border-white/20 backdrop-blur-sm">
                Camera: {currentCamera === 'front' ? 'Front' : 'Back'}
              </Badge>
            )}
          </div>

          {/* Conversation Intensity Debug (for testing) */}
          {conversationIntensity !== 30 && (
            <div className="text-center">
              <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400/30 backdrop-blur-sm">
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