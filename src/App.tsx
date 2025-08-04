import { useState, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Smiley, BookOpen, Plus, X, Edit3, Trash2, TrendUp, CalendarBlank } from "@phosphor-icons/react"
import { useKV } from '@github/spark/hooks'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Area, AreaChart, Cell, PieChart, Pie } from "recharts"
import { generateDemoMoodData, generateDemoDiaryData } from './demo-data'

interface MoodEntry {
  id: string
  level: number // 1-5 scale (1=very sad, 5=very happy)
  timestamp: Date
  note?: string
}

interface DiaryEntry {
  id: string
  title: string
  content: string
  mood?: number // 1-5 scale
  tags: string[]
  timestamp: Date
}

function App() {
  const [moodEntries, setMoodEntries] = useKV<MoodEntry[]>("mood-entries", [])
  const [diaryEntries, setDiaryEntries] = useKV<DiaryEntry[]>("diary-entries", [])
  const [activeTab, setActiveTab] = useState('face')
  const [showMoodForm, setShowMoodForm] = useState(false)
  const [showDiaryForm, setShowDiaryForm] = useState(false)
  const [editingDiary, setEditingDiary] = useState<DiaryEntry | null>(null)
  
  // Current avatar mood based on recent entries
  const [currentMood, setCurrentMood] = useState(3)
  
  // Diary form state
  const [diaryForm, setDiaryForm] = useState({
    title: '',
    content: '',
    mood: 3,
    tags: [] as string[],
    tagInput: ''
  })

  // Chart configuration for mood trends
  const chartConfig = {
    mood: {
      label: "Mood Level",
      color: "hsl(var(--accent))",
    },
    average: {
      label: "Average",
      color: "hsl(var(--muted-foreground))",
    }
  }

  // Process mood data for trending analysis
  const moodTrendsData = useMemo(() => {
    if (moodEntries.length === 0) return []
    
    // Sort entries by date
    const sortedEntries = [...moodEntries].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    
    // Group by day and calculate daily averages
    const dailyMoods = new Map<string, { sum: number; count: number; entries: MoodEntry[] }>()
    
    sortedEntries.forEach(entry => {
      const dateKey = new Date(entry.timestamp).toDateString()
      const existing = dailyMoods.get(dateKey) || { sum: 0, count: 0, entries: [] }
      dailyMoods.set(dateKey, {
        sum: existing.sum + entry.level,
        count: existing.count + 1,
        entries: [...existing.entries, entry]
      })
    })
    
    // Convert to chart data format
    return Array.from(dailyMoods.entries()).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: date,
      mood: Math.round((data.sum / data.count) * 10) / 10,
      count: data.count,
      entries: data.entries
    })).slice(-14) // Last 14 days
  }, [moodEntries])

  // Weekly mood distribution
  const weeklyMoodDistribution = useMemo(() => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    const recent = moodEntries.slice(0, 21) // Last 3 weeks of entries
    
    recent.forEach(entry => {
      distribution[entry.level as keyof typeof distribution]++
    })
    
    return Object.entries(distribution).map(([level, count]) => ({
      mood: getMoodLabel(parseInt(level)),
      level: parseInt(level),
      count,
      percentage: recent.length > 0 ? Math.round((count / recent.length) * 100) : 0,
      emoji: getMoodEmoji(parseInt(level))
    }))
  }, [moodEntries])

  // Mood insights
  const moodInsights = useMemo(() => {
    if (moodEntries.length < 3) return null
    
    const recent = moodEntries.slice(0, 7) // Last week
    const previous = moodEntries.slice(7, 14) // Previous week
    
    const recentAvg = recent.reduce((sum, entry) => sum + entry.level, 0) / recent.length
    const previousAvg = previous.length > 0 
      ? previous.reduce((sum, entry) => sum + entry.level, 0) / previous.length 
      : recentAvg
    
    const trend = recentAvg - previousAvg
    const mostCommonMood = weeklyMoodDistribution.reduce((prev, current) => 
      current.count > prev.count ? current : prev
    )
    
    return {
      recentAverage: Math.round(recentAvg * 10) / 10,
      trend: Math.round(trend * 10) / 10,
      trendDirection: trend > 0.2 ? 'improving' : trend < -0.2 ? 'declining' : 'stable',
      mostCommonMood,
      totalEntries: moodEntries.length,
      entriesThisWeek: recent.length,
      bestDay: moodTrendsData.reduce((best, current) => 
        current.mood > best.mood ? current : best, 
        { mood: 0, date: '', fullDate: '' }
      )
    }
  }, [moodEntries, weeklyMoodDistribution, moodTrendsData])

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

  const getMoodLabel = (level: number): string => {
    switch (level) {
      case 1: return 'Very Sad'
      case 2: return 'Sad'
      case 3: return 'Neutral'
      case 4: return 'Happy'
      case 5: return 'Very Happy'
      default: return 'Neutral'
    }
  }

  // Register mood entry
  const registerMood = (level: number) => {
    const newEntry: MoodEntry = {
      id: `mood-${Date.now()}`,
      level,
      timestamp: new Date()
    }
    
    setMoodEntries(current => [newEntry, ...current.slice(0, 99)])
    setCurrentMood(level)
    setShowMoodForm(false)
  }

  // Get average mood from recent entries
  const getRecentAverageMood = () => {
    const recent = moodEntries.slice(0, 5) // Last 5 entries
    if (recent.length === 0) return 3
    return Math.round(recent.reduce((sum, entry) => sum + entry.level, 0) / recent.length)
  }

  // Add tag to diary form
  const addTag = () => {
    const tag = diaryForm.tagInput.trim().toLowerCase()
    if (tag && !diaryForm.tags.includes(tag)) {
      setDiaryForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
        tagInput: ''
      }))
    }
  }

  // Remove tag from diary form
  const removeTag = (tagToRemove: string) => {
    setDiaryForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  // Save diary entry
  const saveDiaryEntry = () => {
    if (!diaryForm.title.trim() || !diaryForm.content.trim()) return

    const entryData: DiaryEntry = {
      id: editingDiary?.id || `diary-${Date.now()}`,
      title: diaryForm.title.trim(),
      content: diaryForm.content.trim(),
      mood: diaryForm.mood,
      tags: diaryForm.tags,
      timestamp: editingDiary?.timestamp || new Date()
    }

    if (editingDiary) {
      setDiaryEntries(current => 
        current.map(entry => entry.id === editingDiary.id ? entryData : entry)
      )
    } else {
      setDiaryEntries(current => [entryData, ...current])
    }

    // Reset form
    setDiaryForm({
      title: '',
      content: '',
      mood: 3,
      tags: [],
      tagInput: ''
    })
    setEditingDiary(null)
    setShowDiaryForm(false)
  }

  // Start editing diary entry
  const startEditingDiary = (entry: DiaryEntry) => {
    setEditingDiary(entry)
    setDiaryForm({
      title: entry.title,
      content: entry.content,
      mood: entry.mood || 3,
      tags: entry.tags,
      tagInput: ''
    })
    setShowDiaryForm(true)
    setActiveTab('diary')
  }

  // Delete diary entry
  const deleteDiaryEntry = (id: string) => {
    setDiaryEntries(current => current.filter(entry => entry.id !== id))
  }

  // Demo data loader (for testing)
  const loadDemoData = () => {
    const demoMoods = generateDemoMoodData()
    const demoDiary = generateDemoDiaryData()
    setMoodEntries(demoMoods)
    setDiaryEntries(demoDiary)
    setActiveTab('trends')
  }

  // Avatar face configuration based on current mood
  const getAvatarConfig = () => {
    const mood = getRecentAverageMood()
    
    switch (mood) {
      case 1: // Very sad
        return {
          eyeColor: 'bg-blue-400',
          mouthShape: 'w-8 h-2 bg-blue-400/60 rounded-full',
          glowColor: 'shadow-blue-400/20',
          animation: 'animate-gentle-pulse'
        }
      case 2: // Sad
        return {
          eyeColor: 'bg-slate-400',
          mouthShape: 'w-10 h-2 bg-slate-400/60 rounded-full',
          glowColor: 'shadow-slate-400/20',
          animation: 'animate-gentle-pulse'
        }
      case 4: // Happy
        return {
          eyeColor: 'bg-green-400',
          mouthShape: 'w-12 h-3 bg-green-400/80 rounded-full',
          glowColor: 'shadow-green-400/20',
          animation: 'animate-breathe'
        }
      case 5: // Very happy
        return {
          eyeColor: 'bg-yellow-400',
          mouthShape: 'w-14 h-4 bg-yellow-400/80 rounded-full',
          glowColor: 'shadow-yellow-400/20',
          animation: 'animate-breathe'
        }
      default: // Neutral
        return {
          eyeColor: 'bg-accent',
          mouthShape: 'w-10 h-2 bg-accent/60 rounded-full',
          glowColor: 'shadow-accent/20',
          animation: 'animate-breathe'
        }
    }
  }

  const avatarConfig = getAvatarConfig()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="grid lg:grid-cols-5 gap-8 h-[calc(100vh-3rem)]">
          
          {/* Avatar Section - Takes up 3/5 of the screen */}
          <div className="lg:col-span-3 flex items-center justify-center">
            <div className="relative">
              {/* Main Avatar Face */}
              <div className={`w-80 h-80 lg:w-96 lg:h-96 rounded-full bg-gradient-to-br from-card via-secondary/30 to-muted border border-border/50 flex items-center justify-center relative overflow-hidden transition-all duration-1000 ${avatarConfig.glowColor} ${avatarConfig.animation}`}>
                
                {/* Subtle background pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 opacity-60"></div>
                
                {/* Face Features */}
                <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
                  
                  {/* Eyes */}
                  <div className="flex space-x-12">
                    <div className={`w-6 h-6 rounded-full ${avatarConfig.eyeColor} shadow-lg transition-all duration-1000`}></div>
                    <div className={`w-6 h-6 rounded-full ${avatarConfig.eyeColor} shadow-lg transition-all duration-1000`}></div>
                  </div>
                  
                  {/* Nose area - subtle dot */}
                  <div className={`w-2 h-2 rounded-full ${avatarConfig.eyeColor} opacity-40 transition-all duration-1000`}></div>
                  
                  {/* Mouth */}
                  <div className={`${avatarConfig.mouthShape} shadow-lg transition-all duration-1000`}></div>
                  
                </div>
              </div>
              
              {/* Status indicator */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${avatarConfig.eyeColor} animate-gentle-pulse`}></div>
                  <span>Present • {getMoodLabel(getRecentAverageMood())}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Section - Takes up 2/5 of the screen */}
          <div className="lg:col-span-2 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              
              {/* Tab Navigation */}
              <div className="mb-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="face">Face</TabsTrigger>
                  <TabsTrigger value="mood">Mood</TabsTrigger>
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                  <TabsTrigger value="diary">Diary</TabsTrigger>
                </TabsList>
              </div>

              {/* Face Tab */}
              <TabsContent value="face" className="flex-1 flex flex-col">
                <div className="text-center space-y-6 py-12">
                  <h1 className="text-2xl font-medium text-foreground">Welcome</h1>
                  <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                    I'm here to be with you. Check in with your mood or write in your diary whenever you need to express yourself.
                  </p>
                  
                  <div className="flex flex-col space-y-4 max-w-xs mx-auto">
                    <Button 
                      onClick={() => {
                        setActiveTab('mood')
                        setShowMoodForm(true)
                      }}
                      className="bg-accent hover:bg-accent/90"
                    >
                      <Smiley size={16} className="mr-2" />
                      Quick Mood Check
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setActiveTab('diary')
                        setShowDiaryForm(true)
                      }}
                    >
                      <BookOpen size={16} className="mr-2" />
                      Write in Diary
                    </Button>

                    {moodEntries.length >= 3 && (
                      <Button 
                        variant="outline"
                        onClick={() => setActiveTab('trends')}
                        className="border-accent/40 hover:bg-accent/10"
                      >
                        <TrendUp size={16} className="mr-2" />
                        View Trends
                      </Button>
                    )}
                  </div>

                  {/* Recent activity summary */}
                  {(moodEntries.length > 0 || diaryEntries.length > 0) && (
                    <div className="mt-8 pt-6 border-t border-border/50">
                      <p className="text-sm text-muted-foreground mb-4">Recent activity</p>
                      <div className="flex justify-center space-x-6 text-sm">
                        {moodEntries.length > 0 && (
                          <div className="text-center">
                            <p className="font-medium">{moodEntries.length}</p>
                            <p className="text-muted-foreground">mood entries</p>
                          </div>
                        )}
                        {diaryEntries.length > 0 && (
                          <div className="text-center">
                            <p className="font-medium">{diaryEntries.length}</p>
                            <p className="text-muted-foreground">diary entries</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Demo data loader - only show if no data exists */}
                  {moodEntries.length === 0 && diaryEntries.length === 0 && (
                    <div className="mt-8 pt-6 border-t border-border/50">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-3">Want to see how trends work?</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={loadDemoData}
                          className="text-xs"
                        >
                          Load sample data
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Mood Tab */}
              <TabsContent value="mood" className="flex-1 flex flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium">Mood Check-In</h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowMoodForm(!showMoodForm)}
                  >
                    {showMoodForm ? <X size={16} /> : <Plus size={16} />}
                  </Button>
                </div>

                {/* Mood Registration Form */}
                {showMoodForm && (
                  <Card className="p-6 mb-6 border-accent/20">
                    <h3 className="text-base font-medium mb-4">How are you feeling right now?</h3>
                    
                    <div className="space-y-6">
                      {/* Emoji Scale */}
                      <div className="flex justify-between">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <Button
                            key={level}
                            variant="ghost"
                            onClick={() => registerMood(level)}
                            className="h-20 w-20 flex flex-col items-center justify-center hover:bg-accent/10 rounded-2xl transition-colors"
                          >
                            <span className="text-3xl mb-2">{getMoodEmoji(level)}</span>
                            <span className="text-xs text-muted-foreground">{level}</span>
                          </Button>
                        ))}
                      </div>
                      
                      <div className="flex justify-between text-xs text-muted-foreground px-4">
                        <span>Very Sad</span>
                        <span>Neutral</span>
                        <span>Very Happy</span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Recent Mood Entries */}
                <ScrollArea className="flex-1">
                  {moodEntries.length === 0 ? (
                    <div className="text-center py-12">
                      <Smiley size={48} className="mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No mood entries yet</p>
                      <Button onClick={() => setShowMoodForm(true)}>
                        Log your first mood
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {moodEntries
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((entry) => (
                          <Card key={entry.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{getMoodEmoji(entry.level)}</span>
                                <div>
                                  <p className="font-medium">{getMoodLabel(entry.level)}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(entry.timestamp).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline">{entry.level}/5</Badge>
                            </div>
                          </Card>
                        ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Trends Tab */}
              <TabsContent value="trends" className="flex-1 flex flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium">Mood Trends</h2>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <TrendUp size={16} />
                    <span>Pattern Analysis</span>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  {moodEntries.length < 3 ? (
                    <div className="text-center py-12">
                      <TrendUp size={48} className="mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">Not enough data for trends</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Log at least 3 mood entries to see your emotional patterns
                      </p>
                      <Button onClick={() => setActiveTab('mood')}>
                        Start tracking mood
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {/* Insights Summary */}
                      {moodInsights && (
                        <Card className="p-6">
                          <h3 className="font-medium mb-4 flex items-center">
                            <CalendarBlank size={16} className="mr-2" />
                            Weekly Insights
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-accent">{moodInsights.recentAverage}</p>
                              <p className="text-sm text-muted-foreground">Average Mood</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-primary">{moodInsights.entriesThisWeek}</p>
                              <p className="text-sm text-muted-foreground">Entries This Week</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Trend:</span>
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant={
                                    moodInsights.trendDirection === 'improving' ? 'default' :
                                    moodInsights.trendDirection === 'declining' ? 'destructive' : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {moodInsights.trendDirection === 'improving' && '↗'} 
                                  {moodInsights.trendDirection === 'declining' && '↘'} 
                                  {moodInsights.trendDirection === 'stable' && '→'} 
                                  {moodInsights.trendDirection}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {moodInsights.trend > 0 ? '+' : ''}{moodInsights.trend}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Most common:</span>
                              <div className="flex items-center space-x-1">
                                <span>{moodInsights.mostCommonMood.emoji}</span>
                                <span>{moodInsights.mostCommonMood.mood}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({moodInsights.mostCommonMood.percentage}%)
                                </span>
                              </div>
                            </div>
                            
                            {moodInsights.bestDay.mood > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Best day:</span>
                                <div className="flex items-center space-x-1">
                                  <span>{getMoodEmoji(Math.round(moodInsights.bestDay.mood))}</span>
                                  <span>{moodInsights.bestDay.date}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({moodInsights.bestDay.mood}/5)
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      )}

                      {/* Mood Timeline Chart */}
                      {moodTrendsData.length > 0 && (
                        <Card className="p-6">
                          <h3 className="font-medium mb-4">14-Day Mood Timeline</h3>
                          <ChartContainer config={chartConfig} className="h-64">
                            <AreaChart data={moodTrendsData}>
                              <defs>
                                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.05}/>
                                </linearGradient>
                              </defs>
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis 
                                domain={[1, 5]} 
                                tick={{ fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => `${value}`}
                              />
                              <ChartTooltip 
                                content={
                                  <ChartTooltipContent 
                                    formatter={(value, name) => [
                                      `${value}/5 ${getMoodEmoji(Math.round(Number(value)))}`,
                                      "Average Mood"
                                    ]}
                                    labelFormatter={(label, payload) => {
                                      const data = payload?.[0]?.payload
                                      return `${label} (${data?.count} ${data?.count === 1 ? 'entry' : 'entries'})`
                                    }}
                                  />
                                } 
                              />
                              <Area
                                type="monotone"
                                dataKey="mood"
                                stroke="hsl(var(--accent))"
                                fillOpacity={1}
                                fill="url(#moodGradient)"
                                strokeWidth={2}
                                dot={{ 
                                  fill: "hsl(var(--accent))", 
                                  strokeWidth: 2, 
                                  stroke: "hsl(var(--background))",
                                  r: 4 
                                }}
                              />
                            </AreaChart>
                          </ChartContainer>
                        </Card>
                      )}

                      {/* Mood Distribution */}
                      <Card className="p-6">
                        <h3 className="font-medium mb-4">Recent Mood Distribution</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Based on your last {Math.min(moodEntries.length, 21)} entries
                        </p>
                        
                        <ChartContainer config={chartConfig} className="h-48">
                          <BarChart data={weeklyMoodDistribution} layout="horizontal">
                            <XAxis type="number" hide />
                            <YAxis 
                              dataKey="mood" 
                              type="category" 
                              tick={{ fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                              width={60}
                            />
                            <ChartTooltip 
                              content={
                                <ChartTooltipContent 
                                  formatter={(value, name, props) => [
                                    `${value} entries (${props.payload.percentage}%)`,
                                    `${props.payload.emoji} ${props.payload.mood}`
                                  ]}
                                  hideLabel={true}
                                />
                              } 
                            />
                            <Bar 
                              dataKey="count" 
                              fill="hsl(var(--accent))"
                              radius={[0, 4, 4, 0]}
                            >
                              {weeklyMoodDistribution.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={
                                    entry.level === 1 ? 'hsl(220, 50%, 60%)' :
                                    entry.level === 2 ? 'hsl(220, 30%, 70%)' :
                                    entry.level === 3 ? 'hsl(var(--muted-foreground))' :
                                    entry.level === 4 ? 'hsl(120, 40%, 60%)' :
                                    'hsl(60, 80%, 60%)'
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ChartContainer>
                        
                        {/* Distribution percentages */}
                        <div className="grid grid-cols-5 gap-2 mt-4">
                          {weeklyMoodDistribution.map((item) => (
                            <div key={item.level} className="text-center">
                              <div className="text-lg mb-1">{item.emoji}</div>
                              <div className="text-sm font-medium">{item.percentage}%</div>
                              <div className="text-xs text-muted-foreground">{item.count}</div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Pattern Recognition */}
                      {moodTrendsData.length >= 7 && (
                        <Card className="p-6">
                          <h3 className="font-medium mb-4">Pattern Recognition</h3>
                          <div className="space-y-3">
                            
                            {/* Weekly pattern analysis */}
                            <div className="p-4 bg-muted/30 rounded-lg">
                              <h4 className="text-sm font-medium mb-2">Weekly Pattern</h4>
                              <p className="text-sm text-muted-foreground">
                                {(() => {
                                  const recent = moodTrendsData.slice(-7)
                                  const avgWeekend = recent.filter((_, i) => i === 0 || i === 6).reduce((sum, d) => sum + d.mood, 0) / 2
                                  const avgWeekday = recent.filter((_, i) => i > 0 && i < 6).reduce((sum, d) => sum + d.mood, 0) / 5
                                  
                                  if (avgWeekend > avgWeekday + 0.3) {
                                    return "You tend to feel better on weekends. Consider bringing some weekend activities into your weekdays."
                                  } else if (avgWeekday > avgWeekend + 0.3) {
                                    return "Your weekdays are generally better than weekends. You might thrive with structure and routine."
                                  } else {
                                    return "Your mood is fairly consistent throughout the week. Great emotional stability!"
                                  }
                                })()}
                              </p>
                            </div>

                            {/* Consistency analysis */}
                            <div className="p-4 bg-muted/30 rounded-lg">
                              <h4 className="text-sm font-medium mb-2">Emotional Consistency</h4>
                              <p className="text-sm text-muted-foreground">
                                {(() => {
                                  const recentMoods = moodEntries.slice(0, 14).map(e => e.level)
                                  const variance = recentMoods.reduce((sum, mood) => {
                                    const avg = recentMoods.reduce((s, m) => s + m, 0) / recentMoods.length
                                    return sum + Math.pow(mood - avg, 2)
                                  }, 0) / recentMoods.length
                                  
                                  if (variance < 0.5) {
                                    return "Your mood has been very stable recently. This suggests good emotional regulation."
                                  } else if (variance < 1.5) {
                                    return "Your mood shows normal variation. This is healthy emotional responsiveness."
                                  } else {
                                    return "Your mood has been quite variable. Consider what factors might be influencing these changes."
                                  }
                                })()}
                              </p>
                            </div>

                          </div>
                        </Card>
                      )}

                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Diary Tab */}
              <TabsContent value="diary" className="flex-1 flex flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium">Personal Diary</h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingDiary(null)
                      setDiaryForm({
                        title: '',
                        content: '',
                        mood: 3,
                        tags: [],
                        tagInput: ''
                      })
                      setShowDiaryForm(!showDiaryForm)
                    }}
                  >
                    {showDiaryForm ? <X size={16} /> : <Plus size={16} />}
                  </Button>
                </div>

                {/* Diary Entry Form */}
                {showDiaryForm && (
                  <Card className="p-6 mb-6 border-accent/20">
                    <h3 className="text-base font-medium mb-4">
                      {editingDiary ? 'Edit Entry' : 'New Diary Entry'}
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Title</label>
                        <Input
                          value={diaryForm.title}
                          onChange={(e) => setDiaryForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="What's on your mind?"
                          className="border-border/50 focus:border-accent"
                        />
                      </div>
                      
                      {/* Content */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Your thoughts</label>
                        <Textarea
                          value={diaryForm.content}
                          onChange={(e) => setDiaryForm(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Express your feelings and thoughts freely..."
                          className="border-border/50 focus:border-accent resize-none"
                          rows={6}
                        />
                      </div>
                      
                      {/* Mood selector */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          How are you feeling? ({diaryForm.mood}/5)
                        </label>
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">{getMoodEmoji(diaryForm.mood)}</span>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={diaryForm.mood}
                            onChange={(e) => setDiaryForm(prev => ({ ...prev, mood: parseInt(e.target.value) }))}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground min-w-[4rem]">
                            {getMoodLabel(diaryForm.mood)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Tags */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Tags (optional)</label>
                        <div className="flex space-x-2 mb-2">
                          <Input
                            value={diaryForm.tagInput}
                            onChange={(e) => setDiaryForm(prev => ({ ...prev, tagInput: e.target.value }))}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addTag()
                              }
                            }}
                            placeholder="Add a tag..."
                            className="flex-1 border-border/50 focus:border-accent"
                          />
                          <Button
                            size="sm"
                            onClick={addTag}
                            disabled={!diaryForm.tagInput.trim()}
                          >
                            Add
                          </Button>
                        </div>
                        
                        {diaryForm.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {diaryForm.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => removeTag(tag)}
                              >
                                {tag} ×
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex space-x-3 pt-2">
                        <Button
                          onClick={saveDiaryEntry}
                          disabled={!diaryForm.title.trim() || !diaryForm.content.trim()}
                          className="bg-accent hover:bg-accent/90"
                        >
                          {editingDiary ? 'Update Entry' : 'Save Entry'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowDiaryForm(false)
                            setEditingDiary(null)
                            setDiaryForm({
                              title: '',
                              content: '',
                              mood: 3,
                              tags: [],
                              tagInput: ''
                            })
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Diary Entries List */}
                <ScrollArea className="flex-1">
                  {diaryEntries.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen size={48} className="mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">Your diary is empty</p>
                      <Button onClick={() => setShowDiaryForm(true)}>
                        Write your first entry
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {diaryEntries
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((entry) => (
                          <Card key={entry.id} className="p-4 hover:border-accent/40 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-medium mb-1">{entry.title}</h3>
                                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                                  {entry.mood && (
                                    <div className="flex items-center space-x-1">
                                      <span>{getMoodEmoji(entry.mood)}</span>
                                      <span>{entry.mood}/5</span>
                                    </div>
                                  )}
                                  <span>
                                    {new Date(entry.timestamp).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      month: 'short', 
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditingDiary(entry)}
                                >
                                  <Edit3 size={14} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteDiaryEntry(entry.id)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                              {entry.content}
                            </p>
                            
                            {entry.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {entry.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </Card>
                        ))}
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