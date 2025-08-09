import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductImport {
  id: string;
  import_type: 'csv' | 'url' | 'api' | 'xml' | 'image' | 'extension';
  source_name?: string;
  source_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  products_imported: number;
  products_failed: number;
  total_products: number;
  import_data?: any;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface ImportedProduct {
  id: string;
  import_id: string;
  name: string;
  description?: string;
  price: number;
  cost_price?: number;
  currency: string;
  sku?: string;
  category?: string;
  supplier_name?: string;
  supplier_url?: string;
  image_urls?: string[];
  tags?: string[];
  status: 'draft' | 'published' | 'rejected';
  ai_optimized: boolean;
  optimization_data?: any;
  created_at: string;
}

export const useProductImports = () => {
  const [imports, setImports] = useState<ProductImport[]>([]);
  const [importedProducts, setImportedProducts] = useState<ImportedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les imports
  const fetchImports = async () => {
    try {
      setLoading(true);
      
      // Pour l'instant, utilisons des données mock jusqu'à ce que les tables soient créées
      const mockImports: ProductImport[] = [
        {
          id: '1',
          import_type: 'url',
          source_name: 'AliExpress Smartphone',
          source_url: 'https://aliexpress.com/item/123456',
          status: 'completed',
          products_imported: 1,
          products_failed: 0,
          total_products: 1,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        },
        {
          id: '2', 
          import_type: 'csv',
          source_name: 'Electronics Catalog',
          status: 'processing',
          products_imported: 45,
          products_failed: 2,
          total_products: 50,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          import_type: 'api',
          source_name: 'BigBuy API Sync',
          status: 'completed',
          products_imported: 156,
          products_failed: 8,
          total_products: 164,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          completed_at: new Date(Date.now() - 86000000).toISOString(),
        }
      ];
      
      setImports(mockImports);
      setError(null);
    } catch (err) {
      console.error('Error fetching imports:', err);
      setError('Erreur lors du chargement des imports');
      toast.error('Erreur lors du chargement des imports');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les produits importés
  const fetchImportedProducts = async (importId?: string) => {
    try {
      const mockProducts: ImportedProduct[] = [
        {
          id: '1',
          import_id: '1',
          name: 'Smartphone Gaming Pro Max',
          description: 'Smartphone haute performance pour gaming avec écran 120Hz',
          price: 599.99,
          cost_price: 320.00,
          currency: 'EUR',
          sku: 'SPH-GAMING-001',
          category: 'Électronique',
          supplier_name: 'TechDirect',
          supplier_url: 'https://aliexpress.com/store/123',
          image_urls: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'],
          tags: ['smartphone', 'gaming', 'android'],
          status: 'published',
          ai_optimized: true,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          import_id: '2', 
          name: 'Écouteurs Sans Fil Premium',
          description: 'Écouteurs Bluetooth avec réduction de bruit active',
          price: 149.99,
          cost_price: 75.00,
          currency: 'EUR',
          sku: 'EBT-PREMIUM-001',
          category: 'Audio',
          supplier_name: 'SoundMax',
          image_urls: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
          tags: ['audio', 'bluetooth', 'wireless'],
          status: 'draft',
          ai_optimized: false,
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          import_id: '3',
          name: 'Montre Connectée Sport',
          description: 'Montre intelligente avec GPS et monitoring cardiaque',
          price: 299.99,
          cost_price: 180.00,
          currency: 'EUR',
          sku: 'MCN-SPORT-001',
          category: 'Wearables',
          supplier_name: 'FitTech',
          image_urls: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'],
          tags: ['fitness', 'smartwatch', 'gps'],
          status: 'published',
          ai_optimized: true,
          created_at: new Date().toISOString(),
        }
      ];

      if (importId) {
        setImportedProducts(mockProducts.filter(p => p.import_id === importId));
      } else {
        setImportedProducts(mockProducts);
      }
    } catch (err) {
      console.error('Error fetching imported products:', err);
      toast.error('Erreur lors du chargement des produits');
    }
  };

  // Créer un nouvel import
  const createImport = async (importData: Partial<ProductImport>) => {
    try {
      const newImport: ProductImport = {
        id: Date.now().toString(),
        import_type: importData.import_type || 'url',
        source_name: importData.source_name,
        source_url: importData.source_url,
        status: 'pending',
        products_imported: 0,
        products_failed: 0,
        total_products: 0,
        created_at: new Date().toISOString(),
      };

      setImports(prev => [newImport, ...prev]);
      toast.success('Import créé avec succès');
      return newImport;
    } catch (err) {
      console.error('Error creating import:', err);
      toast.error('Erreur lors de la création de l\'import');
      throw err;
    }
  };

  // Mettre à jour un import
  const updateImport = async (id: string, updates: Partial<ProductImport>) => {
    try {
      setImports(prev => prev.map(imp => 
        imp.id === id ? { ...imp, ...updates } : imp
      ));
      return true;
    } catch (err) {
      console.error('Error updating import:', err);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  };

  // Approuver un produit importé
  const approveProduct = async (productId: string) => {
    try {
      setImportedProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, status: 'published' as const } : p
      ));
      toast.success('Produit approuvé et publié');
    } catch (err) {
      console.error('Error approving product:', err);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  // Rejeter un produit importé
  const rejectProduct = async (productId: string) => {
    try {
      setImportedProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, status: 'rejected' as const } : p
      ));
      toast.success('Produit rejeté');
    } catch (err) {
      console.error('Error rejecting product:', err);
      toast.error('Erreur lors du rejet');
    }
  };

  // Optimiser avec IA
  const optimizeWithAI = async (productId: string) => {
    try {
      setImportedProducts(prev => prev.map(p => 
        p.id === productId ? { 
          ...p, 
          ai_optimized: true,
          optimization_data: {
            title_optimized: true,
            description_enhanced: true,
            keywords_added: ['trending', 'premium', 'bestseller'],
            price_suggested: p.price * 1.15
          }
        } : p
      ));
      toast.success('Produit optimisé par IA');
    } catch (err) {
      console.error('Error optimizing product:', err);
      toast.error('Erreur lors de l\'optimisation IA');
    }
  };

  useEffect(() => {
    fetchImports();
    fetchImportedProducts();
  }, []);

  return {
    imports,
    importedProducts,
    loading,
    error,
    fetchImports,
    fetchImportedProducts,
    createImport,
    updateImport,
    approveProduct,
    rejectProduct,
    optimizeWithAI,
  };
};