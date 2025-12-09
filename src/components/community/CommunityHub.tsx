import React, { useState, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Users, UserCircle, UsersThree, ChatCircle } from "@phosphor-icons/react"
import { CommunityFeed } from './CommunityFeed'
import { ConnectionsList } from './ConnectionsList'
import { SupportCircles } from './SupportCircles'
import { ChatView } from './ChatView'
import { generateId } from '@/utils'
import type { SocialSection, UserAccount, ChatConversation } from '@/types'

interface CommunityHubProps {
  currentUser: UserAccount | null
  onClose: () => void
}

export const CommunityHub: React.FC<CommunityHubProps> = ({ currentUser, onClose }) => {
  const [activeSection, setActiveSection] = useState<SocialSection>('community')
  const [conversations, setConversations] = useKV<ChatConversation[]>("chat-conversations", [])

  const handleStartChat = useCallback((userId: string, userName: string) => {
    if (!currentUser) return

    const existingConversation = (conversations || []).find(conv =>
      conv.participantIds.includes(userId) && conv.participantIds.includes(currentUser.id)
    )

    if (existingConversation) {
      setActiveSection('chat')
      return
    }

    const newConversation: ChatConversation = {
      id: generateId('conv'),
      participantIds: [currentUser.id, userId],
      participantNames: [currentUser.userName, userName],
      lastActivity: new Date(),
      unreadCount: 0,
      conversationType: 'direct'
    }

    setConversations(current => [...(current || []), newConversation])
    setActiveSection('chat')
  }, [currentUser, conversations, setConversations])

  const handleUserClick = useCallback((userId: string) => {
    console.log('User clicked:', userId)
  }, [])

  const sections = [
    { id: 'community' as const, label: 'Community', icon: Users },
    { id: 'connections' as const, label: 'Connections', icon: UserCircle },
    { id: 'circles' as const, label: 'Circles', icon: UsersThree },
    { id: 'chat' as const, label: 'Chat', icon: ChatCircle }
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
      <Card className="w-full max-w-4xl h-[90vh] bg-black/90 border-white/20 backdrop-blur-md flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h1 className="text-white text-xl font-medium">Community Hub</h1>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-white/70 hover:text-white h-8 w-8 p-0 rounded-full"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="flex border-b border-white/10 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                activeSection === section.id
                  ? 'text-white bg-white/10 border-b-2 border-purple-400'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <section.icon size={18} />
              <span className="hidden sm:inline">{section.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          {activeSection === 'community' && (
            <CommunityFeed 
              currentUser={currentUser}
              onUserClick={handleUserClick}
            />
          )}
          
          {activeSection === 'connections' && (
            <ConnectionsList
              currentUser={currentUser}
              onStartChat={handleStartChat}
            />
          )}
          
          {activeSection === 'circles' && (
            <SupportCircles currentUser={currentUser} />
          )}
          
          {activeSection === 'chat' && (
            <ChatView
              currentUser={currentUser}
              onBack={() => setActiveSection('connections')}
            />
          )}
        </div>
      </Card>
    </div>
  )
}
