import { describe, it, expect } from 'vitest'
import { FileParserService, ProductImportSchema } from '../fileParserService'

describe('FileParserService', () => {
  describe('parseCSV', () => {
    it('parses valid CSV with default delimiter', async () => {
      const csv = `name,price,stock
Widget A,19.99,100
Widget B,29.99,50`
      const result = await FileParserService.parseCSV(csv)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].name).toBe('Widget A')
      expect(result.data[0].price).toBe(19.99)
      expect(result.errors).toHaveLength(0)
    })

    it('parses CSV with semicolon delimiter', async () => {
      const csv = `name;price;stock
Produit A;15.50;20`
      const result = await FileParserService.parseCSV(csv, ';')
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Produit A')
      expect(result.data[0].price).toBe(15.5)
    })

    it('handles skipRows parameter', async () => {
      const csv = `name,price,stock
Item 1,10,5
Item 2,20,10
Item 3,30,15`
      const result = await FileParserService.parseCSV(csv, ',', 2)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].name).toBe('Item 2')
    })

    it('throws on empty CSV', async () => {
      await expect(FileParserService.parseCSV('')).rejects.toThrow()
    })

    it('throws on header-only CSV', async () => {
      await expect(FileParserService.parseCSV('name,price')).rejects.toThrow()
    })
  })

  describe('parseJSON', () => {
    it('parses array of products', async () => {
      const json = JSON.stringify([
        { name: 'Product 1', price: 10 },
        { name: 'Product 2', price: 20 }
      ])
      const result = await FileParserService.parseJSON(json)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].name).toBe('Product 1')
    })

    it('parses single product object', async () => {
      const json = JSON.stringify({ name: 'Solo', price: 5 })
      const result = await FileParserService.parseJSON(json)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Solo')
    })

    it('throws on invalid JSON', async () => {
      await expect(FileParserService.parseJSON('not json')).rejects.toThrow()
    })
  })

  describe('ProductImportSchema', () => {
    it('validates a correct product', () => {
      const result = ProductImportSchema.safeParse({
        name: 'Test Product',
        price: 9.99,
        sku: 'SKU-001'
      })
      expect(result.success).toBe(true)
    })

    it('rejects product without name', () => {
      const result = ProductImportSchema.safeParse({
        name: '',
        price: 10
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative price', () => {
      const result = ProductImportSchema.safeParse({
        name: 'Test',
        price: -5
      })
      expect(result.success).toBe(false)
    })
  })
})
