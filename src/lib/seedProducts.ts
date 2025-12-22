import { supabase } from '@/integrations/supabase/client'

export async function seedSampleProducts() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('User must be authenticated to seed products')
    return
  }

  // Check if products already exist
  const { data: existingProducts } = await supabase
    .from('products')
    .select('id')
    .limit(1)

  if (existingProducts && existingProducts.length > 0) {
    console.log('Products already seeded')
    return
  }

  const sampleProducts = [
    {
      user_id: user.id,
      title: 'Chaise de Bureau Ergonomique',
      description: 'Chaise de bureau moderne avec support lombaire ajustable et accoudoirs réglables',
      price: 249.99,
      cost_price: 120.00,
      sku: 'CHAIR-ERG-001',
      category: 'Mobilier',
      brand: 'OfficeComfort',
      stock_quantity: 45,
      status: 'active',
      image_url: '/placeholder.svg',
    },
    {
      user_id: user.id,
      title: 'Bureau Ajustable en Hauteur',
      description: 'Bureau électrique avec ajustement motorisé de la hauteur, surface en bambou',
      price: 599.99,
      cost_price: 300.00,
      sku: 'DESK-ADJ-001',
      category: 'Mobilier',
      brand: 'WorkPro',
      stock_quantity: 22,
      status: 'active',
      image_url: '/placeholder.svg',
    },
    {
      user_id: user.id,
      title: 'Lampe LED Architecte',
      description: 'Lampe de bureau LED avec bras articulé et contrôle de luminosité',
      price: 89.99,
      cost_price: 35.00,
      sku: 'LAMP-LED-001',
      category: 'Éclairage',
      brand: 'LightDesign',
      stock_quantity: 78,
      status: 'active',
      image_url: '/placeholder.svg',
    },
    {
      user_id: user.id,
      title: 'Tapis de Souris XXL',
      description: 'Tapis de souris gaming extra-large avec surface lisse et base antidérapante',
      price: 29.99,
      cost_price: 8.00,
      sku: 'MAT-XXL-001',
      category: 'Accessoires',
      brand: 'GamePro',
      stock_quantity: 156,
      status: 'active',
      image_url: '/placeholder.svg',
    },
    {
      user_id: user.id,
      title: 'Support Moniteur Double',
      description: 'Support ergonomique pour deux écrans avec ajustement en hauteur et rotation',
      price: 179.99,
      cost_price: 75.00,
      sku: 'MOUNT-DUAL-001',
      category: 'Accessoires',
      brand: 'TechMount',
      stock_quantity: 34,
      status: 'active',
      image_url: '/placeholder.svg',
    },
  ]

  const { error } = await supabase
    .from('products')
    .insert(sampleProducts as any)

  if (error) {
    console.error('Error seeding products:', error)
  } else {
    console.log('Sample products seeded successfully')
  }
}
