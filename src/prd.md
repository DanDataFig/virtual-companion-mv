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

### 4. Comprehensive User Preferences
- **Functionality**: Advanced settings for voice customization (volume, speed, pitch, voice selection), visual themes (colors, animation speed, motion reduction), and notification preferences (check-ins, reminders, summaries)
- **Purpose**: Allow users to personalize their companion experience to match their accessibility needs and preferences
- **Success Criteria**: Settings persist across sessions, voice changes are immediately applied, theme updates reflect throughout the interface

### 5. Presence Selection System
- **Functionality**: Four distinct companion presences (Nebula, Luma, Terra, Nova) with unique personalities, colors, and interaction styles
- **Purpose**: Provide variety and allow users to choose companions that best match their current emotional needs
- **Success Criteria**: Smooth transitions between presences, personality differences are apparent in responses, visual appearance changes immediately

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
- **State Management**: useKV for persistent mood tracking, conversation history, and user preferences
- **Responsive Design**: Mobile-first with large touch targets for voice/mood controls
- **Accessibility**: Voice customization, motion reduction options, high contrast theme support
- **Personalization**: Persistent preferences for voice, theme, and notification settings across sessions

## Core User Flow
1. **Onboarding**: Welcome → Introduction → Presence Selection → Preference Setup
2. **Daily Use**: Open app → See companion in remembered state (mood/presence)
3. **Settings Access**: Tap gear icon → Customize voice, theme, notifications
4. **Interaction**: Mood check-in → Start conversation → Dynamic visual feedback
5. **Presence Switching**: Tap switch button → Choose different companion personality
6. **Voice Interaction**: Toggle voice responses with customized speed/pitch/volume
7. **High-intensity conversations**: Enhanced visual effects and ripple animations

## Advanced Features
### Settings Categories
- **Voice Settings**: Enable/disable, volume (0-100%), speed (50-200%), pitch (50-200%), voice selection
- **Theme Settings**: Auto/dark/light theme, primary color palette (8 options), animation speed, motion reduction
- **Notifications**: Enable/disable, daily check-ins, mood reminders, weekly summaries, preferred time

### Presence System
- **Nebula**: Mystical purple/violet - exploration and wonder
- **Luma**: Bright amber/yellow - encouragement and joy  
- **Terra**: Grounding green/emerald - stability and growth
- **Nova**: Dynamic cyan/blue - transformation and change

## Success Metrics
- Visual feedback feels natural and enhances emotional connection
- Users engage longer due to responsive visual feedback and personalization
- Settings reduce barriers for users with accessibility needs
- Conversation intensity accurately reflects user emotional state
- Presence switching provides meaningful variety in companion interaction
- Voice customization improves comfort and engagement