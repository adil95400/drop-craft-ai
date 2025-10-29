import { useQuery } from '@tanstack/react-query';
import { academyService } from '@/services/academy.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Clock, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAcademyProgress } from '@/hooks/useAcademyProgress';

export function RecommendationsWidget() {
  const { allProgress } = useAcademyProgress();
  
  const { data: allCourses = [] } = useQuery({
    queryKey: ['academy-courses'],
    queryFn: () => academyService.getCourses(),
  });

  // Get user's completed categories
  const completedCategories = new Set(
    allProgress
      ?.filter((p: any) => p.status === 'completed')
      .map((p: any) => p.academy_courses?.category) || []
  );

  // Get user's current level based on completed courses
  const completedCount = allProgress?.filter((p: any) => p.status === 'completed').length || 0;
  const userLevel = completedCount === 0 ? 'beginner' : completedCount < 3 ? 'intermediate' : 'advanced';

  // Recommend courses based on AI logic
  const recommendedCourses = allCourses
    .filter(course => {
      // Don't recommend completed courses
      const isCompleted = allProgress?.some((p: any) => p.course_id === course.id && p.status === 'completed');
      if (isCompleted) return false;

      // Recommend courses in same categories user is interested in
      if (completedCategories.has(course.category)) return true;

      // Recommend next level courses
      if (userLevel === 'beginner' && course.level === 'intermediate') return true;
      if (userLevel === 'intermediate' && course.level === 'advanced') return true;

      // Recommend beginner courses for complete beginners
      if (completedCount === 0 && course.level === 'beginner') return true;

      return false;
    })
    .slice(0, 3);

  if (recommendedCourses.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Recommandations IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {recommendedCourses.map((course, index) => (
            <div
              key={course.id}
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-2xl">
                {course.thumbnail_emoji || '📚'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {course.title}
                  </h4>
                  {index === 0 && (
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Top
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {course.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.floor(course.duration_minutes / 60)}h
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {course.total_lessons} leçons
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link to="/academy">
            Voir tous les cours
          </Link>
        </Button>

        <div className="rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 p-4 space-y-2">
          <div className="flex items-start gap-2">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Pourquoi ces cours ?</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Notre IA analyse votre progression et vos intérêts pour vous recommander les cours les plus adaptés à votre parcours.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
