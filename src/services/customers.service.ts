/**
 * CustomersService — Pure API V1 delegate
 * All methods proxy to customersApi. No direct Supabase queries.
 */
import { customersApi } from '@/services/api/client'

export class CustomersService {
  static async getCustomers(_userId: string) {
    const resp = await customersApi.list({ per_page: 100 })
    return resp.items ?? []
  }

  static async getCustomer(id: string, _userId: string) {
    return customersApi.get(id)
  }

  static async createCustomer(customer: any) {
    return customersApi.create(customer)
  }

  static async updateCustomer(id: string, _userId: string, updates: any) {
    return customersApi.update(id, updates)
  }

  static async deleteCustomer(id: string, _userId: string) {
    await customersApi.delete(id)
  }

  static async searchCustomers(_userId: string, searchTerm: string) {
    const resp = await customersApi.list({ q: searchTerm, per_page: 100 })
    return resp.items ?? []
  }

  static async getCustomerStats(_userId: string) {
    return customersApi.stats()
  }

  static async getCustomerOrders(customerId: string, _userId: string) {
    // Embedded in customer detail
    const customer = await customersApi.get(customerId)
    return customer.orders ?? []
  }

  static async segmentCustomers(userId: string) {
    const customers = await this.getCustomers(userId)
    return {
      vip: customers.filter((c: any) => (c.total_spent || 0) > 1000),
      regular: customers.filter((c: any) => (c.total_spent || 0) >= 100 && (c.total_spent || 0) <= 1000),
      new: customers.filter((c: any) => (c.total_orders || 0) < 2),
      inactive: customers.filter((c: any) => (c.total_orders || 0) === 0),
    }
  }

  static async updateCustomerStats(customerId: string, userId: string) {
    // Stats update is now server-side via triggers
    return this.getCustomer(customerId, userId)
  }
}
