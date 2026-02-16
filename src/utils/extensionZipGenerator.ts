import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

const EXTENSION_VERSION = '5.9.0';

// Required files that MUST be present for the extension to load in Chrome
const REQUIRED_FILES = [
  'manifest.json',
  'background.js',
  'content-script.js',
  'bulk-import-v5-secure.js',
  'lib/base-extractor.js',
  'lib/platform-detector.js',
  'lib/extractor-bridge.js',
  'lib/feedback-system.js',
  'lib/import-pipeline.js',
  'lib/product-validator.js',
  'extractors/extractor-registry.js',
  'extractors/core-extractor.js',
];

const EXTENSION_FILES = [
  // Core files (required)
  'manifest.json',
  'background.js',
  'popup.html',
  'popup.js',
  'popup.css',
  'options.html',
  'options.js',
  'content-script.js',
  'content.css',
  'auth.html',
  'auth.js',
  
  // Import system (bulk-import-v5-secure.js is REQUIRED)
  'import-overlay-v2.js',
  'bulk-import-v5.js',
  'bulk-import-v5-secure.js',
  'bulk-selector.js',
  'grabber.js',
  
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
  'CHANGELOG.md',
  
  // ==========================================
  // LIBRARY FILES v5.9.0 (Enterprise Gateway + Phase A/B/C + Security + AI)
  // IMPORTANT: Must match manifest.json references
  // ==========================================
  'lib/logger.js',
  'lib/gateway-client.js',
  'lib/action-logger.js',
  'lib/deep-links.js',
  'lib/feature-flags.js',
  'lib/storage-manager.js',
  'lib/secure-dom-builder.js',
  'lib/offline-queue.js',
  'lib/encrypted-storage.js',
  'lib/security.js',
  'lib/onboarding-system.js',
  'lib/ai-predictive-search.js',
  'lib/dynamic-loader.js',
  'lib/advanced-reviews-ui.js',
  'lib/ai-content-service.js',
  'lib/api-client.js',
  'lib/auth.js',
  'lib/auto-order-helper.js',
  'lib/auto-translation-service.js',
  'lib/base-extractor.js',
  'lib/bulk-import-queue.js',
  'lib/bulk-import-state-machine.js',
  'lib/config.js',
  'lib/content-rewriter.js',
  'lib/cost-calculator.js',
  'lib/csv-exporter.js',
  'lib/data-normalizer.js',
  'lib/enhanced-preview.js',
  'lib/extraction-orchestrator.js',
  'lib/extractor-bridge.js',
  'lib/feedback-system.js',
  'lib/history-manager.js',
  'lib/history-panel.js',
  'lib/import-pipeline.js',
  'lib/import-queue.js',
  'lib/libretranslate-client.js',
  'lib/margin-suggestion-engine.js',
  'lib/media-enrichment.js',
  'lib/official-api-client.js',
  'lib/pagination-handler.js',
  'lib/performance-mode.js',
  'lib/platform-detector.js',
  'lib/pre-import-dialog.js',
  'lib/price-rules.js',
  'lib/product-validator.js',
  'lib/quality-scorer.js',
  'lib/quick-import-mode.js',
  'lib/remote-selectors.js',
  'lib/retry-manager.js',
  'lib/review-translator.js',
  'lib/selectors-config.js',
  'lib/session-manager.js',
  'lib/shipping-extractor.js',
  'lib/simplified-popup-ui.js',
  'lib/stock-extractor.js',
  'lib/store-manager.js',
  'lib/supplier-detection-engine.js',
  'lib/supplier-fallback.js',
  'lib/supplier-search.js',
  'lib/tag-generator.js',
  'lib/theme-manager.js',
  'lib/token-refresh.js',
  'lib/tracking-sync.js',
  'lib/ui-enhancements.js',
  'lib/unified-button-injector.js',
  'lib/import-response-handler.js',
  'lib/backend-import-client.js',
  'lib/backend-first-import.js',
  'lib/variant-mapper.js',

  // ==========================================
  // EXTRACTORS v5.9.0 (17+ platforms)
  // ==========================================
  'extractors/core-extractor.js',
  'extractors/extractor-registry.js',
  'extractors/advanced-extractor.js',
  'extractors/aliexpress-extractor.js',
  'extractors/amazon-extractor.js',
  'extractors/banggood-extractor.js',
  'extractors/cdiscount-extractor.js',
  'extractors/cjdropshipping-extractor.js',
  'extractors/dhgate-extractor.js',
  'extractors/ebay-extractor.js',
  'extractors/etsy-extractor.js',
  'extractors/fnac-extractor.js',
  'extractors/homedepot-extractor.js',
  'extractors/rakuten-extractor.js',
  'extractors/shein-extractor.js',
  'extractors/shopify-extractor.js',
  'extractors/temu-extractor.js',
  'extractors/tiktok-extractor.js',
  'extractors/tiktok-reviews-extractor.js',
  'extractors/walmart-extractor.js',
  'extractors/wish-extractor.js',
  
  // Icons
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'icons/icon128.png',
];

export async function generateExtensionZip(): Promise<void> {
  const zip = new JSZip();
  
  // Try multiple base paths for different environments
  // Note: Vite's BASE_URL can differ between preview/published.
  // We include it to avoid fetching from a wrong root.
  const viteBase = (import.meta as any)?.env?.BASE_URL ?? '/';
  const normalizedViteBase = viteBase.endsWith('/') ? viteBase.slice(0, -1) : viteBase;

  const basePaths = [
    `${normalizedViteBase}/chrome-extension`,
    '/chrome-extension',
    './chrome-extension',
    `${window.location.origin}${normalizedViteBase}/chrome-extension`,
    `${window.location.origin}/chrome-extension`,
  ];
  
  let filesLoaded = 0;
  let filesFailed = 0;
  const failedFiles: string[] = [];

  // If any of these are missing, the extension will NOT load in Chrome.
  // Use the REQUIRED_FILES constant defined at the top of the file.
  const requiredFiles = new Set<string>(REQUIRED_FILES);
  
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
      failedFiles.push(filePath);
    }
  }
  
  // Hard fail if required files are missing (prevents producing a broken ZIP)
  const missingRequired = [...requiredFiles].filter((f) => failedFiles.includes(f));
  if (missingRequired.length > 0) {
    const details = missingRequired.slice(0, 12).join(', ');
    toast.error(
      `Téléchargement annulé: fichiers requis introuvables (${missingRequired.length}). Ouvrez la console pour le détail.`
    );
    console.error('Extension ZIP generation aborted. Missing required files:', missingRequired);
    console.error('All failed files:', failedFiles);
    throw new Error(`Missing required extension files: ${details}`);
  }

  // Safety net: if *almost nothing* was fetched, likely wrong base path.
  if (filesLoaded < 10) {
    toast.error(
      "Erreur: impossible d'accéder aux fichiers /chrome-extension (base path incorrect ou assets non déployés)."
    );
    console.error('Not enough extension files could be loaded. Failed files:', failedFiles);
    throw new Error('Not enough extension files could be loaded');
  }
  
  console.log(`Loaded ${filesLoaded}/${EXTENSION_FILES.length} files (${filesFailed} failed)`);
  if (filesFailed > 0) {
    console.warn('Some optional extension files could not be loaded:', failedFiles);
  }

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
