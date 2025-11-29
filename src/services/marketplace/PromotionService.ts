/**
 * Service d'automatisation des promotions
 */

import { supabase } from '@/integrations/supabase/client'
import type { PromotionCampaign, PromotionAutomationRule, PromotionPerformance } from '@/types/marketplace-promotions'

export class PromotionService {
  /**
   * Crée une campagne promotionnelle
   */
  async createCampaign(campaign: Partial<PromotionCampaign>): Promise<PromotionCampaign> {
    const { data, error } = await supabase
      .from('promotion_campaigns' as any)
      .insert(campaign as any)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  }

  /**
   * Liste les campagnes
   */
  async listCampaigns(userId: string, status?: string): Promise<PromotionCampaign[]> {
    let query = supabase
      .from('promotion_campaigns' as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return (data || []) as any
  }

  /**
   * Met à jour une campagne
   */
  async updateCampaign(id: string, updates: Partial<PromotionCampaign>): Promise<PromotionCampaign> {
    const { data, error } = await supabase
      .from('promotion_campaigns' as any)
      .update(updates as any)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  }

  /**
   * Supprime une campagne
   */
  async deleteCampaign(id: string): Promise<void> {
    const { error } = await supabase
      .from('promotion_campaigns' as any)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  /**
   * Crée une règle d'automatisation
   */
  async createAutomationRule(rule: Partial<PromotionAutomationRule>): Promise<PromotionAutomationRule> {
    const { data, error } = await supabase
      .from('promotion_automation_rules' as any)
      .insert(rule as any)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  }

  /**
   * Liste les règles d'automatisation
   */
  async listAutomationRules(userId: string): Promise<PromotionAutomationRule[]> {
    const { data, error } = await supabase
      .from('promotion_automation_rules' as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []) as any
  }

  /**
   * Toggle règle active/inactive
   */
  async toggleRule(ruleId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('promotion_automation_rules' as any)
      .update({ is_active: isActive })
      .eq('id', ruleId)
    
    if (error) throw error
  }

  /**
   * Supprime une règle
   */
  async deleteRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('promotion_automation_rules' as any)
      .delete()
      .eq('id', ruleId)
    
    if (error) throw error
  }

  /**
   * Récupère les performances d'une campagne
   */
  async getCampaignPerformance(campaignId: string): Promise<PromotionPerformance[]> {
    const { data, error } = await supabase
      .from('promotion_performance' as any)
      .select('*')
      .eq('campaign_id', campaignId)
      .order('date', { ascending: false })
    
    if (error) throw error
    return (data || []) as any
  }

  /**
   * Récupère les stats globales
   */
  async getStats(userId: string): Promise<{
    active_campaigns: number
    automation_rules: number
    scheduled_campaigns: number
    revenue_this_month: number
  }> {
    const campaigns = await this.listCampaigns(userId)
    const rules = await this.listAutomationRules(userId)
    
    return {
      active_campaigns: campaigns.filter(c => c.status === 'active').length,
      automation_rules: rules.filter(r => r.is_active).length,
      scheduled_campaigns: campaigns.filter(c => c.status === 'scheduled').length,
      revenue_this_month: campaigns.reduce((sum, c) => sum + (c.revenue_generated || 0), 0)
    }
  }
}

export const promotionService = new PromotionService()
