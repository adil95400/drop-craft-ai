/**
 * Service d'automatisation des promotions — API V1
 */
import { promotionsApi } from '@/services/api/client'
import type { PromotionCampaign, PromotionAutomationRule, PromotionPerformance } from '@/types/marketplace-promotions'

export class PromotionService {
  async createCampaign(campaign: Partial<PromotionCampaign>): Promise<PromotionCampaign> {
    return promotionsApi.createCampaign(campaign)
  }

  async listCampaigns(userId: string, status?: string): Promise<PromotionCampaign[]> {
    const resp = await promotionsApi.listCampaigns(status)
    return resp.items as PromotionCampaign[]
  }

  async updateCampaign(id: string, updates: Partial<PromotionCampaign>): Promise<PromotionCampaign> {
    return promotionsApi.updateCampaign(id, updates)
  }

  async deleteCampaign(id: string): Promise<void> {
    await promotionsApi.deleteCampaign(id)
  }

  async createAutomationRule(rule: Partial<PromotionAutomationRule>): Promise<PromotionAutomationRule> {
    return promotionsApi.createRule(rule)
  }

  async listAutomationRules(userId: string): Promise<PromotionAutomationRule[]> {
    const resp = await promotionsApi.listRules()
    return resp.items as PromotionAutomationRule[]
  }

  async toggleRule(ruleId: string, isActive: boolean): Promise<void> {
    await promotionsApi.toggleRule(ruleId, isActive)
  }

  async deleteRule(ruleId: string): Promise<void> {
    await promotionsApi.deleteRule(ruleId)
  }

  async getCampaignPerformance(campaignId: string): Promise<PromotionPerformance[]> {
    // Performance data comes from campaigns themselves in V1
    return []
  }

  async getStats(userId: string): Promise<{
    active_campaigns: number
    automation_rules: number
    scheduled_campaigns: number
    revenue_this_month: number
  }> {
    return promotionsApi.stats()
  }
}

export const promotionService = new PromotionService()
