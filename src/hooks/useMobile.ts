import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface MobileApp {
  platform: 'ios' | 'android';
  version: string;
  downloads: number;
  rating: number;
  reviews: number;
  last_update: string;
  features: string[];
  download_url: string;
}

export interface BrowserExtension {
  browser: 'chrome' | 'firefox' | 'safari' | 'edge';
  version: string;
  installs: number;
  rating: number;
  reviews: number;
  active_users: number;
  last_update: string;
  store_url: string;
}

export interface MobileFeature {
  id: string;
  name: string;
  description: string;
  status: 'available' | 'development' | 'planned';
  icon: string;
  release_date?: string;
}

export const useMobile = () => {
  const [mobileApps] = useState<MobileApp[]>([
    {
      platform: 'ios',
      version: '2.1.4',
      downloads: 28547,
      rating: 4.8,
      reviews: 1235,
      last_update: '2024-01-15',
      features: ['Dashboard mobile', 'Import rapide', 'Notifications push', 'Mode hors-ligne'],
      download_url: 'https://apps.apple.com/app/shopopti-pro'
    },
    {
      platform: 'android',
      version: '2.1.3',
      downloads: 35210,
      rating: 4.7,
      reviews: 1456,
      last_update: '2024-01-12',
      features: ['Dashboard mobile', 'Import rapide', 'Notifications push', 'Widget Android'],
      download_url: 'https://play.google.com/store/apps/details?id=com.shopopti.pro'
    }
  ]);

  const [extensions] = useState<BrowserExtension[]>([
    {
      browser: 'chrome',
      version: '1.8.2',
      installs: 12547,
      rating: 4.9,
      reviews: 567,
      active_users: 8432,
      last_update: '2024-01-14',
      store_url: 'https://chrome.google.com/webstore/detail/shopopti-importer'
    },
    {
      browser: 'firefox',
      version: '1.8.1',
      installs: 3241,
      rating: 4.7,
      reviews: 89,
      active_users: 2156,
      last_update: '2024-01-10',
      store_url: 'https://addons.mozilla.org/firefox/addon/shopopti-importer'
    },
    {
      browser: 'safari',
      version: '1.7.5',
      installs: 1892,
      rating: 4.6,
      reviews: 45,
      active_users: 1234,
      last_update: '2024-01-08',
      store_url: 'https://apps.apple.com/app/shopopti-safari-extension'
    }
  ]);

  const [features] = useState<MobileFeature[]>([
    {
      id: '1',
      name: 'Scanner QR Produits',
      description: 'Scannez des QR codes pour ajouter des produits',
      status: 'available',
      icon: '📷',
      release_date: '2024-01-01'
    },
    {
      id: '2',
      name: 'Mode Hors-ligne',
      description: 'Synchronisation automatique quand la connexion revient',
      status: 'development',
      icon: '📱',
      release_date: '2024-03-01'
    },
    {
      id: '3',
      name: 'Widget iOS/Android',
      description: 'Widget dashboard sur l\'écran d\'accueil',
      status: 'planned',
      icon: '📊',
      release_date: '2024-06-01'
    },
    {
      id: '4',
      name: 'Import Photo',
      description: 'Importez des produits en prenant une photo',
      status: 'development',
      icon: '📸',
      release_date: '2024-04-01'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const downloadApp = (platform: 'ios' | 'android') => {
    const app = mobileApps.find(a => a.platform === platform);
    if (!app) return;

    // In a real app, this would open the app store
    window.open(app.download_url, '_blank');
    
    toast({
      title: "Redirection App Store",
      description: `Ouverture de l'${platform === 'ios' ? 'App Store' : 'Google Play Store'}`,
    });
  };

  const installExtension = (browser: BrowserExtension['browser']) => {
    const extension = extensions.find(e => e.browser === browser);
    if (!extension) return;

    window.open(extension.store_url, '_blank');
    
    toast({
      title: "Installation Extension",
      description: `Ouverture du store ${browser}`,
    });
  };

  const generateQRCode = () => {
    // In a real app, this would generate a QR code for app download
    toast({
      title: "QR Code généré",
      description: "QR Code pour télécharger l'application mobile",
    });
  };

  const requestFeature = (featureDescription: string) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Demande envoyée",
        description: "Votre demande de fonctionnalité a été transmise à l'équipe",
      });
    }, 1000);
  };

  const reportBug = (bugReport: {
    title: string;
    description: string;
    platform: string;
    version: string;
  }) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Bug signalé",
        description: "Merci pour votre rapport, nous allons examiner le problème",
      });
    }, 1000);
  };

  const getAppStats = () => {
    const totalDownloads = mobileApps.reduce((sum, app) => sum + app.downloads, 0);
    const avgRating = mobileApps.reduce((sum, app) => sum + app.rating, 0) / mobileApps.length;
    const totalExtensionInstalls = extensions.reduce((sum, ext) => sum + ext.installs, 0);
    const activeExtensionUsers = extensions.reduce((sum, ext) => sum + ext.active_users, 0);

    return {
      totalDownloads,
      avgRating: Math.round(avgRating * 10) / 10,
      totalExtensionInstalls,
      activeExtensionUsers,
      availableFeatures: features.filter(f => f.status === 'available').length,
      developmentFeatures: features.filter(f => f.status === 'development').length
    };
  };

  const checkForUpdates = async (platform: 'mobile' | 'extension', identifier: string) => {
    setLoading(true);
    
    try {
      // Simulate update check
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const hasUpdate = Math.random() > 0.7; // 30% chance of update
      
      if (hasUpdate) {
        toast({
          title: "Mise à jour disponible",
          description: "Une nouvelle version est disponible",
        });
      } else {
        toast({
          title: "Pas de mise à jour",
          description: "Vous utilisez la dernière version",
        });
      }
      
      return hasUpdate;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de vérifier les mises à jour",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = (platform: string, deviceToken: string) => {
    toast({
      title: "Notifications activées",
      description: "Vous recevrez des notifications sur cet appareil",
    });
  };

  const unsubscribeFromNotifications = (platform: string, deviceToken: string) => {
    toast({
      title: "Notifications désactivées",
      description: "Vous ne recevrez plus de notifications sur cet appareil",
    });
  };

  return {
    mobileApps,
    extensions,
    features,
    loading,
    stats: getAppStats(),
    downloadApp,
    installExtension,
    generateQRCode,
    requestFeature,
    reportBug,
    checkForUpdates,
    subscribeToNotifications,
    unsubscribeFromNotifications
  };
};