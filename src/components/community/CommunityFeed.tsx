import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/but
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { generateId, formatRelativeTime, getM

  currentUser: UserAccount | null
}
import { generateId, formatRelativeTime, getMoodEmoji, getPostTypeColor } from '@/utils'
import type { CommunityPost, UserAccount } from '@/types'

interface CommunityFeedProps {
  currentUser: UserAccount | null
  onUserClick: (userId: string) => void
}

      timestamp: new Date(),
      supportCount: 0,
      tags: []

    setNewPostContent('')
    setIsAnonymous(false)

    if (!currentUser) return
    setPosts(current => 

            ? post.likes.filter(id =
          return { ...post, l
        return post
    )

    setPosts(current =>
      timestamp: new Date(),
      likes: [],
      supportCount: 0,
      isAnonymous,
      tags: []
    }

    setPosts(current => [newPost, ...(current || [])])
    setNewPostContent('')
    setShowNewPost(false)
    setIsAnonymous(false)
  }, [newPostContent, newPostType, currentUser, isAnonymous, setPosts])

  const handleLikePost = useCallback((postId: string) => {
    if (!currentUser) return

    setPosts(current => 
      (current || []).map(post => {
        if (post.id === postId) {
          const likes = post.likes.includes(currentUser.id)
            ? post.likes.filter(id => id !== currentUser.id)
            : [...post.likes, currentUser.id]
          return { ...post, likes }
        }
        return post
      })
    )
  }, [currentUser, setPosts])

  const handleSupportPost = useCallback((postId: string) => {
    setPosts(current =>
      (current || []).map(post =>
          <div className="
          ? { ...post, supportCount: post.supportCount + 1 }
                
      )
     
  }, [setPosts])

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'gratitude': return <Heart size={16} weight="fill" />
      case 'milestone': return <Sparkle size={16} weight="fill" />
      case 'support': return <HandsClapping size={16} weight="fill" />
      case 'reflection': return <ChatCircle size={16} weight="fill" />
      default: return null
     
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-white text-lg font-medium">Community</h2>
        <Button
                cla
          onClick={() => setShowNewPost(!showNewPost)}
          className="bg-purple-600/90 hover:bg-purple-700 text-white rounded-full"
        >
          {showNewPost ? <X size={18} /> : <Plus size={18} />}
        </Button>
            

      {showNewPost && (
        <Card className="m-4 p-4 bg-black/40 border-white/10 backdrop-blur-md space-y-3 animate-fade-in-up">
          <div className="flex gap-2 flex-wrap">
            {(['reflection', 'milestone', 'support', 'gratitude'] as const).map((type) => (
                class
                key={type}
                onClick={() => setNewPostType(type)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
        </Card>
                    ? getPostTypeColor(type)
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
            <di
                <span className="flex items-center gap-1">
                  {getPostTypeIcon(type)}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              </button>
              >
          </div>

          <Textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Share your thoughts with the community..."
            className="bg-white/5 border-white/20 text-white placeholder:text-white/50 min-h-[100px] resize-none"
            maxLength={1000}
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                  {post.content
                checked={isAnonymous}

































































































