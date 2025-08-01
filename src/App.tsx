import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Mic, ChartLine, X, Calendar, Clock, Brain, TrendUp, Lightbulb, Heart, Palette, SpeakerHigh, SpeakerX, Sparkle, BookOpen, Download, Plus, FileText, Export, Smiley, Wind, Play, Pause, TimerIcon, SpeakerSimpleHigh, SpeakerSimpleSlash } from "@phosphor-icons/react"
import { useKV } from '@github/spark/hooks'

interface Message {
  id: string
  text: string
  sender: 'user' | 'avatar'
  timestamp: Date | string
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
  timestamp: Date | string
  actionable?: boolean
  relatedEmotions: string[]
}

interface ConversationMemory {
  patterns: EmotionalPattern[]
  keywords: { [key: string]: number }
  totalConversations: number
  lastUpdated: Date | string
  insights: EmotionalInsight[]
}

interface ConversationTheme {
  id: string
  name: string
  description: string
  prompts: string[]
  emotion: 'calm' | 'joyful' | 'concerned' | 'contemplative' | 'supportive'
  color: string
  icon: string
}

interface AmbientSound {
  id: string
  name: string
  emotion: 'calm' | 'joyful' | 'concerned' | 'contemplative' | 'supportive'
  frequency: number
  volume: number
  type: 'sine' | 'triangle' | 'sawtooth' | 'square'
}

interface JournalEntry {
  id: string
  title: string
  content: string
  emotion: 'calm' | 'joyful' | 'concerned' | 'contemplative' | 'supportive'
  intensity: number
  tags: string[]
  conversationContext?: string[]
  timestamp: Date | string
  aiInsight?: string
}

interface MoodEntry {
  id: string
  moodLevel: number // 1-5 scale (1=very sad, 5=very happy)
  timestamp: Date | string
  note?: string
}

interface BreathingExercise {
  id: string
  name: string
  description: string
  inhaleCount: number
  holdCount: number
  exhaleCount: number
  cycles: number
  frequency: number // Hz for binaural beats
  emotion: 'calm' | 'energize' | 'focus' | 'sleep'
  duration: number // in seconds
}

interface MeditationSession {
  id: string
  title: string
  description: string
  type: 'breathing' | 'mindfulness' | 'body-scan' | 'loving-kindness' | 'visualization'
  duration: number // in minutes
  guidance: MeditationStep[]
  breathingPattern?: BreathingExercise
  backgroundSounds: AmbientSound[]
  emotion: 'calm' | 'joyful' | 'concerned' | 'contemplative' | 'supportive'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
}

interface MeditationStep {
  id: string
  text: string
  duration: number // in seconds
  breathingCue?: {
    type: 'inhale' | 'hold' | 'exhale' | 'pause'
    duration: number
  }
  soundCue?: string
}

interface MeditationProgress {
  sessionId: string
  completedAt: Date | string
  durationCompleted: number // in minutes
  rating?: number // 1-5
  notes?: string
  emotionalState: {
    before: 'calm' | 'joyful' | 'concerned' | 'contemplative' | 'supportive'
    after: 'calm' | 'joyful' | 'concerned' | 'contemplative' | 'supportive'
  }
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
  const [journalEntries, setJournalEntries] = useKV<JournalEntry[]>("journal-entries", [])
  const [moodEntries, setMoodEntries] = useKV<MoodEntry[]>("mood-entries", [])
  const [meditationProgress, setMeditationProgress] = useKV<MeditationProgress[]>("meditation-progress", [])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [currentMood, setCurrentMood] = useState<'calm' | 'joyful' | 'concerned' | 'contemplative' | 'supportive'>('calm')
  const [showMemoryInsights, setShowMemoryInsights] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<ConversationTheme | null>(null)
  const [ambientEnabled, setAmbientEnabled] = useState(false)
  const [showThemes, setShowThemes] = useState(false)
  const [showJournalForm, setShowJournalForm] = useState(false)
  const [showMoodRegistration, setShowMoodRegistration] = useState(false)
  const [showBreathingExercise, setShowBreathingExercise] = useState(false)
  const [currentBreathingExercise, setCurrentBreathingExercise] = useState<BreathingExercise | null>(null)
  const [breathingActive, setBreathingActive] = useState(false)
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [breathingCycleCount, setBreathingCycleCount] = useState(0)
  const [breathingTimeRemaining, setBreathingTimeRemaining] = useState(0)
  const [breathingPhaseProgress, setBreathingPhaseProgress] = useState(0)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [journalForm, setJournalForm] = useState({
    title: '',
    content: '',
    emotion: 'calm' as const,
    intensity: 3,
    tags: [] as string[],
    tagInput: ''
  })
  const [activeMeditation, setActiveMeditation] = useState<MeditationSession | null>(null)
  const [meditationActive, setMeditationActive] = useState(false)
  const [currentMeditationStep, setCurrentMeditationStep] = useState(0)
  const [meditationTimeElapsed, setMeditationTimeElapsed] = useState(0)
  const [meditationStepTimeRemaining, setMeditationStepTimeRemaining] = useState(0)
  const [showMeditationSessions, setShowMeditationSessions] = useState(false)
  const [preSessionMood, setPreSessionMood] = useState<'calm' | 'joyful' | 'concerned' | 'contemplative' | 'supportive' | null>(null)

