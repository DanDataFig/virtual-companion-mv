import React, { useState, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Heart, HandsClapping, Sparkle, ChatCircle, Plus, X } from "@phosphor-icons/react"
import { generateId, formatRelativeTime, getMoodEmoji, getPostTypeColor } from '@/utils'
import type { CommunityPost, UserAccount } from '@/types'

interface CommunityFeedProps {
  currentUser: UserAccount | null
  onUserClick: (userId: string) => void
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({ currentUser, onUserClick }) => {
  const [posts, setPosts] = useKV<CommunityPost[]>("community-posts", [])
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostType, setNewPostType] = useState<'reflection' | 'milestone' | 'support' | 'gratitude'>('reflection')
  const [isAnonymous, setIsAnonymous] = useState(false)

  const handleCreatePost = useCallback(async () => {
    if (!newPostContent.trim() || !currentUser) return

    const newPost: CommunityPost = {
      id: generateId('post'),
      authorId: currentUser.id,
      authorName: isAnonymous ? 'Anonymous' : currentUser.userName,
      content: newPostContent.trim(),
      type: newPostType,
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
        post.id === postId
          ? { ...post, supportCount: post.supportCount + 1 }
          : post
      )
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
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-white text-lg font-medium">Community</h2>
        <Button
          size="sm"
          onClick={() => setShowNewPost(!showNewPost)}
          className="bg-purple-600/90 hover:bg-purple-700 text-white rounded-full"
        >
          {showNewPost ? <X size={18} /> : <Plus size={18} />}
        </Button>
      </div>

      {showNewPost && (
        <Card className="m-4 p-4 bg-black/40 border-white/10 backdrop-blur-md space-y-3 animate-fade-in-up">
          <div className="flex gap-2 flex-wrap">
            {(['reflection', 'milestone', 'support', 'gratitude'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setNewPostType(type)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  newPostType === type
                    ? getPostTypeColor(type)
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-1">
                  {getPostTypeIcon(type)}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              </button>
            ))}
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
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded"
              />
              <span className="text-white/70 text-sm">Post anonymously</span>
            </label>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNewPost(false)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreatePost}
                disabled={!newPostContent.trim()}
                className="bg-purple-600/90 hover:bg-purple-700 text-white"
              >
                Share
              </Button>
            </div>
          </div>
        </Card>
      )}

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3 py-4">
          {(posts || []).length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <ChatCircle size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No posts yet. Be the first to share!</p>
            </div>
          ) : (
            (posts || []).map((post) => (
              <Card
                key={post.id}
                className="p-4 bg-black/40 border-white/10 backdrop-blur-md hover:bg-black/50 transition-all animate-fade-in-up"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => !post.isAnonymous && onUserClick(post.authorId)}
                      className="text-white/90 font-medium text-sm hover:text-white"
                      disabled={post.isAnonymous}
                    >
                      {post.authorName}
                    </button>
                    <Badge variant="secondary" className={`text-xs ${getPostTypeColor(post.type)}`}>
                      {getPostTypeIcon(post.type)}
                      <span className="ml-1">{post.type}</span>
                    </Badge>
                  </div>
                  <span className="text-white/50 text-xs">
                    {formatRelativeTime(new Date(post.timestamp))}
                  </span>
                </div>

                <p className="text-white/80 leading-relaxed mb-3 whitespace-pre-wrap">
                  {post.content}
                </p>

                <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleLikePost(post.id)}
                    className={`text-xs gap-1 ${
                      currentUser && post.likes.includes(currentUser.id)
                        ? 'text-red-400 hover:text-red-300'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Heart size={16} weight={currentUser && post.likes.includes(currentUser.id) ? "fill" : "regular"} />
                    <span>{post.likes.length}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSupportPost(post.id)}
                    className="text-white/60 hover:text-white text-xs gap-1"
                  >
                    <HandsClapping size={16} />
                    <span>{post.supportCount}</span>
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
