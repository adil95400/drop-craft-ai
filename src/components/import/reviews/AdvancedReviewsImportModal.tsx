import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, FileText, FileSpreadsheet, Star, CheckCircle, AlertCircle, 
  Loader2, Settings2, Filter, Shuffle, Languages, Shield, Calendar,
  Copy, Trash2, Edit3, Download, Sparkles, RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdvancedReviewsImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  productName?: string;
  productSku?: string;
  onSuccess?: () => void;
}

interface ParsedReview {
  id: string;
  customer_name: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: boolean;
  helpful_count: number;
  review_date: string | null;
  images: string[];
  selected: boolean;
  language?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface ImportOptions {
  // Filtering
  minRating: number;
  maxRating: number;
  onlyVerified: boolean;
  onlyWithImages: boolean;
  onlyWithTitle: boolean;
  minCommentLength: number;
  
  // Processing
  translateToFrench: boolean;
  anonymizeNames: boolean;
  randomizeDates: boolean;
  dateRangeStart: string;
  dateRangeEnd: string;
  
  // Duplication prevention
  skipDuplicates: boolean;
  duplicateCheckField: 'comment' | 'title' | 'both';
  
  // Moderation
  autoApprove: boolean;
  filterProfanity: boolean;
  removeUrls: boolean;
  
  // Enhancement
  addVerifiedBadge: boolean;
  adjustRatings: boolean;
  ratingAdjustment: number;
}

const defaultOptions: ImportOptions = {
  minRating: 1,
  maxRating: 5,
  onlyVerified: false,
  onlyWithImages: false,
  onlyWithTitle: false,
  minCommentLength: 0,
  translateToFrench: false,
  anonymizeNames: false,
  randomizeDates: false,
  dateRangeStart: '',
  dateRangeEnd: '',
  skipDuplicates: true,
  duplicateCheckField: 'comment',
  autoApprove: true,
  filterProfanity: false,
  removeUrls: true,
  addVerifiedBadge: false,
  adjustRatings: false,
  ratingAdjustment: 0,
};

const FRENCH_NAMES = [
  'Jean D.', 'Marie L.', 'Pierre M.', 'Sophie B.', 'Thomas R.', 'Julie C.',
  'Nicolas P.', 'Emma V.', 'Lucas G.', 'Camille H.', 'Antoine F.', 'Léa S.',
  'Maxime T.', 'Chloé D.', 'Alexandre B.', 'Sarah M.', 'Hugo L.', 'Clara P.',
  'Louis R.', 'Manon C.', 'Gabriel V.', 'Inès G.', 'Arthur H.', 'Jade F.',
];

const PROFANITY_LIST = ['spam', 'fake', 'arnaque', 'scam', 'merde', 'putain'];

export function AdvancedReviewsImportModal({ 
  open, 
  onOpenChange, 
  productId,
  productName,
  productSku,
  onSuccess 
}: AdvancedReviewsImportModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'csv' | 'json' | 'manual' | 'url'>('csv');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedReviews, setParsedReviews] = useState<ParsedReview[]>([]);
  const [jsonInput, setJsonInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [options, setOptions] = useState<ImportOptions>(defaultOptions);
  const [showOptions, setShowOptions] = useState(false);
  
  // Manual entry form
  const [manualReview, setManualReview] = useState({
    customer_name: '',
    rating: 5,
    title: '',
    comment: '',
    verified_purchase: false
  });

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const detectSentiment = (text: string): 'positive' | 'neutral' | 'negative' => {
    const positiveWords = ['excellent', 'super', 'parfait', 'génial', 'adore', 'love', 'great', 'amazing', 'recommend', 'best'];
    const negativeWords = ['horrible', 'nul', 'déçu', 'mauvais', 'bad', 'terrible', 'worst', 'never', 'refund', 'broken'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  const detectLanguage = (text: string): string => {
    const frenchWords = ['très', 'bien', 'bon', 'produit', 'livraison', 'qualité', 'recommande'];
    const englishWords = ['very', 'good', 'product', 'delivery', 'quality', 'recommend', 'shipping'];
    
    const lowerText = text.toLowerCase();
    const frenchCount = frenchWords.filter(w => lowerText.includes(w)).length;
    const englishCount = englishWords.filter(w => lowerText.includes(w)).length;
    
    if (frenchCount > englishCount) return 'fr';
    if (englishCount > frenchCount) return 'en';
    return 'unknown';
  };

  const anonymizeName = (): string => {
    return FRENCH_NAMES[Math.floor(Math.random() * FRENCH_NAMES.length)];
  };

  const randomizeDate = (start: string, end: string): string => {
    const startDate = start ? new Date(start) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();
    const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
    return new Date(randomTime).toISOString();
  };

  const filterProfanity = (text: string): string => {
    let result = text;
    PROFANITY_LIST.forEach(word => {
      const regex = new RegExp(word, 'gi');
      result = result.replace(regex, '***');
    });
    return result;
  };

  const removeUrls = (text: string): string => {
    return text.replace(/https?:\/\/[^\s]+/g, '').replace(/www\.[^\s]+/g, '').trim();
  };

  const processReview = (review: ParsedReview): ParsedReview => {
    let processed = { ...review };
    
    // Apply rating adjustment
    if (options.adjustRatings) {
      processed.rating = Math.min(5, Math.max(1, processed.rating + options.ratingAdjustment));
    }
    
    // Anonymize names
    if (options.anonymizeNames) {
      processed.customer_name = anonymizeName();
    }
    
    // Randomize dates
    if (options.randomizeDates) {
      processed.review_date = randomizeDate(options.dateRangeStart, options.dateRangeEnd);
    }
    
    // Add verified badge
    if (options.addVerifiedBadge) {
      processed.verified_purchase = true;
    }
    
    // Filter profanity
    if (options.filterProfanity) {
      processed.comment = filterProfanity(processed.comment);
      processed.title = filterProfanity(processed.title);
    }
    
    // Remove URLs
    if (options.removeUrls) {
      processed.comment = removeUrls(processed.comment);
    }
    
    return processed;
  };

  const filterReviews = (reviews: ParsedReview[]): ParsedReview[] => {
    return reviews.filter(review => {
      if (review.rating < options.minRating || review.rating > options.maxRating) return false;
      if (options.onlyVerified && !review.verified_purchase) return false;
      if (options.onlyWithImages && (!review.images || review.images.length === 0)) return false;
      if (options.onlyWithTitle && !review.title) return false;
      if (review.comment.length < options.minCommentLength) return false;
      return true;
    });
  };

  const parseCSVData = useCallback((csvData: string): Promise<ParsedReview[]> => {
    return new Promise((resolve) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const reviews = results.data.map((row: any) => {
            const comment = row.comment || row.review || row.text || row.avis || '';
            return {
              id: generateId(),
              customer_name: row.customer_name || row.name || row.author || 'Client',
              rating: parseFloat(row.rating || row.stars || row.note || '5'),
              title: row.title || row.titre || '',
              comment,
              verified_purchase: ['true', '1', 'yes', 'oui'].includes(String(row.verified_purchase || row.verified || '').toLowerCase()),
              helpful_count: parseInt(row.helpful_count || row.helpful || '0') || 0,
              review_date: row.review_date || row.date || null,
              images: row.images ? String(row.images).split(',').map(s => s.trim()) : [],
              selected: true,
              language: detectLanguage(comment),
              sentiment: detectSentiment(comment),
            };
          });
          resolve(reviews.filter(r => r.comment || r.title));
        }
      });
    });
  }, []);

  const parseJSONData = useCallback((jsonData: string): ParsedReview[] => {
    try {
      const data = JSON.parse(jsonData);
      const reviewsArray = Array.isArray(data) ? data : data.reviews || data.data || [];
      
      return reviewsArray.map((r: any) => {
        const comment = r.comment || r.review || r.text || r.body || r.avis || '';
        return {
          id: generateId(),
          customer_name: r.customer_name || r.name || r.author || r.reviewer || 'Client',
          rating: parseFloat(r.rating || r.stars || r.note || '5'),
          title: r.title || r.titre || '',
          comment,
          verified_purchase: Boolean(r.verified_purchase || r.verified || r.verified_buyer),
          helpful_count: parseInt(r.helpful_count || r.helpful || '0') || 0,
          review_date: r.review_date || r.date || r.created_at || null,
          images: Array.isArray(r.images) ? r.images : [],
          selected: true,
          language: detectLanguage(comment),
          sentiment: detectSentiment(comment),
        };
      }).filter((r: ParsedReview) => r.comment || r.title);
    } catch (e) {
      throw new Error('Format JSON invalide');
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    const text = await file.text();
    
    setIsProcessing(true);
    try {
      let reviews: ParsedReview[];
      
      if (file.name.endsWith('.json')) {
        reviews = parseJSONData(text);
        setActiveTab('json');
      } else {
        reviews = await parseCSVData(text);
        setActiveTab('csv');
      }
      
      const filteredReviews = filterReviews(reviews);
      setParsedReviews(filteredReviews);
      toast.success(`${filteredReviews.length} avis détectés sur ${reviews.length}`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la lecture du fichier');
    } finally {
      setIsProcessing(false);
    }
  }, [parseCSVData, parseJSONData, options]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/vnd.ms-excel': ['.xls', '.xlsx']
    },
    multiple: false
  });

  const handleParseJSON = () => {
    if (!jsonInput.trim()) {
      toast.error('Veuillez entrer du JSON');
      return;
    }
    
    try {
      const reviews = parseJSONData(jsonInput);
      const filteredReviews = filterReviews(reviews);
      setParsedReviews(filteredReviews);
      toast.success(`${filteredReviews.length} avis détectés`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFetchFromUrl = async () => {
    if (!urlInput.trim()) {
      toast.error('Veuillez entrer une URL');
      return;
    }

    setIsProcessing(true);
    try {
      // Call edge function to fetch reviews from URL
      const { data, error } = await supabase.functions.invoke('extension-review-importer', {
        body: {
          source: 'url',
          apiUrl: urlInput,
        }
      });

      if (error) throw error;
      
      if (data.reviews && Array.isArray(data.reviews)) {
        const reviews = data.reviews.map((r: any) => ({
          id: generateId(),
          customer_name: r.customer_name || 'Client',
          rating: r.rating || 5,
          title: r.title || '',
          comment: r.comment || '',
          verified_purchase: r.verified_purchase || false,
          helpful_count: r.helpful_count || 0,
          review_date: r.review_date || null,
          images: r.images || [],
          selected: true,
          language: detectLanguage(r.comment || ''),
          sentiment: detectSentiment(r.comment || ''),
        }));
        
        const filteredReviews = filterReviews(reviews);
        setParsedReviews(filteredReviews);
        toast.success(`${filteredReviews.length} avis extraits`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'extraction');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddManualReview = () => {
    if (!manualReview.comment && !manualReview.title) {
      toast.error('Veuillez entrer un titre ou un commentaire');
      return;
    }
    
    const newReview: ParsedReview = {
      id: generateId(),
      ...manualReview,
      helpful_count: 0,
      review_date: new Date().toISOString(),
      images: [],
      selected: true,
      language: detectLanguage(manualReview.comment),
      sentiment: detectSentiment(manualReview.comment),
    };
    
    setParsedReviews(prev => [...prev, newReview]);
    
    setManualReview({
      customer_name: '',
      rating: 5,
      title: '',
      comment: '',
      verified_purchase: false
    });
    
    toast.success('Avis ajouté');
  };

  const toggleReviewSelection = (id: string) => {
    setParsedReviews(prev => 
      prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r)
    );
  };

  const selectAll = () => {
    setParsedReviews(prev => prev.map(r => ({ ...r, selected: true })));
  };

  const deselectAll = () => {
    setParsedReviews(prev => prev.map(r => ({ ...r, selected: false })));
  };

  const removeSelected = () => {
    setParsedReviews(prev => prev.filter(r => !r.selected));
  };

  const duplicateSelected = () => {
    const selectedReviews = parsedReviews.filter(r => r.selected);
    const duplicated = selectedReviews.map(r => ({
      ...r,
      id: generateId(),
      customer_name: options.anonymizeNames ? anonymizeName() : r.customer_name,
      review_date: options.randomizeDates ? randomizeDate(options.dateRangeStart, options.dateRangeEnd) : r.review_date,
    }));
    setParsedReviews(prev => [...prev, ...duplicated]);
    toast.success(`${duplicated.length} avis dupliqués`);
  };

  const handleImportReviews = async () => {
    const selectedReviews = parsedReviews.filter(r => r.selected);
    
    if (!user || selectedReviews.length === 0) {
      toast.error('Aucun avis sélectionné');
      return;
    }

    setIsProcessing(true);
    try {
      // Process reviews with options
      const processedReviews = selectedReviews.map(processReview);
      
      // Check for duplicates if enabled
      let reviewsToInsert = processedReviews;
      if (options.skipDuplicates) {
        const { data: existingReviews } = await supabase
          .from('imported_reviews')
          .select('comment, title')
          .eq('user_id', user.id);
        
        if (existingReviews) {
          const existingSet = new Set(
            existingReviews.map(r => 
              options.duplicateCheckField === 'both' 
                ? `${r.title}|${r.comment}` 
                : options.duplicateCheckField === 'title' 
                  ? r.title 
                  : r.comment
            )
          );
          
          reviewsToInsert = processedReviews.filter(r => {
            const key = options.duplicateCheckField === 'both' 
              ? `${r.title}|${r.comment}` 
              : options.duplicateCheckField === 'title' 
                ? r.title 
                : r.comment;
            return !existingSet.has(key);
          });
          
          const skipped = processedReviews.length - reviewsToInsert.length;
          if (skipped > 0) {
            toast.info(`${skipped} doublons ignorés`);
          }
        }
      }

      if (reviewsToInsert.length === 0) {
        toast.warning('Tous les avis sont des doublons');
        setIsProcessing(false);
        return;
      }

      const reviewsData = reviewsToInsert.map(review => ({
        user_id: user.id,
        product_id: productId || null,
        product_name: productName || 'Produit',
        product_sku: productSku || null,
        customer_name: review.customer_name,
        rating: Math.min(5, Math.max(1, review.rating)),
        title: review.title,
        comment: review.comment,
        verified_purchase: review.verified_purchase,
        helpful_count: review.helpful_count,
        review_date: review.review_date,
        source: 'manual_import',
        images: review.images,
        status: options.autoApprove ? 'approved' : 'pending',
        metadata: {
          imported_at: new Date().toISOString(),
          language: review.language,
          sentiment: review.sentiment,
          options_applied: {
            anonymized: options.anonymizeNames,
            dates_randomized: options.randomizeDates,
            rating_adjusted: options.adjustRatings,
          }
        }
      }));

      const { data, error } = await supabase
        .from('imported_reviews')
        .insert(reviewsData)
        .select();

      if (error) throw error;

      toast.success(`${data.length} avis importés avec succès`);
      setParsedReviews([]);
      setJsonInput('');
      setUrlInput('');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Erreur lors de l\'import');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCount = parsedReviews.filter(r => r.selected).length;
  const avgRating = parsedReviews.length > 0 
    ? (parsedReviews.reduce((sum, r) => sum + r.rating, 0) / parsedReviews.length).toFixed(1)
    : '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Import avancé des avis
            {productName && (
              <Badge variant="secondary" className="ml-2">{productName}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Importez et personnalisez des avis clients avec des options avancées
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Options toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOptions(!showOptions)}
            className="w-fit"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Options avancées
            {showOptions ? ' (masquer)' : ' (afficher)'}
          </Button>

          {/* Advanced options panel */}
          {showOptions && (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-4 max-h-64 overflow-y-auto">
              <Accordion type="multiple" className="w-full">
                {/* Filtering options */}
                <AccordionItem value="filtering">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filtrage
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Note minimum</Label>
                        <Select
                          value={String(options.minRating)}
                          onValueChange={(v) => setOptions(prev => ({ ...prev, minRating: parseInt(v) }))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map(n => (
                              <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Note maximum</Label>
                        <Select
                          value={String(options.maxRating)}
                          onValueChange={(v) => setOptions(prev => ({ ...prev, maxRating: parseInt(v) }))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map(n => (
                              <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Uniquement achats vérifiés</Label>
                      <Switch
                        checked={options.onlyVerified}
                        onCheckedChange={(v) => setOptions(prev => ({ ...prev, onlyVerified: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Uniquement avec images</Label>
                      <Switch
                        checked={options.onlyWithImages}
                        onCheckedChange={(v) => setOptions(prev => ({ ...prev, onlyWithImages: v }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Longueur min. commentaire: {options.minCommentLength}</Label>
                      <Slider
                        value={[options.minCommentLength]}
                        onValueChange={(v) => setOptions(prev => ({ ...prev, minCommentLength: v[0] }))}
                        max={500}
                        step={10}
                        className="mt-2"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Processing options */}
                <AccordionItem value="processing">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Traitement
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Anonymiser les noms</Label>
                      <Switch
                        checked={options.anonymizeNames}
                        onCheckedChange={(v) => setOptions(prev => ({ ...prev, anonymizeNames: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Randomiser les dates</Label>
                      <Switch
                        checked={options.randomizeDates}
                        onCheckedChange={(v) => setOptions(prev => ({ ...prev, randomizeDates: v }))}
                      />
                    </div>
                    {options.randomizeDates && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Début</Label>
                          <Input
                            type="date"
                            value={options.dateRangeStart}
                            onChange={(e) => setOptions(prev => ({ ...prev, dateRangeStart: e.target.value }))}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Fin</Label>
                          <Input
                            type="date"
                            value={options.dateRangeEnd}
                            onChange={(e) => setOptions(prev => ({ ...prev, dateRangeEnd: e.target.value }))}
                            className="h-8"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Marquer comme vérifiés</Label>
                      <Switch
                        checked={options.addVerifiedBadge}
                        onCheckedChange={(v) => setOptions(prev => ({ ...prev, addVerifiedBadge: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Ajuster les notes</Label>
                      <Switch
                        checked={options.adjustRatings}
                        onCheckedChange={(v) => setOptions(prev => ({ ...prev, adjustRatings: v }))}
                      />
                    </div>
                    {options.adjustRatings && (
                      <div>
                        <Label className="text-xs">Ajustement: {options.ratingAdjustment > 0 ? '+' : ''}{options.ratingAdjustment}</Label>
                        <Slider
                          value={[options.ratingAdjustment]}
                          onValueChange={(v) => setOptions(prev => ({ ...prev, ratingAdjustment: v[0] }))}
                          min={-2}
                          max={2}
                          step={0.5}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Moderation options */}
                <AccordionItem value="moderation">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Modération
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Approuver automatiquement</Label>
                      <Switch
                        checked={options.autoApprove}
                        onCheckedChange={(v) => setOptions(prev => ({ ...prev, autoApprove: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Filtrer les mots inappropriés</Label>
                      <Switch
                        checked={options.filterProfanity}
                        onCheckedChange={(v) => setOptions(prev => ({ ...prev, filterProfanity: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Supprimer les URLs</Label>
                      <Switch
                        checked={options.removeUrls}
                        onCheckedChange={(v) => setOptions(prev => ({ ...prev, removeUrls: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Ignorer les doublons</Label>
                      <Switch
                        checked={options.skipDuplicates}
                        onCheckedChange={(v) => setOptions(prev => ({ ...prev, skipDuplicates: v }))}
                      />
                    </div>
                    {options.skipDuplicates && (
                      <div>
                        <Label className="text-xs">Vérifier par</Label>
                        <Select
                          value={options.duplicateCheckField}
                          onValueChange={(v: any) => setOptions(prev => ({ ...prev, duplicateCheckField: v }))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="comment">Commentaire</SelectItem>
                            <SelectItem value="title">Titre</SelectItem>
                            <SelectItem value="both">Les deux</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Import tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="csv" className="flex items-center gap-1 text-xs">
                <FileSpreadsheet className="h-3 w-3" />
                CSV
              </TabsTrigger>
              <TabsTrigger value="json" className="flex items-center gap-1 text-xs">
                <FileText className="h-3 w-3" />
                JSON
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-1 text-xs">
                <Download className="h-3 w-3" />
                URL
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-1 text-xs">
                <Edit3 className="h-3 w-3" />
                Manuel
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-4">
              <TabsContent value="csv" className="h-full m-0">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  {isDragActive ? (
                    <p>Déposez le fichier ici...</p>
                  ) : (
                    <div>
                      <p className="font-medium text-sm">Glissez-déposez un fichier CSV/JSON</p>
                      <p className="text-xs text-muted-foreground mt-1">ou cliquez pour sélectionner</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="json" className="h-full m-0 space-y-3">
                <Textarea
                  placeholder='[{"customer_name": "Jean", "rating": 5, "comment": "Super!"}]'
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={6}
                  className="font-mono text-xs"
                />
                <Button onClick={handleParseJSON} variant="outline" size="sm" className="w-full">
                  Analyser le JSON
                </Button>
              </TabsContent>

              <TabsContent value="url" className="h-full m-0 space-y-3">
                <div>
                  <Label className="text-xs">URL de la page produit</Label>
                  <Input
                    placeholder="https://www.amazon.fr/dp/..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Supporte Amazon, AliExpress, Trustpilot et autres...
                </p>
                <Button 
                  onClick={handleFetchFromUrl} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Extraction...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Extraire les avis
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="manual" className="h-full m-0 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nom du client</Label>
                    <Input
                      placeholder="Jean D."
                      value={manualReview.customer_name}
                      onChange={(e) => setManualReview(prev => ({ ...prev, customer_name: e.target.value }))}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Note</Label>
                    <Select
                      value={String(manualReview.rating)}
                      onValueChange={(v) => setManualReview(prev => ({ ...prev, rating: parseInt(v) }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 4, 3, 2, 1].map(n => (
                          <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Titre</Label>
                  <Input
                    placeholder="Excellent produit !"
                    value={manualReview.title}
                    onChange={(e) => setManualReview(prev => ({ ...prev, title: e.target.value }))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Commentaire</Label>
                  <Textarea
                    placeholder="J'ai adoré ce produit..."
                    value={manualReview.comment}
                    onChange={(e) => setManualReview(prev => ({ ...prev, comment: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="verified"
                    checked={manualReview.verified_purchase}
                    onCheckedChange={(v) => setManualReview(prev => ({ ...prev, verified_purchase: !!v }))}
                  />
                  <Label htmlFor="verified" className="text-xs">Achat vérifié</Label>
                </div>
                <Button onClick={handleAddManualReview} variant="outline" size="sm" className="w-full">
                  Ajouter à la liste
                </Button>
              </TabsContent>
            </div>
          </Tabs>

          {/* Parsed reviews preview */}
          {parsedReviews.length > 0 && (
            <div className="border rounded-lg p-3 space-y-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {parsedReviews.length} avis
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {selectedCount} sélectionnés
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    ★ {avgRating} moy.
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={selectAll} className="h-7 text-xs">
                    Tout
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll} className="h-7 text-xs">
                    Aucun
                  </Button>
                  <Button variant="ghost" size="sm" onClick={duplicateSelected} className="h-7 text-xs">
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={removeSelected} className="h-7 text-xs text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-32">
                <div className="space-y-1.5">
                  {parsedReviews.map((review) => (
                    <div 
                      key={review.id} 
                      className={`flex items-start gap-2 p-2 rounded text-xs transition-colors cursor-pointer ${
                        review.selected ? 'bg-primary/10' : 'bg-muted/30'
                      }`}
                      onClick={() => toggleReviewSelection(review.id)}
                    >
                      <Checkbox checked={review.selected} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium truncate">{review.customer_name}</span>
                          <span className="text-yellow-500 flex-shrink-0">
                            {'★'.repeat(Math.round(review.rating))}
                          </span>
                          {review.verified_purchase && (
                            <Badge variant="secondary" className="text-[10px] py-0">Vérifié</Badge>
                          )}
                          {review.sentiment && (
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] py-0 ${
                                review.sentiment === 'positive' ? 'text-green-600' :
                                review.sentiment === 'negative' ? 'text-red-600' : ''
                              }`}
                            >
                              {review.sentiment === 'positive' ? '😊' : review.sentiment === 'negative' ? '😞' : '😐'}
                            </Badge>
                          )}
                        </div>
                        {review.title && <p className="font-medium">{review.title}</p>}
                        <p className="text-muted-foreground line-clamp-1">{review.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Annuler
          </Button>
          <Button
            onClick={handleImportReviews}
            disabled={selectedCount === 0 || isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Import...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importer {selectedCount} avis
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
