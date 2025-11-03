import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type ImportedProduct = Database['public']['Tables']['imported_products']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];

export class PublishProductsService {
  /**
   * Publie un produit importé vers la table products
   */
  static async publishProduct(importedProductId: string, userId: string) {
    // Récupérer le produit importé
    const { data: importedProduct, error: fetchError } = await supabase
      .from('imported_products')
      .select('*')
      .eq('id', importedProductId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !importedProduct) {
      throw new Error('Produit importé non trouvé');
    }

    // Vérifier si déjà publié
    if (importedProduct.published_product_id) {
      return this.updatePublishedProduct(importedProduct);
    }

    // Créer le nouveau produit dans products
    const productData: ProductInsert = {
      user_id: userId,
      name: importedProduct.name,
      description: importedProduct.description,
      price: importedProduct.price,
      cost_price: importedProduct.cost_price,
      sku: importedProduct.sku,
      category: importedProduct.category,
      stock_quantity: importedProduct.stock_quantity || 0,
      status: importedProduct.status === 'published' ? 'active' : 'inactive',
      image_url: importedProduct.image_urls?.[0],
      tags: importedProduct.tags,
      supplier: importedProduct.supplier_name,
      profit_margin: this.calculateProfitMargin(
        importedProduct.price,
        importedProduct.cost_price
      ),
      seo_title: importedProduct.meta_title,
      seo_description: importedProduct.meta_description,
      seo_keywords: importedProduct.keywords,
    };

    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (insertError || !newProduct) {
      throw new Error('Erreur lors de la création du produit');
    }

    // Mettre à jour imported_products avec la référence
    const { error: updateError } = await supabase
      .from('imported_products')
      .update({
        published_product_id: newProduct.id,
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced',
      })
      .eq('id', importedProductId);

    if (updateError) {
      throw new Error('Erreur lors de la mise à jour du statut de synchronisation');
    }

    return newProduct;
  }

  /**
   * Met à jour un produit déjà publié
   */
  static async updatePublishedProduct(importedProduct: ImportedProduct) {
    if (!importedProduct.published_product_id) {
      throw new Error('Produit non publié');
    }

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update({
        name: importedProduct.name,
        description: importedProduct.description,
        price: importedProduct.price,
        cost_price: importedProduct.cost_price,
        stock_quantity: importedProduct.stock_quantity || 0,
        status: importedProduct.status === 'published' ? 'active' : 'inactive',
        image_url: importedProduct.image_urls?.[0],
        tags: importedProduct.tags,
        profit_margin: this.calculateProfitMargin(
          importedProduct.price,
          importedProduct.cost_price
        ),
        seo_title: importedProduct.meta_title,
        seo_description: importedProduct.meta_description,
        seo_keywords: importedProduct.keywords,
        updated_at: new Date().toISOString(),
      })
      .eq('id', importedProduct.published_product_id)
      .eq('user_id', importedProduct.user_id)
      .select()
      .single();

    if (error || !updatedProduct) {
      throw new Error('Erreur lors de la mise à jour du produit publié');
    }

    // Mettre à jour le statut de synchronisation
    await supabase
      .from('imported_products')
      .update({
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced',
      })
      .eq('id', importedProduct.id);

    return updatedProduct;
  }

  /**
   * Publication en masse
   */
  static async bulkPublish(importedProductIds: string[], userId: string) {
    const results = {
      success: [] as string[],
      errors: [] as { id: string; error: string }[],
    };

    for (const id of importedProductIds) {
      try {
        await this.publishProduct(id, userId);
        results.success.push(id);
      } catch (error) {
        results.errors.push({
          id,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    return results;
  }

  /**
   * Synchronise le stock d'un produit publié
   */
  static async syncStock(importedProductId: string, userId: string) {
    const { data: importedProduct, error: fetchError } = await supabase
      .from('imported_products')
      .select('published_product_id, stock_quantity')
      .eq('id', importedProductId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !importedProduct?.published_product_id) {
      throw new Error('Produit non trouvé ou non publié');
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({
        stock_quantity: importedProduct.stock_quantity || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', importedProduct.published_product_id)
      .eq('user_id', userId);

    if (updateError) {
      throw new Error('Erreur lors de la synchronisation du stock');
    }

    // Mettre à jour last_synced_at
    await supabase
      .from('imported_products')
      .update({
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced',
      })
      .eq('id', importedProductId);
  }

  /**
   * Dépublie un produit (le garde dans products mais inactive)
   */
  static async unpublishProduct(importedProductId: string, userId: string) {
    const { data: importedProduct, error: fetchError } = await supabase
      .from('imported_products')
      .select('published_product_id')
      .eq('id', importedProductId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !importedProduct?.published_product_id) {
      throw new Error('Produit non trouvé ou non publié');
    }

    // Désactiver le produit dans products
    const { error: updateError } = await supabase
      .from('products')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', importedProduct.published_product_id)
      .eq('user_id', userId);

    if (updateError) {
      throw new Error('Erreur lors de la dépublication');
    }

    // Mettre à jour imported_products
    await supabase
      .from('imported_products')
      .update({
        sync_status: 'pending',
      })
      .eq('id', importedProductId);
  }

  /**
   * Calcule la marge bénéficiaire
   */
  private static calculateProfitMargin(
    price: number,
    costPrice: number | null
  ): number | null {
    if (!costPrice || costPrice === 0) return null;
    return ((price - costPrice) / price) * 100;
  }

  /**
   * Récupère les statistiques de publication
   */
  static async getPublishStats(userId: string) {
    const { data: products, error } = await supabase
      .from('imported_products')
      .select('published_product_id, sync_status, status')
      .eq('user_id', userId);

    if (error || !products) {
      throw new Error('Erreur lors de la récupération des statistiques');
    }

    return {
      total: products.length,
      published: products.filter((p) => p.published_product_id).length,
      pending: products.filter((p) => p.sync_status === 'pending').length,
      synced: products.filter((p) => p.sync_status === 'synced').length,
      errors: products.filter((p) => p.sync_status === 'error').length,
      outdated: products.filter((p) => p.sync_status === 'outdated').length,
    };
  }
}
