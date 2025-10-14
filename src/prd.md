# WE Companion App - Product Requirements Document

## Core Purpose & Success
- **Mission Statement**: A compassionate AI emotional companion that provides empathetic conversation, mood tracking, and community support with dynamic visual feedback that responds to conversation intensity.
- **Success Indicators**: Users feel emotionally supported, experience responsive visual feedback during conversations, maintain consistent mood tracking, and build meaningful connections with others on similar journeys.
- **Experience Qualities**: Calming, empathetic, responsive, connected.

## Project Classification & Approach
- **Complexity Level**: Complex Application - multiple core features with community integration, real-time social interactions, and advanced personalization
- **Primary User Activity**: Interacting - emotional support through AI conversation, community engagement, and social connection with visual feedback

## Essential Features

### 1. AI Companion Chat with Intensity Visualization
- **Functionality**: Real-time conversation with an empathetic AI companion represented by animated overlapping circles that respond to conversation intensity
- **Purpose**: Provide emotional support through natural dialogue with visual feedback that reflects engagement levels
- **Success Criteria**: AI responses feel appropriate to user's emotional context, visual circles respond dynamically to conversation intensity

### 2. Real-time Conversation Intensity Animation with Dynamic Particles
- **Functionality**: Infinity ring circles change color, scale, animation speed, and glow based on analyzed conversation intensity (word choice, punctuation, length, emotional content). Particle effects dynamically adjust count, speed, size, opacity, and glow based on engagement level.
- **Purpose**: Create immersive feedback that makes the companion feel alive and responsive to user engagement
- **Trigger**: Automatic analysis of each message sent and received
- **Progression**: Message sent → intensity analysis (0-100) → particle configuration calculated → visual updates applied (particle count 3-12, speed 1.5-3s, size 6-12px, opacity 50-100%, glow 8-20px)
- **Success Criteria**: Visual feedback feels natural and enhances emotional connection without being distracting; particles are sparse at low engagement and abundant/fast at high engagement

#### Particle Intensity Levels:
- **Low (0-30)**: 3-4 primary particles, slow movement (2.5-3s), subtle glow (8-10px), minimal opacity (60-70%)
- **Medium (31-50)**: 5-7 primary particles, moderate speed (2-2.5s), noticeable glow (10-14px), increased opacity (70-80%)
- **High (51-70)**: 8-10 primary particles, faster movement (1.7-2s), strong glow (14-18px), high opacity (80-90%), trail particles appear
- **Very High (71-100)**: 10-12 primary particles, rapid movement (1.5-1.7s), intense glow (18-20px), maximum opacity (90-100%), abundant trail particles, cross-ring exchange particles activate

### 3. Quick Mood Check-in
- **Functionality**: 5-point emoji scale (😢 to 😊) for rapid mood logging that influences companion visual state
- **Purpose**: Track emotional patterns and inform both AI companion context and visual representation
- **Success Criteria**: Simple one-tap mood entry with immediate visual feedback in companion appearance

### 4. Community Support Hub
- **Functionality**: Share reflections, gratitude posts, support requests, and milestones with a compassionate community; discover and join support circles; connect with journey companions
- **Purpose**: Extend emotional support beyond AI companion through peer connection and shared experiences
- **Success Criteria**: Users feel safe sharing vulnerabilities, receive meaningful support, and build lasting connections

### 5. Journey Documentation & Sharing
- **Functionality**: Private journey moments (breakthroughs, reflections, challenges) with optional community sharing; track emotional growth over time
- **Purpose**: Help users recognize patterns, celebrate progress, and share inspiring moments with others
- **Success Criteria**: Users regularly document experiences, share appropriate moments, and feel proud of their progress

### 6. Support Circles & Groups
- **Functionality**: Themed support groups (mindfulness, life changes, relationships) with member interaction, shared resources, and guided discussions
- **Purpose**: Provide structured peer support around specific topics and challenges
- **Success Criteria**: Active participation in relevant circles, meaningful peer relationships, consistent support exchange

### 7. Privacy & Safety Controls
- **Functionality**: Granular privacy settings, anonymous posting options, connection request controls, and content moderation
- **Purpose**: Ensure users feel safe and in control of their social experience
- **Success Criteria**: Users confidently share at their comfort level, report minimal negative experiences, maintain long-term engagement

### 8. Comprehensive User Preferences
- **Functionality**: Advanced settings for voice customization (volume, speed, pitch, voice selection), visual themes (colors, animation speed, motion reduction), notification preferences, and social settings
- **Purpose**: Allow users to personalize their companion experience to match their accessibility needs and social comfort level
- **Success Criteria**: Settings persist across sessions, customizations feel meaningful, social boundaries are respected

