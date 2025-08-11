# Companion App - Product Requirements Document

## Core Purpose & Success
- **Mission Statement**: A compassionate AI emotional companion that provides empathetic conversation and guided breathing exercises for emotional wellbeing.
- **Success Indicators**: Users feel emotionally supported, complete breathing exercises regularly, and maintain consistent mood tracking.
- **Experience Qualities**: Calming, empathetic, healing.

## Project Classification & Approach
- **Complexity Level**: Light Application - two core features with shared state
- **Primary User Activity**: Interacting - emotional support through conversation and breathing exercises

## Essential Features

### 1. AI Companion Chat
- **Functionality**: Real-time conversation with an empathetic AI that responds to user emotional state and mood history
- **Purpose**: Provide emotional support and understanding through natural dialogue
- **Success Criteria**: AI responses feel appropriate to user's emotional context and mood patterns

### 2. Quick Mood Check-in
- **Functionality**: 5-point emoji scale (😢 to 😊) for rapid mood logging
- **Purpose**: Track emotional patterns and inform AI companion context
- **Success Criteria**: Simple one-tap mood entry with visual feedback

### 3. Guided Breathing Exercises
- **Functionality**: Synchronized breathing exercises with animated infinity loop avatar guidance
- **Purpose**: Provide active emotional regulation tool through structured breathing
- **Success Criteria**: Clear visual guidance with 4-6-4-2 breathing pattern (inhale-hold-exhale-pause)

## Design Direction

### Visual Tone & Identity
- **Emotional Response**: Peaceful, safe, healing, present
- **Design Personality**: Minimalist, organic, ethereal, human-centered
- **Visual Metaphors**: Infinity loops representing continuous presence and flow, gentle breathing rhythms
- **Simplicity Spectrum**: Minimal interface - focused on emotional connection over technical complexity

### Color Strategy
- **Color Scheme Type**: Analogous with calming blues and cyans
- **Primary Color**: Deep slate (oklch(0.10 0.01 240)) - grounding, safe background
- **Secondary Colors**: Soft blues and cyans - breathing and active states
- **Accent Color**: Purple (oklch(0.55 0.18 280)) - user interaction and warmth
- **Color Psychology**: Blues promote calm and trust, purples add warmth without stimulation
- **Breathing Mode**: Cyan to indigo gradient - represents breath flow and healing energy

### Typography System
- **Font Selection**: Inter - clean, readable, friendly
- **Typographic Hierarchy**: Large breathing instructions, medium status text, small metadata
- **Reading Priority**: Breathing guidance > mood state > conversation

### Avatar & Animation
- **Infinity Loop Design**: Continuous flowing loops representing eternal presence and support
- **Breathing Synchronization**: Avatar scales and colors shift to match breathing phases
- **Mood Reflection**: Colors adapt to user's recent mood patterns
- **Motion Purpose**: Guide breathing rhythm, provide comfort through continuous presence

### Breathing Exercise Interface
- **Visual Guidance**: Expanding/contracting circle synchronized with breathing phases
- **Progress Indicators**: Session timer, cycle counter, completion progress
- **Instruction Text**: Clear phase guidance ("Breathe in slowly...", "Hold gently...")
- **Ambient Colors**: Calming cyan-to-blue gradient throughout breathing session

## Implementation Considerations
- **State Management**: useKV for persistent mood tracking and breathing session history
- **Responsive Design**: Mobile-first single column layout
- **Animation Performance**: Smooth 60fps breathing animations with CSS transforms
- **Accessibility**: Clear visual hierarchy, readable text, intuitive touch targets

## Core User Flow
1. Open app → See infinity loop avatar reflecting current emotional state
2. Quick mood check-in via emoji scale (optional)
3. Choose between:
   - Chat with AI companion for emotional support
   - Start guided breathing exercise for active regulation
4. Breathing mode: Follow infinity loop and visual guides through breathing cycles
5. Return to normal mode with session completion tracking

## Success Metrics
- Regular breathing exercise completion (target: 3+ minutes per session)
- Consistent mood tracking entries
- Meaningful AI conversation engagement
- User reports of emotional benefit and calm