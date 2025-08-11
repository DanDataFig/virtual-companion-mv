# Companion App - Product Requirements Document

## Core Purpose & Success
- **Mission Statement**: A compassionate AI emotional companion that provides empathetic conversation and mood tracking with dynamic visual feedback that responds to conversation intensity.
- **Success Indicators**: Users feel emotionally supported, experience responsive visual feedback during conversations, and maintain consistent mood tracking.
- **Experience Qualities**: Calming, empathetic, responsive.

## Project Classification & Approach
- **Complexity Level**: Light Application - two core features with intelligent visual responsiveness
- **Primary User Activity**: Interacting - emotional support through conversation with real-time visual feedback

## Essential Features

### 1. AI Companion Chat with Intensity Visualization
- **Functionality**: Real-time conversation with an empathetic AI companion represented by animated overlapping circles that respond to conversation intensity
- **Purpose**: Provide emotional support through natural dialogue with visual feedback that reflects engagement levels
- **Success Criteria**: AI responses feel appropriate to user's emotional context, visual circles respond dynamically to conversation intensity

### 2. Real-time Conversation Intensity Animation
- **Functionality**: Circles change color, scale, animation speed, and glow based on analyzed conversation intensity (word choice, punctuation, length, emotional content)
- **Purpose**: Create immersive feedback that makes the companion feel alive and responsive to user engagement
- **Success Criteria**: Visual feedback feels natural and enhances emotional connection without being distracting

### 3. Quick Mood Check-in
- **Functionality**: 5-point emoji scale (😢 to 😊) for rapid mood logging that influences companion visual state
- **Purpose**: Track emotional patterns and inform both AI companion context and visual representation
- **Success Criteria**: Simple one-tap mood entry with immediate visual feedback in companion appearance

## Design Direction

### Visual Tone & Identity
- **Emotional Response**: Responsive, alive, empathetic, present
- **Design Personality**: Organic, ethereal, dynamically responsive, human-centered
- **Visual Metaphors**: Overlapping circles representing connection and presence, intensity-based animation representing emotional resonance
- **Simplicity Spectrum**: Minimal interface focused on emotional connection through dynamic visual feedback

### Color Strategy
- **Color Scheme Type**: Mood-responsive gradients (blue/indigo for calm, green/teal for positive, purple/pink for neutral)
- **Primary Color**: Deep slate (oklch(0.10 0.01 240)) - grounding background
- **Dynamic Colors**: Circles shift between color palettes based on mood and conversation intensity
- **Intensity Amplification**: Higher intensity = deeper colors, stronger glow effects, enhanced contrast
- **Color Psychology**: Blues promote calm, greens indicate positive engagement, purples represent balanced interaction

### Avatar Animation System
- **Base State**: Two overlapping circles with gentle pulsing (3-4 second cycles)
- **Intensity Response**: Animation speed increases, scale grows, glow intensifies based on conversation analysis
- **Mood Integration**: Color palettes shift based on user's recent mood entries
- **Real-time Feedback**: Circles respond to typing for immediate visual connection
- **High Intensity Effects**: Ripple animations appear around circles during peak engagement

### Conversation Intensity Analysis
- **Word Analysis**: Emotional keywords (excited, amazing, terrible, etc.) increase intensity
- **Punctuation Weight**: Exclamation marks and question marks add intensity points
- **Message Length**: Longer messages indicate higher engagement
- **Caps Detection**: ALL CAPS text significantly increases intensity
- **Intensity Decay**: Visual effects gradually return to baseline after conversation pauses

## Implementation Considerations
- **Real-time Analysis**: Client-side intensity calculation for immediate visual response
- **Performance**: Smooth animations at 60fps using CSS transforms and transitions
- **State Management**: useKV for persistent mood tracking and conversation history
- **Responsive Design**: Mobile-first with large touch targets for voice/mood controls

## Core User Flow
1. Open app → See overlapping circle companion in neutral state
2. Quick mood check-in (optional) → Circles adapt color palette
3. Start typing → Circles begin responding to intensity in real-time
4. Send message → Full intensity analysis triggers enhanced visual feedback
5. AI responds → Companion maintains contextual mood while awaiting next interaction
6. High-intensity conversations → Additional ripple effects and enhanced glow

## Success Metrics
- Visual feedback feels natural and enhances emotional connection
- Users engage longer due to responsive visual feedback
- Conversation intensity accurately reflects user emotional state
- Mood tracking integration provides meaningful context for companion behavior