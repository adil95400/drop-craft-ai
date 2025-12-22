import { supabase } from '@/integrations/supabase/client';

export interface SmartInventory {
  id: string;
  user_id: string;
  product_id: string;
  current_stock: number;
  optimal_stock: number;
  minimum_threshold: number;
  maximum_threshold: number;
  reorder_point: number;
  reorder_quantity: number;
  demand_forecast: any;
  seasonality_data: any;
  supplier_performance: any;
  cost_optimization: any;
  stock_risk_level: string;
  auto_reorder_enabled: boolean;
  last_reorder_at?: string;
  next_reorder_prediction?: string;
  performance_metrics: any;
  created_at: string;
  updated_at: string;
}

export interface InventoryAnalysis {
  success: boolean;
  currentStock: number;
  optimalLevels: any;
  demandForecast: any;
  recommendations: any;
  riskAssessment: {
    stockoutRisk: string;
    overstockRisk: string;
    overall: string;
  };
  nextActions: any[];
  inventoryId: string;
}

export class SmartInventoryService {
  
  static async getAllInventory(): Promise<SmartInventory[]> {
    const { data, error } = await (supabase as any)
      .from('smart_inventory')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as SmartInventory[];
  }

  static async analyzeProduct(productId: string, analysisType: string = 'full'): Promise<InventoryAnalysis> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('smart-inventory-manager', {
      body: {
        productId,
        analysisType,
        userId: currentUser.user.id
      }
    });

    if (error) throw error;
    return data;
  }

  static async updateInventoryLevels(inventoryId: string, updates: Partial<SmartInventory>): Promise<SmartInventory> {
    const { data, error } = await (supabase as any)
      .from('smart_inventory')
      .update(updates)
      .eq('id', inventoryId)
      .select()
      .single();

    if (error) throw error;
    return data as SmartInventory;
  }

  static async enableAutoReorder(inventoryId: string, enabled: boolean): Promise<SmartInventory> {
    return this.updateInventoryLevels(inventoryId, { auto_reorder_enabled: enabled });
  }

  static async getHighRiskItems(): Promise<SmartInventory[]> {
    const { data, error } = await (supabase as any)
      .from('smart_inventory')
      .select('*')
      .in('stock_risk_level', ['high', 'critical'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as SmartInventory[];
  }

  static async getReorderRecommendations(): Promise<SmartInventory[]> {
    const { data, error } = await (supabase as any)
      .from('smart_inventory')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as SmartInventory[];
  }

  static async bulkAnalyzeInventory(productIds: string[]): Promise<InventoryAnalysis[]> {
    const results = [];
    
    for (const productId of productIds) {
      try {
        const analysis = await this.analyzeProduct(productId);
        results.push(analysis);
        
        // Pause courte entre les analyses
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error analyzing inventory for product ${productId}:`, error);
        results.push({
          success: false,
          error: error.message,
          productId
        } as any);
      }
    }
    
    return results;
  }

  static async getInventoryMetrics(): Promise<any> {
    const { data: inventory, error } = await (supabase as any)
      .from('smart_inventory')
      .select('*');

    if (error) throw error;

    if (!inventory || inventory.length === 0) {
      return {
        totalProducts: 0,
        criticalRisk: 0,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        autoReorderEnabled: 0,
        averageStockLevel: 0
      };
    }

    const criticalRisk = inventory.filter((i: any) => i.stock_risk_level === 'critical').length;
    const highRisk = inventory.filter((i: any) => i.stock_risk_level === 'high').length;
    const mediumRisk = inventory.filter((i: any) => i.stock_risk_level === 'medium').length;
    const lowRisk = inventory.filter((i: any) => i.stock_risk_level === 'low').length;
    const autoReorderEnabled = inventory.filter((i: any) => i.auto_reorder_enabled).length;
    const averageStockLevel = inventory.reduce((sum: number, i: any) => sum + (i.current_stock || 0), 0) / inventory.length;

    return {
      totalProducts: inventory.length,
      criticalRisk,
      highRisk,
      mediumRisk,
      lowRisk,
      autoReorderEnabled,
      averageStockLevel: Math.round(averageStockLevel)
    };
  }

  static async simulateReorder(inventoryId: string): Promise<any> {
    const { data: inventory, error } = await (supabase as any)
      .from('smart_inventory')
      .select('*')
      .eq('id', inventoryId)
      .single();

    if (error || !inventory) throw new Error('Inventory not found');

    // Simuler une commande de réapprovisionnement
    const orderData = {
      productId: inventory.product_id,
      quantity: inventory.reorder_quantity || 10,
      estimatedCost: (inventory.reorder_quantity || 10) * (
        (inventory.cost_optimization as any)?.unitCost || 10
      ),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      supplier: 'Fournisseur principal'
    };

    return orderData;
  }

  static async updateStockLevel(productId: string, newStock: number): Promise<void> {
    const { error } = await supabase
      .from('smart_inventory')
      .update({ 
        current_stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('product_id', productId);

    if (error) throw error;

    // Mettre à jour également le stock dans la table des produits
    await supabase
      .from('imported_products')
      .update({ stock_quantity: newStock })
      .eq('id', productId);
  }

  static async getPredictiveInsights(): Promise<any> {
    const { data: inventory, error } = await supabase
      .from('smart_inventory')
      .select('*')
      .order('next_reorder_prediction', { ascending: true })
      .limit(10);

    if (error) throw error;

    const upcomingReorders = inventory?.filter(i => 
      i.next_reorder_prediction && 
      new Date(i.next_reorder_prediction) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    ) || [];

    return {
      upcomingReorders: upcomingReorders.length,
      next7Days: upcomingReorders.filter(i => 
        new Date(i.next_reorder_prediction!) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ).length,
      criticalActions: inventory?.filter(i => i.stock_risk_level === 'critical').length || 0,
      recommendations: [
        'Vérifier les prédictions de demande',
        'Optimiser les niveaux de sécurité',
        'Évaluer les performances fournisseur'
      ]
    };
  }

  // Méthodes utilitaires pour les calculs d'inventaire
  static calculateOptimalStock(
    averageDemand: number,
    leadTime: number,
    safetyFactor: number = 1.5
  ): number {
    const leadTimeDemand = averageDemand * leadTime;
    const safetyStock = leadTimeDemand * safetyFactor;
    return Math.ceil(leadTimeDemand + safetyStock);
  }

  static calculateReorderPoint(
    averageDemand: number,
    leadTime: number,
    safetyStock: number
  ): number {
    return Math.ceil((averageDemand * leadTime) + safetyStock);
  }

  static calculateEOQ(
    annualDemand: number,
    orderCost: number,
    holdingCostPerUnit: number
  ): number {
    if (holdingCostPerUnit <= 0) return annualDemand / 12; // Fallback mensuel
    return Math.ceil(Math.sqrt((2 * annualDemand * orderCost) / holdingCostPerUnit));
  }
}