  // Audio context and oscillators for ambient sounds and meditation
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorsRef = useRef<{ [key: string]: OscillatorNode }>({})
  const gainNodesRef = useRef<{ [key: string]: GainNode }>({})
  const meditationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Text-to-Speech for meditation narration
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [voiceNarrationEnabled, setVoiceNarrationEnabled] = useState(true)
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Comprehensive meditation sessions
  const meditationSessions: MeditationSession[] = [
    {
      id: 'breathing-calm',
      title: 'Calming Breath',
      description: 'A gentle 4-7-8 breathing pattern to promote deep relaxation and inner peace',
      type: 'breathing',
      duration: 10,
      difficulty: 'beginner',
      emotion: 'calm',
      tags: ['stress-relief', 'relaxation', 'sleep-prep'],
      breathingPattern: {
        id: 'calm-478',
        name: 'Calming 4-7-8 Breath',
        description: 'Breathe in for 4, hold for 7, exhale for 8',
        inhaleCount: 4,
        holdCount: 7,
        exhaleCount: 8,
        cycles: 8,
        frequency: 256,
        emotion: 'calm',
        duration: 600
      },
      backgroundSounds: [
        { id: 'meditation-base', name: 'Deep Earth Tone', emotion: 'calm', frequency: 256, volume: 0.015, type: 'sine' },
        { id: 'meditation-binaural', name: 'Theta Meditation Beat', emotion: 'calm', frequency: 260, volume: 0.015, type: 'sine' },
        { id: 'meditation-green', name: 'Forest Whisper', emotion: 'calm', frequency: 20, volume: 0.025, type: 'sine' }
      ],
      guidance: [
        {
          id: 'intro',
          text: 'Welcome to your calming breath meditation. Find a comfortable position and gently close your eyes.',
          duration: 10,
          soundCue: 'chime'
        },
        {
          id: 'breathing-instruction',
          text: 'We will practice the four-seven-eight breathing pattern. Breathe in through your nose for four counts, hold for seven, then exhale slowly through your mouth for eight counts.',
          duration: 15,
        },
        {
          id: 'begin-breathing',
          text: 'Let us begin. Breathe in slowly through your nose.',
          duration: 4,
          breathingCue: { type: 'inhale', duration: 4 }
        },
        {
          id: 'hold-breath',
          text: 'Hold your breath gently.',
          duration: 7,
          breathingCue: { type: 'hold', duration: 7 }
        },
        {
          id: 'exhale-breath',
          text: 'Now exhale slowly through your mouth.',
          duration: 8,
          breathingCue: { type: 'exhale', duration: 8 }
        },
        {
          id: 'continue-pattern',
          text: 'Continue this rhythm at your own pace. Notice how each breath brings deeper relaxation. Allow your body to soften with each exhale.',
          duration: 500,
        },
        {
          id: 'closing',
          text: 'Begin to deepen your breath naturally. Gently wiggle your fingers and toes, and when you are ready, slowly open your eyes.',
          duration: 20,
          soundCue: 'chime'
        }
      ]
    },
    {
      id: 'mindfulness-present',
      title: 'Present Moment Awareness',
      description: 'A guided practice to anchor yourself in the here and now through mindful attention',
      type: 'mindfulness',
      duration: 15,
      difficulty: 'beginner',
      emotion: 'contemplative',
      tags: ['mindfulness', 'awareness', 'grounding'],
      backgroundSounds: [
        { id: 'mindful-base', name: 'Singing Bowl Resonance', emotion: 'contemplative', frequency: 432, volume: 0.02, type: 'sine' },
        { id: 'mindful-binaural', name: 'Alpha Awareness Beat', emotion: 'contemplative', frequency: 440, volume: 0.02, type: 'sine' },
        { id: 'mindful-ambient', name: 'Gentle Rain', emotion: 'contemplative', frequency: 35, volume: 0.02, type: 'sine' }
      ],
      guidance: [
        {
          id: 'welcome',
          text: 'Welcome to present moment awareness meditation. Settle into your space and allow your body to relax.',
          duration: 15,
        },
        {
          id: 'body-awareness',
          text: 'Begin by noticing your body. Feel the weight of your body supported by the surface beneath you. Notice any areas of tension or comfort.',
          duration: 30,
        },
        {
          id: 'breath-anchor',
          text: 'Now bring your attention to your breath. Notice the natural rhythm of breathing without trying to change it. Feel the air entering and leaving your nostrils.',
          duration: 60,
        },
        {
          id: 'sounds',
          text: 'Expand your awareness to include the sounds around you. Simply notice them without judgment. Let them be part of your present moment experience.',
          duration: 90,
        },
        {
          id: 'thoughts',
          text: 'If thoughts arise, acknowledge them gently like clouds passing in the sky, then return your attention to the present moment.',
          duration: 120,
        },
        {
          id: 'integration',
          text: 'Rest in this awareness of the present moment. You are here, you are now, you are enough. There is nowhere else you need to be.',
          duration: 300,
        },
        {
          id: 'closing',
          text: 'Take a moment to appreciate this time you have given yourself. Gently return to your day with this sense of presence.',
          duration: 25,
        }
      ]
    },
    {
      id: 'body-scan-release',
      title: 'Body Scan for Release',
      description: 'A systematic practice to release tension and cultivate body awareness',
      type: 'body-scan',
      duration: 20,
      difficulty: 'intermediate',
      emotion: 'supportive',
      tags: ['tension-relief', 'body-awareness', 'healing'],
      backgroundSounds: [
        { id: 'healing-base', name: 'Heart Healing Frequency', emotion: 'supportive', frequency: 341, volume: 0.018, type: 'sine' },
        { id: 'healing-binaural', name: 'Theta Healing Beat', emotion: 'supportive', frequency: 347, volume: 0.018, type: 'sine' },
        { id: 'healing-nature', name: 'Ocean Waves', emotion: 'supportive', frequency: 25, volume: 0.025, type: 'sine' }
      ],
      guidance: [
        {
          id: 'setup',
          text: 'Lie down comfortably or sit with your spine straight. Close your eyes and begin to settle in.',
          duration: 20,
        },
        {
          id: 'feet',
          text: 'Bring your attention to your feet. Notice any sensations, then consciously release any tension.',
          duration: 60,
        },
        {
          id: 'legs',
          text: 'Move your awareness up to your legs. Feel your calves, knees, and thighs. Allow them to soften.',
          duration: 90,
        },
        {
          id: 'torso',
          text: 'Shift attention to your torso. Notice your belly, chest, and back. Breathe space into any tightness.',
          duration: 120,
        },
        {
          id: 'arms',
          text: 'Focus on your arms, from shoulders to fingertips. Let them be heavy and relaxed.',
          duration: 80,
        },
        {
          id: 'neck-head',
          text: 'Bring awareness to your neck, jaw, and face. Release any holding, letting your expression soften.',
          duration: 100,
        },
        {
          id: 'whole-body',
          text: 'Now sense your whole body as one unified field of awareness. Rest in this wholeness.',
          duration: 300,
        },
        {
          id: 'gratitude',
          text: 'Send gratitude to your body for all it does for you. Slowly begin to move and stretch.',
          duration: 30,
        }
      ]
    },
    {
      id: 'loving-kindness',
      title: 'Loving-Kindness Meditation',
      description: 'Cultivate compassion and goodwill toward yourself and others',
      type: 'loving-kindness',
      duration: 18,
      difficulty: 'intermediate',
      emotion: 'joyful',
      tags: ['compassion', 'love', 'emotional-healing'],
      backgroundSounds: [
        { id: 'love-base', name: 'Heart Chakra Tone', emotion: 'joyful', frequency: 341, volume: 0.02, type: 'sine' },
        { id: 'love-binaural', name: 'Alpha Love Beat', emotion: 'joyful', frequency: 349, volume: 0.02, type: 'sine' },
        { id: 'love-ambient', name: 'Gentle Hum', emotion: 'joyful', frequency: 40, volume: 0.015, type: 'sine' }
      ],
      guidance: [
        {
          id: 'centering',
          text: 'Sit comfortably and place your hand on your heart. Begin to connect with feelings of warmth and kindness.',
          duration: 20,
        },
        {
          id: 'self-love',
          text: 'Direct loving-kindness toward yourself: "May I be happy. May I be healthy. May I be at peace. May I be free from suffering."',
          duration: 180,
        },
        {
          id: 'loved-one',
          text: 'Bring to mind someone you love easily. Send them these wishes: "May you be happy. May you be healthy. May you be at peace."',
          duration: 150,
        },
        {
          id: 'neutral-person',
          text: 'Think of someone neutral - perhaps a cashier or neighbor. Extend the same kindness: "May you be happy. May you be healthy."',
          duration: 120,
        },
        {
          id: 'difficult-person',
          text: 'If you feel ready, think of someone challenging. Offer what kindness you can: "May you find peace. May you be free from suffering."',
          duration: 120,
        },
        {
          id: 'all-beings',
          text: 'Expand your circle to include all beings everywhere: "May all beings be happy. May all beings be free from suffering."',
          duration: 150,
        },
        {
          id: 'closing-love',
          text: 'Rest in this field of loving-kindness. Let it fill your heart and radiate outward into your day.',
          duration: 30,
        }
      ]
    },
    {
      id: 'visualization-garden',
      title: 'Inner Garden Visualization',
      description: 'Journey to a peaceful inner sanctuary where healing and growth flourish',
      type: 'visualization',
      duration: 25,
      difficulty: 'advanced',
      emotion: 'contemplative',
      tags: ['visualization', 'healing', 'inner-peace', 'creativity'],
      backgroundSounds: [
        { id: 'garden-base', name: 'Earth Mother Tone', emotion: 'contemplative', frequency: 256, volume: 0.015, type: 'sine' },
        { id: 'garden-binaural', name: 'Theta Journey Beat', emotion: 'contemplative', frequency: 261, volume: 0.015, type: 'sine' },
        { id: 'garden-nature', name: 'Birds and Breeze', emotion: 'contemplative', frequency: 45, volume: 0.02, type: 'sine' }
      ],
      guidance: [
        {
          id: 'journey-begin',
          text: 'Close your eyes and take three deep, cleansing breaths. Imagine yourself walking on a peaceful path.',
          duration: 30,
        },
        {
          id: 'gate',
          text: 'Ahead, you see a beautiful gate leading to your inner garden. Approach it slowly and notice its details.',
          duration: 60,
        },
        {
          id: 'entering',
          text: 'Open the gate and step into your sanctuary. What do you see? What do you feel?',
          duration: 90,
        },
        {
          id: 'exploration',
          text: 'Explore this garden that represents your inner world. Notice the plants, colors, and textures around you.',
          duration: 180,
        },
        {
          id: 'healing-spot',
          text: 'Find a special place in this garden where healing happens. Perhaps a tree, a fountain, or a flower bed.',
          duration: 120,
        },
        {
          id: 'receiving',
          text: 'Rest in this healing space. Receive whatever gifts this place has for you - wisdom, peace, or renewal.',
          duration: 300,
        },
        {
          id: 'planting',
          text: 'Before you leave, plant something new in your garden - an intention, a hope, or a dream.',
          duration: 90,
        },
        {
          id: 'return',
          text: 'Walk slowly back to the gate, knowing you can return here anytime. Step back through and return to your body.',
          duration: 60,
        },
        {
          id: 'integration',
          text: 'Take a moment to remember what you experienced. Gently open your eyes when you are ready.',
          duration: 30,
        }
      ]
    },
    {
      id: 'anxiety-relief',
      title: 'Anxiety Relief Breathing',
      description: 'A gentle breathing practice specifically designed to calm anxiety and racing thoughts',
      type: 'breathing',
      duration: 12,
      difficulty: 'beginner',
      emotion: 'concerned',
      tags: ['anxiety', 'stress-relief', 'calming'],
      breathingPattern: {
        id: 'anxiety-relief',
        name: 'Box Breathing for Anxiety',
        description: 'Equal counts for all phases to create stability',
        inhaleCount: 4,
        holdCount: 4,
        exhaleCount: 4,
        cycles: 12,
        frequency: 256,
        emotion: 'calm',
        duration: 720
      },
      backgroundSounds: [
        { id: 'anxiety-base', name: 'Grounding Frequency', emotion: 'concerned', frequency: 256, volume: 0.018, type: 'sine' },
        { id: 'anxiety-binaural', name: 'Calming Alpha Beat', emotion: 'concerned', frequency: 266, volume: 0.018, type: 'sine' },
        { id: 'anxiety-nature', name: 'Gentle Stream', emotion: 'concerned', frequency: 30, volume: 0.025, type: 'sine' }
      ],
      guidance: [
        {
          id: 'safety',
          text: 'You are safe in this moment. Find a comfortable position and know that this feeling will pass.',
          duration: 15,
        },
        {
          id: 'breath-anchor',
          text: 'We will use your breath as an anchor. Breathe in for 4 counts, hold for 4, exhale for 4, hold for 4.',
          duration: 20,
        },
        {
          id: 'box-breathing',
          text: 'Begin box breathing. In for 4... hold for 4... out for 4... hold for 4. Continue this steady rhythm.',
          duration: 480,
          breathingCue: { type: 'inhale', duration: 4 }
        },
        {
          id: 'grounding',
          text: 'With each breath, feel more grounded and stable. You are returning to your center.',
          duration: 120,
        },
        {
          id: 'affirmation',
          text: 'Remind yourself: "I am safe. I am breathing. This moment is okay. I can handle whatever comes."',
          duration: 60,
        },
        {
          id: 'transition',
          text: 'Continue breathing naturally. Notice how much calmer you feel now. You have the tools you need.',
          duration: 25,
        }
      ]
    }
  ]

  // Conversation themes based on emotions
  const conversationThemes: ConversationTheme[] = [
    {
      id: 'gratitude',
      name: 'Gratitude & Appreciation',
      description: 'Explore moments of gratitude and positive reflection',
      emotion: 'joyful',
      color: 'amber',
      icon: '✨',
      prompts: [
        "What's something beautiful you noticed today?",
        "Tell me about a moment that made you smile recently",
        "What are you most grateful for right now?",
        "Share a memory that brings you joy"
      ]
    },
    {
      id: 'growth',
      name: 'Personal Growth',
      description: 'Reflect on learning, challenges, and development',
      emotion: 'contemplative',
      color: 'purple',
      icon: '🌱',
      prompts: [
        "What's something new you've learned about yourself?",
        "How have you grown through a recent challenge?",
        "What wisdom would you share with your past self?",
        "What skills or qualities are you developing?"
      ]
    },
    {
      id: 'support',
      name: 'Seeking Support',
      description: 'Share challenges and receive gentle guidance',
      emotion: 'concerned',
      color: 'blue',
      icon: '🤝',
      prompts: [
        "What's weighing on your mind lately?",
        "How can I support you through this?",
        "What do you need to feel more at peace?",
        "Tell me about what's making you feel uncertain"
      ]
    },
    {
      id: 'mindfulness',
      name: 'Mindful Presence',
      description: 'Ground yourself in the present moment',
      emotion: 'calm',
      color: 'slate',
      icon: '🧘',
      prompts: [
        "How are you feeling in this very moment?",
        "What sensations do you notice in your body right now?",
        "Describe your environment - what do you see, hear, feel?",
        "What would help you feel more centered today?"
      ]
    },
    {
      id: 'connection',
      name: 'Human Connection',
      description: 'Explore relationships and meaningful connections',
      emotion: 'supportive',
      color: 'green',
      icon: '💚',
      prompts: [
        "Tell me about someone who makes you feel understood",
        "How do you like to show care for others?",
        "What makes you feel most connected to people?",
        "Share a meaningful conversation you've had recently"
      ]
    },
    {
      id: 'creativity',
      name: 'Creative Expression',
      description: 'Explore imagination, art, and creative outlets',
      emotion: 'joyful',
      color: 'orange',
      icon: '🎨',
      prompts: [
        "What creative activities bring you alive?",
        "Tell me about an idea that excites you",
        "How do you express your unique perspective?",
        "What would you create if you had unlimited resources?"
      ]
    }
  ]

