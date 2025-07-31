import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Mic } from "@phosphor-icons/react"
import { useKV } from '@github/spark/hooks'

interface Message {
  id: string
  text: string
  sender: 'user' | 'avatar'
  timestamp: Date
  mood?: 'calm' | 'joyful' | 'concerned' | 'contemplative' | 'supportive'
}

function App() {
  const [messages, setMessages] = useKV<Message[]>("conversation-history", [])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [currentMood, setCurrentMood] = useState<'calm' | 'joyful' | 'concerned' | 'contemplative' | 'supportive'>('calm')

  const analyzeMood = async (text: string): Promise<'calm' | 'joyful' | 'concerned' | 'contemplative' | 'supportive'> => {
    try {
      const prompt = spark.llmPrompt`Analyze the emotional tone of this message and return only one word from: calm, joyful, concerned, contemplative, supportive. Message: "${text}"`
      const moodResult = await spark.llm(prompt, "gpt-4o-mini")
      const mood = moodResult.toLowerCase().trim() as 'calm' | 'joyful' | 'concerned' | 'contemplative' | 'supportive'
      
      // Validate the result
      const validMoods = ['calm', 'joyful', 'concerned', 'contemplative', 'supportive']
      return validMoods.includes(mood) ? mood : 'calm'
    } catch {
      return 'calm'
    }
  }

  const sendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText("")
    setIsTyping(true)

    // Simulate avatar response with LLM
    try {
      const prompt = spark.llmPrompt`You are an empathetic, caring AI companion with a gentle, understanding nature. Respond to this message with genuine warmth and empathy, offering thoughtful support or conversation: "${inputText}"`
      const response = await spark.llm(prompt, "gpt-4o")
      
      // Analyze mood of the response
      const mood = await analyzeMood(response)
      setCurrentMood(mood)
      
      const avatarMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'avatar',
        timestamp: new Date(),
        mood: mood
      }

      setMessages(prev => [...prev, avatarMessage])
    } catch (error) {
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm here with you. Please tell me more about what's on your mind.",
        sender: 'avatar',
        timestamp: new Date(),
        mood: 'supportive'
      }
      setCurrentMood('supportive')
      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsTyping(false)
    }
  }

  // Mood-based visual configurations
  const getMoodConfig = (mood: string) => {
    switch (mood) {
      case 'joyful':
        return {
          containerGradient: 'from-amber-400/20 via-orange-300/10 to-yellow-200/15',
          glowColor: 'from-amber-400/30 to-orange-300/20',
          eyeColor: 'bg-amber-400',
          eyeShadow: 'shadow-amber-400/60',
          mouthClass: 'w-16 h-4 bg-amber-400/90',
          animationSpeed: 'animate-pulse',
          orbitals: [
            { pos: 'top-6 left-6', color: 'bg-amber-400/70', anim: 'animate-bounce' },
            { pos: 'bottom-8 right-8', color: 'bg-orange-300/80', anim: 'animate-ping' },
            { pos: 'top-12 right-6', color: 'bg-yellow-300/60', anim: 'animate-pulse' }
          ]
        }
      case 'concerned':
        return {
          containerGradient: 'from-blue-500/15 via-indigo-400/8 to-purple-300/12',
          glowColor: 'from-blue-500/25 to-indigo-400/15',
          eyeColor: 'bg-blue-500',
          eyeShadow: 'shadow-blue-500/50',
          mouthClass: 'w-10 h-2 bg-blue-500/80',
          animationSpeed: 'animate-pulse duration-1000',
          orbitals: [
            { pos: 'top-8 left-8', color: 'bg-blue-500/60', anim: 'animate-pulse' },
            { pos: 'bottom-12 right-12', color: 'bg-indigo-400/70', anim: 'animate-bounce' },
            { pos: 'top-16 right-8', color: 'bg-purple-400/50', anim: 'animate-ping' }
          ]
        }
      case 'contemplative':
        return {
          containerGradient: 'from-purple-400/15 via-violet-300/8 to-indigo-300/12',
          glowColor: 'from-purple-400/25 to-violet-300/15',
          eyeColor: 'bg-purple-400',
          eyeShadow: 'shadow-purple-400/50',
          mouthClass: 'w-8 h-2 bg-purple-400/80',
          animationSpeed: 'animate-pulse duration-2000',
          orbitals: [
            { pos: 'top-10 left-10', color: 'bg-purple-400/60', anim: 'animate-pulse' },
            { pos: 'bottom-10 right-10', color: 'bg-violet-300/70', anim: 'animate-pulse' },
            { pos: 'top-20 right-10', color: 'bg-indigo-400/50', anim: 'animate-pulse' }
          ]
        }
      case 'supportive':
        return {
          containerGradient: 'from-green-400/15 via-emerald-300/8 to-teal-300/12',
          glowColor: 'from-green-400/25 to-emerald-300/15',
          eyeColor: 'bg-green-400',
          eyeShadow: 'shadow-green-400/50',
          mouthClass: 'w-14 h-3 bg-green-400/85',
          animationSpeed: 'animate-pulse duration-1500',
          orbitals: [
            { pos: 'top-8 left-8', color: 'bg-green-400/60', anim: 'animate-bounce' },
            { pos: 'bottom-12 right-12', color: 'bg-emerald-300/70', anim: 'animate-pulse' },
            { pos: 'top-16 right-8', color: 'bg-teal-300/60', anim: 'animate-ping' }
          ]
        }
      default: // calm
        return {
          containerGradient: 'from-accent/10 via-primary/5 to-transparent',
          glowColor: 'from-accent/20 to-primary/10',
          eyeColor: 'bg-accent',
          eyeShadow: 'shadow-accent/50',
          mouthClass: 'w-12 h-3 bg-accent/80',
          animationSpeed: 'animate-pulse',
          orbitals: [
            { pos: 'top-8 left-8', color: 'bg-accent/60', anim: 'animate-bounce' },
            { pos: 'bottom-12 right-12', color: 'bg-primary/80', anim: 'animate-ping' },
            { pos: 'top-16 right-8', color: 'bg-accent/40', anim: 'animate-pulse' }
          ]
        }
    }
  }

  const moodConfig = getMoodConfig(currentMood)

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Avatar Section - Takes up majority of screen */}
        <div className="flex-1 lg:flex-[2] flex items-center justify-center p-8 relative overflow-hidden">
          {/* Ethereal Background Effects */}
          <div className={`absolute inset-0 bg-gradient-to-br ${moodConfig.containerGradient} transition-all duration-2000`}></div>
          <div className="absolute inset-0 bg-gradient-radial from-accent/20 via-transparent to-transparent opacity-60"></div>
          
          {/* Avatar Container */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
            
            {/* Main Avatar Display */}
            <div className="relative">
              {/* Avatar Face Container */}
              <div className={`w-80 h-80 lg:w-96 lg:h-96 rounded-full bg-gradient-to-br from-card via-accent/10 to-primary/20 shadow-2xl border border-accent/30 flex items-center justify-center relative overflow-hidden transition-all duration-2000`}>
                
                {/* Animated Background Patterns */}
                <div className={`absolute inset-0 bg-gradient-radial from-accent/30 via-transparent to-transparent ${moodConfig.animationSpeed}`}></div>
                <div className="absolute inset-0 bg-gradient-conic from-primary/20 via-transparent to-accent/20 animate-spin-slow"></div>
                
                {/* Face Features */}
                <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
                  
                  {/* Eyes */}
                  <div className="flex space-x-8">
                    <div className={`w-6 h-6 rounded-full ${moodConfig.eyeColor} ${moodConfig.animationSpeed} shadow-lg ${moodConfig.eyeShadow} transition-all duration-1000`}></div>
                    <div className={`w-6 h-6 rounded-full ${moodConfig.eyeColor} ${moodConfig.animationSpeed} shadow-lg ${moodConfig.eyeShadow} transition-all duration-1000`} style={{animationDelay: '0.5s'}}></div>
                  </div>
                  
                  {/* Nose/Center Point */}
                  <div className={`w-2 h-2 rounded-full ${moodConfig.eyeColor} opacity-60 transition-all duration-1000`}></div>
                  
                  {/* Mouth/Expression Area */}
                  <div className={`${moodConfig.mouthClass} rounded-full shadow-lg transition-all duration-1000 ${isTyping ? 'animate-pulse scale-110' : ''}`}></div>
                  
                </div>
                
                {/* Orbital Elements */}
                <div className="absolute inset-0">
                  {moodConfig.orbitals.map((orbital, index) => (
                    <div key={index} className={`absolute ${orbital.pos} w-2 h-2 rounded-full ${orbital.color} ${orbital.anim} transition-all duration-1000`}></div>
                  ))}
                </div>
              </div>
              
              {/* Avatar Glow Effect */}
              <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${moodConfig.glowColor} blur-xl scale-110 animate-pulse transition-all duration-2000`}></div>
            </div>
            
            {/* Status Indicator */}
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${isTyping ? 'bg-accent animate-pulse' : moodConfig.eyeColor}`}></div>
              <span className="text-sm text-muted-foreground font-medium">
                {isTyping ? 'Thinking...' : `${currentMood.charAt(0).toUpperCase() + currentMood.slice(1)} • Listening`}
              </span>
            </div>
          </div>
        </div>

        {/* Conversation Section */}
        <div className="lg:flex-1 lg:max-w-md border-t lg:border-t-0 lg:border-l border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="h-full flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-border/50">
              <h1 className="text-xl font-semibold text-foreground">Conversation</h1>
              <p className="text-sm text-muted-foreground mt-1">Share your thoughts freely</p>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-2">Welcome</p>
                    <p className="text-sm text-muted-foreground">I'm here to listen and understand. What would you like to talk about?</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <Card className={`max-w-[80%] p-4 relative ${ 
                        message.sender === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted border-accent/20'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className={`text-xs opacity-70 ${
                            message.sender === 'user' ? 'text-primary-foreground' : 'text-muted-foreground'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {message.sender === 'avatar' && message.mood && (
                            <span className={`text-xs px-2 py-1 rounded-full bg-opacity-20 ${
                              message.mood === 'joyful' ? 'bg-amber-400 text-amber-700' :
                              message.mood === 'concerned' ? 'bg-blue-500 text-blue-700' :
                              message.mood === 'contemplative' ? 'bg-purple-400 text-purple-700' :
                              message.mood === 'supportive' ? 'bg-green-400 text-green-700' :
                              'bg-accent text-accent-foreground'
                            }`}>
                              {message.mood}
                            </span>
                          )}
                        </div>
                      </Card>
                    </div>
                  ))
                )}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <Card className="bg-muted border-accent/20 p-4">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-accent animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-6 border-t border-border/50 bg-background/50">
              <div className="flex space-x-3">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 bg-background border-accent/30 focus:border-accent"
                  disabled={isTyping}
                />
                <Button 
                  size="icon"
                  onClick={sendMessage}
                  disabled={!inputText.trim() || isTyping}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Send size={16} />
                </Button>
                <Button 
                  size="icon"
                  variant="outline"
                  className="border-accent/30 hover:bg-accent/10"
                >
                  <Mic size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App