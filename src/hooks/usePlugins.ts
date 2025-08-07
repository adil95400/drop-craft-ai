import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Plugin {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  author: string;
  price: string;
  rating: number;
  reviews: number;
  downloads: number;
  active?: boolean;
  premium: boolean;
  featured: boolean;
  images: string[];
  changelog: string[];
  requirements: string[];
  installed_at?: string;
}

export interface PluginCategory {
  name: string;
  count: number;
  icon: string;
  description: string;
}

export const usePlugins = () => {
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([
    {
      id: '1',
      name: 'Shopify Sync Pro',
      description: 'Synchronisation avancée avec Shopify',
      category: 'E-commerce',
      version: '2.1.4',
      author: 'Shopopti Team',
      price: '€29/mois',
      rating: 4.8,
      reviews: 234,
      downloads: 5420,
      active: true,
      premium: true,
      featured: true,
      images: [],
      changelog: ['Correction de bugs', 'Amélioration des performances'],
      requirements: ['Shopify store', 'Plan Pro ou Enterprise'],
      installed_at: '2024-01-15'
    },
    {
      id: '2',
      name: 'Email Marketing AI',
      description: 'Automatisation email avec IA',
      category: 'Marketing',
      version: '1.5.2',
      author: 'AI Marketing Inc',
      price: 'Gratuit',
      rating: 4.6,
      reviews: 189,
      downloads: 3210,
      active: true,
      premium: false,
      featured: false,
      images: [],
      changelog: ['Nouvelles templates', 'Amélioration IA'],
      requirements: ['Plan Starter ou supérieur'],
      installed_at: '2024-01-10'
    }
  ]);

  const [availablePlugins, setAvailablePlugins] = useState<Plugin[]>([
    {
      id: '3',
      name: 'WooCommerce Connect',
      description: 'Intégration complète avec WooCommerce',
      category: 'E-commerce',
      version: '1.3.0',
      author: 'WordPress Team',
      price: '€19/mois',
      rating: 4.9,
      reviews: 512,
      downloads: 8750,
      premium: true,
      featured: true,
      images: [],
      changelog: [],
      requirements: ['WooCommerce store', 'WordPress 5.0+']
    },
    {
      id: '4',
      name: 'SEO Optimizer',
      description: 'Optimisation SEO automatique',
      category: 'SEO',
      version: '2.0.1',
      author: 'SEO Tools Ltd',
      price: 'Gratuit',
      rating: 4.3,
      reviews: 298,
      downloads: 4560,
      premium: false,
      featured: false,
      images: [],
      changelog: [],
      requirements: ['Plan Starter ou supérieur']
    }
  ]);

  const [categories] = useState<PluginCategory[]>([
    { name: 'E-commerce', count: 25, icon: '🛒', description: 'Intégrations plateformes' },
    { name: 'Marketing', count: 18, icon: '📢', description: 'Outils marketing' },
    { name: 'Analytics', count: 12, icon: '📊', description: 'Analyses et rapports' },
    { name: 'SEO', count: 8, icon: '🔍', description: 'Optimisation SEO' },
    { name: 'Automation', count: 15, icon: '🤖', description: 'Automatisation' },
    { name: 'Social Media', count: 10, icon: '📱', description: 'Réseaux sociaux' }
  ]);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const installPlugin = async (pluginId: string) => {
    setLoading(true);
    
    try {
      const plugin = availablePlugins.find(p => p.id === pluginId);
      if (!plugin) throw new Error('Plugin non trouvé');

      // Simulate installation time
      await new Promise(resolve => setTimeout(resolve, 2000));

      const installedPlugin: Plugin = {
        ...plugin,
        active: true,
        installed_at: new Date().toISOString()
      };

      setInstalledPlugins(prev => [installedPlugin, ...prev]);
      setAvailablePlugins(prev => prev.filter(p => p.id !== pluginId));
      
      toast({
        title: "Plugin installé",
        description: `${plugin.name} a été installé avec succès`,
      });

      return installedPlugin;
    } catch (error) {
      toast({
        title: "Erreur d'installation",
        description: "Impossible d'installer le plugin",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const uninstallPlugin = async (pluginId: string) => {
    const plugin = installedPlugins.find(p => p.id === pluginId);
    if (!plugin) return;

    setInstalledPlugins(prev => prev.filter(p => p.id !== pluginId));
    
    const availablePlugin: Plugin = {
      ...plugin,
      active: undefined,
      installed_at: undefined
    };
    
    setAvailablePlugins(prev => [availablePlugin, ...prev]);
    
    toast({
      title: "Plugin désinstallé",
      description: `${plugin.name} a été désinstallé`,
    });
  };

  const togglePlugin = async (pluginId: string) => {
    setInstalledPlugins(prev => 
      prev.map(plugin => 
        plugin.id === pluginId 
          ? { ...plugin, active: !plugin.active }
          : plugin
      )
    );

    const plugin = installedPlugins.find(p => p.id === pluginId);
    const newStatus = !plugin?.active;

    toast({
      title: `Plugin ${newStatus ? 'activé' : 'désactivé'}`,
      description: `${plugin?.name} a été ${newStatus ? 'activé' : 'désactivé'}`,
    });
  };

  const updatePlugin = async (pluginId: string) => {
    setLoading(true);
    
    try {
      // Simulate update
      await new Promise(resolve => setTimeout(resolve, 3000));

      setInstalledPlugins(prev => 
        prev.map(plugin => 
          plugin.id === pluginId 
            ? { 
                ...plugin, 
                version: `${plugin.version.split('.')[0]}.${parseInt(plugin.version.split('.')[1]) + 1}.0`
              }
            : plugin
        )
      );

      const plugin = installedPlugins.find(p => p.id === pluginId);
      
      toast({
        title: "Plugin mis à jour",
        description: `${plugin?.name} a été mis à jour avec succès`,
      });

    } catch (error) {
      toast({
        title: "Erreur de mise à jour",
        description: "Impossible de mettre à jour le plugin",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const configurePlugin = async (pluginId: string, settings: Record<string, any>) => {
    toast({
      title: "Configuration sauvegardée",
      description: "Les paramètres du plugin ont été mis à jour",
    });
  };

  const searchPlugins = (query: string, filters?: { category?: string; price?: string; featured?: boolean }) => {
    let results = [...availablePlugins];

    if (query.trim()) {
      results = results.filter(plugin => 
        plugin.name.toLowerCase().includes(query.toLowerCase()) ||
        plugin.description.toLowerCase().includes(query.toLowerCase()) ||
        plugin.category.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (filters?.category && filters.category !== 'all') {
      results = results.filter(plugin => plugin.category === filters.category);
    }

    if (filters?.price) {
      if (filters.price === 'free') {
        results = results.filter(plugin => plugin.price === 'Gratuit');
      } else if (filters.price === 'premium') {
        results = results.filter(plugin => plugin.premium);
      }
    }

    if (filters?.featured) {
      results = results.filter(plugin => plugin.featured);
    }

    return results.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.rating - a.rating;
    });
  };

  const getPluginStats = () => {
    const totalInstalled = installedPlugins.length;
    const activePlugins = installedPlugins.filter(p => p.active).length;
    const premiumPlugins = installedPlugins.filter(p => p.premium).length;
    const avgRating = installedPlugins.length > 0 
      ? installedPlugins.reduce((sum, p) => sum + p.rating, 0) / installedPlugins.length 
      : 0;

    return {
      totalInstalled,
      activePlugins,
      premiumPlugins,
      avgRating: Math.round(avgRating * 10) / 10
    };
  };

  const exportPluginList = () => {
    const data = installedPlugins.map(plugin => ({
      name: plugin.name,
      version: plugin.version,
      category: plugin.category,
      active: plugin.active,
      installed_at: plugin.installed_at
    }));

    const csvContent = [
      'Name,Version,Category,Active,Installed At',
      ...data.map(row => `"${row.name}","${row.version}","${row.category}","${row.active}","${row.installed_at}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'installed-plugins.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export terminé",
      description: "La liste des plugins a été exportée",
    });
  };

  return {
    installedPlugins,
    availablePlugins,
    categories,
    loading,
    stats: getPluginStats(),
    installPlugin,
    uninstallPlugin,
    togglePlugin,
    updatePlugin,
    configurePlugin,
    searchPlugins,
    exportPluginList
  };
};