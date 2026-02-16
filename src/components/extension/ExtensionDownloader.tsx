import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Download, Check, AlertCircle, Chrome, FolderOpen, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const EXTENSION_FILES = [
  // Root files
  'manifest.json',
  'background.js',
  'popup.html',
  'popup.js',
  'popup.css',
  'options.html',
  'options.js',
  'content-script.js',
  'content.css',
  'content.js',
  'import-overlay-v2.js',
  'bulk-import-v5.js',
  'bulk-selector.js',
  'auth.html',
  'auth.js',
  'auto-order.js',
  'automation.js',
  'fulfillment.js',
  'grabber.js',
  'injected.js',
  'multi-store.js',
  'multi-store-manager.js',
  'price-monitor.js',
  'price-optimizer.js',
  'supplier-search.js',
  'supplier-compare.js',
  'reviews-extractor.js',
  'review-translator.js',
  'variants-extractor.js',
  'video-extractor.js',
  'image-optimizer.js',
  'watermark-remover.js',
  'seo-meta-generator.js',
  'ai-content-generator.js',
  'ads-spy.js',
  'trend-analyzer.js',
  'winning-product-detector.js',
  'advanced-scraper.js',
  'debug-panel.js',
  'sidebar.js',
  'sidebar.css',
  'faq.js',
  'support.js',
  'index.html',
  'README.md',
  'PRIVACY_POLICY.md',
  
  // Lib folder
  'lib/api-client.js',
  'lib/auth.js',
  'lib/auto-order-helper.js',
  'lib/config.js',
  'lib/content-rewriter.js',
  'lib/csv-exporter.js',
  'lib/history-manager.js',
  'lib/import-queue.js',
  'lib/libretranslate-client.js',
  'lib/pagination-handler.js',
  'lib/price-rules.js',
  'lib/retry-manager.js',
  'lib/security.js',
  'lib/shipping-extractor.js',
  'lib/stock-extractor.js',
  'lib/store-manager.js',
  'lib/tag-generator.js',
  'lib/tracking-sync.js',
  
  // Extractors folder
  'extractors/advanced-extractor.js',
  'extractors/aliexpress-extractor.js',
  'extractors/amazon-extractor.js',
  'extractors/core-extractor.js',
  'extractors/ebay-extractor.js',
  'extractors/shein-extractor.js',
  'extractors/temu-extractor.js',
  
  // Icons folder
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'icons/icon128.png',
];

const EXTENSION_VERSION = '6.0.0';

export function ExtensionDownloader() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const downloadExtension = async () => {
    setIsDownloading(true);
    setProgress(0);
    setStatus('downloading');
    setErrorMessage('');

    try {
      const zip = new JSZip();
      const baseUrl = '/chrome-extension/';
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < EXTENSION_FILES.length; i++) {
        const file = EXTENSION_FILES[i];
        setProgress(Math.round((i / EXTENSION_FILES.length) * 100));

        try {
          const response = await fetch(`${baseUrl}${file}`);
          
          if (response.ok) {
            // Handle binary files (images)
            if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.ico')) {
              const blob = await response.blob();
              zip.file(file, blob);
            } else {
              const content = await response.text();
              zip.file(file, content);
            }
            successCount++;
          } else {
            console.warn(`File not found: ${file}`);
            errorCount++;
          }
        } catch (err) {
          console.warn(`Error fetching ${file}:`, err);
          errorCount++;
        }
      }

      if (successCount === 0) {
        throw new Error('Aucun fichier n\'a pu être téléchargé');
      }

      setProgress(95);

      // Generate ZIP
      const blob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Download
      saveAs(blob, `shopopti-extension-v${EXTENSION_VERSION}.zip`);

      setProgress(100);
      setStatus('success');
      toast.success(`Extension téléchargée ! ${successCount} fichiers inclus.`);

    } catch (error) {
      console.error('Download error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erreur de téléchargement');
      toast.error('Erreur lors du téléchargement');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Chrome className="h-6 w-6 text-primary" />
          Télécharger l'Extension Chrome
        </CardTitle>
        <CardDescription>
          Version {EXTENSION_VERSION} - Extension complète avec tous les modules
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'downloading' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Téléchargement en cours...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <Check className="h-5 w-5 text-green-500" />
            <span className="text-green-700 dark:text-green-400">
              Téléchargement réussi ! Décompressez le ZIP et chargez-le dans Chrome.
            </span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700 dark:text-red-400">{errorMessage}</span>
          </div>
        )}

        <Button 
          onClick={downloadExtension} 
          disabled={isDownloading}
          className="w-full"
          size="lg"
        >
          {isDownloading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Téléchargement...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Télécharger ShopOpti+ v{EXTENSION_VERSION}
            </>
          )}
        </Button>

        <div className="pt-4 border-t space-y-3">
          <h4 className="font-semibold text-sm">Instructions d'installation :</h4>
          <ol className="text-sm text-muted-foreground space-y-2">
            <li className="flex gap-2">
              <span className="font-bold text-primary">1.</span>
              <span>Décompressez le fichier ZIP téléchargé</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary">2.</span>
              <span>Ouvrez Chrome et allez à <code className="bg-muted px-1 rounded">chrome://extensions</code></span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary">3.</span>
              <span>Activez le <strong>"Mode développeur"</strong> en haut à droite</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary">4.</span>
              <span>Cliquez sur <strong>"Charger l'extension non empaquetée"</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary">5.</span>
              <span>Sélectionnez le dossier décompressé</span>
            </li>
          </ol>
        </div>

        <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <FolderOpen className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <span className="text-sm text-blue-700 dark:text-blue-400">
            <strong>Contenu :</strong> {EXTENSION_FILES.length} fichiers incluant extracteurs, 
            traduction, auto-order, et synchronisation multi-boutiques.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
