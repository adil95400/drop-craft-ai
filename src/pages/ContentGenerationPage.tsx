import { ContentGenerationHub } from '@/components/content/ContentGenerationHub';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Image, FileText, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon 
}: { 
  title: string
  value: string | number
  subtitle: string
  icon: any
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.2 }}
  >
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  </motion.div>
)

export default function ContentGenerationPage() {
  return (
    <>
      <Helmet>
        <title>Génération de Contenu IA - Vidéos, Posts Sociaux & Photos</title>
        <meta name="description" content="Générez automatiquement des vidéos TikTok, posts sociaux, et améliorez vos photos produits avec l'IA" />
      </Helmet>
      
      <ChannablePageWrapper
        title="Génération de Contenu IA"
        subtitle="Créez automatiquement des vidéos TikTok, posts sociaux et améliorez vos photos produits"
        heroImage="marketing"
      >
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.contentGeneration} />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Vidéos Générées"
            value="156"
            subtitle="Ce mois"
            icon={Video}
          />
          <StatCard
            title="Images Optimisées"
            value="1,234"
            subtitle="Photos produits"
            icon={Image}
          />
          <StatCard
            title="Posts Créés"
            value="892"
            subtitle="Contenus sociaux"
            icon={FileText}
          />
          <StatCard
            title="Crédits IA"
            value="4,500"
            subtitle="Disponibles"
            icon={Sparkles}
          />
        </div>

        <ContentGenerationHub />
      </ChannablePageWrapper>
    </>
  );
}
