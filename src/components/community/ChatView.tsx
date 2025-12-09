import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatCircle, PaperPlaneTilt, ArrowLeft, DotsThree } from "@phosphor-icons/react"
import { generateId, formatDisplayTime } from '@/utils'
import type { ChatMessage, ChatConversation, UserAccount } from '@/types'

interface ChatViewProps {
  currentUser: UserAccount | null
  onBack: () => void
}

export const ChatView: React.FC<ChatViewProps> = ({ currentUser, onBack }) => {
  const [conversations, setConversations] = useKV<ChatConversation[]>("chat-conversations", [])
  const [messages, setMessages] = useKV<ChatMessage[]>("chat-messages", [])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeConversation = conversations?.find(conv => conv.id === activeConversationId)
  const conversationMessages = (messages || []).filter(
    msg => 
      activeConversationId && (
        (msg.senderId === currentUser?.id && msg.receiverId === activeConversation?.participantIds.find(id => id !== currentUser.id)) ||
        (msg.receiverId === currentUser?.id && msg.senderId === activeConversation?.participantIds.find(id => id !== currentUser.id))
      )
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversationMessages])

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !currentUser || !activeConversation) return

    const receiverId = activeConversation.participantIds.find(id => id !== currentUser.id)
    if (!receiverId) return

    const newMessage: ChatMessage = {
      id: generateId('msg'),
      senderId: currentUser.id,
      senderName: currentUser.userName,
      receiverId,
      content: inputMessage.trim(),
      timestamp: new Date(),
      messageType: 'text'
    }

    setMessages(current => [...(current || []), newMessage])

    setConversations(current =>
      (current || []).map(conv =>
        conv.id === activeConversationId
          ? { ...conv, lastMessage: newMessage, lastActivity: new Date() }
          : conv
      )
    )

    setInputMessage('')
  }, [inputMessage, currentUser, activeConversation, activeConversationId, setMessages, setConversations])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  const myConversations = (conversations || []).filter(conv =>
    conv.participantIds.includes(currentUser?.id || '')
  ).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())

  if (activeConversation) {
    const otherParticipantName = activeConversation.participantNames.find(
      name => name !== currentUser?.userName
    )

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActiveConversationId(null)}
              className="text-white/70 hover:text-white h-8 w-8 p-0"
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h3 className="text-white font-medium">{otherParticipantName}</h3>
              <p className="text-white/50 text-xs">Online</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-white/70 hover:text-white h-8 w-8 p-0"
          >
            <DotsThree size={20} />
          </Button>
        </div>

        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <div className="space-y-3">
            {conversationMessages.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                <ChatCircle size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              conversationMessages.map((msg) => {
                const isOwn = msg.senderId === currentUser?.id
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-purple-600/90 text-white'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      <p className="text-xs opacity-60 mt-1">
                        {formatDisplayTime(new Date(msg.timestamp))}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/10 bg-black/40">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="bg-purple-600/90 hover:bg-purple-700 text-white"
            >
              <PaperPlaneTilt size={18} />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-white text-lg font-medium">Messages</h2>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 py-4">
          {myConversations.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <ChatCircle size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-2">Connect with others to start chatting</p>
            </div>
          ) : (
            myConversations.map((conv) => {
              const otherParticipantName = conv.participantNames.find(
                name => name !== currentUser?.userName
              )
              
              return (
                <Card
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className="p-4 bg-black/40 border-white/10 backdrop-blur-md hover:bg-black/50 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium mb-1">
                        {otherParticipantName}
                      </h3>
                      {conv.lastMessage && (
                        <p className="text-white/60 text-sm truncate">
                          {conv.lastMessage.senderId === currentUser?.id ? 'You: ' : ''}
                          {conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-3">
                      <span className="text-white/50 text-xs whitespace-nowrap">
                        {conv.lastMessage && formatDisplayTime(new Date(conv.lastMessage.timestamp))}
                      </span>
                      {conv.unreadCount > 0 && (
                        <div className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
