import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, FileSpreadsheet, Star, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Papa from 'papaparse';

interface ReviewsImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  productName?: string;
  onSuccess?: () => void;
}

interface ParsedReview {
  customer_name: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: boolean;
  helpful_count: number;
  review_date: string | null;
  images: string[];
}

export function ReviewsImportModal({ 
  open, 
  onOpenChange, 
  productId,
  productName,
  onSuccess 
}: ReviewsImportModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'csv' | 'json' | 'manual'>('csv');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedReviews, setParsedReviews] = useState<ParsedReview[]>([]);
  const [jsonInput, setJsonInput] = useState('');
  
  // Manual entry form
  const [manualReview, setManualReview] = useState({
    customer_name: '',
    rating: 5,
    title: '',
    comment: '',
    verified_purchase: false
  });

  const parseCSVData = useCallback((csvData: string) => {
    return new Promise<ParsedReview[]>((resolve) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const reviews = results.data.map((row: any) => ({
            customer_name: row.customer_name || row.name || row.author || 'Client',
            rating: parseFloat(row.rating || row.stars || row.note || '5'),
            title: row.title || row.titre || '',
            comment: row.comment || row.review || row.text || row.avis || '',
            verified_purchase: ['true', '1', 'yes', 'oui'].includes(String(row.verified_purchase || row.verified || '').toLowerCase()),
            helpful_count: parseInt(row.helpful_count || row.helpful || '0') || 0,
            review_date: row.review_date || row.date || null,
            images: row.images ? String(row.images).split(',').map(s => s.trim()) : []
          }));
          resolve(reviews.filter(r => r.comment || r.title));
        }
      });
    });
  }, []);

  const parseJSONData = useCallback((jsonData: string): ParsedReview[] => {
    try {
      const data = JSON.parse(jsonData);
      const reviewsArray = Array.isArray(data) ? data : data.reviews || data.data || [];
      
      return reviewsArray.map((r: any) => ({
        customer_name: r.customer_name || r.name || r.author || r.reviewer || 'Client',
        rating: parseFloat(r.rating || r.stars || r.note || '5'),
        title: r.title || r.titre || '',
        comment: r.comment || r.review || r.text || r.body || r.avis || '',
        verified_purchase: Boolean(r.verified_purchase || r.verified || r.verified_buyer),
        helpful_count: parseInt(r.helpful_count || r.helpful || '0') || 0,
        review_date: r.review_date || r.date || r.created_at || null,
        images: Array.isArray(r.images) ? r.images : []
      })).filter((r: ParsedReview) => r.comment || r.title);
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
      
      setParsedReviews(reviews);
      toast.success(`${reviews.length} avis détectés`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la lecture du fichier');
    } finally {
      setIsProcessing(false);
    }
  }, [parseCSVData, parseJSONData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json']
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
      setParsedReviews(reviews);
      toast.success(`${reviews.length} avis détectés`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddManualReview = () => {
    if (!manualReview.comment && !manualReview.title) {
      toast.error('Veuillez entrer un titre ou un commentaire');
      return;
    }
    
    setParsedReviews(prev => [...prev, {
      ...manualReview,
      helpful_count: 0,
      review_date: new Date().toISOString(),
      images: []
    }]);
    
    setManualReview({
      customer_name: '',
      rating: 5,
      title: '',
      comment: '',
      verified_purchase: false
    });
    
    toast.success('Avis ajouté');
  };

  const handleImportReviews = async () => {
    if (!user || parsedReviews.length === 0) {
      toast.error('Aucun avis à importer');
      return;
    }

    setIsProcessing(true);
    try {
      const reviewsToInsert = parsedReviews.map(review => ({
        user_id: user.id,
        product_id: productId || null,
        product_name: productName || 'Produit',
        customer_name: review.customer_name,
        rating: Math.min(5, Math.max(0, review.rating)),
        title: review.title,
        comment: review.comment,
        verified_purchase: review.verified_purchase,
        helpful_count: review.helpful_count,
        review_date: review.review_date,
        source: 'manual',
        images: review.images,
        metadata: {
          imported_at: new Date().toISOString()
        }
      }));

      const { data, error } = await supabase
        .from('imported_reviews')
        .insert(reviewsToInsert)
        .select();

      if (error) throw error;

      toast.success(`${data.length} avis importés avec succès`);
      setParsedReviews([]);
      setJsonInput('');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Erreur lors de l\'import');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Importer des avis
          </DialogTitle>
          <DialogDescription>
            Importez des avis clients depuis un fichier CSV/JSON ou ajoutez-les manuellement
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="csv" className="flex items-center gap-1">
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              JSON
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              Manuel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p>Déposez le fichier ici...</p>
              ) : (
                <div>
                  <p className="font-medium">Glissez-déposez un fichier CSV ici</p>
                  <p className="text-sm text-muted-foreground mt-1">ou cliquez pour sélectionner</p>
                </div>
              )}
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">Format CSV attendu :</p>
              <code className="text-xs">customer_name,rating,title,comment,verified_purchase</code>
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <div>
              <Label>Données JSON</Label>
              <Textarea
                placeholder='[{"customer_name": "Jean", "rating": 5, "title": "Super!", "comment": "Très bon produit"}]'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={8}
                className="font-mono text-xs"
              />
            </div>
            <Button onClick={handleParseJSON} variant="outline" className="w-full">
              Analyser le JSON
            </Button>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom du client</Label>
                <Input
                  placeholder="Jean D."
                  value={manualReview.customer_name}
                  onChange={(e) => setManualReview(prev => ({ ...prev, customer_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Note (1-5)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={manualReview.rating}
                  onChange={(e) => setManualReview(prev => ({ ...prev, rating: parseInt(e.target.value) || 5 }))}
                />
              </div>
            </div>
            <div>
              <Label>Titre</Label>
              <Input
                placeholder="Excellent produit !"
                value={manualReview.title}
                onChange={(e) => setManualReview(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label>Commentaire</Label>
              <Textarea
                placeholder="J'ai adoré ce produit..."
                value={manualReview.comment}
                onChange={(e) => setManualReview(prev => ({ ...prev, comment: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="verified"
                checked={manualReview.verified_purchase}
                onChange={(e) => setManualReview(prev => ({ ...prev, verified_purchase: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="verified">Achat vérifié</Label>
            </div>
            <Button onClick={handleAddManualReview} variant="outline" className="w-full">
              Ajouter à la liste
            </Button>
          </TabsContent>
        </Tabs>

        {/* Parsed reviews preview */}
        {parsedReviews.length > 0 && (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {parsedReviews.length} avis prêts à importer
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setParsedReviews([])}
              >
                Effacer
              </Button>
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-2">
              {parsedReviews.slice(0, 5).map((review, i) => (
                <div key={i} className="bg-muted/50 p-2 rounded text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{review.customer_name}</span>
                    <span className="text-yellow-500">{'★'.repeat(Math.round(review.rating))}</span>
                    {review.verified_purchase && (
                      <span className="text-xs bg-green-100 text-green-700 px-1 rounded">Vérifié</span>
                    )}
                  </div>
                  {review.title && <p className="font-medium">{review.title}</p>}
                  <p className="text-muted-foreground line-clamp-2">{review.comment}</p>
                </div>
              ))}
              {parsedReviews.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  + {parsedReviews.length - 5} autres avis...
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Annuler
          </Button>
          <Button
            onClick={handleImportReviews}
            disabled={parsedReviews.length === 0 || isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importer {parsedReviews.length} avis
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
