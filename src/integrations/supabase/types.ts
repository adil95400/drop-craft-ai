export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          source: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          source?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          source?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_optimization_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json
          job_type: string
          output_data: Json | null
          progress: number | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data: Json
          job_type: string
          output_data?: Json | null
          progress?: number | null
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json
          job_type?: string
          output_data?: Json | null
          progress?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_cache: {
        Row: {
          cache_key: string
          created_at: string
          data: Json
          expires_at: string
          id: string
          updated_at: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          data: Json
          expires_at: string
          id?: string
          updated_at?: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          ai_generated: boolean
          category: string
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          publish_date: string
          seo_description: string | null
          seo_title: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          views: number
        }
        Insert: {
          ai_generated?: boolean
          category: string
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          publish_date?: string
          seo_description?: string | null
          seo_title?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          views?: number
        }
        Update: {
          ai_generated?: boolean
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          publish_date?: string
          seo_description?: string | null
          seo_title?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          views?: number
        }
        Relationships: []
      }
      catalog_products: {
        Row: {
          attributes: Json | null
          availability_status: string | null
          brand: string | null
          category: string | null
          competition_score: number | null
          cost_price: number | null
          created_at: string | null
          currency: string | null
          delivery_time: string | null
          description: string | null
          ean: string | null
          external_id: string
          id: string
          image_url: string | null
          image_urls: string[] | null
          is_bestseller: boolean | null
          is_trending: boolean | null
          is_winner: boolean | null
          last_updated: string | null
          name: string
          original_price: number | null
          price: number
          profit_margin: number | null
          rating: number | null
          reviews_count: number | null
          sales_count: number | null
          seo_data: Json | null
          shipping_cost: number | null
          sku: string | null
          stock_quantity: number | null
          subcategory: string | null
          supplier_id: string
          supplier_name: string
          supplier_url: string | null
          tags: string[] | null
          trend_score: number | null
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          availability_status?: string | null
          brand?: string | null
          category?: string | null
          competition_score?: number | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          delivery_time?: string | null
          description?: string | null
          ean?: string | null
          external_id: string
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_bestseller?: boolean | null
          is_trending?: boolean | null
          is_winner?: boolean | null
          last_updated?: string | null
          name: string
          original_price?: number | null
          price?: number
          profit_margin?: number | null
          rating?: number | null
          reviews_count?: number | null
          sales_count?: number | null
          seo_data?: Json | null
          shipping_cost?: number | null
          sku?: string | null
          stock_quantity?: number | null
          subcategory?: string | null
          supplier_id: string
          supplier_name: string
          supplier_url?: string | null
          tags?: string[] | null
          trend_score?: number | null
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          availability_status?: string | null
          brand?: string | null
          category?: string | null
          competition_score?: number | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          delivery_time?: string | null
          description?: string | null
          ean?: string | null
          external_id?: string
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_bestseller?: boolean | null
          is_trending?: boolean | null
          is_winner?: boolean | null
          last_updated?: string | null
          name?: string
          original_price?: number | null
          price?: number
          profit_margin?: number | null
          rating?: number | null
          reviews_count?: number | null
          sales_count?: number | null
          seo_data?: Json | null
          shipping_cost?: number | null
          sku?: string | null
          stock_quantity?: number | null
          subcategory?: string | null
          supplier_id?: string
          supplier_name?: string
          supplier_url?: string | null
          tags?: string[] | null
          trend_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: Json | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          status: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: Json | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          status?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: Json | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          status?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      import_connectors: {
        Row: {
          config: Json
          created_at: string | null
          credentials: Json
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          name: string
          provider: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string | null
          credentials?: Json
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name: string
          provider: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          credentials?: Json
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string
          provider?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      import_jobs: {
        Row: {
          created_at: string
          error_rows: number | null
          errors: string[] | null
          file_data: Json | null
          id: string
          mapping_config: Json | null
          processed_rows: number | null
          result_data: Json | null
          source_type: string
          source_url: string | null
          status: string
          success_rows: number | null
          total_rows: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_rows?: number | null
          errors?: string[] | null
          file_data?: Json | null
          id?: string
          mapping_config?: Json | null
          processed_rows?: number | null
          result_data?: Json | null
          source_type: string
          source_url?: string | null
          status?: string
          success_rows?: number | null
          total_rows?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_rows?: number | null
          errors?: string[] | null
          file_data?: Json | null
          id?: string
          mapping_config?: Json | null
          processed_rows?: number | null
          result_data?: Json | null
          source_type?: string
          source_url?: string | null
          status?: string
          success_rows?: number | null
          total_rows?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      imported_products: {
        Row: {
          ai_optimization_data: Json | null
          ai_optimized: boolean | null
          ai_recommendations: Json | null
          ai_score: number | null
          category: string | null
          cost_price: number | null
          created_at: string | null
          currency: string | null
          data_completeness_score: number | null
          description: string | null
          id: string
          image_urls: string[] | null
          import_id: string | null
          import_quality_score: number | null
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          name: string
          price: number
          published_at: string | null
          review_status: string | null
          reviewed_at: string | null
          sku: string | null
          status: string | null
          supplier_name: string | null
          supplier_product_id: string | null
          supplier_url: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          video_urls: string[] | null
        }
        Insert: {
          ai_optimization_data?: Json | null
          ai_optimized?: boolean | null
          ai_recommendations?: Json | null
          ai_score?: number | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          data_completeness_score?: number | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          import_id?: string | null
          import_quality_score?: number | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          price: number
          published_at?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          sku?: string | null
          status?: string | null
          supplier_name?: string | null
          supplier_product_id?: string | null
          supplier_url?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          video_urls?: string[] | null
        }
        Update: {
          ai_optimization_data?: Json | null
          ai_optimized?: boolean | null
          ai_recommendations?: Json | null
          ai_score?: number | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          data_completeness_score?: number | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          import_id?: string | null
          import_quality_score?: number | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          price?: number
          published_at?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          sku?: string | null
          status?: string | null
          supplier_name?: string | null
          supplier_product_id?: string | null
          supplier_url?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          video_urls?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "imported_products_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "product_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          access_token: string | null
          api_key: string | null
          api_secret: string | null
          connection_status: string | null
          created_at: string
          credential_access_log: Json | null
          credential_encryption_version: number | null
          encrypted_credentials: Json | null
          id: string
          is_active: boolean | null
          last_credential_access: string | null
          last_error: string | null
          last_sync_at: string | null
          platform_name: string
          platform_type: string
          platform_url: string | null
          refresh_token: string | null
          require_additional_auth: boolean | null
          seller_id: string | null
          shop_domain: string | null
          store_config: Json | null
          sync_frequency: string | null
          sync_settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          api_key?: string | null
          api_secret?: string | null
          connection_status?: string | null
          created_at?: string
          credential_access_log?: Json | null
          credential_encryption_version?: number | null
          encrypted_credentials?: Json | null
          id?: string
          is_active?: boolean | null
          last_credential_access?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          platform_name: string
          platform_type: string
          platform_url?: string | null
          refresh_token?: string | null
          require_additional_auth?: boolean | null
          seller_id?: string | null
          shop_domain?: string | null
          store_config?: Json | null
          sync_frequency?: string | null
          sync_settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          api_key?: string | null
          api_secret?: string | null
          connection_status?: string | null
          created_at?: string
          credential_access_log?: Json | null
          credential_encryption_version?: number | null
          encrypted_credentials?: Json | null
          id?: string
          is_active?: boolean | null
          last_credential_access?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          platform_name?: string
          platform_type?: string
          platform_url?: string | null
          refresh_token?: string | null
          require_additional_auth?: boolean | null
          seller_id?: string | null
          shop_domain?: string | null
          store_config?: Json | null
          sync_frequency?: string | null
          sync_settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      newsletters: {
        Row: {
          created_at: string | null
          created_ip: unknown | null
          email: string
          id: string
          rate_limit_key: string | null
          source: string | null
        }
        Insert: {
          created_at?: string | null
          created_ip?: unknown | null
          email: string
          id?: string
          rate_limit_key?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string | null
          created_ip?: unknown | null
          email?: string
          id?: string
          rate_limit_key?: string | null
          source?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          timestamp: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          timestamp?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          timestamp?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          qty: number
          total_price: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          qty?: number
          total_price?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          qty?: number
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          carrier: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          id: string
          notes: string | null
          order_number: string
          shipping_address: Json | null
          status: string | null
          total_amount: number
          tracking_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_address?: Json | null
          carrier?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_number: string
          shipping_address?: Json | null
          status?: string | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_address?: Json | null
          carrier?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          shipping_address?: Json | null
          status?: string | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      plans_limits: {
        Row: {
          created_at: string | null
          id: string
          limit_key: string
          limit_value: number
          plan: Database["public"]["Enums"]["plan_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          limit_key: string
          limit_value: number
          plan: Database["public"]["Enums"]["plan_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          limit_key?: string
          limit_value?: number
          plan?: Database["public"]["Enums"]["plan_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          catalog_product_id: string
          created_at: string | null
          current_price: number
          id: string
          is_active: boolean | null
          target_price: number
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          catalog_product_id: string
          created_at?: string | null
          current_price: number
          id?: string
          is_active?: boolean | null
          target_price: number
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          catalog_product_id?: string
          created_at?: string | null
          current_price?: number
          id?: string
          is_active?: boolean | null
          target_price?: number
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_catalog_product_id_fkey"
            columns: ["catalog_product_id"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_imports: {
        Row: {
          ai_optimization_results: Json | null
          ai_processing_enabled: boolean | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          import_config: Json | null
          import_data: Json | null
          import_type: string
          processing_time_ms: number | null
          products_failed: number | null
          products_imported: number | null
          quality_score: number | null
          source_name: string | null
          source_url: string | null
          started_at: string | null
          status: string | null
          total_products: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_optimization_results?: Json | null
          ai_processing_enabled?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          import_config?: Json | null
          import_data?: Json | null
          import_type: string
          processing_time_ms?: number | null
          products_failed?: number | null
          products_imported?: number | null
          quality_score?: number | null
          source_name?: string | null
          source_url?: string | null
          started_at?: string | null
          status?: string | null
          total_products?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_optimization_results?: Json | null
          ai_processing_enabled?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          import_config?: Json | null
          import_data?: Json | null
          import_type?: string
          processing_time_ms?: number | null
          products_failed?: number | null
          products_imported?: number | null
          quality_score?: number | null
          source_name?: string | null
          source_url?: string | null
          started_at?: string | null
          status?: string | null
          total_products?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          dimensions: Json | null
          id: string
          image_url: string | null
          name: string
          price: number
          profit_margin: number | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          shopify_id: string | null
          sku: string | null
          status: string | null
          stock_quantity: number | null
          supplier: string | null
          supplier_id: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          id?: string
          image_url?: string | null
          name: string
          price?: number
          profit_margin?: number | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          shopify_id?: string | null
          sku?: string | null
          status?: string | null
          stock_quantity?: number | null
          supplier?: string | null
          supplier_id?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          profit_margin?: number | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          shopify_id?: string | null
          sku?: string | null
          status?: string | null
          stock_quantity?: number | null
          supplier?: string | null
          supplier_id?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_supplier_id"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          email_notifications: boolean | null
          full_name: string | null
          id: string
          plan: Database["public"]["Enums"]["plan_type"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id: string
          plan?: Database["public"]["Enums"]["plan_type"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_type"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          external_id: string
          helpful_count: number | null
          id: string
          photos: string[] | null
          platform: string
          product_id: string | null
          rating: number
          status: string | null
          title: string | null
          updated_at: string
          verified_purchase: boolean | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          external_id: string
          helpful_count?: number | null
          id?: string
          photos?: string[] | null
          platform: string
          product_id?: string | null
          rating: number
          status?: string | null
          title?: string | null
          updated_at?: string
          verified_purchase?: boolean | null
        }
        Update: {
          content?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          external_id?: string
          helpful_count?: number | null
          id?: string
          photos?: string[] | null
          platform?: string
          product_id?: string | null
          rating?: number
          status?: string | null
          title?: string | null
          updated_at?: string
          verified_purchase?: boolean | null
        }
        Relationships: []
      }
      scheduled_imports: {
        Row: {
          created_at: string | null
          filter_config: Json | null
          frequency: string
          id: string
          is_active: boolean | null
          last_execution: string | null
          name: string
          next_execution: string
          optimization_settings: Json | null
          platform: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filter_config?: Json | null
          frequency: string
          id?: string
          is_active?: boolean | null
          last_execution?: string | null
          name: string
          next_execution: string
          optimization_settings?: Json | null
          platform: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filter_config?: Json | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_execution?: string | null
          name?: string
          next_execution?: string
          optimization_settings?: Json | null
          platform?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          description: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shipments: {
        Row: {
          carrier: string | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          order_id: string
          status: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          order_id: string
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          carrier?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          order_id?: string
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sourcing_history: {
        Row: {
          action: string
          catalog_product_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          catalog_product_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          catalog_product_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sourcing_history_catalog_product_id_fkey"
            columns: ["catalog_product_id"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_name: string | null
          price_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string | null
          price_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string | null
          price_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          access_count: number | null
          api_endpoint: string | null
          api_key: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          credentials_updated_at: string | null
          encrypted_credentials: Json | null
          id: string
          last_access_at: string | null
          name: string
          rating: number | null
          status: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          access_count?: number | null
          api_endpoint?: string | null
          api_key?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          credentials_updated_at?: string | null
          encrypted_credentials?: Json | null
          id?: string
          last_access_at?: string | null
          name: string
          rating?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          access_count?: number | null
          api_endpoint?: string | null
          api_key?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          credentials_updated_at?: string | null
          encrypted_credentials?: Json | null
          id?: string
          last_access_at?: string | null
          name?: string
          rating?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          integration_id: string
          records_failed: number | null
          records_processed: number | null
          records_succeeded: number | null
          started_at: string
          status: string
          sync_data: Json | null
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          integration_id: string
          records_failed?: number | null
          records_processed?: number | null
          records_succeeded?: number | null
          started_at?: string
          status: string
          sync_data?: Json | null
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string
          records_failed?: number | null
          records_processed?: number | null
          records_succeeded?: number | null
          started_at?: string
          status?: string
          sync_data?: Json | null
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_api_keys: {
        Row: {
          created_at: string
          created_ip: unknown | null
          encrypted_value: string
          id: string
          is_active: boolean
          key_name: string
          last_used_at: string | null
          platform: string
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_ip?: unknown | null
          encrypted_value: string
          id?: string
          is_active?: boolean
          key_name: string
          last_used_at?: string | null
          platform: string
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_ip?: unknown | null
          encrypted_value?: string
          id?: string
          is_active?: boolean
          key_name?: string
          last_used_at?: string | null
          platform?: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          catalog_product_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          catalog_product_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          catalog_product_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_catalog_product_id_fkey"
            columns: ["catalog_product_id"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quotas: {
        Row: {
          created_at: string | null
          current_count: number | null
          id: string
          quota_key: string
          reset_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_count?: number | null
          id?: string
          quota_key: string
          reset_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_count?: number | null
          id?: string
          quota_key?: string
          reset_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_profit_margin: {
        Args: { cost_price: number; price: number }
        Returns: number
      }
      check_quota: {
        Args: { quota_key_param: string; user_id_param: string }
        Returns: boolean
      }
      clean_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      detect_suspicious_activity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_business_intelligence: {
        Args: { limit_count?: number }
        Returns: {
          competition_score: number
          cost_price: number
          id: string
          name: string
          profit_margin: number
          sales_count: number
          supplier_name: string
          supplier_url: string
          trend_score: number
        }[]
      }
      get_customer_sensitive_info: {
        Args: { customer_id: string }
        Returns: {
          address: Json
          email: string
          id: string
          name: string
          phone: string
        }[]
      }
      get_customers_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: Json
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          status: string
          total_orders: number
          total_spent: number
          updated_at: string
          user_id: string
        }[]
      }
      get_marketplace_products: {
        Args: {
          category_filter?: string
          limit_count?: number
          search_term?: string
        }
        Returns: {
          availability_status: string
          brand: string
          category: string
          created_at: string
          currency: string
          delivery_time: string
          description: string
          external_id: string
          id: string
          image_url: string
          image_urls: string[]
          is_bestseller: boolean
          is_trending: boolean
          name: string
          price: number
          rating: number
          reviews_count: number
          sku: string
          subcategory: string
          tags: string[]
          updated_at: string
        }[]
      }
      get_masked_customers: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: Json
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          status: string
          total_orders: number
          total_spent: number
          updated_at: string
          user_id: string
        }[]
      }
      get_safe_integrations: {
        Args: Record<PropertyKey, never>
        Returns: {
          connection_status: string
          created_at: string
          has_access_token: boolean
          has_api_key: boolean
          has_api_secret: boolean
          has_encrypted_credentials: boolean
          has_refresh_token: boolean
          id: string
          is_active: boolean
          last_credential_access: string
          last_error: string
          last_sync_at: string
          platform_name: string
          platform_type: string
          platform_url: string
          require_additional_auth: boolean
          seller_id: string
          shop_domain: string
          store_config: Json
          sync_frequency: string
          sync_settings: Json
          updated_at: string
          user_id: string
        }[]
      }
      get_secure_suppliers: {
        Args: Record<PropertyKey, never>
        Returns: {
          access_count: number
          api_endpoint: string
          contact_email_masked: string
          contact_phone_masked: string
          country: string
          created_at: string
          credentials_updated_at: string
          has_api_key: boolean
          has_encrypted_credentials: boolean
          id: string
          last_access_at: string
          name: string
          rating: number
          status: string
          updated_at: string
          user_id: string
          website: string
        }[]
      }
      get_subscription_status_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          expires_at: string
          has_subscription: boolean
          is_active: boolean
          tier_level: string
        }[]
      }
      get_supplier_sensitive_data: {
        Args: { supplier_id: string }
        Returns: {
          contact_email: string
          contact_phone: string
          credentials_last_updated: string
          has_api_key: boolean
          id: string
        }[]
      }
      get_user_plan: {
        Args: { user_id_param: string }
        Returns: string
      }
      has_plan: {
        Args: { min_plan: string; user_id_param: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_quota: {
        Args: {
          increment_by?: number
          quota_key_param: string
          user_id_param: string
        }
        Returns: boolean
      }
      is_supplier_owner: {
        Args: { _supplier_id: string; _user_id: string }
        Returns: boolean
      }
      log_credential_access: {
        Args: {
          access_type: string
          integration_id: string
          ip_address_param?: string
          user_id_param?: string
        }
        Returns: undefined
      }
      log_sensitive_data_access: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      mask_customer_email: {
        Args: { email: string }
        Returns: string
      }
      mask_customer_phone: {
        Args: { phone: string }
        Returns: string
      }
      public_newsletter_signup: {
        Args: { email_param: string }
        Returns: Json
      }
      rotate_api_key: {
        Args: { key_id: string }
        Returns: Json
      }
      secure_newsletter_signup: {
        Args: { email_param: string; source_param?: string; user_ip?: unknown }
        Returns: Json
      }
      simple_mask_email: {
        Args: { email: string }
        Returns: string
      }
      simple_mask_phone: {
        Args: { phone: string }
        Returns: string
      }
      user_has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      verify_supplier_ownership: {
        Args: { supplier_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "staff"
      plan_type: "standard" | "pro" | "ultra_pro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "staff"],
      plan_type: ["standard", "pro", "ultra_pro"],
    },
  },
} as const
