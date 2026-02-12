/**
 * OrdersService — Pure API V1 delegate
 * All methods proxy to ordersApi. No direct Supabase queries.
 */
import { ordersApi } from '@/services/api/client'

export class OrdersService {
  static async getOrders(_userId: string) {
    const resp = await ordersApi.list({ per_page: 100 })
    return resp.items ?? []
  }

  static async getOrder(id: string, _userId: string) {
    return ordersApi.get(id)
  }

  static async createOrder(_userId: string, orderData: any, items?: any[]) {
    return ordersApi.create({ ...orderData, items })
  }

  static async updateOrder(id: string, _userId: string, updates: any) {
    return ordersApi.update(id, updates)
  }

  static async updateOrderStatus(id: string, userId: string, status: string) {
    return this.updateOrder(id, userId, { status })
  }

  static async updateFulfillment(id: string, userId: string, data: {
    fulfillment_status?: string
    tracking_number?: string
    tracking_url?: string
    carrier?: string
    supplier_order_id?: string
  }) {
    return this.updateOrder(id, userId, data)
  }

  static async deleteOrder(id: string, _userId: string) {
    await ordersApi.delete(id)
  }

  static async getOrderStats(_userId: string) {
    return ordersApi.stats()
  }

  static async searchOrders(_userId: string, searchTerm: string) {
    const resp = await ordersApi.list({ q: searchTerm, per_page: 100 })
    return resp.items ?? []
  }

  static async filterByStatus(_userId: string, status: string) {
    const resp = await ordersApi.list({ status, per_page: 100 })
    return resp.items ?? []
  }

  static async getOrdersByPeriod(_userId: string, _startDate: Date, _endDate: Date) {
    // TODO: Add date range params to API
    const resp = await ordersApi.list({ per_page: 100 })
    return resp.items ?? []
  }
}