### 9. Presence Selection System
- **Functionality**: Four distinct companion presences (Nebula, Luma, Terra, Nova) with unique personalities, colors, and interaction styles
- **Purpose**: Provide variety and allow users to choose companions that best match their current emotional needs
- **Success Criteria**: Smooth transitions between presences, personality differences are apparent in responses, visual appearance changes immediately

## Social Features Architecture

### Community Interaction Types
- **Gratitude Posts**: Share positive moments and appreciation
- **Support Requests**: Ask for encouragement during difficult times
- **Milestone Celebrations**: Recognize achievements and breakthroughs
- **Reflective Sharing**: Deep thoughts and insights from AI conversations

### Connection Framework
- **Journey Buddies**: Long-term companions for ongoing support
- **Check-in Partners**: Regular accountability and mood sharing
- **Support Circle Members**: Topic-focused group connections
- **Anonymous Support**: Temporary, situation-specific assistance

### Privacy & Safety Features
- **Anonymous Posting**: Share without revealing identity
- **Selective Sharing**: Choose which journey moments become public
- **Connection Controls**: Accept/reject connection requests
- **Content Reporting**: Community-driven moderation system
- **Emotional Tone Monitoring**: AI-assisted positive interaction encouragement

## Design Direction

### Visual Tone & Identity
- **Emotional Response**: Responsive, alive, empathetic, connected, safe
- **Design Personality**: Organic, ethereal, dynamically responsive, human-centered, community-minded
- **Visual Metaphors**: Overlapping circles representing connection and presence, community hubs as warm gathering spaces, intensity-based animation representing emotional resonance
- **Simplicity Spectrum**: Thoughtfully layered interface balancing personal AI connection with meaningful social features

### Social Interface Design
- **Community Hub**: Clean feed design with post type indicators, emotional context cues, and supportive interaction buttons
- **Support Circles**: Intimate group spaces with member awareness and topic focus
- **Journey Timeline**: Personal growth visualization with shareable highlights
- **Connection Spaces**: Warm, private messaging areas for deeper relationships

### Color Strategy
- **Color Scheme Type**: Mood-responsive gradients with community accent colors
- **Primary Color**: Deep slate (oklch(0.10 0.01 240)) - grounding background
- **Social Accent Colors**: Warm community colors (soft greens for support, gentle blues for connection, warm purples for sharing)
- **Dynamic Colors**: Circles shift between color palettes based on mood and conversation intensity
- **Community Indicators**: Distinct color coding for post types, support levels, and connection states

## Advanced Features

### AI-Enhanced Social Matching
- **Compatibility Scoring**: Match users based on conversation patterns, emotional needs, and growth goals
- **Timing Intelligence**: Suggest connections when users are in receptive emotional states
- **Support Predictions**: Identify when users might benefit from community outreach

### Emotional Intelligence Integration
- **Conversation Context**: AI companion references community interactions in private conversations
- **Support Suggestions**: Recommend community features based on conversation themes
- **Growth Tracking**: Correlate individual progress with social engagement levels

### Community Wellness Features
- **Mood Trend Sharing**: Anonymous aggregate mood data for community awareness
- **Support Circles**: Topic-based groups with guided conversation starters
- **Milestone Celebrations**: Community recognition of individual achievements
- **Crisis Support**: Escalation pathways for users in acute distress

## Implementation Considerations
- **Privacy-First Architecture**: All social features optional, granular privacy controls, data portability
- **Moderation Systems**: AI-assisted content screening, community reporting, human moderation for sensitive cases
- **Scalability**: Support for growing community sizes while maintaining intimacy
- **Cross-Platform Sync**: Consistent social experience across devices and sessions
- **Real-time Features**: Live support circle discussions, instant connection notifications, immediate emotional support responses

## Success Metrics
- **Community Engagement**: Daily active community users, posts per user, support interactions
- **Connection Quality**: Long-term relationship formation, peer support effectiveness, user retention correlation
- **Safety Metrics**: Report rates, resolution times, user safety perception scores
- **Emotional Impact**: Community interaction correlation with mood improvements, crisis intervention success
- **Feature Integration**: Social feature usage alongside AI companion interactions, cross-feature user flows

## Core User Flow (Enhanced)
1. **Onboarding**: Welcome → Introduction → Presence Selection → Preference Setup → Community Introduction
2. **Daily Use**: Open app → See companion in remembered state → Check community updates → Engage with posts or connections
3. **Social Discovery**: Browse support circles → Join relevant groups → Connect with compatible journey partners
4. **Community Interaction**: Share mood moments → Receive support → Offer encouragement → Build relationships
5. **Crisis Support**: Access immediate community assistance → Connect with trained peer supporters → Follow up care
6. **Growth Celebration**: Document breakthroughs → Share with community → Receive celebration and encouragement
7. **Privacy Management**: Adjust sharing preferences → Control connection visibility → Manage anonymous interactions