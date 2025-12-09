import React, { useState, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { UserPlus, ChatCircle, Users, MagnifyingGlass, Check, X } from "@phosphor-icons/react"
import { generateId, formatRelativeTime } from '@/utils'
import type { Connection, UserAccount } from '@/types'

interface ConnectionsListProps {
  currentUser: UserAccount | null
  onStartChat: (userId: string, userName: string) => void
}

export const ConnectionsList: React.FC<ConnectionsListProps> = ({ currentUser, onStartChat }) => {
  const [connections, setConnections] = useKV<Connection[]>("user-connections", [])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddConnection, setShowAddConnection] = useState(false)

  const myConnections = (connections || []).filter(
    conn => conn.userId === currentUser?.id && conn.status === 'active'
  )

  const pendingRequests = (connections || []).filter(
    conn => conn.connectedUserId === currentUser?.id && conn.status === 'pending'
  )

  const handleAcceptConnection = useCallback((connectionId: string) => {
    setConnections(current =>
      (current || []).map(conn =>
        conn.id === connectionId
          ? { ...conn, status: 'active' as const, lastInteraction: new Date() }
          : conn
      )
    )
  }, [setConnections])

  const handleRejectConnection = useCallback((connectionId: string) => {
    setConnections(current =>
      (current || []).filter(conn => conn.id !== connectionId)
    )
  }, [setConnections])

  const handleRemoveConnection = useCallback((connectionId: string) => {
    setConnections(current =>
      (current || []).filter(conn => conn.id !== connectionId)
    )
  }, [setConnections])

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'journey-buddy': return 'bg-purple-500/20 text-purple-200 border-purple-400/30'
      case 'support-circle': return 'bg-blue-500/20 text-blue-200 border-blue-400/30'
      case 'check-in-partner': return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
      default: return 'bg-gray-500/20 text-gray-200 border-gray-400/30'
    }
  }

  const filteredConnections = myConnections.filter(conn =>
    conn.userName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-medium">Connections</h2>
          <Button
            size="sm"
            onClick={() => setShowAddConnection(!showAddConnection)}
            className="bg-purple-600/90 hover:bg-purple-700 text-white rounded-full"
          >
            <UserPlus size={18} />
          </Button>
        </div>

        <div className="relative">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search connections..."
            className="bg-white/5 border-white/20 text-white placeholder:text-white/50 pl-10"
          />
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className="p-4 space-y-2 border-b border-white/10">
          <h3 className="text-white/80 text-sm font-medium mb-2">Pending Requests</h3>
          {pendingRequests.map((conn) => (
            <Card
              key={conn.id}
              className="p-3 bg-black/40 border-white/10 backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium text-sm">{conn.userName}</div>
                  <div className="text-white/60 text-xs mt-0.5">
                    Wants to connect as {conn.connectionType.replace('-', ' ')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptConnection(conn.id)}
                    className="bg-emerald-600/90 hover:bg-emerald-700 text-white h-8 w-8 p-0"
                  >
                    <Check size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRejectConnection(conn.id)}
                    className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 py-4">
          {filteredConnections.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <Users size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {searchQuery ? 'No connections found' : 'No connections yet. Start connecting!'}
              </p>
            </div>
          ) : (
            filteredConnections.map((conn) => (
              <Card
                key={conn.id}
                className="p-4 bg-black/40 border-white/10 backdrop-blur-md hover:bg-black/50 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-white font-medium mb-1">{conn.userName}</div>
                    <Badge variant="secondary" className={`text-xs ${getConnectionTypeColor(conn.connectionType)}`}>
                      {conn.connectionType.replace('-', ' ')}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onStartChat(conn.connectedUserId, conn.userName)}
                    className="bg-purple-600/90 hover:bg-purple-700 text-white h-8 w-8 p-0"
                  >
                    <ChatCircle size={16} />
                  </Button>
                </div>

                {conn.sharedInterests.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {conn.sharedInterests.slice(0, 3).map((interest, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-white/5 text-white/60 text-xs"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                  <span className="text-white/50 text-xs">
                    Last interaction: {formatRelativeTime(new Date(conn.lastInteraction))}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveConnection(conn.id)}
                    className="text-white/50 hover:text-red-400 text-xs h-auto p-1"
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
