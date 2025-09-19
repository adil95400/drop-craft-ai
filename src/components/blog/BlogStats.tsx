import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Heart, 
  Share2, 
  MessageCircle, 
  Users, 
  TrendingUp,
  Calendar,
  BookOpen
} from 'lucide-react';

interface BlogStatsProps {
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  totalSubscribers: number;
  articlesCount: number;
  monthlyGrowth: number;
}

export function BlogStats({
  totalViews,
  totalLikes,
  totalShares,
  totalComments,
  totalSubscribers,
  articlesCount,
  monthlyGrowth
}: BlogStatsProps) {
  const stats = [
    {
      icon: Eye,
      label: 'Vues totales',
      value: totalViews.toLocaleString(),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Heart,
      label: 'J\'aime',
      value: totalLikes.toLocaleString(),
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      icon: Share2,
      label: 'Partages',
      value: totalShares.toLocaleString(),
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: MessageCircle,
      label: 'Commentaires',
      value: totalComments.toLocaleString(),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: Users,
      label: 'Abonnés',
      value: totalSubscribers.toLocaleString(),
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      icon: BookOpen,
      label: 'Articles',
      value: articlesCount.toString(),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Growth Banner */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  Croissance mensuelle
                </h3>
                <p className="text-green-600">
                  Notre communauté grandit chaque mois
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-700">
                +{monthlyGrowth}%
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <Calendar className="w-4 h-4 mr-1" />
                Ce mois
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Facts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold text-blue-700 mb-1">
              5 min
            </div>
            <div className="text-sm text-blue-600">
              Temps de lecture moyen
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold text-purple-700 mb-1">
              3x/sem
            </div>
            <div className="text-sm text-purple-600">
              Nouveaux articles
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold text-orange-700 mb-1">
              98%
            </div>
            <div className="text-sm text-orange-600">
              Satisfaction lecteurs
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}