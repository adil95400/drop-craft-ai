import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { academyService } from '@/services/academy.service';
import { useAcademyProgress, useAcademyCertificates } from '@/hooks/useAcademyProgress';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Clock, 
  BookOpen, 
  Award, 
  CheckCircle2,
  Lock,
  Download,
  MessageSquare,
  Star,
  ArrowLeft
} from 'lucide-react';
import { VideoPlayer } from '@/components/academy/VideoPlayer';
import { QuizComponent } from '@/components/academy/QuizComponent';
import { CommentsSection } from '@/components/academy/CommentsSection';
import { useState } from 'react';

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => slug ? academyService.getCourseBySlug(slug) : null,
    enabled: !!slug,
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', course?.id],
    queryFn: () => course?.id ? academyService.getCourseLessons(course.id) : [],
    enabled: !!course?.id,
  });

  const { courseProgress, lessonProgress, markLessonComplete } = useAcademyProgress(course?.id);
  const { generateCertificate } = useAcademyCertificates();

  const currentLesson = lessons.find(l => l.id === currentLessonId) || lessons[0];

  const { data: currentQuiz } = useQuery({
    queryKey: ['quiz', currentLesson?.id],
    queryFn: () => currentLesson ? academyService.getQuizByLesson(currentLesson.id) : null,
    enabled: !!currentLesson && showQuiz,
  });

  const handleLessonComplete = () => {
    if (currentLesson) {
      markLessonComplete(currentLesson.id, currentLesson.duration_minutes || 0);
      
      // Check if course is completed
      if (courseProgress?.progress_percentage === 100) {
        generateCertificate(course?.id || '');
      }
      
      // Move to next lesson
      const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
      if (currentIndex < lessons.length - 1) {
        setCurrentLessonId(lessons[currentIndex + 1].id);
      }
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return lessonProgress?.some(p => p.lesson_id === lessonId && p.is_completed) || false;
  };

  if (courseLoading || lessonsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold">Cours non trouvé</h1>
        <Button asChild className="mt-4">
          <Link to="/academy">Retour à l'Academy</Link>
        </Button>
      </div>
    );
  }

  const levelText = {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
  };

  return (
    <>
      <Helmet>
        <title>{course.title} | DropCraft Academy</title>
        <meta name="description" content={course.description} />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Breadcrumb */}
        <Button variant="ghost" asChild className="gap-2">
          <Link to="/academy">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'Academy
          </Link>
        </Button>

        {/* Course Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player or Content */}
            <Card>
              <CardContent className="p-0">
                {currentLesson?.content_type === 'video' && currentLesson.video_url ? (
                  <VideoPlayer
                    videoUrl={currentLesson.video_url}
                    lessonId={currentLesson.id}
                    onComplete={handleLessonComplete}
                  />
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="text-6xl">{course.thumbnail_emoji || '📚'}</div>
                      <h2 className="text-2xl font-bold">{currentLesson?.title}</h2>
                      <p className="text-muted-foreground max-w-md">
                        {currentLesson?.description}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lesson Content */}
            {currentLesson && (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{currentLesson.title}</CardTitle>
                      {currentLesson.description && (
                        <CardDescription className="mt-2">{currentLesson.description}</CardDescription>
                      )}
                    </div>
                    {isLessonCompleted(currentLesson.id) && (
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complété
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentLesson.content_text && (
                    <div className="prose dark:prose-invert max-w-none">
                      {currentLesson.content_text}
                    </div>
                  )}

                  <Separator />

                  <div className="flex gap-3">
                    {!isLessonCompleted(currentLesson.id) && (
                      <Button onClick={handleLessonComplete} className="gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Marquer comme complété
                      </Button>
                    )}
                    
                    {currentLesson.content_type === 'quiz' && (
                      <Button 
                        variant="outline" 
                        onClick={() => setShowQuiz(!showQuiz)}
                        className="gap-2"
                      >
                        {showQuiz ? 'Masquer' : 'Afficher'} le Quiz
                      </Button>
                    )}
                  </div>

                  {showQuiz && currentQuiz && (
                    <QuizComponent
                      quiz={currentQuiz}
                      onComplete={(score, passed) => {
                        if (passed) {
                          handleLessonComplete();
                        }
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Comments */}
            <CommentsSection courseId={course.id} lessonId={currentLesson?.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Info */}
            <Card>
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge>{levelText[course.level]}</Badge>
                  {course.tags?.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {Math.floor(course.duration_minutes / 60)}h{course.duration_minutes % 60}m
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {course.total_lessons} leçons
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    4.8/5 (245 avis)
                  </div>
                </div>

                {courseProgress && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Votre progression</span>
                        <span>{courseProgress.progress_percentage}%</span>
                      </div>
                      <Progress value={courseProgress.progress_percentage} />
                      <p className="text-xs text-muted-foreground">
                        {courseProgress.completed_lessons}/{course.total_lessons} leçons complétées
                      </p>
                    </div>
                  </>
                )}

                {course.learning_objectives && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Objectifs d'apprentissage</h4>
                      <ul className="space-y-1 text-sm">
                        {course.learning_objectives.map((obj, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {courseProgress?.progress_percentage === 100 && (
                  <Button className="w-full gap-2">
                    <Award className="h-4 w-4" />
                    Télécharger le certificat
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Lessons List */}
            <Card>
              <CardHeader>
                <CardTitle>Contenu du cours</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {lessons.map((lesson, index) => (
                    <button
                      key={lesson.id}
                      onClick={() => setCurrentLessonId(lesson.id)}
                      className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                        currentLesson?.id === lesson.id ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center">
                          {isLessonCompleted(lesson.id) ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : lesson.is_preview ? (
                            <Play className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{index + 1}. {lesson.title}</p>
                          {lesson.duration_minutes && (
                            <p className="text-xs text-muted-foreground">{lesson.duration_minutes} min</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
