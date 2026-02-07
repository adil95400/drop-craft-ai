/**
 * AcademyPage - ShopOpti Academy
 */
import { Helmet } from 'react-helmet-async'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GraduationCap, Video, TrendingUp, Award } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { academyService } from '@/services/academy.service'
import { CourseCard } from '@/components/academy/CourseCard'
import { ProgressDashboard } from '@/components/academy/ProgressDashboard'
import { useAcademyProgress } from '@/hooks/useAcademyProgress'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

export default function AcademyPage() {
  const [activeTab, setActiveTab] = useState('courses')
  const { stats } = useAcademyProgress()

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['academy-courses'],
    queryFn: () => academyService.getCourses(),
  })

  return (
    <>
      <Helmet>
        <title>Academy - Formation Dropshipping | ShopOpti</title>
        <meta name="description" content="Formations complètes en dropshipping, e-commerce et automatisation." />
      </Helmet>

      <ChannablePageWrapper
        title="ShopOpti Academy"
        description="Formations, quiz interactifs et certifications"
        heroImage="support"
        badge={{ label: 'Academy', icon: GraduationCap }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="courses" className="gap-2"><Video className="h-4 w-4" />Cours</TabsTrigger>
            <TabsTrigger value="progress" className="gap-2"><TrendingUp className="h-4 w-4" />Progression</TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2"><Award className="h-4 w-4" />Certificats</TabsTrigger>
          </TabsList>
          <TabsContent value="courses" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-48 bg-muted rounded-lg animate-pulse" />
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
                {courses.map((course) => (<CourseCard key={course.id} course={course} showProgress />))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="progress"><ProgressDashboard /></TabsContent>
          <TabsContent value="certificates"><ProgressDashboard /></TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  )
}
