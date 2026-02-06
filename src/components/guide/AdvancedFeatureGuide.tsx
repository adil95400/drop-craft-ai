/**
 * AdvancedFeatureGuide - Documentation avancée intégrée avec vidéos, captures et guides détaillés
 * Version professionnelle enrichie du FeatureGuide de base
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import {
  BookOpen, ChevronDown, ChevronRight, CheckCircle2,
  Lightbulb, Play, GraduationCap, ExternalLink, X, Sparkles,
  Camera, Video, FileText, ArrowRight, AlertTriangle, Info,
  Monitor, Smartphone, Zap, Award
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GuideStep {
  title: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
  completed?: boolean
  screenshot?: string
  detailedInstructions?: string[]
}

export interface GuideTip {
  text: string
  type?: 'info' | 'warning' | 'pro'
}

export interface GuideVideo {
  title: string
  description?: string
  youtubeId: string
  duration?: string
  thumbnail?: string
}

export interface GuideScreenshot {
  title: string
  description?: string
  imageUrl: string
  alt: string
}

export interface GuideFAQ {
  question: string
  answer: string
}

export interface AdvancedGuideProps {
  featureName: string
  description: string
  steps: GuideStep[]
  tips?: GuideTip[]
  videos?: GuideVideo[]
  screenshots?: GuideScreenshot[]
  faqs?: GuideFAQ[]
  keyFeatures?: string[]
  videoUrl?: string
  academyPath?: string
  defaultOpen?: boolean
  className?: string
  level?: 'beginner' | 'intermediate' | 'advanced'
}

export function AdvancedFeatureGuide({
  featureName,
  description,
  steps,
  tips = [],
  videos = [],
  screenshots = [],
  faqs = [],
  keyFeatures = [],
  videoUrl,
  academyPath,
  defaultOpen = false,
  className,
  level = 'beginner'
}: AdvancedGuideProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [dismissedTips, setDismissedTips] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState('steps')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const completedSteps = steps.filter(s => s.completed).length

  const levelConfig = {
    beginner: { label: 'Débutant', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: Zap },
    intermediate: { label: 'Intermédiaire', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Monitor },
    advanced: { label: 'Avancé', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: Award }
  }

  const currentLevel = levelConfig[level]
  const LevelIcon = currentLevel.icon

  const hasTabs = videos.length > 0 || screenshots.length > 0 || faqs.length > 0

  return (
    <Card className={cn("border-primary/20 bg-gradient-to-br from-primary/[0.02] to-transparent overflow-hidden", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 shadow-sm">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2 flex-wrap">
                    Guide : {featureName}
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", currentLevel.color)}>
                      <LevelIcon className="h-3 w-3 mr-0.5" />
                      {currentLevel.label}
                    </Badge>
                    {completedSteps === steps.length && steps.length > 0 && (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-[10px]">
                        <CheckCircle2 className="h-3 w-3 mr-0.5" />Complété
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {videos.length > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 border-blue-500/20 text-blue-600">
                    <Video className="h-3 w-3 mr-0.5" />{videos.length} vidéo{videos.length > 1 ? 's' : ''}
                  </Badge>
                )}
                {steps.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {completedSteps}/{steps.length}
                  </Badge>
                )}
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-5">
            {/* Key Features Chips */}
            {keyFeatures.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {keyFeatures.map((feature, i) => (
                  <Badge key={i} variant="secondary" className="text-[11px] bg-accent/50 font-normal">
                    <Sparkles className="h-3 w-3 mr-1 text-primary" />{feature}
                  </Badge>
                ))}
              </div>
            )}

            {/* Tabs or simple content */}
            {hasTabs ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-muted/50 h-9">
                  <TabsTrigger value="steps" className="text-xs gap-1.5 h-7">
                    <Play className="h-3.5 w-3.5" />Étapes
                  </TabsTrigger>
                  {videos.length > 0 && (
                    <TabsTrigger value="videos" className="text-xs gap-1.5 h-7">
                      <Video className="h-3.5 w-3.5" />Vidéos
                    </TabsTrigger>
                  )}
                  {screenshots.length > 0 && (
                    <TabsTrigger value="screenshots" className="text-xs gap-1.5 h-7">
                      <Camera className="h-3.5 w-3.5" />Captures
                    </TabsTrigger>
                  )}
                  {faqs.length > 0 && (
                    <TabsTrigger value="faq" className="text-xs gap-1.5 h-7">
                      <FileText className="h-3.5 w-3.5" />FAQ
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="steps" className="mt-0">
                  <StepsSection steps={steps} />
                </TabsContent>

                <TabsContent value="videos" className="mt-0">
                  <VideosSection videos={videos} />
                </TabsContent>

                <TabsContent value="screenshots" className="mt-0">
                  <ScreenshotsSection screenshots={screenshots} />
                </TabsContent>

                <TabsContent value="faq" className="mt-0">
                  <FAQSection faqs={faqs} expandedFaq={expandedFaq} setExpandedFaq={setExpandedFaq} />
                </TabsContent>
              </Tabs>
            ) : (
              <StepsSection steps={steps} />
            )}

            {/* Tips */}
            {tips.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Lightbulb className="h-4 w-4" />Astuces Pro
                </h4>
                {tips.map((tip, index) => {
                  if (dismissedTips.includes(index)) return null
                  const tipConfig = {
                    info: { style: 'bg-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-400', icon: Info },
                    warning: { style: 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400', icon: AlertTriangle },
                    pro: { style: 'bg-purple-500/5 border-purple-500/20 text-purple-700 dark:text-purple-400', icon: Sparkles }
                  }
                  const config = tipConfig[tip.type || 'info']
                  const TipIcon = config.icon
                  return (
                    <div key={index} className={cn("relative flex items-start gap-2 p-3 rounded-lg border text-sm", config.style)}>
                      <TipIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="flex-1">{tip.text}</span>
                      <button onClick={() => setDismissedTips(prev => [...prev, index])} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {videoUrl && (
                <Button variant="outline" size="sm" onClick={() => window.open(videoUrl, '_blank')} className="text-xs">
                  <Play className="h-3.5 w-3.5 mr-1.5" />Tutoriel vidéo
                </Button>
              )}
              {academyPath && (
                <Button variant="outline" size="sm" onClick={() => window.open(academyPath, '_self')} className="text-xs">
                  <GraduationCap className="h-3.5 w-3.5 mr-1.5" />Cours Academy
                </Button>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function StepsSection({ steps }: { steps: GuideStep[] }) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div
          key={index}
          className={cn(
            "rounded-lg border transition-all",
            step.completed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card border-border hover:border-primary/30"
          )}
        >
          <button
            onClick={() => setExpandedStep(expandedStep === index ? null : index)}
            className="flex items-start gap-3 p-3 w-full text-left"
          >
            <div className={cn(
              "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
              step.completed ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
            )}>
              {step.completed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", step.completed && "line-through text-muted-foreground")}>{step.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
            </div>
            {(step.detailedInstructions || step.screenshot) && (
              <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform mt-1", expandedStep === index && "rotate-90")} />
            )}
          </button>

          {expandedStep === index && (step.detailedInstructions || step.screenshot) && (
            <div className="px-3 pb-3 pl-[52px] space-y-3">
              {step.detailedInstructions && (
                <div className="space-y-1.5">
                  {step.detailedInstructions.map((instruction, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary" />
                      <span>{instruction}</span>
                    </div>
                  ))}
                </div>
              )}
              {step.screenshot && (
                <div className="rounded-lg overflow-hidden border bg-muted/30">
                  <img src={step.screenshot} alt={step.title} className="w-full h-auto" loading="lazy" />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function VideosSection({ videos }: { videos: GuideVideo[] }) {
  const [activeVideo, setActiveVideo] = useState(0)
  const current = videos[activeVideo]

  return (
    <div className="space-y-3">
      {/* Video player */}
      <div className="rounded-xl overflow-hidden border bg-black/5 shadow-inner">
        <AspectRatio ratio={16 / 9}>
          <iframe
            src={`https://www.youtube.com/embed/${current.youtubeId}?rel=0`}
            title={current.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </AspectRatio>
      </div>
      <div className="px-1">
        <h4 className="text-sm font-semibold">{current.title}</h4>
        {current.description && <p className="text-xs text-muted-foreground mt-0.5">{current.description}</p>}
        {current.duration && <Badge variant="outline" className="text-[10px] mt-1">{current.duration}</Badge>}
      </div>

      {/* Video list */}
      {videos.length > 1 && (
        <div className="space-y-1.5 pt-2 border-t">
          {videos.map((video, i) => (
            <button
              key={i}
              onClick={() => setActiveVideo(i)}
              className={cn(
                "flex items-center gap-3 w-full p-2.5 rounded-lg text-left text-sm transition-colors",
                i === activeVideo ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                i === activeVideo ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <Play className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{video.title}</p>
                {video.duration && <p className="text-[10px] text-muted-foreground">{video.duration}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ScreenshotsSection({ screenshots }: { screenshots: GuideScreenshot[] }) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {screenshots.map((screenshot, i) => (
          <button
            key={i}
            onClick={() => setSelectedImage(selectedImage === i ? null : i)}
            className="rounded-lg overflow-hidden border hover:border-primary/50 transition-colors text-left group"
          >
            <div className="relative">
              <img src={screenshot.imageUrl} alt={screenshot.alt} className="w-full h-32 object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
              </div>
            </div>
            <div className="p-2">
              <p className="text-xs font-medium truncate">{screenshot.title}</p>
              {screenshot.description && <p className="text-[10px] text-muted-foreground truncate">{screenshot.description}</p>}
            </div>
          </button>
        ))}
      </div>

      {selectedImage !== null && (
        <div className="rounded-xl overflow-hidden border shadow-lg">
          <img src={screenshots[selectedImage].imageUrl} alt={screenshots[selectedImage].alt} className="w-full h-auto" />
          <div className="p-3 bg-muted/30">
            <p className="text-sm font-medium">{screenshots[selectedImage].title}</p>
            {screenshots[selectedImage].description && (
              <p className="text-xs text-muted-foreground mt-0.5">{screenshots[selectedImage].description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FAQSection({ faqs, expandedFaq, setExpandedFaq }: { 
  faqs: GuideFAQ[], expandedFaq: number | null, setExpandedFaq: (v: number | null) => void 
}) {
  return (
    <div className="space-y-1.5">
      {faqs.map((faq, i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
            className="flex items-center justify-between w-full p-3 text-left hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-medium">{faq.question}</span>
            <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedFaq === i && "rotate-90")} />
          </button>
          {expandedFaq === i && (
            <div className="px-3 pb-3 text-sm text-muted-foreground border-t pt-2">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
