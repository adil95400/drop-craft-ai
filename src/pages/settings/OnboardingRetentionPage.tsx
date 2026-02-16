/**
 * Sprint 16: Onboarding & Retention Dashboard
 * Gamification, achievements, progress checklist, feature discovery
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Star, Zap, Target, Flame, CheckCircle2, 
  Circle, Lock, ChevronRight, Sparkles, Gift, TrendingUp,
  Lightbulb, X, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGamification, ACHIEVEMENTS, getLevelFromXP, type AchievementDef } from '@/hooks/useGamification';
import { useFeatureDiscovery } from '@/hooks/useFeatureDiscovery';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const LEVEL_TITLES = [
  'Débutant', 'Apprenti', 'Vendeur', 'Marchand', 'Expert',
  'Stratège', 'Maître', 'Légende', 'Champion', 'Titan', 'Élite', 'Visionnaire'
];

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  onboarding: { label: 'Démarrage', icon: <Zap className="h-4 w-4" />, color: 'text-blue-500' },
  products: { label: 'Catalogue', icon: <Target className="h-4 w-4" />, color: 'text-emerald-500' },
  sales: { label: 'Ventes', icon: <TrendingUp className="h-4 w-4" />, color: 'text-amber-500' },
  engagement: { label: 'Engagement', icon: <Flame className="h-4 w-4" />, color: 'text-orange-500' },
  mastery: { label: 'Maîtrise', icon: <Star className="h-4 w-4" />, color: 'text-violet-500' },
};

export default function OnboardingRetentionPage() {
  const navigate = useNavigate();
  const { gamification, unlockedAchievements, levelInfo, streak, isUnlocked } = useGamification();
  const { unseenTips, dismiss } = useFeatureDiscovery();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredAchievements = selectedCategory 
    ? ACHIEVEMENTS.filter(a => a.category === selectedCategory)
    : ACHIEVEMENTS;

  const totalUnlocked = unlockedAchievements.length;
  const totalAchievements = ACHIEVEMENTS.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          Progression & Récompenses
        </h1>
        <p className="text-muted-foreground mt-1">
          Suivez votre progression et débloquez des récompenses
        </p>
      </div>

      {/* Level & XP Card */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-amber-500/5">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-amber-500/5 opacity-50" />
        <CardContent className="relative p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Level Badge */}
            <motion.div 
              className="flex-shrink-0 w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-amber-500 flex flex-col items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-3xl font-bold text-white">{levelInfo.level}</span>
              <span className="text-xs text-white/80 font-medium">
                {LEVEL_TITLES[Math.min(levelInfo.level - 1, LEVEL_TITLES.length - 1)]}
              </span>
            </motion.div>

            {/* XP Progress */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Niveau {levelInfo.level}
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                      {levelInfo.xp} XP
                    </Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {levelInfo.xpInLevel} / {levelInfo.xpForNext} XP pour le niveau suivant
                  </p>
                </div>
                {streak > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-semibold text-orange-600">{streak}j</span>
                  </div>
                )}
              </div>
              <Progress value={levelInfo.percent} className="h-3 bg-muted/50" />
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  {totalUnlocked}/{totalAchievements} succès
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  {gamification?.total_actions || 0} actions
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="achievements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="achievements" className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4" /> Succès
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4" /> Découvrir
            {unseenTips.length > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {unseenTips.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedCategory === null ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setSelectedCategory(null)}
            >
              Tous
            </Button>
            {Object.entries(CATEGORY_LABELS).map(([key, cat]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(key)}
                className="flex items-center gap-1.5"
              >
                {cat.icon} {cat.label}
              </Button>
            ))}
          </div>

          {/* Achievement Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAchievements.map((achievement, i) => {
              const unlocked = isUnlocked(achievement.id);
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className={cn(
                    "transition-all",
                    unlocked 
                      ? "border-emerald-500/30 bg-emerald-500/5" 
                      : "opacity-70 hover:opacity-100"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "text-2xl w-10 h-10 flex items-center justify-center rounded-lg",
                          unlocked ? "bg-emerald-500/10" : "bg-muted/50 grayscale"
                        )}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">{achievement.name}</h4>
                            {unlocked ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
                          <Badge variant="outline" className="mt-2 text-[10px] px-1.5 py-0">
                            <Sparkles className="h-3 w-3 mr-1" />
                            +{achievement.xpReward} XP
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Feature Discovery Tab */}
        <TabsContent value="discover" className="space-y-3">
          {unseenTips.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-lg">Tout exploré !</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Vous avez découvert toutes les fonctionnalités disponibles.
                </p>
              </CardContent>
            </Card>
          ) : (
            unseenTips.map((tip, i) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="group hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => navigate(tip.route)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg bg-primary/5">
                      {tip.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{tip.title}</h4>
                      <p className="text-xs text-muted-foreground">{tip.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); dismiss.mutate(tip.id); }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
