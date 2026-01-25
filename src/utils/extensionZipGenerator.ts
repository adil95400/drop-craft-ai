import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

const EXTENSION_FILES = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'popup.css',
  'background.js',
  'content.js',
  'content.css',
  'injected.js',
  'options.html',
  'options.js',
  'auth.html',
  'auth.js',
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'icons/icon128.png',
  'README.md',
  'PRIVACY_POLICY.md',
  'STORE_LISTING.md'
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
        const isBinary = filePath.endsWith('.png') || filePath.endsWith('.ico');
        
        if (isBinary) {
          const blob = await response.blob();
          zip.file(filePath, blob);
        } else {
          const text = await response.text();
          
          // Validate that we got actual file content, not HTML error page
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            console.warn(`File ${filePath} returned HTML instead of expected content, skipping...`);
            continue;
          }
          
          // For JSON files, validate JSON structure
          if (filePath.endsWith('.json')) {
            try {
              JSON.parse(text);
            } catch (e) {
              console.warn(`File ${filePath} is not valid JSON, skipping...`);
              continue;
            }
          }
          
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
    }
  }
  
  // Check if we got any files
  if (filesLoaded === 0) {
    toast.error('Erreur: Impossible de charger les fichiers de l\'extension');
    throw new Error('No extension files could be loaded');
  }
  
  console.log(`Loaded ${filesLoaded}/${EXTENSION_FILES.length} files`);

  // Add installation README
  const readmeContent = `# ShopOpti Chrome Extension v4.0.0

## Installation

1. Téléchargez et décompressez ce fichier ZIP
2. Ouvrez Chrome et allez à chrome://extensions
3. Activez le "Mode développeur" en haut à droite
4. Cliquez sur "Charger l'extension non empaquetée"
5. Sélectionnez le dossier décompressé

## Fonctionnalités

- Import 1-clic depuis AliExpress, Amazon, eBay, Temu
- Détection automatique des prix et informations produit
- Synchronisation automatique avec ShopOpti
- Import d'avis depuis Trustpilot, Google, Amazon
- Surveillance des prix et alertes

## Configuration

1. Cliquez sur l'icône de l'extension
2. Entrez votre clé API disponible sur shopopti.io/extensions/chrome
3. Configurez vos préférences dans les options

## Support

Pour toute question, contactez support@shopopti.io
`;
  zip.file('README.txt', readmeContent);

  // Generate ZIP and trigger download
  const content = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });
  
  // Use saveAs to download
  saveAs(content, 'shopopti-chrome-extension-v4.zip');
  
  toast.success(`Extension téléchargée (${filesLoaded} fichiers)`);
}
