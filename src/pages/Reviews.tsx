import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, ThumbsUp, Filter, Search, Crown, MessageSquare, Plus, Eye, Edit2, Trash2, MoreHorizontal, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useRealReviews } from '@/hooks/useRealReviews'
import { AddReviewModal } from '@/components/reviews/AddReviewModal'
import { ReviewDetailsModal } from '@/components/reviews/ReviewDetailsModal'
import { toast } from 'sonner'

export default function Reviews() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<string | null>(null)
  const { reviews, stats, isLoading, markHelpful, isMarkingHelpful } = useRealReviews()

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = (review.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (review.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter
    return matchesSearch && matchesRating && matchesStatus
  })

  const renderStars = (rating: number, size = 'w-4 h-4') => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'rejected':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const handleHelpful = (reviewId: string) => {
    markHelpful(reviewId)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Chargement des avis...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Star className="w-8 h-8 text-primary" />
            Avis Clients
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez et analysez les avis de vos clients avec des outils avancés
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter Avis
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              toast.success('Filtres avancés activés');
            }}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtres Avancés
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            onClick={() => navigate('/reviews-ultra-pro')}
          >
            <Crown className="w-4 h-4 mr-2" />
            Reviews Ultra Pro
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Avis</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">+12% ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
            {renderStars(Math.round(stats.averageRating))}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">Très bon score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avis Récents</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentReviews.length}</div>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Distribution des Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.ratingDistribution.slice().reverse().map(({ rating, count }) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-sm w-8">{rating}★</span>
                <Progress value={(count / (stats.total || 1)) * 100} className="flex-1 h-2" />
                <span className="text-sm text-muted-foreground w-8">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher dans les avis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Note" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les notes</SelectItem>
                <SelectItem value="5">5 étoiles</SelectItem>
                <SelectItem value="4">4 étoiles</SelectItem>
                <SelectItem value="3">3 étoiles</SelectItem>
                <SelectItem value="2">2 étoiles</SelectItem>
                <SelectItem value="1">1 étoile</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun avis trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {reviews.length === 0 
                  ? "Vous n'avez pas encore d'avis. Ajoutez votre premier avis pour commencer !"
                  : "Aucun avis ne correspond à vos critères de recherche."
                }
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un avis
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {(review.customer_name || 'A').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{review.customer_name || 'Client anonyme'}</h4>
                        {renderStars(review.rating)}
                        <Badge 
                          variant={review.status === 'published' ? 'default' : 
                                  review.status === 'pending' ? 'secondary' : 'destructive'}
                          className="ml-2"
                        >
                          {getStatusIcon(review.status)}
                          <span className="ml-1 capitalize">{review.status}</span>
                        </Badge>
                        {review.verified_purchase && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Vérifié
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">
                        {new Date(review.created_at).toLocaleDateString('fr-FR')} • {review.platform}
                      </p>
                      {review.title && (
                        <h5 className="font-medium mb-2">{review.title}</h5>
                      )}
                      <p className="text-foreground mb-3 line-clamp-3">{review.content}</p>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleHelpful(review.id)}
                          disabled={isMarkingHelpful}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Utile ({review.helpful_count})
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedReview(review.id)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir détails
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedReview(review.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Voir détails
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <AddReviewModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
      
      <ReviewDetailsModal
        reviewId={selectedReview}
        open={!!selectedReview}
        onOpenChange={(open) => !open && setSelectedReview(null)}
      />
    </div>
  )
}