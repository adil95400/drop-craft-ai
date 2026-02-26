/**
 * Composant Hero pour l'Import Rapide - Position Premium en haut de page
 * Zone d'action principale avec champ URL et plateformes supportées
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useReducedMotion, getMotionProps } from '@/hooks/useReducedMotion';
import {
  Link as LinkIcon,
  Rocket,
  Loader2,
  Sparkles,
  FileSpreadsheet,
  Chrome,
  ArrowRight,
  Zap,
} from 'lucide-react';

// Plateformes supportées avec logos
const supportedPlatforms = [
  { name: 'AliExpress', logo: '/logos/aliexpress-logo.svg', color: 'text-orange-500', path: '/import/aliexpress' },
  { name: 'Amazon', logo: '/logos/amazon-logo.svg', color: 'text-amber-600', path: '/import/amazon' },
  { name: 'Temu', logo: '/logos/temu-logo.svg', color: 'text-orange-600', path: '/import/temu' },
  { name: 'eBay', logo: '/logos/ebay-icon.svg', color: 'text-blue-500', path: '/import/ebay' },
  { name: 'Etsy', logo: '/logos/etsy.svg', color: 'text-orange-500', path: '/import/etsy' },
  { name: 'CJ', logo: '/logos/cj-logo.svg', color: 'text-red-500', path: '/import/cj-dropshipping' },
  { name: 'Cdiscount', logo: '/logos/cdiscount-icon.svg', color: 'text-red-600', path: '/import/cdiscount' },
  { name: 'Shopify', logo: '/logos/shopify.svg', color: 'text-green-600', path: '/import/shopify' },
];

interface QuickImportHeroProps {
  className?: string;
  onImportStart?: () => void;
}

export function QuickImportHero({ className, onImportStart }: QuickImportHeroProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleQuickImport = useCallback(async () => {
    if (!url.trim()) {
      toast({
        title: "URL requise",
        description: "Veuillez coller l'URL d'un produit à importer",
        variant: "destructive",
      });
      return;
    }

    // Valider l'URL
    try {
      new URL(url);
    } catch {
      toast({
        title: "URL invalide",
        description: "Veuillez entrer une URL valide (commençant par http:// ou https://)",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    onImportStart?.();
    
    // Rediriger vers la page d'import avec l'URL
    navigate(`/import/autods?url=${encodeURIComponent(url)}`);
    setIsImporting(false);
  }, [url, navigate, toast, onImportStart]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuickImport();
    }
  };

  const fadeInUp = getMotionProps(prefersReducedMotion, {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  });

  return (
    <motion.div {...fadeInUp} className={className}>
      <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-purple-500/5">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-primary/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        
        <CardContent className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Left: Title and description */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white">
                  <Zap className="w-3 h-3 mr-1" />
                  Import Rapide
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  IA intégrée
                </Badge>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold">
                Importez un produit en{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                  quelques secondes
                </span>
              </h2>
              
              <p className="text-muted-foreground">
                Collez simplement l'URL d'un produit. Notre IA extrait et optimise automatiquement toutes les données.
              </p>
            </div>

            {/* Right: Quick actions */}
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => navigate('/import/quick')}
                className="whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/extensions')}
                className="whitespace-nowrap"
              >
                <Chrome className="w-4 h-4 mr-2" />
                Extension
              </Button>
            </div>
          </div>

          {/* Main URL Input */}
          <div className="mt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="Collez l'URL du produit (AliExpress, Amazon, Temu, eBay...)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "pl-12 h-14 text-base md:text-lg bg-background/80 backdrop-blur",
                    "border-2 focus:border-primary transition-colors",
                    "placeholder:text-muted-foreground/60"
                  )}
                />
              </div>
              <Button
                size="lg"
                onClick={handleQuickImport}
                disabled={isImporting}
                className={cn(
                  "h-14 px-8 text-base font-semibold whitespace-nowrap",
                  "bg-gradient-to-r from-primary to-purple-600",
                  "hover:from-primary/90 hover:to-purple-600/90",
                  "shadow-lg hover:shadow-xl transition-all"
                )}
              >
                {isImporting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Rocket className="w-5 h-5 mr-2" />
                    Importer
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Supported platforms */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Plateformes :</span>
            <TooltipProvider>
              {supportedPlatforms.map((platform) => (
                <Tooltip key={platform.name}>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1.5 cursor-pointer hover:bg-secondary/80 transition-colors"
                      onClick={() => navigate(platform.path)}
                    >
                      <img
                        src={platform.logo}
                        alt={platform.name}
                        className="w-4 h-4 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span className="hidden sm:inline">{platform.name}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Importer depuis {platform.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/import/search-suppliers')}>
              Voir tout
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
