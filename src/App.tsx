import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Mic, ChartLine, X, Calendar, Clock, Brain, TrendUp, Lightbulb, Heart } from "@phosphor-icons/react"
import { useKV } from '@github/spark/hooks'

interface Message {
  id: string
  text: string
  sender: 'user' | 'avatar'
  timestamp: Date
  mood?: 'calm' | 'joyful' | 'concerned' | 'contemplative' | 'supportive'
  userEmotion?: 'calm' | 'joyful' | 'concerned' | 'contemplative' | 'supportive'
}

interface EmotionalPattern {
  date: string
  emotions: { [key: string]: number }
  dominantEmotion: string
  intensity: number
  context: string[]
}

interface EmotionalInsight {
  id: string
  type: 'pattern' | 'trend' | 'recommendation' | 'reflection'
  title: string
  description: string
  confidence: number
  timestamp: Date
  actionable?: boolean
  relatedEmotions: string[]
}

interface ConversationMemory {
  patterns: EmotionalPattern[]
  keywords: { [key: string]: number }
  totalConversations: number
  lastUpdated: Date
  insights: EmotionalInsight[]
}

function App() {
  const [messages, setMessages] = useKV<Message[]>("conversation-history", [])
  const [memory, setMemory] = useKV<ConversationMemory>("emotional-memory", {
    patterns: [],
    keywords: {},
    totalConversations: 0,
    lastUpdated: new Date(),
    insights: []
  })
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [currentMood, setCurrentMood] = useState<'calm' | 'joyful' | 'concerned' | 'contemplative' | 'supportive'>('calm')
  const [showMemoryInsights, setShowMemoryInsights] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)

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

  const generateEmotionalInsights = async () => {
    if (memory.patterns.length < 3) return // Need at least 3 days of data
    
    setIsGeneratingInsights(true)
    try {
      // Prepare data for analysis
      const recentPatterns = memory.patterns.slice(0, 14) // Last 2 weeks
      const emotionFrequency = {}
      const topicFrequency = { ...memory.keywords }
      
      recentPatterns.forEach(pattern => {
        Object.entries(pattern.emotions).forEach(([emotion, count]) => {
          emotionFrequency[emotion] = (emotionFrequency[emotion] || 0) + count
        })
      })
      
      // Create context for AI analysis
      const analysisData = {
        recentEmotions: Object.entries(emotionFrequency).sort((a, b) => b[1] - a[1]),
        frequentTopics: Object.entries(topicFrequency).sort((a, b) => b[1] - a[1]).slice(0, 10),
        totalConversations: memory.totalConversations,
        daysTracked: recentPatterns.length,
        emotionalTrends: recentPatterns.map(p => ({
          date: p.date,
          dominant: p.dominantEmotion,
          intensity: p.intensity
        }))
      }
      
      // Generate different types of insights
      const insights: EmotionalInsight[] = []
      
      // Pattern Analysis
      const patternPrompt = spark.llmPrompt`
        Analyze these emotional patterns over ${analysisData.daysTracked} days:
        Emotions: ${JSON.stringify(analysisData.recentEmotions)}
        Topics: ${JSON.stringify(analysisData.frequentTopics)}
        
        Identify one significant emotional pattern. Respond with JSON:
        {
          "title": "Brief pattern name",
          "description": "2-3 sentence explanation of the pattern",
          "confidence": number 1-100,
          "relatedEmotions": ["emotion1", "emotion2"]
        }
      `
      
      const patternResult = await spark.llm(patternPrompt, "gpt-4o", true)
      const patternData = JSON.parse(patternResult)
      
      insights.push({
        id: `pattern-${Date.now()}`,
        type: 'pattern',
        title: patternData.title,
        description: patternData.description,
        confidence: patternData.confidence,
        timestamp: new Date(),
        relatedEmotions: patternData.relatedEmotions
      })
      
      // Trend Analysis
      const trendPrompt = spark.llmPrompt`
        Analyze emotional trends from this timeline:
        ${JSON.stringify(analysisData.emotionalTrends)}
        
        Identify one emotional trend (improving, declining, stable, cyclical). Respond with JSON:
        {
          "title": "Brief trend description",
          "description": "2-3 sentence explanation of the trend and what it might indicate",
          "confidence": number 1-100,
          "relatedEmotions": ["emotion1", "emotion2"]
        }
      `
      
      const trendResult = await spark.llm(trendPrompt, "gpt-4o", true)
      const trendData = JSON.parse(trendResult)
      
      insights.push({
        id: `trend-${Date.now()}`,
        type: 'trend',
        title: trendData.title,
        description: trendData.description,
        confidence: trendData.confidence,
        timestamp: new Date(),
        relatedEmotions: trendData.relatedEmotions
      })
      
      // Recommendation
      const recommendationPrompt = spark.llmPrompt`
        Based on these emotional patterns and frequent topics:
        Emotions: ${JSON.stringify(analysisData.recentEmotions.slice(0, 3))}
        Topics: ${JSON.stringify(analysisData.frequentTopics.slice(0, 5))}
        
        Suggest one gentle, actionable recommendation for emotional wellbeing. Respond with JSON:
        {
          "title": "Brief recommendation title",
          "description": "2-3 sentence supportive suggestion that's specific and actionable",
          "confidence": number 1-100,
          "relatedEmotions": ["emotion1", "emotion2"]
        }
      `
      
      const recommendationResult = await spark.llm(recommendationPrompt, "gpt-4o", true)
      const recommendationData = JSON.parse(recommendationResult)
      
      insights.push({
        id: `recommendation-${Date.now()}`,
        type: 'recommendation',
        title: recommendationData.title,
        description: recommendationData.description,
        confidence: recommendationData.confidence,
        timestamp: new Date(),
        actionable: true,
        relatedEmotions: recommendationData.relatedEmotions
      })
      
      // Reflection
      const reflectionPrompt = spark.llmPrompt`
        Create a gentle reflection based on this emotional journey:
        Dominant emotions: ${analysisData.recentEmotions.slice(0, 2).map(([emotion]) => emotion).join(', ')}
        Key topics: ${analysisData.frequentTopics.slice(0, 3).map(([topic]) => topic).join(', ')}
        
        Write an empathetic reflection about growth and self-awareness. Respond with JSON:
        {
          "title": "Reflection title",
          "description": "2-3 sentence compassionate reflection on their emotional journey",
          "confidence": number 1-100,
          "relatedEmotions": ["emotion1", "emotion2"]
        }
      `
      
      const reflectionResult = await spark.llm(reflectionPrompt, "gpt-4o", true)
      const reflectionData = JSON.parse(reflectionResult)
      
      insights.push({
        id: `reflection-${Date.now()}`,
        type: 'reflection',
        title: reflectionData.title,
        description: reflectionData.description,
        confidence: reflectionData.confidence,
        timestamp: new Date(),
        relatedEmotions: reflectionData.relatedEmotions
      })
      
      // Update memory with new insights (keep only last 10)
      setMemory(currentMemory => ({
        ...currentMemory,
        insights: [...insights, ...currentMemory.insights].slice(0, 10)
      }))
      
    } catch (error) {
      console.log('Insight generation failed:', error)
    } finally {
      setIsGeneratingInsights(false)
    }
  }

  // Auto-generate insights when enough data is available
  useEffect(() => {
    if (memory.patterns.length >= 3 && memory.insights.length === 0) {
      generateEmotionalInsights()
    }
  }, [memory.patterns.length])
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Extract keywords from user message
      const keywordPrompt = spark.llmPrompt`Extract 3-5 key emotional or topical words from this message, return as comma-separated list: "${userMessage}"`
      const keywordsResult = await spark.llm(keywordPrompt, "gpt-4o-mini")
      const keywords = keywordsResult.split(',').map(k => k.trim().toLowerCase())
      
      setMemory(currentMemory => {
        const newMemory = { ...currentMemory }
        
        // Update keyword frequency
        keywords.forEach(keyword => {
          newMemory.keywords[keyword] = (newMemory.keywords[keyword] || 0) + 1
        })
        
        // Find or create today's pattern
        let todayPattern = newMemory.patterns.find(p => p.date === today)
        if (!todayPattern) {
          todayPattern = {
            date: today,
            emotions: {},
            dominantEmotion: userEmotion,
            intensity: 1,
            context: []
          }
          newMemory.patterns.push(todayPattern)
        }
        
        // Update emotion counts
        todayPattern.emotions[userEmotion] = (todayPattern.emotions[userEmotion] || 0) + 1
        
        // Update dominant emotion
        const emotionEntries = Object.entries(todayPattern.emotions)
        todayPattern.dominantEmotion = emotionEntries.reduce((a, b) => a[1] > b[1] ? a : b)[0]
        
        // Add context (keep last 5 topics)
        todayPattern.context = [...new Set([...todayPattern.context, ...keywords])].slice(-5)
        
        // Update intensity (average of emotion frequencies)
        todayPattern.intensity = Math.min(5, Math.max(1, 
          Object.values(todayPattern.emotions).reduce((a, b) => a + b, 0) / Object.keys(todayPattern.emotions).length
        ))
        
        newMemory.totalConversations += 1
        newMemory.lastUpdated = new Date()
        
        // Keep only last 30 days of patterns
        newMemory.patterns = newMemory.patterns
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 30)
        
        return newMemory
      })
    } catch (error) {
      console.log('Memory update failed:', error)
    }
  }

  const updateEmotionalMemory = async (userMessage: string, userEmotion: string, avatarResponse: string) => {
    // Get recent emotional patterns for context
    const recentPatterns = memory.patterns.slice(0, 7) // Last week
    const frequentKeywords = Object.entries(memory.keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
    
    let contextualInfo = ""
    
    if (recentPatterns.length > 0) {
      const recentEmotions = recentPatterns.map(p => p.dominantEmotion).join(', ')
      contextualInfo += `Recent emotional patterns: ${recentEmotions}. `
    }
    
    if (frequentKeywords.length > 0) {
      contextualInfo += `Frequent topics: ${frequentKeywords.slice(0, 5).join(', ')}. `
    }
    
    if (memory.totalConversations > 0) {
      contextualInfo += `Total conversations: ${memory.totalConversations}. `
    }
    
    const basePrompt = `You are an empathetic, caring AI companion with a gentle, understanding nature. ${contextualInfo}Use this context to respond with deeper understanding and continuity. Respond to: "${userMessage}"`
    
    return basePrompt
  }

  const sendMessage = async () => {
    if (!inputText.trim()) return

    // Analyze user's emotional state
    const userEmotion = await analyzeMood(inputText)

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      userEmotion: userEmotion
    }

    setMessages(prev => [...prev, userMessage])
    const messageText = inputText
    setInputText("")
    setIsTyping(true)

    // Simulate avatar response with LLM using contextual memory
    try {
      const contextualPrompt = getContextualPrompt(messageText)
      const prompt = spark.llmPrompt`${contextualPrompt}`
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
      
      // Update emotional memory
      await updateEmotionalMemory(messageText, userEmotion, response)
      
      // Generate insights if we have enough data and haven't generated recently
      if (memory.patterns.length >= 3 && memory.totalConversations % 5 === 0) {
        setTimeout(() => generateEmotionalInsights(), 1000)
      }
      
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

  // Helper function to get emotional intensity color
  const getEmotionColor = (emotion: string, intensity: number) => {
    const colors = {
      joyful: `bg-amber-${Math.min(400 + intensity * 100, 600)}`,
      concerned: `bg-blue-${Math.min(400 + intensity * 100, 600)}`,
      contemplative: `bg-purple-${Math.min(400 + intensity * 100, 600)}`,
      supportive: `bg-green-${Math.min(400 + intensity * 100, 600)}`,
      calm: `bg-slate-${Math.min(400 + intensity * 100, 600)}`
    }
    return colors[emotion as keyof typeof colors] || 'bg-slate-400'
  }

  // Generate timeline data from emotional patterns
  const getTimelineData = () => {
    const sortedPatterns = [...memory.patterns].sort((a, b) => a.date.localeCompare(b.date))
    return sortedPatterns.map(pattern => ({
      ...pattern,
      formattedDate: new Date(pattern.date).toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })
    }))
  }

  // Generate calendar grid data
  const getCalendarData = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    // Create calendar grid
    const calendarDays = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const pattern = memory.patterns.find(p => p.date === dateStr)
      
      calendarDays.push({
        day,
        date: dateStr,
        pattern,
        isToday: day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
      })
    }
    
    return {
      monthName: today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      days: calendarDays
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
            
            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="p-6 border-b border-border/50">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
                  <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
                  <TabsTrigger value="calendar" className="text-xs">Calendar</TabsTrigger>
                  <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
                </TabsList>
                
                {activeTab === 'chat' && (
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-xl font-semibold text-foreground">Conversation</h1>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-muted-foreground">Share your thoughts freely</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {memory.totalConversations > 0 && (
                        <span className="text-xs text-muted-foreground bg-accent/10 px-2 py-1 rounded-full">
                          {memory.totalConversations} talks
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowMemoryInsights(!showMemoryInsights)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {showMemoryInsights ? <X size={16} /> : <ChartLine size={16} />}
                      </Button>
                    </div>
                  </div>
                )}
                
                {activeTab === 'insights' && (
                  <div>
                    <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <Brain size={20} />
                      AI Insights
                    </h1>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-muted-foreground">AI-powered emotional pattern analysis</p>
                      {memory.patterns.length >= 3 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={generateEmotionalInsights}
                          disabled={isGeneratingInsights}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isGeneratingInsights ? 'Analyzing...' : 'Refresh'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                  <div>
                    <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <Calendar size={20} />
                      Emotional Calendar
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Your emotional journey by day</p>
                  </div>
                )}
                
                {activeTab === 'timeline' && (
                  <div>
                    <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <Clock size={20} />
                      Timeline View
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Emotional patterns over time</p>
                  </div>
                )}
                
                {/* Memory Insights Panel - only show in chat tab */}
                {activeTab === 'chat' && showMemoryInsights && memory.patterns.length > 0 && (
                  <Card className="mt-4 p-4 bg-muted/30 border-accent/20">
                    <h3 className="text-sm font-medium text-foreground mb-3">Emotional Journey</h3>
                    <div className="space-y-3">
                      {/* Recent Patterns */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Recent emotional patterns:</p>
                        <div className="flex flex-wrap gap-1">
                          {memory.patterns.slice(0, 7).map((pattern, index) => (
                            <Badge 
                              key={pattern.date} 
                              variant="outline" 
                              className={`text-xs ${
                                pattern.dominantEmotion === 'joyful' ? 'border-amber-400/50 text-amber-700' :
                                pattern.dominantEmotion === 'concerned' ? 'border-blue-500/50 text-blue-700' :
                                pattern.dominantEmotion === 'contemplative' ? 'border-purple-400/50 text-purple-700' :
                                pattern.dominantEmotion === 'supportive' ? 'border-green-400/50 text-green-700' :
                                'border-accent/50'
                              }`}
                            >
                              {pattern.dominantEmotion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {/* Frequent Topics */}
                      {Object.keys(memory.keywords).length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Common themes:</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(memory.keywords)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 5)
                              .map(([keyword, count]) => (
                                <Badge key={keyword} variant="secondary" className="text-xs">
                                  {keyword} ({count})
                                </Badge>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>

              {/* Tab Content */}
              <TabsContent value="chat" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
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
                              <div className="flex items-center space-x-2">
                                {message.sender === 'user' && message.userEmotion && (
                                  <span className={`text-xs px-2 py-1 rounded-full bg-opacity-20 ${
                                    message.userEmotion === 'joyful' ? 'bg-amber-400 text-amber-100' :
                                    message.userEmotion === 'concerned' ? 'bg-blue-500 text-blue-100' :
                                    message.userEmotion === 'contemplative' ? 'bg-purple-400 text-purple-100' :
                                    message.userEmotion === 'supportive' ? 'bg-green-400 text-green-100' :
                                    'bg-white text-primary-foreground'
                                  }`}>
                                    {message.userEmotion}
                                  </span>
                                )}
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
              </TabsContent>

              <TabsContent value="insights" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <ScrollArea className="flex-1 p-6">
                  {memory.patterns.length < 3 ? (
                    <div className="text-center py-12">
                      <Brain size={48} className="mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">Building insights...</p>
                      <p className="text-sm text-muted-foreground">AI insights will appear after a few conversations to identify meaningful patterns</p>
                      <div className="mt-4">
                        <Badge variant="secondary" className="text-xs">
                          {memory.patterns.length}/3 conversations needed
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* AI Insights Header */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Emotional Intelligence</h3>
                        <div className="flex items-center space-x-2">
                          {isGeneratingInsights && (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <div className="w-2 h-2 rounded-full bg-accent animate-bounce"></div>
                              <span>Analyzing patterns...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Insights List */}
                      {memory.insights.length === 0 && !isGeneratingInsights ? (
                        <Card className="p-6 text-center">
                          <Lightbulb size={32} className="mx-auto text-muted-foreground mb-3" />
                          <p className="text-muted-foreground mb-2">No insights yet</p>
                          <Button
                            size="sm"
                            onClick={generateEmotionalInsights}
                            className="bg-accent hover:bg-accent/90"
                          >
                            Generate Insights
                          </Button>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {memory.insights
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .map((insight) => (
                              <Card key={insight.id} className={`p-4 border-l-4 ${
                                insight.type === 'pattern' ? 'border-l-purple-400 bg-purple-50/50' :
                                insight.type === 'trend' ? 'border-l-blue-400 bg-blue-50/50' :
                                insight.type === 'recommendation' ? 'border-l-green-400 bg-green-50/50' :
                                'border-l-amber-400 bg-amber-50/50'
                              }`}>
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    {insight.type === 'pattern' && <Brain size={16} className="text-purple-600" />}
                                    {insight.type === 'trend' && <TrendUp size={16} className="text-blue-600" />}
                                    {insight.type === 'recommendation' && <Lightbulb size={16} className="text-green-600" />}
                                    {insight.type === 'reflection' && <Heart size={16} className="text-amber-600" />}
                                    <h4 className="font-medium text-sm">{insight.title}</h4>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className="text-xs">
                                      {Math.round(insight.confidence)}% confident
                                    </Badge>
                                    <Badge 
                                      variant="secondary" 
                                      className={`text-xs capitalize ${
                                        insight.type === 'pattern' ? 'bg-purple-100 text-purple-700' :
                                        insight.type === 'trend' ? 'bg-blue-100 text-blue-700' :
                                        insight.type === 'recommendation' ? 'bg-green-100 text-green-700' :
                                        'bg-amber-100 text-amber-700'
                                      }`}
                                    >
                                      {insight.type}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                                  {insight.description}
                                </p>
                                
                                {insight.relatedEmotions.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {insight.relatedEmotions.map((emotion) => (
                                      <Badge key={emotion} variant="outline" className={`text-xs ${
                                        emotion === 'joyful' ? 'border-amber-400/50 text-amber-700' :
                                        emotion === 'concerned' ? 'border-blue-500/50 text-blue-700' :
                                        emotion === 'contemplative' ? 'border-purple-400/50 text-purple-700' :
                                        emotion === 'supportive' ? 'border-green-400/50 text-green-700' :
                                        'border-slate-400/50 text-slate-700'
                                      }`}>
                                        {emotion}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                
                                <p className="text-xs text-muted-foreground">
                                  {new Date(insight.timestamp).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </Card>
                            ))}
                        </div>
                      )}

                      {/* Insights Summary */}
                      {memory.insights.length > 0 && (
                        <Card className="p-4 bg-muted/30">
                          <h4 className="text-sm font-medium mb-3">Insight Summary</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Total Insights</p>
                              <p className="text-lg font-semibold">{memory.insights.length}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Avg Confidence</p>
                              <p className="text-lg font-semibold">
                                {Math.round(memory.insights.reduce((acc, insight) => acc + insight.confidence, 0) / memory.insights.length)}%
                              </p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground mb-2">Insight Types</p>
                            <div className="flex flex-wrap gap-1">
                              {['pattern', 'trend', 'recommendation', 'reflection'].map(type => {
                                const count = memory.insights.filter(i => i.type === type).length
                                if (count === 0) return null
                                return (
                                  <Badge key={type} variant="secondary" className="text-xs">
                                    {type} ({count})
                                  </Badge>
                                )
                              })}
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="calendar" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <ScrollArea className="flex-1 p-6">
                  {memory.patterns.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">No emotional data yet</p>
                      <p className="text-sm text-muted-foreground">Start having conversations to see your emotional calendar</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Calendar Grid */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">{getCalendarData().monthName}</h3>
                        <div className="grid grid-cols-7 gap-1 mb-4">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-xs font-medium text-muted-foreground text-center p-2">
                              {day}
                            </div>
                          ))}
                          {getCalendarData().days.map((day, index) => (
                            <div key={index} className="aspect-square">
                              {day ? (
                                <div className={`w-full h-full rounded-lg border border-border/30 flex flex-col items-center justify-center relative ${
                                  day.isToday ? 'border-accent bg-accent/10' : ''
                                } ${day.pattern ? 'cursor-pointer hover:border-accent/50' : ''}`}>
                                  <span className={`text-xs font-medium ${day.isToday ? 'text-accent' : 'text-foreground'}`}>
                                    {day.day}
                                  </span>
                                  {day.pattern && (
                                    <div 
                                      className={`w-2 h-2 rounded-full mt-1 ${
                                        day.pattern.dominantEmotion === 'joyful' ? 'bg-amber-400' :
                                        day.pattern.dominantEmotion === 'concerned' ? 'bg-blue-500' :
                                        day.pattern.dominantEmotion === 'contemplative' ? 'bg-purple-400' :
                                        day.pattern.dominantEmotion === 'supportive' ? 'bg-green-400' :
                                        'bg-slate-400'
                                      }`}
                                      title={`${day.pattern.dominantEmotion} (intensity: ${day.pattern.intensity})`}
                                    />
                                  )}
                                </div>
                              ) : (
                                <div className="w-full h-full"></div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Legend */}
                      <Card className="p-4 bg-muted/30">
                        <h4 className="text-sm font-medium mb-3">Emotional States</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { emotion: 'joyful', color: 'bg-amber-400', label: 'Joyful' },
                            { emotion: 'concerned', color: 'bg-blue-500', label: 'Concerned' },
                            { emotion: 'contemplative', color: 'bg-purple-400', label: 'Contemplative' },
                            { emotion: 'supportive', color: 'bg-green-400', label: 'Supportive' },
                            { emotion: 'calm', color: 'bg-slate-400', label: 'Calm' }
                          ].map(({ emotion, color, label }) => (
                            <div key={emotion} className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${color}`}></div>
                              <span className="text-xs text-muted-foreground">{label}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="timeline" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <ScrollArea className="flex-1 p-6">
                  {memory.patterns.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock size={48} className="mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">No timeline data yet</p>
                      <p className="text-sm text-muted-foreground">Your emotional journey will appear here as you continue conversations</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Timeline Header */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Emotional Timeline</h3>
                        <Badge variant="secondary" className="text-xs">
                          {memory.patterns.length} {memory.patterns.length === 1 ? 'day' : 'days'} tracked
                        </Badge>
                      </div>

                      {/* Timeline Items */}
                      <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
                        
                        <div className="space-y-6">
                          {getTimelineData().map((pattern, index) => (
                            <div key={pattern.date} className="relative flex items-start space-x-4">
                              {/* Timeline Dot */}
                              <div className={`w-3 h-3 rounded-full border-2 border-background z-10 ${
                                pattern.dominantEmotion === 'joyful' ? 'bg-amber-400' :
                                pattern.dominantEmotion === 'concerned' ? 'bg-blue-500' :
                                pattern.dominantEmotion === 'contemplative' ? 'bg-purple-400' :
                                pattern.dominantEmotion === 'supportive' ? 'bg-green-400' :
                                'bg-slate-400'
                              }`}></div>
                              
                              {/* Timeline Content */}
                              <Card className="flex-1 p-4 bg-card border-accent/20">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-medium text-sm">{pattern.formattedDate}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      Dominant: {pattern.dominantEmotion} • Intensity: {pattern.intensity}/5
                                    </p>
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      pattern.dominantEmotion === 'joyful' ? 'border-amber-400/50 text-amber-700' :
                                      pattern.dominantEmotion === 'concerned' ? 'border-blue-500/50 text-blue-700' :
                                      pattern.dominantEmotion === 'contemplative' ? 'border-purple-400/50 text-purple-700' :
                                      pattern.dominantEmotion === 'supportive' ? 'border-green-400/50 text-green-700' :
                                      'border-slate-400/50 text-slate-700'
                                    }`}
                                  >
                                    {pattern.dominantEmotion}
                                  </Badge>
                                </div>
                                
                                {/* Emotional Breakdown */}
                                {Object.keys(pattern.emotions).length > 1 && (
                                  <div className="mb-3">
                                    <p className="text-xs text-muted-foreground mb-2">Emotional mix:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(pattern.emotions)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([emotion, count]) => (
                                          <Badge key={emotion} variant="secondary" className="text-xs">
                                            {emotion} ({count})
                                          </Badge>
                                        ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Context Keywords */}
                                {pattern.context.length > 0 && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-2">Topics discussed:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {pattern.context.map((topic) => (
                                        <Badge key={topic} variant="outline" className="text-xs">
                                          {topic}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </Card>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App