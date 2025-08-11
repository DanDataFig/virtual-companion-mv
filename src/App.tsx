import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PaperPlaneTilt, VideoCamera, Microphone, MicrophoneSlash, Smiley, Phone } from "@phosphor-icons/react"
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

function App() {
  const [messages, setMessages] = useKV<Message[]>("chat-messages", [])
  const [moodEntries, setMoodEntries] = useKV<MoodEntry[]>("mood-entries", [])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showMoodSelector, setShowMoodSelector] = useState(false)
  const [currentMood, setCurrentMood] = useState(3)
  const [showChat, setShowChat] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
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

  // Handle enter key in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
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
    
    switch (companionMood) {
      case 1:
      case 2:
        return {
          circle1: 'from-blue-400 to-indigo-500',
          circle2: 'from-slate-400 to-blue-400',
          glow: 'rgba(99, 102, 241, 0.3)'
        }
      case 4:
      case 5:
        return {
          circle1: 'from-emerald-400 to-green-500',
          circle2: 'from-teal-400 to-emerald-400',
          glow: 'rgba(16, 185, 129, 0.3)'
        }
      default:
        return {
          circle1: 'from-purple-400 to-violet-500',
          circle2: 'from-pink-400 to-purple-400',
          glow: 'rgba(168, 85, 247, 0.3)'
        }
    }
  }

  const circleColors = getCircleColors()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <div className="flex-1 flex flex-col">
        
        {/* Main Avatar Area - Takes up most of the screen */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-transparent to-slate-900/50" />
          
          {/* Overlapping Circles Avatar */}
          <div className="relative">
            {/* First Circle */}
            <div 
              className={`w-80 h-80 rounded-full bg-gradient-to-br ${circleColors.circle1} animate-pulse-slow opacity-90 blur-sm`}
              style={{
                animationDuration: '3s',
                filter: `drop-shadow(0 0 40px ${circleColors.glow})`
              }}
            />
            
            {/* Second Circle - Overlapping */}
            <div 
              className={`w-80 h-80 rounded-full bg-gradient-to-br ${circleColors.circle2} animate-pulse-slow opacity-80 absolute top-0 left-16 blur-sm`}
              style={{
                animationDuration: '4s',
                animationDelay: '1s',
                filter: `drop-shadow(0 0 40px ${circleColors.glow})`
              }}
            />
            
            {/* Center glow effect */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div 
                className="w-32 h-32 rounded-full bg-white/20 animate-breathe-glow"
                style={{
                  filter: `drop-shadow(0 0 60px ${circleColors.glow})`
                }}
              />
            </div>
            
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
                  <div className="text-xs">Tap to chat or speak</div>
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
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
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
          <div className="flex justify-center items-center space-x-8">
            {/* Video Call */}
            <Button
              size="lg"
              variant="ghost"
              className="w-16 h-16 rounded-full bg-green-600/90 hover:bg-green-700 text-white backdrop-blur-sm"
            >
              <VideoCamera size={24} />
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
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setShowChat(true)}
              placeholder="Type your message..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 backdrop-blur-sm rounded-full px-6 py-3"
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isLoading}
              className="bg-purple-600/90 hover:bg-purple-700 rounded-full px-6 backdrop-blur-sm"
            >
              <PaperPlaneTilt size={18} />
            </Button>
          </div>

          {/* Current Mood Indicator */}
          {moodEntries.length > 0 && (
            <div className="text-center">
              <Badge variant="secondary" className="bg-white/10 text-white/80 border-white/20 backdrop-blur-sm">
                Current mood: {getMoodEmoji(moodEntries[0].level)} {moodEntries[0].level}/5
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App