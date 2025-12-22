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
import { Skeleton } from '@/components/ui/skeleton';
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
  ArrowLeft,
  FileText,
  Video,
  HelpCircle
} from 'lucide-react';
import { VideoPlayer } from '@/components/academy/VideoPlayer';
import { QuizComponent } from '@/components/academy/QuizComponent';
import { CommentsSection } from '@/components/academy/CommentsSection';
import { LessonSkeleton } from '@/components/academy/LessonSkeleton';
import { useState, useMemo } from 'react';

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

  const lessonTypeIcon = useMemo(() => {
    if (!currentLesson) return null;
    switch (currentLesson.content_type) {
      case 'video': return <Video className="h-5 w-5" />;
      case 'quiz': return <HelpCircle className="h-5 w-5" />;
      case 'text': return <FileText className="h-5 w-5" />;
      default: return <BookOpen className="h-5 w-5" />;
    }
  }, [currentLesson]);

  if (courseLoading || lessonsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LessonSkeleton />
          </div>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
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
        <title>{course.title} | ShopOpti Academy</title>
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
                   <div className="aspect-video bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10 border border-border flex items-center justify-center">
                     <div className="text-center space-y-6 p-8">
                       <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-500 text-white text-5xl">
                         {lessonTypeIcon}
                       </div>
                       <div className="space-y-2">
                         <h2 className="text-3xl font-bold">{currentLesson?.title}</h2>
                         {currentLesson?.description && (
                           <p className="text-muted-foreground max-w-md mx-auto text-lg">
                             {currentLesson.description}
                           </p>
                         )}
                       </div>
                       {currentLesson?.content_type === 'text' && (
                         <Button size="lg" onClick={() => document.getElementById('lesson-content')?.scrollIntoView({ behavior: 'smooth' })}>
                           Commencer la lecture
                         </Button>
                       )}
                     </div>
                   </div>
                 )}
              </CardContent>
            </Card>

            {/* Lesson Content */}
            {currentLesson && (
              <Card id="lesson-content">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {lessonTypeIcon}
                        <CardTitle className="text-2xl">{currentLesson.title}</CardTitle>
                      </div>
                      {currentLesson.description && (
                        <CardDescription className="text-base">{currentLesson.description}</CardDescription>
                      )}
                    </div>
                    {isLessonCompleted(currentLesson.id) && (
                      <Badge className="bg-green-500 shrink-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complété
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {currentLesson.content_text && (
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      <div className="whitespace-pre-line leading-relaxed">
                        {currentLesson.content_text}
                      </div>
                    </div>
                  )}

                  <Separator />

                   <div className="flex flex-wrap gap-3">
                     {!isLessonCompleted(currentLesson.id) && (
                       <Button onClick={handleLessonComplete} className="gap-2" size="lg">
                         <CheckCircle2 className="h-4 w-4" />
                         Marquer comme complété
                       </Button>
                     )}
                     
                     {currentLesson.content_type === 'quiz' && (
                       <Button 
                         variant="outline" 
                         onClick={() => setShowQuiz(!showQuiz)}
                         className="gap-2"
                         size="lg"
                       >
                         <HelpCircle className="h-4 w-4" />
                         {showQuiz ? 'Masquer' : 'Commencer'} le Quiz
                       </Button>
                     )}

                     {isLessonCompleted(currentLesson.id) && (
                       <Button variant="secondary" size="lg" className="gap-2">
                         <CheckCircle2 className="h-4 w-4 text-green-500" />
                         Leçon complétée
                       </Button>
                     )}
                   </div>

                  {showQuiz && currentQuiz && (
                    <QuizComponent
                      quiz={{
                        id: (currentQuiz as any).id || '',
                        lesson_id: currentLesson?.id || '',
                        course_id: course?.id || '',
                        passing_score: (currentQuiz as any).passing_score || 70,
                        questions: (currentQuiz as any).questions || [],
                        title: (currentQuiz as any).title || '',
                      }}
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
                   {lessons.map((lesson, index) => {
                     const lessonIcon = lesson.content_type === 'video' ? Video : 
                                       lesson.content_type === 'quiz' ? HelpCircle : FileText;
                     const LessonIcon = lessonIcon;
                     
                     return (
                       <button
                         key={lesson.id}
                         onClick={() => setCurrentLessonId(lesson.id)}
                         className={`w-full p-4 text-left hover:bg-accent/50 transition-all ${
                           currentLesson?.id === lesson.id ? 'bg-accent border-l-4 border-primary' : ''
                         }`}
                       >
                         <div className="flex items-start gap-3">
                           <div className={`flex-shrink-0 w-10 h-10 rounded-lg border-2 flex items-center justify-center ${
                             isLessonCompleted(lesson.id) 
                               ? 'bg-green-500/10 border-green-500' 
                               : currentLesson?.id === lesson.id 
                               ? 'bg-primary/10 border-primary'
                               : 'border-border'
                           }`}>
                             {isLessonCompleted(lesson.id) ? (
                               <CheckCircle2 className="h-5 w-5 text-green-500" />
                             ) : (
                               <LessonIcon className="h-5 w-5 text-muted-foreground" />
                             )}
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="font-semibold text-sm mb-1">
                               {index + 1}. {lesson.title}
                             </p>
                             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                               {lesson.duration_minutes && (
                                 <span className="flex items-center gap-1">
                                   <Clock className="h-3 w-3" />
                                   {lesson.duration_minutes} min
                                 </span>
                               )}
                               {lesson.is_preview && (
                                 <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                   Aperçu
                                 </Badge>
                               )}
                             </div>
                           </div>
                         </div>
                       </button>
                     );
                   })}
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
