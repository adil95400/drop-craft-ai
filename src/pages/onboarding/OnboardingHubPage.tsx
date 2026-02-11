import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { 
  Play, 
  BookOpen, 
  Trophy, 
  ChevronRight, 
  Clock, 
  Check, 
  Star,
  Sparkles,
  Video,
  GraduationCap,
  ArrowRight,
  Rocket
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { VideoTutorialSection } from '@/components/onboarding/VideoTutorialSection'
import { TUTORIALS, getAllVideos, type Tutorial } from '@/data/tutorialVideos'
import { useVideoProgress } from '@/hooks/useVideoProgress'
import { cn } from '@/lib/utils'

export default function OnboardingHubPage() {
  const navigate = useNavigate()
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null)
  const allVideos = getAllVideos()
  const allVideoIds = allVideos.map(v => v.id)
  const { progress, getCompletionPercentage } = useVideoProgress(allVideoIds)
  
  const globalProgress = getCompletionPercentage()
  const completedTutorials = TUTORIALS.filter(tutorial => {
    const tutorialVideoIds = tutorial.videos.map(v => v.id)
    return tutorialVideoIds.every(id => progress[id]?.completed)
  }).length

  return (
    <ChannablePageWrapper
      title="Guide de démarrage"
      description="Maîtrisez toutes les fonctionnalités avec nos tutoriels interactifs et vidéos guidées."
      heroImage="support"
      badge={{ label: 'Formation', icon: GraduationCap }}
    >
        <Tabs defaultValue="tutorials" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="tutorials" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Tutoriels
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Vidéos
            </TabsTrigger>
          </TabsList>

          {/* Tutorials Tab */}
          <TabsContent value="tutorials" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TUTORIALS.map((tutorial, index) => {
                const tutorialVideoIds = tutorial.videos.map(v => v.id)
                const completedVideos = tutorialVideoIds.filter(id => progress[id]?.completed).length
                const tutorialProgress = tutorialVideoIds.length > 0 
                  ? Math.round((completedVideos / tutorialVideoIds.length) * 100)
                  : 0
                const isCompleted = tutorialProgress === 100

                return (
                  <motion.div
                    key={tutorial.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={cn(
                        'group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1',
                        isCompleted && 'ring-2 ring-green-500/50'
                      )}
                      onClick={() => setSelectedTutorial(tutorial)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className={cn('p-3 rounded-xl', tutorial.color)}>
                            <tutorial.icon className="w-6 h-6 text-white" />
                          </div>
                          {isCompleted ? (
                            <Badge className="bg-green-500">
                              <Check className="w-3 h-3 mr-1" />
                              Terminé
                            </Badge>
                          ) : tutorialProgress > 0 ? (
                            <Badge variant="secondary">{tutorialProgress}%</Badge>
                          ) : (
                            <Badge variant="outline">Nouveau</Badge>
                          )}
                        </div>
                        <CardTitle className="mt-4 group-hover:text-primary transition-colors">
                          {tutorial.title}
                        </CardTitle>
                        <CardDescription>{tutorial.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Progress value={tutorialProgress} className="h-2" />
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {tutorial.estimatedTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <Video className="w-4 h-4" />
                              {tutorial.videos.length} vidéos
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Toutes les vidéos</h2>
                <p className="text-muted-foreground">
                  {Object.values(progress).filter(p => p.completed).length}/{allVideos.length} vidéos visionnées
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allVideos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
                    onClick={() => {
                      const tutorial = TUTORIALS.find(t => 
                        t.videos.some(v => v.id === video.id)
                      )
                      if (tutorial) setSelectedTutorial(tutorial)
                    }}
                  >
                    <div className="relative aspect-video">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                          <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                      {progress[video.id]?.completed && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm truncate">{video.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{video.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

      {/* Tutorial Detail Modal */}
      <AnimatePresence>
        {selectedTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTutorial(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className={cn('p-6 text-white', selectedTutorial.color)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white/20">
                      <selectedTutorial.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedTutorial.title}</h2>
                      <p className="text-white/80">{selectedTutorial.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setSelectedTutorial(null)}
                  >
                    <span className="sr-only">Fermer</span>
                    ×
                  </Button>
                </div>
              </div>

              {/* Content */}
              <ScrollArea className="max-h-[calc(90vh-200px)]">
                <div className="p-6 space-y-8">
                  {/* Videos Section */}
                  <VideoTutorialSection
                    tutorialId={selectedTutorial.id}
                    videos={selectedTutorial.videos}
                    title={`Vidéos - ${selectedTutorial.title}`}
                  />

                  {/* Steps */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Étapes du tutoriel
                    </h3>
                    <div className="space-y-3">
                      {selectedTutorial.steps.map((step, index) => (
                        <Card key={step.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                {index + 1}
                              </div>
                              <div className="flex-1 space-y-2">
                                <h4 className="font-medium">{step.title}</h4>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                                {step.tips && step.tips.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {step.tips.map((tip, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        💡 {tip}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {step.actionRoute && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-2"
                                    onClick={() => {
                                      setSelectedTutorial(null)
                                      navigate(step.actionRoute!)
                                    }}
                                  >
                                    {step.actionLabel || 'Aller à la page'}
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="p-4 border-t bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Durée estimée : {selectedTutorial.estimatedTime}
                </div>
                <Button onClick={() => setSelectedTutorial(null)}>
                  Fermer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ChannablePageWrapper>
  )
}
