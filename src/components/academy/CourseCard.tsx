import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, BookOpen, Play, Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Course } from '@/services/academy.service';
import { useAcademyProgress, useAcademyFavorites } from '@/hooks/useAcademyProgress';

interface CourseCardProps {
  course: Course;
  showProgress?: boolean;
}

export function CourseCard({ course, showProgress }: CourseCardProps) {
  const { courseProgress } = useAcademyProgress(course.id);
  const { isFavorite, toggleFavorite } = useAcademyFavorites();

  const levelColors = {
    beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
    intermediate: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    advanced: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };

  const levelText = {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
  };

  const hours = Math.floor(course.duration_minutes / 60);
  const minutes = course.duration_minutes % 60;
  const durationText = `${hours}h${minutes > 0 ? `${minutes}min` : ''}`;

  return (
    <Card className="hover:shadow-lg transition-all group overflow-hidden">
      <div className="relative">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-48 object-cover" />
        ) : (
          <div className="h-48 bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
            <div className="text-6xl">{course.thumbnail_emoji || '📚'}</div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(course.id);
          }}
        >
          <Heart className={`h-4 w-4 ${isFavorite(course.id) ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
      </div>

      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge variant="outline" className={levelColors[course.level]}>
            {levelText[course.level]}
          </Badge>
          {course.tags && course.tags.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {course.tags[0]}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
          {course.title}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {course.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {durationText}
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {course.total_lessons} leçons
          </div>
          {course.instructor_name && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              4.8
            </div>
          )}
        </div>

        {showProgress && courseProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{courseProgress.progress_percentage}%</span>
            </div>
            <Progress value={courseProgress.progress_percentage} />
            <p className="text-xs text-muted-foreground">
              {courseProgress.completed_lessons}/{course.total_lessons} leçons complétées
            </p>
          </div>
        )}

        <Button asChild className="w-full gap-2">
          <Link to={`/academy/courses/${course.slug}`}>
            <Play className="h-4 w-4" />
            {courseProgress && courseProgress.progress_percentage > 0 ? 'Continuer' : 'Commencer'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
