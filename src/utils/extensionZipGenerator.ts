import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
  const basePath = '/chrome-extension';
  
  // Fetch all extension files
  const filePromises = EXTENSION_FILES.map(async (filePath) => {
    try {
      const response = await fetch(`${basePath}/${filePath}`);
      if (!response.ok) {
        console.warn(`Could not fetch ${filePath}:`, response.status);
        return null;
      }
      
      // Determine if binary or text
      const isBinary = filePath.endsWith('.png') || filePath.endsWith('.ico');
      
      if (isBinary) {
        const blob = await response.blob();
        return { path: filePath, content: blob, binary: true };
      } else {
        const text = await response.text();
        return { path: filePath, content: text, binary: false };
      }
    } catch (error) {
      console.warn(`Error fetching ${filePath}:`, error);
      return null;
    }
  });

  const files = await Promise.all(filePromises);
  
  // Add files to ZIP
  files.forEach((file) => {
    if (file) {
      if (file.binary) {
        zip.file(file.path, file.content as Blob);
      } else {
        zip.file(file.path, file.content as string);
      }
    }
  });

  // Also add README
  const readmeContent = `# ShopOpti Chrome Extension

## Installation

1. Téléchargez et décompressez ce fichier ZIP
2. Ouvrez Chrome et allez à chrome://extensions
3. Activez le "Mode développeur" en haut à droite
4. Cliquez sur "Charger l'extension non empaquetée"
5. Sélectionnez le dossier décompressé

## Fonctionnalités

- Import 1-clic depuis AliExpress, Amazon, eBay
- Détection automatique des prix et informations produit
- Synchronisation automatique avec ShopOpti
- Import d'avis depuis Trustpilot, Google, Amazon
- Surveillance des prix et alertes

## Support

Pour toute question, contactez support@shopopti.com
`;
  zip.file('README.txt', readmeContent);

  // Generate ZIP and trigger download
  const content = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });
  
  saveAs(content, 'shopopti-chrome-extension.zip');
}
