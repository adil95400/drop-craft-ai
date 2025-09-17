import { supabase } from '@/integrations/supabase/client'

export interface StockAlert {
  id: string
  product_id: string
  product_name: string
  current_stock: number
  minimum_threshold: number
  reorder_point: number
  recommended_order_quantity: number
  supplier_id?: string
  supplier_name?: string
  backup_suppliers: BackupSupplier[]
  urgency: 'low' | 'medium' | 'high' | 'critical'
  auto_reorder_enabled: boolean
  last_reorder_date?: string
  estimated_stockout_date: string
}

export interface BackupSupplier {
  id: string
  name: string
  price: number
  lead_time_days: number
  minimum_order_quantity: number
  reliability_score: number
  last_order_date?: string
}

export interface StockMovement {
  id: string
  product_id: string
  movement_type: 'in' | 'out' | 'adjustment' | 'reserved' | 'returned'
  quantity: number
  reason: string
  reference_order_id?: string
  supplier_id?: string
  created_at: string
  created_by: string
}

export interface AutoReorderRule {
  id: string
  product_id: string
  is_active: boolean
  reorder_point: number
  reorder_quantity: number
  preferred_supplier_id: string
  backup_supplier_ids: string[]
  max_reorder_amount: number
  safety_stock_days: number
  lead_time_days: number
  auto_approve_orders: boolean
}

export class StockManagementService {
  private static instance: StockManagementService

  public static getInstance(): StockManagementService {
    if (!StockManagementService.instance) {
      StockManagementService.instance = new StockManagementService()
    }
    return StockManagementService.instance
  }

  async getStockAlerts(urgencyFilter?: string): Promise<StockAlert[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase.functions.invoke('stock-alerts-analyzer', {
        body: {
          user_id: user.id,
          urgency_filter: urgencyFilter,
          include_backup_suppliers: true,
          calculate_stockout_dates: true
        }
      })

      if (error) throw error
      return data.alerts || []
    } catch (error) {
      console.error('Failed to fetch stock alerts:', error)
      throw error
    }
  }

  async createAutoReorderRule(rule: Omit<AutoReorderRule, 'id'>): Promise<AutoReorderRule> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Using existing automation_rules table for stock rules  
      const { data, error } = await supabase
        .from('automation_rules')
        .insert({
          user_id: user.id,
          name: `Auto-reorder: ${rule.product_id}`,
          rule_type: 'stock_management',
          trigger_conditions: rule as any,
          actions: [] as any,
          is_active: rule.is_active
        })
        .select()
        .single()

      if (error) throw error
      return { id: data.id, ...rule }
    } catch (error) {
      console.error('Failed to create auto reorder rule:', error)
      throw error
    }
  }

  async processStockMovement(movement: Omit<StockMovement, 'id' | 'created_at' | 'created_by'>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase.functions.invoke('stock-movement-processor', {
        body: {
          ...movement,
          user_id: user.id,
          trigger_automation: true,
          update_reorder_points: true
        }
      })

      if (error) throw error
      console.log('Stock movement processed:', data)
    } catch (error) {
      console.error('Stock movement processing failed:', error)
      throw error
    }
  }

  async executeAutoReorder(productId: string, forceReorder: boolean = false): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase.functions.invoke('auto-reorder-executor', {
        body: {
          product_id: productId,
          user_id: user.id,
          force_reorder: forceReorder,
          use_backup_suppliers: true,
          notify_user: true
        }
      })

      if (error) throw error
      console.log('Auto reorder executed:', data)
    } catch (error) {
      console.error('Auto reorder execution failed:', error)
      throw error
    }
  }

  async findBackupSuppliers(productId: string, excludeSupplierIds: string[] = []): Promise<BackupSupplier[]> {
    try {
      const { data, error } = await supabase.functions.invoke('backup-supplier-finder', {
        body: {
          product_id: productId,
          exclude_supplier_ids: excludeSupplierIds,
          max_results: 5,
          sort_by: 'reliability_score',
          include_pricing: true
        }
      })

      if (error) throw error
      return data.backup_suppliers || []
    } catch (error) {
      console.error('Failed to find backup suppliers:', error)
      throw error
    }
  }

  async getStockMovements(productId?: string, days: number = 30): Promise<StockMovement[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Using activity_logs table as fallback for stock movements
      let query = supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

      if (productId) {
        query = query.eq('entity_id', productId)
      }

      const { data, error } = await query.limit(100)

      if (error) throw error
      return (data || []).map((log: any) => ({
        id: log.id,
        product_id: log.entity_id || '',
        movement_type: log.action as 'in' | 'out' | 'adjustment',
        quantity: 1,
        reason: log.description,
        reference_order_id: undefined,
        supplier_id: undefined,
        created_at: log.created_at,
        created_by: log.user_id
      }))
    } catch (error) {
      console.error('Failed to fetch stock movements:', error)
      throw error
    }
  }

  async updateStockLevels(updates: { product_id: string; new_stock: number; reason: string }[]): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase.functions.invoke('bulk-stock-updater', {
        body: {
          updates,
          user_id: user.id,
          trigger_automation: true,
          create_movements: true
        }
      })

      if (error) throw error
      console.log('Stock levels updated:', data)
    } catch (error) {
      console.error('Bulk stock update failed:', error)
      throw error
    }
  }

  async getStockPredictions(productId: string, days: number = 30): Promise<{
    predicted_stockout_date: string
    recommended_reorder_date: string
    predicted_sales_velocity: number
    confidence_score: number
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('stock-predictor', {
        body: {
          product_id: productId,
          prediction_days: days,
          include_seasonality: true,
          include_trends: true
        }
      })

      if (error) throw error
      return data.predictions || {
        predicted_stockout_date: '',
        recommended_reorder_date: '',
        predicted_sales_velocity: 0,
        confidence_score: 0
      }
    } catch (error) {
      console.error('Stock predictions failed:', error)
      throw error
    }
  }

  async getStockDashboardStats(): Promise<{
    total_products: number
    low_stock_products: number
    out_of_stock_products: number
    auto_reorders_active: number
    reorders_this_month: number
    stock_value: number
    top_moving_products: Array<{ name: string; velocity: number }>
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase.functions.invoke('stock-dashboard-stats', {
        body: { user_id: user.id, timeframe: '30d' }
      })

      if (error) throw error
      return data.stats || {
        total_products: 0,
        low_stock_products: 0,
        out_of_stock_products: 0,
        auto_reorders_active: 0,
        reorders_this_month: 0,
        stock_value: 0,
        top_moving_products: []
      }
    } catch (error) {
      console.error('Failed to fetch stock dashboard stats:', error)
      return {
        total_products: 0,
        low_stock_products: 0,
        out_of_stock_products: 0,
        auto_reorders_active: 0,
        reorders_this_month: 0,
        stock_value: 0,
        top_moving_products: []
      }
    }
  }
}

export const stockManagementService = StockManagementService.getInstance()