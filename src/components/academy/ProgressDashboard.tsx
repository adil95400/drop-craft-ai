import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Clock, 
  BookOpen, 
  Award, 
  TrendingUp,
  Target,
  Zap,
  Star
} from 'lucide-react';
import { useAcademyProgress, useAcademyAchievements, useAcademyCertificates } from '@/hooks/useAcademyProgress';
import { Link } from 'react-router-dom';

export function ProgressDashboard() {
  const { stats, allProgress, isLoading } = useAcademyProgress();
  const { achievements } = useAcademyAchievements();
  const { certificates } = useAcademyCertificates();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Cours Complétés',
      value: stats?.completedCourses || 0,
      total: stats?.totalCourses || 0,
      icon: BookOpen,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Certificats Obtenus',
      value: (certificates?.length || 0).toString(),
      icon: Award,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Points XP',
      value: stats?.totalPoints || 0,
      icon: Zap,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Temps Total',
      value: `${Math.floor((stats?.totalTimeSpent || 0) / 60)}h${(stats?.totalTimeSpent || 0) % 60}m`,
      icon: Clock,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">
                    {stat.value}
                    {stat.total && <span className="text-sm text-muted-foreground">/{stat.total}</span>}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cours en Cours */}
      {allProgress && allProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cours en Cours
            </CardTitle>
            <CardDescription>Continuez votre apprentissage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allProgress
                .filter((p: any) => p.status === 'in_progress')
                .slice(0, 3)
                .map((progress: any) => (
                  <div key={progress.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors">
                    <div className="text-3xl">{progress.academy_courses?.thumbnail_emoji || '📚'}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{progress.academy_courses?.title}</h4>
                        <Badge variant="outline">{progress.progress_percentage}%</Badge>
                      </div>
                      <Progress value={progress.progress_percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {progress.completed_lessons}/{progress.academy_courses?.total_lessons} leçons
                      </p>
                    </div>
                    <Button size="sm" asChild>
                      <Link to={`/academy/courses/${progress.academy_courses?.slug}`}>
                        Continuer
                      </Link>
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Achievements */}
      {achievements && achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Achievements Récents
            </CardTitle>
            <CardDescription>Vos dernières réussites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.slice(0, 6).map((achievement: any) => (
                <div key={achievement.id} className="flex items-start gap-3 p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="text-2xl">{achievement.icon || '🏆'}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{achievement.achievement_name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        +{achievement.points} XP
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificates */}
      {certificates && certificates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Mes Certificats
            </CardTitle>
            <CardDescription>Téléchargez vos certificats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert: any) => (
                <div key={cert.id} className="flex items-center gap-4 p-4 rounded-lg border bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                  <div className="p-3 rounded-lg bg-yellow-500/20">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{cert.academy_courses?.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      N° {cert.certificate_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(cert.issued_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Télécharger
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objectifs de la Semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Compléter 3 leçons</span>
                <span className="text-sm text-muted-foreground">1/3</span>
              </div>
              <Progress value={33} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Passer 2 heures en formation</span>
                <span className="text-sm text-muted-foreground">45min/2h</span>
              </div>
              <Progress value={37} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Obtenir un certificat</span>
                <span className="text-sm text-muted-foreground">0/1</span>
              </div>
              <Progress value={0} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