  // Generate healing ambient sounds - soft binaural beats and deep green noise
  const createAmbientSound = (emotion: string): AmbientSound[] => {
    switch (emotion) {
      case 'joyful':
        return [
          { id: 'joy-1', name: 'Gentle Uplift Base', emotion: 'joyful', frequency: 136, volume: 0.03, type: 'sine' }, // OM frequency base
          { id: 'joy-2', name: 'Alpha Joy Binaural', emotion: 'joyful', frequency: 146, volume: 0.03, type: 'sine' }, // 10Hz alpha binaural
          { id: 'joy-3', name: 'Soft Green Noise', emotion: 'joyful', frequency: 40, volume: 0.02, type: 'sine' }   // Green noise layer
        ]
      case 'concerned':
        return [
          { id: 'concern-1', name: 'Deep Healing Base', emotion: 'concerned', frequency: 256, volume: 0.025, type: 'sine' }, // C note healing
          { id: 'concern-2', name: 'Theta Comfort Beat', emotion: 'concerned', frequency: 262, volume: 0.025, type: 'sine' }, // 6Hz theta binaural
          { id: 'concern-3', name: 'Grounding Green Noise', emotion: 'concerned', frequency: 35, volume: 0.03, type: 'sine' }  // Deep green noise
        ]
      case 'contemplative':
        return [
          { id: 'contemp-1', name: 'Meditation Base', emotion: 'contemplative', frequency: 432, volume: 0.02, type: 'sine' }, // 432Hz healing base
          { id: 'contemp-2', name: 'Theta Insight Beat', emotion: 'contemplative', frequency: 437, volume: 0.02, type: 'sine' }, // 5Hz theta binaural
          { id: 'contemp-3', name: 'Deep Forest Noise', emotion: 'contemplative', frequency: 30, volume: 0.025, type: 'sine' } // Very deep green noise
        ]
      case 'supportive':
        return [
          { id: 'support-1', name: 'Heart Healing Base', emotion: 'supportive', frequency: 341, volume: 0.025, type: 'sine' }, // F note heart chakra
          { id: 'support-2', name: 'Alpha Support Beat', emotion: 'supportive', frequency: 349, volume: 0.025, type: 'sine' }, // 8Hz alpha binaural
          { id: 'support-3', name: 'Nurturing Green Noise', emotion: 'supportive', frequency: 45, volume: 0.02, type: 'sine' } // Gentle green noise
        ]
      default: // calm
        return [
          { id: 'calm-1', name: 'Earth Resonance Base', emotion: 'calm', frequency: 256, volume: 0.02, type: 'sine' }, // Schumann resonance inspired
          { id: 'calm-2', name: 'Delta Peace Beat', emotion: 'calm', frequency: 259, volume: 0.02, type: 'sine' },    // 3Hz delta binaural
          { id: 'calm-3', name: 'Deep Green Ocean', emotion: 'calm', frequency: 25, volume: 0.035, type: 'sine' }     // Ultra-deep green noise
        ]
    }
  }

  // Initialize Text-to-Speech
  const initializeSpeechSynthesis = () => {
    try {
      if ('speechSynthesis' in window) {
        speechSynthesisRef.current = window.speechSynthesis
        
        // Load available voices
        const loadVoices = () => {
          const voices = speechSynthesisRef.current?.getVoices() || []
          
          // Filter for high-quality voices, prefer female voices for meditation
          const meditationVoices = voices.filter(voice => {
            const name = voice.name.toLowerCase()
            const lang = voice.lang.toLowerCase()
            
            // Prefer English voices
            if (!lang.startsWith('en')) return false
            
            // Look for high-quality voices (often contain "premium", "neural", "enhanced")
            const isHighQuality = name.includes('premium') || 
                                  name.includes('neural') || 
                                  name.includes('enhanced') ||
                                  name.includes('natural') ||
                                  voice.localService === false // Cloud voices are often higher quality
                                  
            // Prefer female voices for meditation (traditionally more soothing)
            const isFemale = name.includes('female') || 
                            name.includes('woman') ||
                            name.includes('samantha') ||
                            name.includes('alex') ||
                            name.includes('victoria') ||
                            name.includes('ava') ||
                            name.includes('serena') ||
                            name.includes('aria') ||
                            name.includes('nora') ||
                            name.includes('jenny') ||
                            name.includes('michelle')
            
            return isHighQuality || isFemale || voice.default
          })
          
          // Fallback to all voices if no preferred ones found
          const voicesToUse = meditationVoices.length > 0 ? meditationVoices : voices.filter(v => v.lang.startsWith('en'))
          
          setAvailableVoices(voicesToUse)
          
          // Select default voice (prefer the first high-quality female voice)
          if (voicesToUse.length > 0 && !selectedVoice) {
            const defaultVoice = voicesToUse.find(voice => {
              const name = voice.name.toLowerCase()
              return name.includes('samantha') || name.includes('alex') || name.includes('ava')
            }) || voicesToUse[0]
            
            setSelectedVoice(defaultVoice)
          }
        }
        
        // Load voices immediately
        loadVoices()
        
        // Some browsers load voices asynchronously
        if (speechSynthesisRef.current.onvoiceschanged !== undefined) {
          speechSynthesisRef.current.onvoiceschanged = loadVoices
        }
      }
    } catch (error) {
      console.warn('Speech synthesis initialization failed:', error)
    }
  }

