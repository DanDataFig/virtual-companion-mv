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
}

function App() {
  const [messages, setMessages] = useKV<Message[]>("conversation-history", [])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)

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
      
      const avatarMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'avatar',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, avatarMessage])
    } catch (error) {
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm here with you. Please tell me more about what's on your mind.",
        sender: 'avatar',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsTyping(false)
    }
  }

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
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-primary/5 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-radial from-accent/20 via-transparent to-transparent opacity-60"></div>
          
          {/* Avatar Container */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
            
            {/* Main Avatar Display */}
            <div className="relative">
              {/* Avatar Face Container */}
              <div className="w-80 h-80 lg:w-96 lg:h-96 rounded-full bg-gradient-to-br from-card via-accent/10 to-primary/20 shadow-2xl border border-accent/30 flex items-center justify-center relative overflow-hidden">
                
                {/* Animated Background Patterns */}
                <div className="absolute inset-0 bg-gradient-radial from-accent/30 via-transparent to-transparent animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-conic from-primary/20 via-transparent to-accent/20 animate-spin-slow"></div>
                
                {/* Face Features */}
                <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
                  
                  {/* Eyes */}
                  <div className="flex space-x-8">
                    <div className="w-6 h-6 rounded-full bg-accent animate-pulse shadow-lg shadow-accent/50"></div>
                    <div className="w-6 h-6 rounded-full bg-accent animate-pulse shadow-lg shadow-accent/50" style={{animationDelay: '0.5s'}}></div>
                  </div>
                  
                  {/* Nose/Center Point */}
                  <div className="w-2 h-2 rounded-full bg-accent/60"></div>
                  
                  {/* Mouth/Expression Area */}
                  <div className={`w-12 h-3 rounded-full bg-accent/80 shadow-lg transition-all duration-1000 ${isTyping ? 'animate-pulse scale-110' : ''}`}></div>
                  
                </div>
                
                {/* Orbital Elements */}
                <div className="absolute inset-0">
                  <div className="absolute top-8 left-8 w-2 h-2 rounded-full bg-accent/60 animate-bounce"></div>
                  <div className="absolute bottom-12 right-12 w-1 h-1 rounded-full bg-primary/80 animate-ping"></div>
                  <div className="absolute top-16 right-8 w-1.5 h-1.5 rounded-full bg-accent/40 animate-pulse"></div>
                </div>
              </div>
              
              {/* Avatar Glow Effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/20 to-primary/10 blur-xl scale-110 animate-pulse"></div>
            </div>
            
            {/* Status Indicator */}
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${isTyping ? 'bg-accent animate-pulse' : 'bg-primary/60'}`}></div>
              <span className="text-sm text-muted-foreground font-medium">
                {isTyping ? 'Thinking...' : 'Listening'}
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
                      <Card className={`max-w-[80%] p-4 ${
                        message.sender === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted border-accent/20'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <p className={`text-xs mt-2 opacity-70 ${
                          message.sender === 'user' ? 'text-primary-foreground' : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
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