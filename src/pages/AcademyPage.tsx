import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Video, TrendingUp, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { academyService } from '@/services/academy.service';
import { CourseCard } from '@/components/academy/CourseCard';
import { ProgressDashboard } from '@/components/academy/ProgressDashboard';
import { useAcademyProgress } from '@/hooks/useAcademyProgress';

export default function AcademyPage() {
  const [activeTab, setActiveTab] = useState('courses');
  const { stats } = useAcademyProgress();
  
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['academy-courses'],
    queryFn: () => academyService.getCourses(),
  });

  return (
    <>
      <Helmet>
        <title>Academy - Formation Dropshipping | Drop Craft AI</title>
        <meta name="description" content="Formations complètes en dropshipping, e-commerce et automatisation. Cours vidéo, guides pratiques et webinars exclusifs." />
      </Helmet>

      <div className="container mx-auto py-8 px-4 space-y-8">
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">ShopOpti Academy</span>
          </div>
          
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
            Devenez Expert du Dropshipping
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Formations complètes, quiz interactifs et certifications pour réussir votre business
          </p>

          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{courses.length}</div>
              <div className="text-sm text-muted-foreground">Cours disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats?.completedCourses || 0}</div>
              <div className="text-sm text-muted-foreground">Cours complétés</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats?.totalPoints || 0}</div>
              <div className="text-sm text-muted-foreground">Points XP</div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
            <TabsTrigger value="courses" className="gap-2">
              <Video className="h-4 w-4" />
              Cours
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Ma Progression
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2">
              <Award className="h-4 w-4" />
              Certificats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-48 bg-gradient-to-br from-muted via-muted to-accent/10 rounded-lg animate-pulse" />
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="text-6xl">📚</div>
                <h3 className="text-xl font-semibold">Aucun cours disponible</h3>
                <p className="text-muted-foreground">Les cours seront bientôt disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} showProgress />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress">
            <ProgressDashboard />
          </TabsContent>

          <TabsContent value="certificates">
            <ProgressDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