  // Speak meditation guidance text
  const speakText = (text: string, options: { 
    rate?: number
    pitch?: number
    volume?: number
    onStart?: () => void
    onEnd?: () => void
  } = {}) => {
    if (!voiceNarrationEnabled || !speechSynthesisRef.current || !selectedVoice) return

    try {
      // Check if speech synthesis is available and working
      if (speechSynthesisRef.current.speaking) {
        speechSynthesisRef.current.cancel()
      }
      
      // Clean text for better speech (remove special characters, normalize punctuation)
      const cleanText = text
        .replace(/["""'']/g, '"')
        .replace(/[–—]/g, '-')
        .replace(/\.\.\./g, '...')
        .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure proper pauses between sentences
        .replace(/\b(\d+)-(\d+)-(\d+)\b/g, '$1 $2 $3') // Convert "4-7-8" to "4 7 8" for better pronunciation
        .trim()
      
      const utterance = new SpeechSynthesisUtterance(cleanText)
      
      // Configure voice settings for meditation
      utterance.voice = selectedVoice
      utterance.rate = options.rate || 0.8  // Slower pace for meditation
      utterance.pitch = options.pitch || 0.9 // Slightly lower pitch for calmness
      utterance.volume = options.volume || 0.8
      
      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true)
        options.onStart?.()
      }
      
      utterance.onend = () => {
        setIsSpeaking(false)
        currentUtteranceRef.current = null
        options.onEnd?.()
      }
      
      utterance.onerror = (event) => {
        console.warn('Speech synthesis error:', event.error)
        setIsSpeaking(false)
        currentUtteranceRef.current = null
        
        // If there's a critical error, disable voice narration
        if (event.error === 'not-allowed' || event.error === 'network') {
          setVoiceNarrationEnabled(false)
        }
        
        options.onEnd?.()
      }
      
      // Handle interruption (user navigates away, etc.)
      utterance.onpause = () => {
        setIsSpeaking(false)
      }
      
      utterance.onresume = () => {
        setIsSpeaking(true)
      }
      
      currentUtteranceRef.current = utterance
      speechSynthesisRef.current.speak(utterance)
      
    } catch (error) {
      console.warn('Failed to speak text:', error)
      setIsSpeaking(false)
      setVoiceNarrationEnabled(false) // Disable on critical error
      options.onEnd?.()
    }
  }

  // Stop current speech
  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel()
      setIsSpeaking(false)
      currentUtteranceRef.current = null
    }
  }

  // Toggle voice narration
  const toggleVoiceNarration = () => {
    const newState = !voiceNarrationEnabled
    setVoiceNarrationEnabled(newState)
    
    if (!newState && isSpeaking) {
      stopSpeaking()
    }
    
    // Provide feedback about the change
    if (activeMeditation) {
      const statusText = newState ? 
        "Voice guidance enabled. You'll hear narration for each step." : 
        "Voice guidance disabled. You can still see the text instructions."
      
      // If enabling voice and we have a selected voice, speak the status
      if (newState && selectedVoice) {
        setTimeout(() => {
          speakText(statusText, {
            rate: 0.8,
            pitch: 0.9,
            volume: 0.9
          })
        }, 500)
      }
    }
  }
  // Initialize audio context
  const initializeAudio = () => {
    try {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContext) {
          audioContextRef.current = new AudioContext()
        }
      }
    } catch (error) {
      console.warn('Audio context initialization failed:', error)
    }
  }

  // Start ambient sounds with enhanced healing binaural and therapeutic green noise
  const startAmbientSounds = (emotion: string) => {
    if (!ambientEnabled) return
    
    try {
      initializeAudio()
      if (!audioContextRef.current) return

      // Stop existing sounds
      stopAmbientSounds()

      const sounds = createAmbientSound(emotion)
      
      sounds.forEach((sound, index) => {
        try {
          if (sound.id.includes('Green') || sound.id.includes('Ocean') || sound.id.includes('Forest') || sound.id.includes('Noise')) {
            // Create therapeutic green noise
            createHealingGreenNoise(sound)
          } else {
            // Create gentle binaural beat (every other sound for L/R stereo effect)
            createTherapeuticBinaural(sound, index % 2 === 1)
          }
        } catch (error) {
          console.warn('Failed to create healing sound:', error)
        }
      })
    } catch (error) {
      console.warn('Failed to start healing ambient sounds:', error)
    }
  }

  // Create therapeutic binaural beats with healing frequencies
  const createTherapeuticBinaural = (sound: AmbientSound, isRightEar: boolean = false) => {
    try {
      const oscillator = audioContextRef.current!.createOscillator()
      const gainNode = audioContextRef.current!.createGain()
      const panner = audioContextRef.current!.createStereoPanner()
      const compressor = audioContextRef.current!.createDynamicsCompressor()
      const lowpass = audioContextRef.current!.createBiquadFilter()
      
      // Gentle stereo panning for binaural effect
      panner.pan.setValueAtTime(isRightEar ? 0.7 : -0.7, audioContextRef.current!.currentTime)
      
      // Pure sine wave for therapeutic effect
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(sound.frequency, audioContextRef.current!.currentTime)
      
      // Soft low-pass filter for smoothness
      lowpass.type = 'lowpass'
      lowpass.frequency.setValueAtTime(8000, audioContextRef.current!.currentTime)
      lowpass.Q.setValueAtTime(0.5, audioContextRef.current!.currentTime)
      
      // Gentle compression for even dynamics
      compressor.threshold.setValueAtTime(-24, audioContextRef.current!.currentTime)
      compressor.knee.setValueAtTime(30, audioContextRef.current!.currentTime)
      compressor.ratio.setValueAtTime(3, audioContextRef.current!.currentTime)
      compressor.attack.setValueAtTime(0.003, audioContextRef.current!.currentTime)
      compressor.release.setValueAtTime(0.25, audioContextRef.current!.currentTime)
      
      // Very gentle volume with slow fade-in
      gainNode.gain.setValueAtTime(0, audioContextRef.current!.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(sound.volume, audioContextRef.current!.currentTime + 8)
      
      // Subtle frequency modulation for organic feel (very gentle)
      const lfo = audioContextRef.current!.createOscillator()
      const lfoGain = audioContextRef.current!.createGain()
      lfo.type = 'sine'
      lfo.frequency.setValueAtTime(0.05, audioContextRef.current!.currentTime) // Extremely slow modulation
      lfoGain.gain.setValueAtTime(0.2, audioContextRef.current!.currentTime)  // Very subtle depth
      
      lfo.connect(lfoGain)
      lfoGain.connect(oscillator.frequency)
      lfo.start()
      
      // Connect audio chain
      oscillator.connect(lowpass)
      lowpass.connect(compressor)
      compressor.connect(gainNode)
      gainNode.connect(panner)
      panner.connect(audioContextRef.current!.destination)
      
      oscillator.start()
      
      oscillatorsRef.current[sound.id] = oscillator
      gainNodesRef.current[sound.id] = gainNode
      
      // Store LFO for cleanup
      oscillatorsRef.current[sound.id + '_lfo'] = lfo
      
    } catch (error) {
      console.warn('Failed to create therapeutic binaural:', error)
    }
  }

  // Create healing green noise with therapeutic frequencies
  const createHealingGreenNoise = (sound: AmbientSound) => {
    try {
      const bufferSize = 8192 // Larger buffer for smoother noise
      const buffer = audioContextRef.current!.createBuffer(2, bufferSize, audioContextRef.current!.sampleRate)
      
      // Generate therapeutic green noise (1/f^0.5 power spectral density)
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel)
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
        
        for (let i = 0; i < bufferSize; i++) {
          // Generate brown/pink noise for green noise characteristics
          const white = Math.random() * 2 - 1
          
          // Paul Kellet's pink noise filter approximation for natural sound
          b0 = 0.99886 * b0 + white * 0.0555179
          b1 = 0.99332 * b1 + white * 0.0750759
          b2 = 0.96900 * b2 + white * 0.1538520
          b3 = 0.86650 * b3 + white * 0.3104856
          b4 = 0.55000 * b4 + white * 0.5329522
          b5 = -0.7616 * b5 - white * 0.0168980
          
          const pinkNoise = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
          b6 = white * 0.115926
          
          // Apply gentle filtering for deep, soothing characteristics
          channelData[i] = pinkNoise * 0.15 // Reduce amplitude for background ambience
        }
      }
      
      const noiseSource = audioContextRef.current!.createBufferSource()
      const gainNode = audioContextRef.current!.createGain()
      const lowpass1 = audioContextRef.current!.createBiquadFilter()
      const lowpass2 = audioContextRef.current!.createBiquadFilter()
      const highpass = audioContextRef.current!.createBiquadFilter()
      
      // Deep low-pass filtering for ultra-soothing effect
      lowpass1.type = 'lowpass'
      lowpass1.frequency.setValueAtTime(sound.frequency * 4, audioContextRef.current!.currentTime)
      lowpass1.Q.setValueAtTime(0.7, audioContextRef.current!.currentTime)
      
      lowpass2.type = 'lowpass'
      lowpass2.frequency.setValueAtTime(sound.frequency * 6, audioContextRef.current!.currentTime)
      lowpass2.Q.setValueAtTime(1.2, audioContextRef.current!.currentTime)
      
      // Gentle high-pass to remove subsonic rumble
      highpass.type = 'highpass'
      highpass.frequency.setValueAtTime(20, audioContextRef.current!.currentTime)
      highpass.Q.setValueAtTime(0.5, audioContextRef.current!.currentTime)
      
      noiseSource.buffer = buffer
      noiseSource.loop = true
      
      // Very slow fade-in for ambient presence
      gainNode.gain.setValueAtTime(0, audioContextRef.current!.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(sound.volume, audioContextRef.current!.currentTime + 12)
      
      // Connect the healing audio chain
      noiseSource.connect(highpass)
      highpass.connect(lowpass1)
      lowpass1.connect(lowpass2)
      lowpass2.connect(gainNode)
      gainNode.connect(audioContextRef.current!.destination)
      
      noiseSource.start()
      
      oscillatorsRef.current[sound.id] = noiseSource as any
      gainNodesRef.current[sound.id] = gainNode
      
    } catch (error) {
      console.warn('Failed to create healing green noise:', error)
    }
  }

  // Stop ambient sounds - enhanced cleanup
  const stopAmbientSounds = () => {
    Object.entries(oscillatorsRef.current).forEach(([key, oscillator]) => {
      try {
        if (oscillator) {
          if ('stop' in oscillator) {
            oscillator.stop()
          }
        }
      } catch (e) {
        // Already stopped or invalid
      }
    })
    
    oscillatorsRef.current = {}
    gainNodesRef.current = {}
  }

  // Update ambient sounds when mood changes
  useEffect(() => {
    if (ambientEnabled) {
      startAmbientSounds(currentMood)
    }
    return () => {
      if (!ambientEnabled) {
        stopAmbientSounds()
      }
    }
  }, [currentMood, ambientEnabled])

  // Initialize systems on mount
  useEffect(() => {
    initializeSpeechSynthesis()
  }, [])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientSounds()
      stopSpeaking() // Stop any ongoing speech
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
      if (meditationTimerRef.current) {
        clearInterval(meditationTimerRef.current)
      }
      if (breathingTimerRef.current) {
        clearTimeout(breathingTimerRef.current)
      }
    }
  }, [])

  // Quick mood registration functions
  const getMoodEmoji = (level: number): string => {
    switch (level) {
      case 1: return '😢' // Very sad
      case 2: return '😞' // Sad
      case 3: return '😐' // Neutral
      case 4: return '🙂' // Happy
      case 5: return '😊' // Very happy
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

  const registerMood = (level: number, note?: string) => {
    const newMoodEntry: MoodEntry = {
      id: `mood-${Date.now()}`,
      moodLevel: level,
      timestamp: new Date(),
      note: note?.trim() || undefined
    }

    setMoodEntries(current => [newMoodEntry, ...current.slice(0, 99)]) // Keep last 100 entries
    setShowMoodRegistration(false)
  }

  const getTodaysMoods = () => {
    const today = new Date().toDateString()
    return moodEntries.filter(entry => 
      new Date(entry.timestamp).toDateString() === today
    )
  }

  const getAverageMoodToday = () => {
    const todaysMoods = getTodaysMoods()
    if (todaysMoods.length === 0) return null
    return Math.round(todaysMoods.reduce((sum, mood) => sum + mood.moodLevel, 0) / todaysMoods.length * 10) / 10
  }

  // Meditation session management
  const startMeditationSession = (session: MeditationSession) => {
    setActiveMeditation(session)
    setMeditationActive(true)
    setCurrentMeditationStep(0)
    setMeditationTimeElapsed(0)
    setMeditationStepTimeRemaining(session.guidance[0].duration)
    setPreSessionMood(currentMood)
    setShowMeditationSessions(false)
    
    // Set emotion based on session
    setCurrentMood(session.emotion)
    
    // Start ambient sounds for meditation
    if (session.backgroundSounds) {
      stopAmbientSounds()
      startMeditationAudio(session.backgroundSounds)
    }
    
    // Start the meditation timer
    runMeditationSession(session)
  }

  const runMeditationSession = (session: MeditationSession) => {
    let stepIndex = 0
    let stepTimeRemaining = session.guidance[0].duration

    // Speak the first guidance step
    if (voiceNarrationEnabled && session.guidance[0]) {
      speakText(session.guidance[0].text, {
        rate: 0.7,
        pitch: 0.8,
        volume: 0.9
      })
    }

    const updateTimer = () => {
      setMeditationTimeElapsed(prev => prev + 1)
      setMeditationStepTimeRemaining(prev => {
        const newTime = prev - 1
        if (newTime <= 0 && stepIndex < session.guidance.length - 1) {
          // Move to next step
          stepIndex++
          setCurrentMeditationStep(stepIndex)
          const nextStepDuration = session.guidance[stepIndex].duration
          setMeditationStepTimeRemaining(nextStepDuration)
          
          // Handle breathing cues
          const step = session.guidance[stepIndex]
          if (step.breathingCue) {
            handleBreathingCue(step.breathingCue)
          }
          
          // Speak the new guidance step with a slight delay to avoid overlap
          if (voiceNarrationEnabled && step.text) {
            setTimeout(() => {
              speakText(step.text, {
                rate: 0.7,
                pitch: 0.8,
                volume: 0.9
              })
            }, 500) // 500ms delay for natural flow
          }
          
          return nextStepDuration
        }
        return newTime
      })
    }

    meditationTimerRef.current = setInterval(updateTimer, 1000)

    // Auto-stop when session is complete
    setTimeout(() => {
      completeMeditationSession()
    }, session.duration * 60 * 1000)
  }

  const handleBreathingCue = (cue: { type: 'inhale' | 'hold' | 'exhale' | 'pause', duration: number }) => {
    setBreathingPhase(cue.type as 'inhale' | 'hold' | 'exhale')
    // The breathing pattern is visual guidance, actual timing managed by meditation session
  }

  const pauseMeditationSession = () => {
    const newActiveState = !meditationActive
    setMeditationActive(newActiveState)
    
    if (meditationTimerRef.current) {
      if (meditationActive) {
        // Pausing - stop timer and speech
        clearInterval(meditationTimerRef.current)
        stopSpeaking()
      } else {
        // Resuming - restart timer and possibly speak current step
        if (activeMeditation) {
          runMeditationSession(activeMeditation)
          
          // Speak current step when resuming if voice is enabled
          if (voiceNarrationEnabled && activeMeditation.guidance[currentMeditationStep]) {
            setTimeout(() => {
              speakText(activeMeditation.guidance[currentMeditationStep].text, {
                rate: 0.7,
                pitch: 0.8,
                volume: 0.9
              })
            }, 1000) // Delay to allow user to settle back into meditation
          }
        }
      }
    }
  }

  const stopMeditationSession = () => {
    if (meditationTimerRef.current) {
      clearInterval(meditationTimerRef.current)
    }
    stopSpeaking() // Stop any ongoing speech
    stopAmbientSounds()
    setActiveMeditation(null)
    setMeditationActive(false)
    setCurrentMeditationStep(0)
    setMeditationTimeElapsed(0)
    setMeditationStepTimeRemaining(0)
    setPreSessionMood(null)
  }

  const completeMeditationSession = () => {
    if (!activeMeditation || !preSessionMood) return

    // Stop any ongoing speech
    stopSpeaking()

    const progress: MeditationProgress = {
      sessionId: activeMeditation.id,
      completedAt: new Date(),
      durationCompleted: Math.round(meditationTimeElapsed / 60),
      emotionalState: {
        before: preSessionMood,
        after: currentMood
      }
    }

    setMeditationProgress(current => [progress, ...current.slice(0, 49)]) // Keep last 50 sessions
    
    // Speak completion message if voice is enabled
    const completionText = `Beautiful work completing your ${activeMeditation.title} session. Take a moment to notice how you feel now.`
    if (voiceNarrationEnabled) {
      speakText(completionText, {
        rate: 0.8,
        pitch: 0.9,
        volume: 0.9,
        onEnd: () => {
          // Add completion message to chat after speech ends
          if (messages.length > 0) {
            const completionMessage: Message = {
              id: `meditation-complete-${Date.now()}`,
              text: `${completionText} How was that experience for you?`,
              sender: 'avatar',
              timestamp: new Date(),
              mood: 'supportive'
            }
            setMessages(prev => [...prev, completionMessage])
          }
        }
      })
    } else {
      // Add completion message immediately if no voice
      if (messages.length > 0) {
        const completionMessage: Message = {
          id: `meditation-complete-${Date.now()}`,
          text: `${completionText} How was that experience for you?`,
          sender: 'avatar',
          timestamp: new Date(),
          mood: 'supportive'
        }
        setMessages(prev => [...prev, completionMessage])
      }
    }
    
    stopMeditationSession()
  }

  const startMeditationAudio = (sounds: AmbientSound[]) => {
    if (!ambientEnabled) return
    
    try {
      initializeAudio()
      if (!audioContextRef.current) return

      sounds.forEach((sound, index) => {
        if (sound.id.includes('green') || sound.id.includes('nature') || sound.id.includes('ambient')) {
          createHealingGreenNoise(sound)
        } else {
          createTherapeuticBinaural(sound, index % 2 === 1)
        }
      })
    } catch (error) {
      console.warn('Failed to start meditation audio:', error)
    }
  }

  const formatMeditationTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  const toggleAmbientSounds = () => {
    try {
      setAmbientEnabled(!ambientEnabled)
      if (!ambientEnabled) {
        // User needs to interact with page for audio to work
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume()
        }
        startAmbientSounds(currentMood)
      } else {
        stopAmbientSounds()
      }
    } catch (error) {
      console.warn('Failed to toggle ambient sounds:', error)
    }
  }

  // Apply conversation theme
  const applyTheme = (theme: ConversationTheme) => {
    setSelectedTheme(theme)
    setCurrentMood(theme.emotion)
    setShowThemes(false)
    
    // Add a theme message to the conversation
    const themeMessage: Message = {
      id: `theme-${Date.now()}`,
      text: `Let's explore ${theme.name.toLowerCase()}. ${theme.description}`,
      sender: 'avatar',
      timestamp: new Date(),
      mood: theme.emotion
    }
    
    setMessages(prev => [...prev, themeMessage])
  }

  // Get theme prompt
  const getThemePrompt = (theme: ConversationTheme): string => {
    const randomPrompt = theme.prompts[Math.floor(Math.random() * theme.prompts.length)]
    return randomPrompt
  }

  // Suggest theme-based conversation starter
  const suggestThemePrompt = () => {
    if (!selectedTheme) return
    
    const prompt = getThemePrompt(selectedTheme)
    const themePromptMessage: Message = {
      id: `prompt-${Date.now()}`,
      text: prompt,
      sender: 'avatar',
      timestamp: new Date(),
      mood: selectedTheme.emotion
    }
    
    setMessages(prev => [...prev, themePromptMessage])
  }

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

  // Generate AI insight for journal entry
  const generateJournalInsight = async (content: string, emotion: string): Promise<string> => {
    try {
      const prompt = spark.llmPrompt`
        Based on this journal entry about ${emotion} feelings:
        "${content}"
        
        Provide a gentle, supportive insight or reflection (2-3 sentences) that offers:
        1. Validation of their feelings
        2. A thoughtful observation or connection
        3. Gentle encouragement or perspective
        
        Keep it warm, empathetic, and focused on growth or self-compassion.
      `
      
      const insight = await spark.llm(prompt, "gpt-4o")
      return insight
    } catch (error) {
      return "Thank you for sharing your thoughts. Every reflection is a step toward deeper self-understanding."
    }
  }

  // Create or update journal entry
  const saveJournalEntry = async () => {
    if (!journalForm.title.trim() || !journalForm.content.trim()) return

    const entryData = {
      id: editingEntry?.id || `journal-${Date.now()}`,
      title: journalForm.title.trim(),
      content: journalForm.content.trim(),
      emotion: journalForm.emotion,
      intensity: journalForm.intensity,
      tags: journalForm.tags,
      timestamp: editingEntry?.timestamp || new Date(),
      conversationContext: memory.keywords ? 
        Object.entries(memory.keywords)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([word]) => word) : []
    }

    // Generate AI insight
    const aiInsight = await generateJournalInsight(entryData.content, entryData.emotion)
    
    const newEntry: JournalEntry = {
      ...entryData,
      aiInsight
    }

    if (editingEntry) {
      setJournalEntries(current => 
        current.map(entry => entry.id === editingEntry.id ? newEntry : entry)
      )
    } else {
      setJournalEntries(current => [newEntry, ...current])
    }

    // Reset form
    setJournalForm({
      title: '',
      content: '',
      emotion: 'calm',
      intensity: 3,
      tags: [],
      tagInput: ''
    })
    setEditingEntry(null)
    setShowJournalForm(false)
  }

  // Delete journal entry
  const deleteJournalEntry = (id: string) => {
    setJournalEntries(current => current.filter(entry => entry.id !== id))
  }

  // Start editing journal entry
  const startEditingEntry = (entry: JournalEntry) => {
    setEditingEntry(entry)
    setJournalForm({
      title: entry.title,
      content: entry.content,
      emotion: entry.emotion,
      intensity: entry.intensity,
      tags: entry.tags,
      tagInput: ''
    })
    setShowJournalForm(true)
  }

  // Add tag to journal form
  const addTag = () => {
    const tag = journalForm.tagInput.trim().toLowerCase()
    if (tag && !journalForm.tags.includes(tag)) {
      setJournalForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
        tagInput: ''
      }))
    }
  }

  // Remove tag from journal form
  const removeTag = (tagToRemove: string) => {
    setJournalForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  // Export journal as JSON
  const exportJournal = () => {
    const exportData = {
      entries: journalEntries,
      emotionalPatterns: memory.patterns,
      insights: memory.insights,
      totalConversations: memory.totalConversations,
      exportDate: new Date().toISOString(),
      summary: {
        totalEntries: journalEntries.length,
        emotionBreakdown: journalEntries.reduce((acc, entry) => {
          acc[entry.emotion] = (acc[entry.emotion] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        averageIntensity: journalEntries.length > 0 ? 
          journalEntries.reduce((sum, entry) => sum + entry.intensity, 0) / journalEntries.length : 0,
        dateRange: journalEntries.length > 0 ? {
          earliest: journalEntries[journalEntries.length - 1]?.timestamp,
          latest: journalEntries[0]?.timestamp
        } : null
      }
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emotional-journal-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export journal as readable text
  const exportJournalAsText = () => {
    let textContent = `PERSONAL EMOTIONAL JOURNAL\n`
    textContent += `=========================\n\n`
    textContent += `Export Date: ${new Date().toLocaleDateString()}\n`
    textContent += `Total Entries: ${journalEntries.length}\n`
    textContent += `Total Conversations: ${memory.totalConversations}\n\n`

    if (journalEntries.length > 0) {
      textContent += `JOURNAL ENTRIES\n`
      textContent += `---------------\n\n`

      journalEntries
        .slice()
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .forEach((entry, index) => {
          textContent += `${index + 1}. ${entry.title}\n`
          textContent += `Date: ${new Date(entry.timestamp).toLocaleDateString()}\n`
          textContent += `Emotion: ${entry.emotion} (intensity: ${entry.intensity}/5)\n`
          if (entry.tags.length > 0) {
            textContent += `Tags: ${entry.tags.join(', ')}\n`
          }
          textContent += `\nContent:\n${entry.content}\n`
          if (entry.aiInsight) {
            textContent += `\nAI Insight:\n${entry.aiInsight}\n`
          }
          textContent += `\n${'-'.repeat(50)}\n\n`
        })
    }

    // Add emotional patterns summary
    if (memory.patterns.length > 0) {
      textContent += `EMOTIONAL PATTERNS SUMMARY\n`
      textContent += `--------------------------\n\n`
      
      const emotionCounts = memory.patterns.reduce((acc, pattern) => {
        acc[pattern.dominantEmotion] = (acc[pattern.dominantEmotion] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([emotion, count]) => {
          textContent += `${emotion}: ${count} days\n`
        })
      textContent += `\n`
    }

    const blob = new Blob([textContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emotional-journal-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Auto-generate insights when enough data is available
  useEffect(() => {
    if (memory.patterns.length >= 3 && memory.insights.length === 0) {
      generateEmotionalInsights()
    }
  }, [memory.patterns.length])

  const updateEmotionalMemory = async (userMessage: string, userEmotion: string, avatarResponse: string) => {
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

  const getContextualPrompt = (userMessage: string) => {
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
    
    // Add theme context if active
    if (selectedTheme) {
      contextualInfo += `Current conversation theme: ${selectedTheme.name} - ${selectedTheme.description}. Focus on this theme while maintaining natural conversation flow. `
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
    // Special meditation mode
    if (activeMeditation) {
      return {
        containerGradient: 'from-purple-400/15 via-indigo-300/8 to-violet-200/12',
        glowColor: 'from-purple-400/25 to-indigo-300/15',
        eyeColor: 'bg-purple-400',
        eyeShadow: 'shadow-purple-400/50',
        mouthClass: 'w-12 h-3 bg-purple-400/80',
        animationSpeed: 'animate-pulse duration-3000',
        orbitals: [
          { pos: 'top-10 left-10', color: 'bg-purple-400/60', anim: 'animate-pulse duration-4000' },
          { pos: 'bottom-14 right-14', color: 'bg-indigo-300/70', anim: 'animate-pulse duration-5000' },
          { pos: 'top-20 right-12', color: 'bg-violet-300/50', anim: 'animate-pulse duration-6000' }
        ]
      }
    }

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
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${
                  activeMeditation ? 'bg-purple-400 animate-pulse' :
                  isTyping ? 'bg-accent animate-pulse' : 
                  moodConfig.eyeColor
                }`}></div>
                <span className="text-sm text-muted-foreground font-medium">
                  {activeMeditation ? 'Meditating...' :
                   isTyping ? 'Thinking...' : 
                   `${currentMood.charAt(0).toUpperCase() + currentMood.slice(1)} • Listening`}
                </span>
              </div>
              
              {/* Ambient Sound Status */}
              {ambientEnabled && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                  <span>{activeMeditation ? 'Meditation sounds active' : 'Healing sounds active'}</span>
                </div>
              )}
              
              {/* Voice Narration Status */}
              {activeMeditation && voiceNarrationEnabled && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-accent animate-pulse' : 'bg-muted'}`}></div>
                  <span>{isSpeaking ? 'Speaking guidance...' : 'Voice guidance ready'}</span>
                </div>
              )}
              
              {/* Active Theme Display */}
              {selectedTheme && !activeMeditation && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-card/50 px-3 py-1 rounded-full border border-accent/20">
                  <span>{selectedTheme.icon}</span>
                  <span>{selectedTheme.name}</span>
                </div>
              )}
              
              {/* Active Meditation Display */}
              {activeMeditation && (
                <div className="flex flex-col items-center space-y-1">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-purple-50/50 px-3 py-1 rounded-full border border-purple-200/50">
                    <Wind size={12} />
                    <span>{activeMeditation.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatMeditationTime(meditationTimeElapsed)} / {activeMeditation.duration}min
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conversation Section */}
        <div className="lg:flex-1 lg:max-w-md border-t lg:border-t-0 lg:border-l border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="h-full flex flex-col">
            
            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="p-6 border-b border-border/50">
                <TabsList className="grid w-full grid-cols-6 mb-4">
                  <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
                  <TabsTrigger value="mood" className="text-xs">Mood</TabsTrigger>
                  <TabsTrigger value="journal" className="text-xs">Journal</TabsTrigger>
                  <TabsTrigger value="meditate" className="text-xs">Meditate</TabsTrigger>
                  <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
                  <TabsTrigger value="calendar" className="text-xs">Calendar</TabsTrigger>
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
                      {/* Quick Mood Display */}
                      {getAverageMoodToday() && (
                        <span className="text-xs text-muted-foreground bg-accent/10 px-2 py-1 rounded-full flex items-center gap-1">
                          {getMoodEmoji(Math.round(getAverageMoodToday()!))} Today
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowMoodRegistration(!showMoodRegistration)}
                        className={`text-muted-foreground hover:text-foreground ${showMoodRegistration ? 'bg-accent/20 text-accent' : ''}`}
                        title="Quick mood check-in"
                      >
                        <Smiley size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={toggleAmbientSounds}
                        className={`text-muted-foreground hover:text-foreground ${ambientEnabled ? 'bg-accent/20 text-accent' : ''}`}
                        title={ambientEnabled ? 'Disable healing sounds' : 'Enable healing sounds'}
                      >
                        {ambientEnabled ? <SpeakerHigh size={16} /> : <SpeakerX size={16} />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowThemes(!showThemes)}
                        className={`text-muted-foreground hover:text-foreground ${showThemes ? 'bg-accent/20 text-accent' : ''}`}
                        title="Conversation themes"
                      >
                        <Palette size={16} />
                      </Button>
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
                
                {activeTab === 'mood' && (
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                          <Smiley size={20} />
                          Mood Tracker
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">Quick daily mood check-ins</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {moodEntries.length > 0 && (
                          <span className="text-xs text-muted-foreground bg-accent/10 px-2 py-1 rounded-full">
                            {moodEntries.length} entries
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowMoodRegistration(!showMoodRegistration)}
                          className={`text-muted-foreground hover:text-foreground ${showMoodRegistration ? 'bg-accent/20 text-accent' : ''}`}
                        >
                          {showMoodRegistration ? <X size={16} /> : <Plus size={16} />}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Quick Mood Registration Form */}
                    {showMoodRegistration && (
                      <Card className="mt-4 p-4 bg-muted/30 border-accent/20">
                        <h3 className="text-sm font-medium text-foreground mb-3">How are you feeling right now?</h3>
                        
                        <div className="space-y-4">
                          {/* Emoji Scale */}
                          <div className="flex justify-between items-center">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <Button
                                key={level}
                                variant="ghost"
                                onClick={() => registerMood(level)}
                                className="h-16 w-16 flex flex-col items-center justify-center hover:bg-accent/20 transition-colors rounded-xl"
                              >
                                <span className="text-2xl mb-1">{getMoodEmoji(level)}</span>
                                <span className="text-xs text-muted-foreground">{level}</span>
                              </Button>
                            ))}
                          </div>
                          
                          <div className="flex justify-between text-xs text-muted-foreground px-2">
                            <span>Very Sad</span>
                            <span>Neutral</span>
                            <span>Very Happy</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                )}
                
                {activeTab === 'journal' && (
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                          <BookOpen size={20} />
                          Personal Journal
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">Reflect on your emotional journey</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {journalEntries.length > 0 && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={exportJournalAsText}
                              className="text-muted-foreground hover:text-foreground"
                              title="Export as text file"
                            >
                              <FileText size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={exportJournal}
                              className="text-muted-foreground hover:text-foreground"
                              title="Export as JSON"
                            >
                              <Download size={16} />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingEntry(null)
                            setJournalForm({
                              title: '',
                              content: '',
                              emotion: 'calm',
                              intensity: 3,
                              tags: [],
                              tagInput: ''
                            })
                            setShowJournalForm(!showJournalForm)
                          }}
                          className={`text-muted-foreground hover:text-foreground ${showJournalForm ? 'bg-accent/20 text-accent' : ''}`}
                        >
                          {showJournalForm ? <X size={16} /> : <Plus size={16} />}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Journal Entry Form */}
                    {showJournalForm && (
                      <Card className="mt-4 p-4 bg-muted/30 border-accent/20">
                        <h3 className="text-sm font-medium text-foreground mb-3">
                          {editingEntry ? 'Edit Entry' : 'New Journal Entry'}
                        </h3>
                        
                        <div className="space-y-4">
                          {/* Title */}
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                            <Input
                              value={journalForm.title}
                              onChange={(e) => setJournalForm(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Give your entry a title..."
                              className="bg-background border-accent/30"
                            />
                          </div>
                          
                          {/* Content */}
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Your thoughts</label>
                            <Textarea
                              value={journalForm.content}
                              onChange={(e) => setJournalForm(prev => ({ ...prev, content: e.target.value }))}
                              placeholder="What's on your mind? How are you feeling? What insights have you gained?"
                              className="bg-background border-accent/30 resize-none"
                              rows={4}
                            />
                          </div>
                          
                          {/* Emotion and Intensity */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Emotion</label>
                              <select
                                value={journalForm.emotion}
                                onChange={(e) => setJournalForm(prev => ({ ...prev, emotion: e.target.value as any }))}
                                className="w-full p-2 text-sm bg-background border border-accent/30 rounded-md focus:outline-none focus:border-accent"
                              >
                                <option value="calm">Calm</option>
                                <option value="joyful">Joyful</option>
                                <option value="concerned">Concerned</option>
                                <option value="contemplative">Contemplative</option>
                                <option value="supportive">Supportive</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">
                                Intensity ({journalForm.intensity}/5)
                              </label>
                              <input
                                type="range"
                                min="1"
                                max="5"
                                value={journalForm.intensity}
                                onChange={(e) => setJournalForm(prev => ({ ...prev, intensity: parseInt(e.target.value) }))}
                                className="w-full"
                              />
                            </div>
                          </div>
                          
                          {/* Tags */}
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Tags</label>
                            <div className="flex space-x-2 mb-2">
                              <Input
                                value={journalForm.tagInput}
                                onChange={(e) => setJournalForm(prev => ({ ...prev, tagInput: e.target.value }))}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    addTag()
                                  }
                                }}
                                placeholder="Add a tag..."
                                className="flex-1 bg-background border-accent/30"
                              />
                              <Button
                                size="sm"
                                onClick={addTag}
                                disabled={!journalForm.tagInput.trim()}
                                className="bg-accent hover:bg-accent/90"
                              >
                                Add
                              </Button>
                            </div>
                            
                            {journalForm.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {journalForm.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => removeTag(tag)}
                                  >
                                    {tag} ×
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex space-x-2 pt-2">
                            <Button
                              size="sm"
                              onClick={saveJournalEntry}
                              disabled={!journalForm.title.trim() || !journalForm.content.trim()}
                              className="bg-accent hover:bg-accent/90"
                            >
                              {editingEntry ? 'Update Entry' : 'Save Entry'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setShowJournalForm(false)
                                setEditingEntry(null)
                                setJournalForm({
                                  title: '',
                                  content: '',
                                  emotion: 'calm',
                                  intensity: 3,
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
                  </div>
                )}
                
                {activeTab === 'meditate' && (
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                          <Wind size={20} />
                          Guided Meditation
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">Find peace through guided practice</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {meditationProgress.length > 0 && (
                          <span className="text-xs text-muted-foreground bg-accent/10 px-2 py-1 rounded-full">
                            {meditationProgress.length} sessions
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={toggleVoiceNarration}
                          className={`text-muted-foreground hover:text-foreground ${voiceNarrationEnabled ? 'bg-accent/20 text-accent' : ''}`}
                          title={voiceNarrationEnabled ? 'Disable voice guidance' : 'Enable voice guidance'}
                        >
                          {voiceNarrationEnabled ? <SpeakerSimpleHigh size={16} /> : <SpeakerSimpleSlash size={16} />}
                        </Button>
                        {!activeMeditation && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowMeditationSessions(!showMeditationSessions)}
                            className={`text-muted-foreground hover:text-foreground ${showMeditationSessions ? 'bg-accent/20 text-accent' : ''}`}
                          >
                            {showMeditationSessions ? <X size={16} /> : <Plus size={16} />}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Active Meditation Display */}
                    {activeMeditation && (
                      <Card className="mt-4 p-4 bg-muted/30 border-accent/20">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-medium text-foreground">{activeMeditation.title}</h3>
                            <p className="text-xs text-muted-foreground">
                              Step {currentMeditationStep + 1} of {activeMeditation.guidance.length}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {formatMeditationTime(meditationTimeElapsed)} / {activeMeditation.duration}min
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={toggleVoiceNarration}
                              className={`text-muted-foreground hover:text-foreground ${voiceNarrationEnabled ? 'bg-accent/20 text-accent' : ''}`}
                              title={voiceNarrationEnabled ? 'Disable voice guidance' : 'Enable voice guidance'}
                            >
                              {voiceNarrationEnabled ? <SpeakerSimpleHigh size={16} /> : <SpeakerSimpleSlash size={16} />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={pauseMeditationSession}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {meditationActive ? <Pause size={16} /> : <Play size={16} />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={stopMeditationSession}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Current Step Display */}
                        <div className="space-y-3">
                          <div className="bg-card/50 rounded-lg p-3">
                            <p className="text-sm text-foreground leading-relaxed">
                              {activeMeditation.guidance[currentMeditationStep]?.text}
                            </p>
                          </div>
                          
                          {/* Breathing Visualization */}
                          {activeMeditation.guidance[currentMeditationStep]?.breathingCue && (
                            <div className="flex flex-col items-center space-y-2">
                              <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-1000 ${
                                breathingPhase === 'inhale' ? 'scale-110 border-accent bg-accent/10' :
                                breathingPhase === 'hold' ? 'scale-110 border-primary bg-primary/10' :
                                'scale-90 border-muted bg-muted/20'
                              }`}>
                                <span className="text-xs text-muted-foreground capitalize">{breathingPhase}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {meditationStepTimeRemaining}s remaining
                              </p>
                            </div>
                          )}
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-accent h-2 rounded-full transition-all duration-1000"
                              style={{ 
                                width: `${(meditationTimeElapsed / (activeMeditation.duration * 60)) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </Card>
                    )}
                    
                    {/* Voice Settings Panel */}
                    {!activeMeditation && availableVoices.length > 0 && (
                      <Card className="mt-4 p-4 bg-muted/30 border-accent/20">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                            <SpeakerSimpleHigh size={16} />
                            Voice Guidance Settings
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${voiceNarrationEnabled ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>
                              {voiceNarrationEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          {/* Voice Selection */}
                          <div>
                            <label className="text-xs text-muted-foreground mb-2 block">Narrator Voice</label>
                            <select
                              value={selectedVoice?.name || ''}
                              onChange={(e) => {
                                const voice = availableVoices.find(v => v.name === e.target.value)
                                setSelectedVoice(voice || null)
                              }}
                              className="w-full p-2 text-sm bg-background border border-accent/30 rounded-md focus:outline-none focus:border-accent"
                              disabled={!voiceNarrationEnabled}
                            >
                              {availableVoices.map((voice) => (
                                <option key={voice.name} value={voice.name}>
                                  {voice.name} ({voice.lang})
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Voice Test */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Test voice</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (selectedVoice && voiceNarrationEnabled) {
                                  speakText("Welcome to your meditation practice. Let's begin this journey together.", {
                                    rate: 0.7,
                                    pitch: 0.8,
                                    volume: 0.9
                                  })
                                }
                              }}
                              disabled={!voiceNarrationEnabled || !selectedVoice || isSpeaking}
                              className="text-xs"
                            >
                              {isSpeaking ? 'Speaking...' : 'Test Voice'}
                            </Button>
                          </div>
                          
                          {/* Voice Description */}
                          <div className="text-xs text-muted-foreground bg-card/50 rounded-lg p-3">
                            <p>
                              Voice guidance provides gentle narration throughout your meditation session, 
                              helping you stay focused and relaxed. You can toggle it on or off at any time 
                              during your practice.
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}
                    
                    {/* Meditation Sessions List */}
                    {showMeditationSessions && !activeMeditation && (
                      <Card className="mt-4 p-4 bg-muted/30 border-accent/20">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-foreground">Choose a Practice</h3>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowMeditationSessions(false)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X size={12} />
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {meditationSessions.map((session) => (
                            <Button
                              key={session.id}
                              variant="ghost"
                              onClick={() => startMeditationSession(session)}
                              className="h-auto p-3 flex flex-col items-start space-y-2 hover:bg-accent/10 text-left w-full"
                            >
                              <div className="flex items-center justify-between w-full">
                                <h4 className="font-medium text-sm text-foreground">{session.title}</h4>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    {session.duration}min
                                  </Badge>
                                  <Badge variant="outline" className={`text-xs ${
                                    session.difficulty === 'beginner' ? 'border-green-400/50 text-green-700' :
                                    session.difficulty === 'intermediate' ? 'border-amber-400/50 text-amber-700' :
                                    'border-red-400/50 text-red-700'
                                  }`}>
                                    {session.difficulty}
                                  </Badge>
                                </div>
                              </div>
                              
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {session.description}
                              </p>
                              
                              <div className="flex flex-wrap gap-1">
                                {session.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </Card>
                    )}
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
                
                {activeTab === 'calendar' && (
                  <div>
                    <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <Calendar size={20} />
                      Emotional Calendar
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Your emotional journey by day</p>
                  </div>
                )}
              </div>
              
                {/* Conversation Themes Panel - only show in chat tab */}
                {activeTab === 'chat' && showThemes && (
                  <Card className="mt-4 p-4 bg-muted/30 border-accent/20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-foreground">Conversation Themes</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowThemes(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                    
                    <div className="grid gap-3">
                      {conversationThemes.map((theme) => (
                        <Button
                          key={theme.id}
                          variant="ghost"
                          onClick={() => applyTheme(theme)}
                          className="h-auto p-3 flex items-start space-x-3 hover:bg-accent/10 text-left"
                        >
                          <span className="text-lg mt-0.5">{theme.icon}</span>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm text-foreground">{theme.name}</h4>
                              <Badge variant="outline" className={`text-xs ${
                                theme.emotion === 'joyful' ? 'border-amber-400/50 text-amber-700' :
                                theme.emotion === 'concerned' ? 'border-blue-500/50 text-blue-700' :
                                theme.emotion === 'contemplative' ? 'border-purple-400/50 text-purple-700' :
                                theme.emotion === 'supportive' ? 'border-green-400/50 text-green-700' :
                                'border-slate-400/50 text-slate-700'
                              }`}>
                                {theme.emotion}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{theme.description}</p>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </Card>
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
                        <p className="text-sm text-muted-foreground mb-4">I'm here to listen and understand. What would you like to talk about?</p>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">💡 Try conversation themes or ambient sounds from the toolbar above</p>
                          <div className="flex justify-center space-x-1">
                            <Badge variant="outline" className="text-xs">
                              <Palette size={10} className="mr-1" />
                              Themes
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <SpeakerHigh size={10} className="mr-1" />
                              Healing Sounds
                            </Badge>
                          </div>
                        </div>
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
                                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

              <TabsContent value="mood" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <ScrollArea className="flex-1 p-6">
                  {moodEntries.length === 0 ? (
                    <div className="text-center py-12">
                      <Smiley size={48} className="mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">No mood entries yet</p>
                      <p className="text-sm text-muted-foreground mb-4">Start tracking your daily mood with quick check-ins</p>
                      <Button
                        onClick={() => setShowMoodRegistration(true)}
                        className="bg-accent hover:bg-accent/90"
                      >
                        <Smiley size={16} className="mr-2" />
                        First Check-in
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Mood Statistics */}
                      <Card className="p-4 bg-muted/30">
                        <h3 className="text-sm font-medium mb-3">Mood Overview</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-lg font-semibold">{moodEntries.length}</p>
                            <p className="text-xs text-muted-foreground">Total Entries</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold">
                              {moodEntries.length > 0 ? 
                                Math.round(moodEntries.reduce((sum, entry) => sum + entry.moodLevel, 0) / moodEntries.length * 10) / 10 
                                : 0}
                            </p>
                            <p className="text-xs text-muted-foreground">Avg Mood</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold">
                              {getAverageMoodToday() || '—'}
                            </p>
                            <p className="text-xs text-muted-foreground">Today</p>
                          </div>
                        </div>
                      </Card>

                      {/* Recent Mood Entries */}
                      <div>
                        <h3 className="text-sm font-medium mb-3">Recent Check-ins</h3>
                        <div className="space-y-3">
                          {moodEntries
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .slice(0, 20)
                            .map((entry) => (
                              <Card key={entry.id} className="p-3 border-accent/20">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-2xl">{getMoodEmoji(entry.moodLevel)}</span>
                                    <div>
                                      <p className="text-sm font-medium">{getMoodLabel(entry.moodLevel)}</p>
                                      <p className="text-xs text-muted-foreground">
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
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-muted-foreground">
                                      {entry.moodLevel}/5
                                    </span>
                                  </div>
                                </div>
                                {entry.note && (
                                  <p className="text-sm text-muted-foreground mt-2 pl-11">
                                    {entry.note}
                                  </p>
                                )}
                              </Card>
                            ))}
                        </div>
                      </div>

                      {/* Daily Mood Pattern */}
                      {moodEntries.length >= 7 && (
                        <Card className="p-4 bg-muted/30">
                          <h3 className="text-sm font-medium mb-3">7-Day Pattern</h3>
                          <div className="space-y-2">
                            {Array.from({length: 7}, (_, i) => {
                              const date = new Date()
                              date.setDate(date.getDate() - i)
                              const dateStr = date.toDateString()
                              const dayMoods = moodEntries.filter(entry => 
                                new Date(entry.timestamp).toDateString() === dateStr
                              )
                              const avgMood = dayMoods.length > 0 ? 
                                Math.round(dayMoods.reduce((sum, mood) => sum + mood.moodLevel, 0) / dayMoods.length) : null
                              
                              return (
                                <div key={i} className="flex items-center justify-between py-1">
                                  <span className="text-xs text-muted-foreground">
                                    {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    {avgMood ? (
                                      <>
                                        <span className="text-sm">{getMoodEmoji(avgMood)}</span>
                                        <span className="text-xs text-muted-foreground w-8 text-right">
                                          {avgMood}/5
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </Card>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="meditate" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <ScrollArea className="flex-1 p-6">
                  {!activeMeditation ? (
                    <div className="space-y-6">
                      {/* Meditation Welcome */}
                      <div className="text-center py-8">
                        <Wind size={48} className="mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-lg font-medium text-foreground mb-2">Welcome to Meditation</h2>
                        <p className="text-sm text-muted-foreground mb-6">
                          Find peace, clarity, and healing through guided meditation practices
                        </p>
                        <Button
                          onClick={() => setShowMeditationSessions(true)}
                          className="bg-accent hover:bg-accent/90"
                        >
                          <Wind size={16} className="mr-2" />
                          Start Your Practice
                        </Button>
                      </div>

                      {/* Recent Sessions */}
                      {meditationProgress.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium mb-3">Recent Sessions</h3>
                          <div className="space-y-3">
                            {meditationProgress
                              .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                              .slice(0, 5)
                              .map((progress) => {
                                const session = meditationSessions.find(s => s.id === progress.sessionId)
                                if (!session) return null
                                
                                return (
                                  <Card key={`${progress.sessionId}-${progress.completedAt}`} className="p-3 border-accent/20">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h4 className="text-sm font-medium">{session.title}</h4>
                                        <p className="text-xs text-muted-foreground">
                                          {progress.durationCompleted}min • {new Date(progress.completedAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        {progress.emotionalState.before !== progress.emotionalState.after && (
                                          <div className="flex items-center space-x-1">
                                            <Badge variant="outline" className="text-xs">
                                              {progress.emotionalState.before}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">→</span>
                                            <Badge variant="outline" className={`text-xs ${
                                              progress.emotionalState.after === 'joyful' ? 'border-amber-400/50 text-amber-700' :
                                              progress.emotionalState.after === 'calm' ? 'border-slate-400/50 text-slate-700' :
                                              progress.emotionalState.after === 'contemplative' ? 'border-purple-400/50 text-purple-700' :
                                              progress.emotionalState.after === 'supportive' ? 'border-green-400/50 text-green-700' :
                                              'border-blue-400/50 text-blue-700'
                                            }`}>
                                              {progress.emotionalState.after}
                                            </Badge>
                                          </div>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => startMeditationSession(session)}
                                          className="text-muted-foreground hover:text-foreground"
                                        >
                                          <Play size={12} />
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      {/* Practice Statistics */}
                      {meditationProgress.length > 0 && (
                        <Card className="p-4 bg-muted/30">
                          <h3 className="text-sm font-medium mb-3">Your Practice</h3>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-lg font-semibold">{meditationProgress.length}</p>
                              <p className="text-xs text-muted-foreground">Sessions</p>
                            </div>
                            <div>
                              <p className="text-lg font-semibold">
                                {Math.round(meditationProgress.reduce((sum, p) => sum + p.durationCompleted, 0))}
                              </p>
                              <p className="text-xs text-muted-foreground">Minutes</p>
                            </div>
                            <div>
                              <p className="text-lg font-semibold">
                                {meditationProgress.length > 0 ? 
                                  Math.round(meditationProgress.reduce((sum, p) => sum + p.durationCompleted, 0) / meditationProgress.length) 
                                  : 0}
                              </p>
                              <p className="text-xs text-muted-foreground">Avg Duration</p>
                            </div>
                          </div>
                        </Card>
                      )}

                      {/* Meditation Categories */}
                      <div>
                        <h3 className="text-sm font-medium mb-3">Explore by Type</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { type: 'breathing', label: 'Breathing', icon: '🫁', color: 'blue' },
                            { type: 'mindfulness', label: 'Mindfulness', icon: '🧘', color: 'purple' },
                            { type: 'body-scan', label: 'Body Scan', icon: '✨', color: 'green' },
                            { type: 'loving-kindness', label: 'Love & Kindness', icon: '💚', color: 'amber' },
                            { type: 'visualization', label: 'Visualization', icon: '🌸', color: 'pink' },
                          ].map(({ type, label, icon, color }) => {
                            const sessionsOfType = meditationSessions.filter(s => s.type === type)
                            return (
                              <Button
                                key={type}
                                variant="ghost"
                                onClick={() => {
                                  setShowMeditationSessions(true)
                                }}
                                className="h-16 flex flex-col items-center justify-center space-y-1 hover:bg-accent/10"
                              >
                                <span className="text-lg">{icon}</span>
                                <span className="text-xs text-muted-foreground">{label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {sessionsOfType.length} available
                                </span>
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Active Meditation Interface */
                    <div className="h-full flex flex-col items-center justify-center space-y-8">
                      {/* Session Info */}
                      <div className="text-center space-y-2">
                        <h2 className="text-xl font-medium text-foreground">{activeMeditation.title}</h2>
                        <p className="text-sm text-muted-foreground max-w-md">
                          {activeMeditation.description}
                        </p>
                      </div>

                      {/* Large Breathing Visualization */}
                      {activeMeditation.guidance[currentMeditationStep]?.breathingCue && (
                        <div className="flex flex-col items-center space-y-6">
                          <div className={`w-40 h-40 rounded-full border-4 flex items-center justify-center transition-all duration-2000 ${
                            breathingPhase === 'inhale' ? 'scale-125 border-accent bg-accent/20 shadow-xl shadow-accent/30' :
                            breathingPhase === 'hold' ? 'scale-125 border-primary bg-primary/20 shadow-xl shadow-primary/30' :
                            'scale-75 border-muted bg-muted/30 shadow-lg'
                          }`}>
                            <div className="text-center">
                              <p className="text-lg font-medium capitalize">{breathingPhase}</p>
                              <p className="text-sm text-muted-foreground">
                                {activeMeditation.breathingPattern ? 
                                  (breathingPhase === 'inhale' ? activeMeditation.breathingPattern.inhaleCount :
                                   breathingPhase === 'hold' ? activeMeditation.breathingPattern.holdCount :
                                   activeMeditation.breathingPattern.exhaleCount) + 's' 
                                  : ''}
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-center text-sm text-muted-foreground max-w-sm">
                            Follow the circle as it guides your breathing rhythm
                          </p>
                        </div>
                      )}

                      {/* Current Guidance */}
                      <Card className="w-full max-w-md p-6 bg-card/50 backdrop-blur-sm">
                        <p className="text-center text-sm leading-relaxed text-foreground">
                          {activeMeditation.guidance[currentMeditationStep]?.text}
                        </p>
                      </Card>

                      {/* Progress and Controls */}
                      <div className="w-full max-w-md space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Step {currentMeditationStep + 1} of {activeMeditation.guidance.length}</span>
                            <span>{formatMeditationTime(meditationTimeElapsed)} / {activeMeditation.duration}min</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-accent h-2 rounded-full transition-all duration-1000"
                              style={{ 
                                width: `${(meditationTimeElapsed / (activeMeditation.duration * 60)) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex items-center justify-center space-x-4">
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={toggleVoiceNarration}
                            className={`border-accent/30 ${voiceNarrationEnabled ? 'bg-accent/10 text-accent' : ''}`}
                            title={voiceNarrationEnabled ? 'Disable voice guidance' : 'Enable voice guidance'}
                          >
                            {voiceNarrationEnabled ? <SpeakerSimpleHigh size={20} /> : <SpeakerSimpleSlash size={20} />}
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={pauseMeditationSession}
                            className="border-accent/30"
                          >
                            {meditationActive ? <Pause size={20} /> : <Play size={20} />}
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={stopMeditationSession}
                            className="border-destructive/30 text-destructive hover:bg-destructive/10"
                          >
                            <X size={20} />
                          </Button>
                        </div>
                        
                        {/* Voice Status */}
                        {voiceNarrationEnabled && (
                          <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                            <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-accent animate-pulse' : 'bg-muted'}`}></div>
                            <span>{isSpeaking ? 'Voice guidance active' : 'Voice guidance ready'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="journal" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <ScrollArea className="flex-1 p-6">
                  {journalEntries.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen size={48} className="mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">Your journal is empty</p>
                      <p className="text-sm text-muted-foreground mb-4">Start writing to capture your thoughts and emotional journey</p>
                      <Button
                        onClick={() => setShowJournalForm(true)}
                        className="bg-accent hover:bg-accent/90"
                      >
                        <Plus size={16} className="mr-2" />
                        Write First Entry
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Journal Stats */}
                      <Card className="p-4 bg-muted/30">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-lg font-semibold">{journalEntries.length}</p>
                            <p className="text-xs text-muted-foreground">Entries</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold">
                              {journalEntries.length > 0 ? 
                                Math.round(journalEntries.reduce((sum, entry) => sum + entry.intensity, 0) / journalEntries.length * 10) / 10 
                                : 0}
                            </p>
                            <p className="text-xs text-muted-foreground">Avg Intensity</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold">
                              {journalEntries.length > 0 ? 
                                Object.entries(
                                  journalEntries.reduce((acc, entry) => {
                                    acc[entry.emotion] = (acc[entry.emotion] || 0) + 1
                                    return acc
                                  }, {} as Record<string, number>)
                                ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'
                                : 'none'
                              }
                            </p>
                            <p className="text-xs text-muted-foreground">Top Emotion</p>
                          </div>
                        </div>
                      </Card>

                      {/* Journal Entries List */}
                      <div className="space-y-4">
                        {journalEntries
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map((entry) => (
                            <Card key={entry.id} className="p-4 border-accent/20 hover:border-accent/40 transition-colors">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h3 className="font-medium text-sm text-foreground mb-1">{entry.title}</h3>
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${ 
                                        entry.emotion === 'joyful' ? 'border-amber-400/50 text-amber-700' :
                                        entry.emotion === 'concerned' ? 'border-blue-500/50 text-blue-700' :
                                        entry.emotion === 'contemplative' ? 'border-purple-400/50 text-purple-700' :
                                        entry.emotion === 'supportive' ? 'border-green-400/50 text-green-700' :
                                        'border-slate-400/50 text-slate-700'
                                      }`}
                                    >
                                      {entry.emotion}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Intensity: {entry.intensity}/5
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(entry.timestamp).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditingEntry(entry)}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteJournalEntry(entry.id)}
                                    className="text-muted-foreground hover:text-destructive"
                                  >
                                    <X size={12} />
                                  </Button>
                                </div>
                              </div>
                              
                              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                                {entry.content}
                              </p>
                              
                              {entry.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {entry.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              
                              {entry.aiInsight && (
                                <div className="border-l-2 border-accent/50 pl-3 bg-accent/5 rounded-r-md p-2">
                                  <p className="text-xs text-muted-foreground mb-1">AI Insight</p>
                                  <p className="text-sm text-accent-foreground leading-relaxed">
                                    {entry.aiInsight}
                                  </p>
                                </div>
                              )}
                              
                              {entry.conversationContext && entry.conversationContext.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-border/30">
                                  <p className="text-xs text-muted-foreground mb-1">Related conversation themes</p>
                                  <div className="flex flex-wrap gap-1">
                                    {entry.conversationContext.map((context) => (
                                      <Badge key={context} variant="outline" className="text-xs">
                                        {context}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </Card>
                          ))}
                      </div>
                    </div>
                  )}
                </ScrollArea>
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
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App