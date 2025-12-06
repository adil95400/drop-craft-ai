/**
 * Types pour l'import/export CSV Shopify
 * Compatible avec le template Shopify product_template_csv
 */

export interface ShopifyCSVProduct {
  // Identifiants
  Handle: string
  Title: string
  
  // Description
  'Body (HTML)': string
  
  // Organisation
  Vendor: string
  'Product Category': string
  Type: string
  Tags: string
  
  // Publication
  Published: 'TRUE' | 'FALSE'
  'Published On Online Store': 'TRUE' | 'FALSE'
  
  // Options (variantes)
  'Option1 Name': string
  'Option1 Value': string
  'Option2 Name'?: string
  'Option2 Value'?: string
  'Option3 Name'?: string
  'Option3 Value'?: string
  
  // SKU & Inventaire
  'Variant SKU': string
  'Variant Grams': string
  'Variant Inventory Tracker': string
  'Variant Inventory Qty': string
  'Variant Inventory Policy': 'deny' | 'continue'
  'Variant Fulfillment Service': string
  
  // Prix
  'Variant Price': string
  'Variant Compare At Price': string
  'Unit Price'?: string
  'Unit Price Measure'?: string
  'Unit Price Measure Unit'?: string
  
  // Shipping & Taxes
  'Variant Requires Shipping': 'TRUE' | 'FALSE'
  'Variant Taxable': 'TRUE' | 'FALSE'
  'Variant Barcode': string
  'Variant Tax Code'?: string
  'Charge Tax'?: 'TRUE' | 'FALSE'
  
  // Images
  'Image Src': string
  'Image Position': string
  'Image Alt Text': string
  'Variant Image': string
  
  // Poids
  'Variant Weight Unit': 'g' | 'kg' | 'lb' | 'oz'
  
  // SEO
  'SEO Title': string
  'SEO Description': string
  
  // Google Shopping
  'Google Shopping / Google Product Category'?: string
  'Google Shopping / Gender'?: string
  'Google Shopping / Age Group'?: string
  'Google Shopping / MPN'?: string
  'Google Shopping / AdWords Grouping'?: string
  'Google Shopping / AdWords Labels'?: string
  'Google Shopping / Condition'?: string
  'Google Shopping / Custom Product'?: string
  'Google Shopping / Custom Label 0'?: string
  'Google Shopping / Custom Label 1'?: string
  'Google Shopping / Custom Label 2'?: string
  'Google Shopping / Custom Label 3'?: string
  'Google Shopping / Custom Label 4'?: string
  
  // Statut
  Status: 'active' | 'draft' | 'archived'
  
  // Gift Card
  'Gift Card'?: 'TRUE' | 'FALSE'
}

// Mapping des champs ShopOpti vers Shopify CSV
export const SHOPOPTI_TO_SHOPIFY_MAPPING: Record<string, string> = {
  // Product fields
  handle: 'Handle',
  name: 'Title',
  description: 'Body (HTML)',
  vendor: 'Vendor',
  category: 'Product Category',
  product_type: 'Type',
  tags: 'Tags',
  status: 'Status',
  
  // Variant fields
  sku: 'Variant SKU',
  price: 'Variant Price',
  compare_at_price: 'Variant Compare At Price',
  cost_price: 'Cost per item',
  barcode: 'Variant Barcode',
  weight: 'Variant Grams',
  weight_unit: 'Variant Weight Unit',
  stock_quantity: 'Variant Inventory Qty',
  inventory_policy: 'Variant Inventory Policy',
  fulfillment_service: 'Variant Fulfillment Service',
  requires_shipping: 'Variant Requires Shipping',
  taxable: 'Variant Taxable',
  
  // Options
  option1_name: 'Option1 Name',
  option1_value: 'Option1 Value',
  option2_name: 'Option2 Name',
  option2_value: 'Option2 Value',
  option3_name: 'Option3 Name',
  option3_value: 'Option3 Value',
  
  // Images
  image_url: 'Image Src',
  
  // SEO
  seo_title: 'SEO Title',
  seo_description: 'SEO Description',
  
  // Google Shopping
  google_product_category: 'Google Shopping / Google Product Category',
  google_gender: 'Google Shopping / Gender',
  google_age_group: 'Google Shopping / Age Group',
  mpn: 'Google Shopping / MPN',
  product_condition: 'Google Shopping / Condition',
}

// Mapping inverse Shopify CSV vers ShopOpti
export const SHOPIFY_TO_SHOPOPTI_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(SHOPOPTI_TO_SHOPIFY_MAPPING).map(([k, v]) => [v, k])
)

// Colonnes requises pour l'import Shopify
export const SHOPIFY_REQUIRED_COLUMNS = [
  'Handle',
  'Title',
  'Variant Price',
  'Variant SKU',
]

// Colonnes optionnelles mais recommandées
export const SHOPIFY_RECOMMENDED_COLUMNS = [
  'Body (HTML)',
  'Vendor',
  'Product Category',
  'Type',
  'Tags',
  'Image Src',
  'Variant Inventory Qty',
  'SEO Title',
  'SEO Description',
]
