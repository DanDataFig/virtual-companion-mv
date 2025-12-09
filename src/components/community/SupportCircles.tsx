import React, { useState, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  UsersThree, 
  SignIn, 
  SignOut, 
  Heart, 
  Leaf, 
  Sun, 
  Brain,
  UsersFour
} from "@phosphor-icons/react"
import { formatRelativeTime } from '@/utils'
import type { SupportCircle, UserAccount } from '@/types'

interface SupportCirclesProps {
  currentUser: UserAccount | null
}

export const SupportCircles: React.FC<SupportCirclesProps> = ({ currentUser }) => {
  const [circles, setCircles] = useKV<SupportCircle[]>("support-circles", [
    {
      id: 'circle-1',
      name: 'Mindful Moments',
      description: 'Daily mindfulness and meditation practices',
      type: 'mindfulness',
      memberCount: 127,
      isPrivate: false,
      memberIds: [],
      recentActivity: new Date(),
      tags: ['meditation', 'breathing', 'presence']
    },
    {
      id: 'circle-2',
      name: 'Life Transitions',
      description: 'Supporting each other through major life changes',
      type: 'life-changes',
      memberCount: 89,
      isPrivate: false,
      memberIds: [],
      recentActivity: new Date(Date.now() - 3600000),
      tags: ['change', 'growth', 'transformation']
    },
    {
      id: 'circle-3',
      name: 'Daily Check-Ins',
      description: 'Share how you are feeling every day',
      type: 'daily-check-ins',
      memberCount: 234,
      isPrivate: false,
      memberIds: [],
      recentActivity: new Date(Date.now() - 7200000),
      tags: ['routine', 'accountability', 'support']
    },
    {
      id: 'circle-4',
      name: 'Mood Support Hub',
      description: 'A safe space for emotional support and understanding',
      type: 'mood-support',
      memberCount: 156,
      isPrivate: false,
      memberIds: [],
      recentActivity: new Date(Date.now() - 10800000),
      tags: ['emotions', 'empathy', 'healing']
    },
    {
      id: 'circle-5',
      name: 'Relationship Reflections',
      description: 'Navigating connections with others and ourselves',
      type: 'relationships',
      memberCount: 92,
      isPrivate: false,
      memberIds: [],
      recentActivity: new Date(Date.now() - 14400000),
      tags: ['connections', 'boundaries', 'communication']
    }
  ])

  const handleJoinCircle = useCallback((circleId: string) => {
    if (!currentUser) return

    setCircles(current =>
      (current || []).map(circle => {
        if (circle.id === circleId) {
          const isMember = circle.memberIds.includes(currentUser.id)
          return {
            ...circle,
            memberIds: isMember
              ? circle.memberIds.filter(id => id !== currentUser.id)
              : [...circle.memberIds, currentUser.id],
            memberCount: isMember ? circle.memberCount - 1 : circle.memberCount + 1
          }
        }
        return circle
      })
    )
  }, [currentUser, setCircles])

  const getCircleIcon = (type: string) => {
    switch (type) {
      case 'mindfulness': return <Brain size={20} weight="fill" />
      case 'life-changes': return <Leaf size={20} weight="fill" />
      case 'daily-check-ins': return <Sun size={20} weight="fill" />
      case 'mood-support': return <Heart size={20} weight="fill" />
      case 'relationships': return <UsersFour size={20} weight="fill" />
      default: return <UsersThree size={20} weight="fill" />
    }
  }

  const getCircleColor = (type: string) => {
    switch (type) {
      case 'mindfulness': return 'bg-purple-500/20 text-purple-200 border-purple-400/30'
      case 'life-changes': return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
      case 'daily-check-ins': return 'bg-amber-500/20 text-amber-200 border-amber-400/30'
      case 'mood-support': return 'bg-pink-500/20 text-pink-200 border-pink-400/30'
      case 'relationships': return 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30'
      default: return 'bg-gray-500/20 text-gray-200 border-gray-400/30'
    }
  }

  const isMember = (circle: SupportCircle) =>
    currentUser ? circle.memberIds.includes(currentUser.id) : false

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-white text-lg font-medium">Support Circles</h2>
        <p className="text-white/60 text-sm mt-1">
          Join communities that resonate with your journey
        </p>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3 py-4">
          {(circles || []).map((circle) => (
            <Card
              key={circle.id}
              className="p-4 bg-black/40 border-white/10 backdrop-blur-md hover:bg-black/50 transition-all animate-fade-in-up"
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCircleColor(circle.type)}`}>
                  {getCircleIcon(circle.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1">{circle.name}</h3>
                      <p className="text-white/70 text-sm leading-relaxed">
                        {circle.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {circle.tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-white/5 text-white/60 text-xs"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-4 text-white/60 text-xs">
                      <span className="flex items-center gap-1">
                        <UsersThree size={14} />
                        {circle.memberCount} members
                      </span>
                      <span>
                        Active {formatRelativeTime(new Date(circle.recentActivity))}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleJoinCircle(circle.id)}
                      className={`gap-1.5 ${
                        isMember(circle)
                          ? 'bg-white/10 hover:bg-white/15 text-white'
                          : 'bg-purple-600/90 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {isMember(circle) ? (
                        <>
                          <SignOut size={16} />
                          <span>Leave</span>
                        </>
                      ) : (
                        <>
                          <SignIn size={16} />
                          <span>Join</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
