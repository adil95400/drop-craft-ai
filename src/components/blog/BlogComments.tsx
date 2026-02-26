import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MessageCircle, Heart, Reply, Flag, MoreHorizontal,
  ThumbsUp, ThumbsDown, Share2, Edit, Trash2, Check, X
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale'

interface Comment {
  id: string
  author: {
    name: string
    avatar: string
    isVerified: boolean
  }
  content: string
  createdAt: Date
  likes: number
  dislikes: number
  replies: Comment[]
  isLiked?: boolean
  isDisliked?: boolean
}

interface BlogCommentsProps {
  postId: string
  comments: Comment[]
  onAddComment?: (content: string, parentId?: string) => void
  onLikeComment?: (commentId: string) => void
  onDislikeComment?: (commentId: string) => void
  onEditComment?: (commentId: string, content: string) => void
  onDeleteComment?: (commentId: string) => void
  onReportComment?: (commentId: string) => void
}

export function BlogComments({ 
  postId, 
  comments = [],
  onAddComment,
  onLikeComment,
  onDislikeComment,
  onEditComment,
  onDeleteComment,
  onReportComment
}: BlogCommentsProps) {
  const locale = useDateFnsLocale()
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onAddComment?.(newComment)
      setNewComment('')
    }
  }

  const handleSubmitReply = (parentId: string) => {
    if (replyContent.trim()) {
      onAddComment?.(replyContent, parentId)
      setReplyContent('')
      setReplyingTo(null)
    }
  }

  const handleEditComment = (commentId: string, content: string) => {
    setEditingComment(commentId)
    setEditContent(content)
  }

  const handleSaveEdit = (commentId: string) => {
    if (editContent.trim()) {
      onEditComment?.(commentId, editContent)
      setEditingComment(null)
      setEditContent('')
    }
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-12 mt-4' : ''}`}>
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.author.avatar} />
          <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">{comment.author.name}</span>
            {comment.author.isVerified && (
              <Badge variant="secondary" className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Vérifié
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {format(comment.createdAt, 'PPp', { locale })}
            </span>
          </div>
          
          {editingComment === comment.id ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSaveEdit(comment.id)}>
                  <Check className="h-4 w-4 mr-1" />
                  Sauvegarder
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setEditingComment(null)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLikeComment?.(comment.id)}
                  className={`${comment.isLiked ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  {comment.likes}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDislikeComment?.(comment.id)}
                  className={`${comment.isDisliked ? 'text-destructive' : 'text-muted-foreground'}`}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  {comment.dislikes}
                </Button>
                
                {!isReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(comment.id)}
                  >
                    <Reply className="h-4 w-4 mr-1" />
                    Répondre
                  </Button>
                )}
                
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  Partager
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleEditComment(comment.id, comment.content)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDeleteComment?.(comment.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onReportComment?.(comment.id)}>
                      <Flag className="h-4 w-4 mr-2" />
                      Signaler
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
          
          {replyingTo === comment.id && (
            <div className="mt-4 space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Répondre à ${comment.author.name}...`}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSubmitReply(comment.id)}>
                  <Reply className="h-4 w-4 mr-1" />
                  Répondre
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setReplyingTo(null)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
          
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map(reply => (
                <CommentItem key={reply.id} comment={reply} isReply />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Commentaires ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nouveau commentaire */}
        <div className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Partagez votre avis sur cet article..."
            className="min-h-[100px]"
          />
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Soyez respectueux et constructif dans vos commentaires
            </p>
            <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Publier
            </Button>
          </div>
        </div>
        
        <Separator />
        
        {/* Liste des commentaires */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun commentaire pour le moment</p>
            <p className="text-sm">Soyez le premier à partager votre avis !</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map(comment => (
              <div key={comment.id}>
                <CommentItem comment={comment} />
                {comment !== comments[comments.length - 1] && (
                  <Separator className="mt-6" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Données de test
export const mockComments: Comment[] = [
  {
    id: '1',
    author: {
      name: 'Marie Dupont',
      avatar: '/avatars/marie.jpg',
      isVerified: true
    },
    content: 'Excellent article ! Les conseils sur la recherche de produits sont très pertinents. J\'ai particulièrement apprécié la section sur l\'analyse de la concurrence.',
    createdAt: new Date('2024-01-15T10:30:00'),
    likes: 12,
    dislikes: 0,
    isLiked: false,
    replies: [
      {
        id: '2',
        author: {
          name: 'Paul Martin',
          avatar: '/avatars/paul.jpg',
          isVerified: false
        },
        content: 'Je suis d\'accord avec Marie. Ces stratégies m\'ont aidé à augmenter mes ventes de 40% le mois dernier.',
        createdAt: new Date('2024-01-15T14:20:00'),
        likes: 5,
        dislikes: 0,
        replies: []
      }
    ]
  },
  {
    id: '3',
    author: {
      name: 'Sophie Laurent',
      avatar: '/avatars/sophie.jpg',
      isVerified: false
    },
    content: 'Merci pour ces informations précieuses ! Auriez-vous des recommandations d\'outils spécifiques pour l\'analyse des tendances ?',
    createdAt: new Date('2024-01-16T09:15:00'),
    likes: 8,
    dislikes: 1,
    replies: []
  }
]