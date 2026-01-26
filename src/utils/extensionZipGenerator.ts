import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

const EXTENSION_VERSION = '5.7.0';

const EXTENSION_FILES = [
  // Core files
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
  'auth.html',
  'auth.js',
  
  // Import system
  'import-overlay-v2.js',
  'bulk-import-v5.js',
  'bulk-selector.js',
  'grabber.js',
  'injected.js',
  
  // Automation & fulfillment
  'auto-order.js',
  'automation.js',
  'fulfillment.js',
  
  // Multi-store
  'multi-store.js',
  'multi-store-manager.js',
  
  // Price & monitoring
  'price-monitor.js',
  'price-optimizer.js',
  
  // Suppliers
  'supplier-search.js',
  'supplier-compare.js',
  
  // Reviews & content
  'reviews-extractor.js',
  'review-translator.js',
  'variants-extractor.js',
  'video-extractor.js',
  
  // Image & SEO
  'image-optimizer.js',
  'watermark-remover.js',
  'seo-meta-generator.js',
  'ai-content-generator.js',
  
  // Ads & trends
  'ads-spy.js',
  'trend-analyzer.js',
  'winning-product-detector.js',
  'advanced-scraper.js',
  
  // UI components
  'debug-panel.js',
  'sidebar.js',
  'sidebar.css',
  'faq.js',
  'support.js',
  'index.html',
  
  // Documentation
  'README.md',
  'PRIVACY_POLICY.md',
  
  // Library files
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
  
  // Extractors
  'extractors/advanced-extractor.js',
  'extractors/aliexpress-extractor.js',
  'extractors/amazon-extractor.js',
  'extractors/core-extractor.js',
  'extractors/ebay-extractor.js',
  'extractors/shein-extractor.js',
  'extractors/temu-extractor.js',
  
  // Icons
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'icons/icon128.png',
];

export async function generateExtensionZip(): Promise<void> {
  const zip = new JSZip();
  
  // Try multiple base paths for different environments
  const basePaths = [
    '/chrome-extension',
    './chrome-extension',
    `${window.location.origin}/chrome-extension`
  ];
  
  let filesLoaded = 0;
  let filesFailed = 0;
  
  toast.info(`Préparation de ${EXTENSION_FILES.length} fichiers...`);
  
  // Fetch all extension files
  for (const filePath of EXTENSION_FILES) {
    let fileLoaded = false;
    
    for (const basePath of basePaths) {
      try {
        const fullPath = `${basePath}/${filePath}`;
        const response = await fetch(fullPath, { 
          method: 'GET',
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          continue;
        }
        
        // Determine if binary or text
        const isBinary = filePath.endsWith('.png') || filePath.endsWith('.ico') || filePath.endsWith('.jpg');
        
        if (isBinary) {
          const blob = await response.blob();
          zip.file(filePath, blob);
        } else {
          const text = await response.text();
          zip.file(filePath, text);
        }
        
        filesLoaded++;
        fileLoaded = true;
        break; // File loaded successfully, move to next file
      } catch (error) {
        console.warn(`Error fetching ${filePath} from ${basePath}:`, error);
      }
    }
    
    if (!fileLoaded) {
      console.warn(`Could not load file: ${filePath}`);
      filesFailed++;
    }
  }
  
  // Check if we got enough files
  if (filesLoaded < 10) {
    toast.error('Erreur: Impossible de charger les fichiers de l\'extension');
    throw new Error('Not enough extension files could be loaded');
  }
  
  console.log(`Loaded ${filesLoaded}/${EXTENSION_FILES.length} files (${filesFailed} failed)`);

  // Add installation README
  const readmeContent = `# ShopOpti+ Chrome Extension v${EXTENSION_VERSION}

## Installation

1. Décompressez ce fichier ZIP dans un dossier permanent
2. Ouvrez Chrome et allez à chrome://extensions
3. Activez le "Mode développeur" en haut à droite
4. Cliquez sur "Charger l'extension non empaquetée"
5. Sélectionnez le dossier décompressé

## Fonctionnalités

✅ Import 1-clic depuis 45+ plateformes (Amazon, AliExpress, Temu, Shein, eBay...)
✅ Import en masse avec sélection par checkbox
✅ Extraction haute fidélité (images HD, variantes, vidéos)
✅ Import d'avis avec traduction automatique
✅ Synchronisation multi-boutiques (Shopify, WooCommerce, PrestaShop)
✅ Surveillance des prix et alertes stock
✅ Auto-Order / Fulfillment automatique
✅ Ads Spy TikTok/Facebook/Instagram
✅ Traduction intégrée via LibreTranslate

## Configuration

1. Cliquez sur l'icône ShopOpti+ dans la barre d'outils Chrome
2. Connectez-vous avec vos identifiants ShopOpti
3. Configurez vos boutiques et préférences dans les options

## Support

📧 support@shopopti.io
🌐 https://shopopti.io/support
📖 https://shopopti.io/extensions/documentation
`;
  zip.file('INSTALL.txt', readmeContent);

  // Generate ZIP and trigger download
  const content = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });
  
  // Use saveAs to download
  saveAs(content, `shopopti-extension-v${EXTENSION_VERSION}.zip`);
  
  toast.success(`Extension v${EXTENSION_VERSION} téléchargée (${filesLoaded} fichiers)`);
}
