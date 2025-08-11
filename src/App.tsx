import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PaperPlaneTilt, VideoCamera, Microphone, MicrophoneSlash, Smiley } from "@phosphor-icons/react"
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

  // Infinity loop animation configuration based on mood
  const getInfinityConfig = () => {
    switch (companionMood) {
      case 1:
      case 2:
        return {
          color: 'from-blue-400 via-blue-500 to-blue-600',
          glow: 'drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]',
          speed: 'animate-spin-slow'
        }
      case 4:
      case 5:
        return {
          color: 'from-green-400 via-emerald-500 to-green-600',
          glow: 'drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]',
          speed: 'animate-spin'
        }
      default:
        return {
          color: 'from-purple-400 via-pink-500 to-purple-600',
          glow: 'drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]',
          speed: 'animate-spin'
        }
    }
  }

  const infinityConfig = getInfinityConfig()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto p-4 max-w-md h-screen flex flex-col">
        
        {/* Header with avatar */}
        <div className="flex-shrink-0 text-center py-8">
          <div className="relative mb-6">
            {/* Infinity loop avatar */}
            <div className="w-40 h-20 mx-auto relative flex items-center justify-center animate-float">
              <svg 
                viewBox="0 0 160 80" 
                className={`w-full h-full filter ${infinityConfig.glow}`}
              >
                {/* Infinity symbol path */}
                <path
                  d="M 20 40 C 20 20, 40 20, 40 40 C 40 60, 20 60, 20 40 M 40 40 C 40 20, 60 20, 60 40 C 60 60, 40 60, 40 40 M 60 40 C 60 20, 80 20, 80 40 C 80 60, 60 60, 60 40 M 80 40 C 80 20, 100 20, 100 40 C 100 60, 80 60, 80 40 M 100 40 C 100 20, 120 20, 120 40 C 120 60, 100 60, 100 40 M 120 40 C 120 20, 140 20, 140 40 C 140 60, 120 60, 120 40"
                  fill="none"
                  stroke="url(#infinityGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className={`${infinityConfig.speed}`}
                  style={{ 
                    animationDuration: companionMood <= 2 ? '8s' : '4s',
                    transformOrigin: 'center'
                  }}
                />
                
                {/* Pulsing dots along the path */}
                <circle cx="20" cy="40" r="2" fill="url(#dotGradient)" className="animate-pulse">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="80" cy="40" r="2" fill="url(#dotGradient)" className="animate-pulse">
                  <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="140" cy="40" r="2" fill="url(#dotGradient)" className="animate-pulse">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
                
                <defs>
                  <linearGradient id="infinityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={
                      companionMood <= 2 ? "#60a5fa" : companionMood >= 4 ? "#34d399" : "#a855f7"
                    } />
                    <stop offset="50%" stopColor={
                      companionMood <= 2 ? "#3b82f6" : companionMood >= 4 ? "#10b981" : "#ec4899"
                    } />
                    <stop offset="100%" stopColor={
                      companionMood <= 2 ? "#2563eb" : companionMood >= 4 ? "#059669" : "#9333ea"
                    } />
                  </linearGradient>
                  <radialGradient id="dotGradient">
                    <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="white" stopOpacity="0.3" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
            
            {/* Status indicator */}
            <div className="text-center mt-4">
              <div className="flex items-center justify-center space-x-2 text-sm text-slate-300">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-breathe"></div>
                <span>Present • {getMoodEmoji(companionMood)} Feeling {companionMood}/5</span>
              </div>
            </div>
          </div>
          
          <h1 className="text-xl font-medium text-white mb-2">Your Companion</h1>
          <p className="text-sm text-slate-400">I'm here to listen and be with you</p>
        </div>

        {/* Chat Messages */}
        <Card className="flex-1 bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-4 overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="h-full p-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">{getMoodEmoji(3)}</div>
                <p className="text-slate-400 mb-4">Start a conversation</p>
                <p className="text-sm text-slate-500">Share what's on your mind. I'm here to listen.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} ${
                      message.sender === 'user' ? 'animate-slide-in-right' : 'animate-slide-in-left'
                    }`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.sender === 'user' 
                        ? 'bg-purple-600 text-white shadow-lg' 
                        : 'bg-slate-700 text-slate-100 shadow-lg'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700 text-slate-100 rounded-2xl px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Mood Selector */}
        {showMoodSelector && (
          <Card className="mb-4 p-4 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <h3 className="text-white text-sm font-medium mb-3">How are you feeling?</h3>
            <div className="flex justify-between">
              {[1, 2, 3, 4, 5].map((level) => (
                <Button
                  key={level}
                  variant="ghost"
                  onClick={() => registerMood(level)}
                  className="h-16 w-16 flex flex-col items-center justify-center hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  <span className="text-2xl mb-1">{getMoodEmoji(level)}</span>
                  <span className="text-xs text-slate-400">{level}</span>
                </Button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2 px-2">
              <span>Very Sad</span>
              <span>Neutral</span>
              <span>Very Happy</span>
            </div>
          </Card>
        )}

        {/* Bottom Controls */}
        <div className="flex-shrink-0 space-y-3">
          
          {/* Video Call Interface */}
          <div className="flex justify-center space-x-4">
            <Button
              size="lg"
              variant="ghost"
              className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 text-white"
            >
              <VideoCamera size={24} />
            </Button>
            
            <Button
              size="lg"
              variant="ghost" 
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              <MicrophoneSlash size={24} />
            </Button>
            
            <Button
              size="lg"
              variant="ghost"
              onClick={() => setShowMoodSelector(!showMoodSelector)}
              className="w-14 h-14 rounded-full bg-slate-600 hover:bg-slate-700 text-white"
            >
              <Smiley size={24} />
            </Button>
          </div>

          {/* Message Input */}
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="flex-1 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-purple-500"
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <PaperPlaneTilt size={16} />
            </Button>
          </div>

          {/* Recent mood indicator */}
          {moodEntries.length > 0 && (
            <div className="text-center">
              <Badge variant="secondary" className="bg-slate-700/50 text-slate-300 border-slate-600">
                Last mood: {getMoodEmoji(moodEntries[0].level)} {moodEntries[0].level}/5
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App