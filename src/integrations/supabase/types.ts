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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ab_test_variants: {
        Row: {
          ad_creative: Json | null
          created_at: string | null
          id: string
          is_winner: boolean | null
          performance_data: Json | null
          test_name: string
          traffic_allocation: number | null
          updated_at: string | null
          user_id: string
          variant_name: string
        }
        Insert: {
          ad_creative?: Json | null
          created_at?: string | null
          id?: string
          is_winner?: boolean | null
          performance_data?: Json | null
          test_name: string
          traffic_allocation?: number | null
          updated_at?: string | null
          user_id: string
          variant_name: string
        }
        Update: {
          ad_creative?: Json | null
          created_at?: string | null
          id?: string
          is_winner?: boolean | null
          performance_data?: Json | null
          test_name?: string
          traffic_allocation?: number | null
          updated_at?: string | null
          user_id?: string
          variant_name?: string
        }
        Relationships: []
      }
      active_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          message: string | null
          metadata: Json | null
          severity: string | null
          status: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          severity?: string | null
          status?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          severity?: string | null
          status?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      advanced_reports: {
        Row: {
          created_at: string | null
          filters: Json | null
          id: string
          is_favorite: boolean | null
          last_generated_at: string | null
          report_data: Json | null
          report_name: string
          report_type: string
          schedule: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          is_favorite?: boolean | null
          last_generated_at?: string | null
          report_data?: Json | null
          report_name: string
          report_type: string
          schedule?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          is_favorite?: boolean | null
          last_generated_at?: string | null
          report_data?: Json | null
          report_name?: string
          report_type?: string
          schedule?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          announcement_type: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          starts_at: string | null
          target_plans: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          announcement_type?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          starts_at?: string | null
          target_plans?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          announcement_type?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          starts_at?: string | null
          target_plans?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      api_analytics: {
        Row: {
          avg_response_time_ms: number | null
          created_at: string | null
          date: string
          endpoint: string | null
          failed_requests: number | null
          id: string
          total_requests: number | null
          user_id: string | null
        }
        Insert: {
          avg_response_time_ms?: number | null
          created_at?: string | null
          date?: string
          endpoint?: string | null
          failed_requests?: number | null
          id?: string
          total_requests?: number | null
          user_id?: string | null
        }
        Update: {
          avg_response_time_ms?: number | null
          created_at?: string | null
          date?: string
          endpoint?: string | null
          failed_requests?: number | null
          id?: string
          total_requests?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          allowed_ips: string[] | null
          created_at: string | null
          environment: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key: string
          key_prefix: string | null
          last_used_at: string | null
          last_used_ip: string | null
          name: string
          rate_limit: number | null
          rate_limit_window: string | null
          scopes: string[] | null
          user_id: string
        }
        Insert: {
          allowed_ips?: string[] | null
          created_at?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          key_prefix?: string | null
          last_used_at?: string | null
          last_used_ip?: string | null
          name: string
          rate_limit?: number | null
          rate_limit_window?: string | null
          scopes?: string[] | null
          user_id: string
        }
        Update: {
          allowed_ips?: string[] | null
          created_at?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          key_prefix?: string | null
          last_used_at?: string | null
          last_used_ip?: string | null
          name?: string
          rate_limit?: number | null
          rate_limit_window?: string | null
          scopes?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      api_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          endpoint: string
          error_message: string | null
          id: string
          ip_address: string | null
          method: string | null
          request_body: Json | null
          response_body: Json | null
          response_time_ms: number | null
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method?: string | null
          request_body?: Json | null
          response_body?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method?: string | null
          request_body?: Json | null
          response_body?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_actions: {
        Row: {
          action_type: string
          config: Json | null
          created_at: string | null
          execution_order: number | null
          id: string
          is_active: boolean | null
          name: string
          trigger_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          config?: Json | null
          created_at?: string | null
          execution_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          config?: Json | null
          created_at?: string | null
          execution_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_actions_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "automation_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_execution_logs: {
        Row: {
          action_id: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          executed_at: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          status: string | null
          trigger_id: string | null
          user_id: string
        }
        Insert: {
          action_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          status?: string | null
          trigger_id?: string | null
          user_id: string
        }
        Update: {
          action_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          status?: string | null
          trigger_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_execution_logs_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "automation_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_execution_logs_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "automation_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json | null
          action_type: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          trigger_config: Json | null
          trigger_count: number | null
          trigger_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          trigger_config?: Json | null
          trigger_count?: number | null
          trigger_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          trigger_config?: Json | null
          trigger_count?: number | null
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      automation_triggers: {
        Row: {
          conditions: Json | null
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          trigger_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conditions?: Json | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          trigger_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conditions?: Json | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      automation_workflows: {
        Row: {
          created_at: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          run_count: number | null
          status: string | null
          steps: Json | null
          updated_at: string | null
          user_id: string
          workflow_data: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          run_count?: number | null
          status?: string | null
          steps?: Json | null
          updated_at?: string | null
          user_id: string
          workflow_data?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          run_count?: number | null
          status?: string | null
          steps?: Json | null
          updated_at?: string | null
          user_id?: string
          workflow_data?: Json | null
        }
        Relationships: []
      }
      business_intelligence_insights: {
        Row: {
          actionable_recommendations: Json | null
          confidence_score: number | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          impact_score: number | null
          insight_type: string
          is_read: boolean | null
          priority: number | null
          status: string | null
          supporting_data: Json | null
          title: string
          user_id: string
        }
        Insert: {
          actionable_recommendations?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          impact_score?: number | null
          insight_type: string
          is_read?: boolean | null
          priority?: number | null
          status?: string | null
          supporting_data?: Json | null
          title: string
          user_id: string
        }
        Update: {
          actionable_recommendations?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          impact_score?: number | null
          insight_type?: string
          is_read?: boolean | null
          priority?: number | null
          status?: string | null
          supporting_data?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      catalog_products: {
        Row: {
          category: string | null
          compare_at_price: number | null
          created_at: string | null
          description: string | null
          id: string
          image_urls: string[] | null
          is_imported: boolean | null
          price: number | null
          source_platform: string | null
          source_url: string | null
          status: string | null
          supplier_name: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_imported?: boolean | null
          price?: number | null
          source_platform?: string | null
          source_url?: string | null
          status?: string | null
          supplier_name?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_imported?: boolean | null
          price?: number | null
          source_platform?: string | null
          source_url?: string | null
          status?: string | null
          supplier_name?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          tags: string[] | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      enterprise_integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          integration_type: string
          is_active: boolean | null
          last_error: string | null
          last_sync_at: string | null
          name: string
          sync_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          integration_type: string
          is_active?: boolean | null
          last_error?: string | null
          last_sync_at?: string | null
          name: string
          sync_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          integration_type?: string
          is_active?: boolean | null
          last_error?: string | null
          last_sync_at?: string | null
          name?: string
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      extension_auth_tokens: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string | null
          token: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string | null
          token: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string | null
          token?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      extension_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          extension_id: string | null
          id: string
          input_data: Json | null
          job_type: string
          output_data: Json | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          extension_id?: string | null
          id?: string
          input_data?: Json | null
          job_type: string
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          extension_id?: string | null
          id?: string
          input_data?: Json | null
          job_type?: string
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extension_jobs_extension_id_fkey"
            columns: ["extension_id"]
            isOneToOne: false
            referencedRelation: "extensions"
            referencedColumns: ["id"]
          },
        ]
      }
      extensions: {
        Row: {
          code: string
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_premium: boolean | null
          name: string
          status: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          code: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean | null
          name: string
          status?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          code?: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean | null
          name?: string
          status?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          is_active: boolean | null
          not_helpful_count: number | null
          order_index: number | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_active?: boolean | null
          not_helpful_count?: number | null
          order_index?: number | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_active?: boolean | null
          not_helpful_count?: number | null
          order_index?: number | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fulfilment_rules: {
        Row: {
          actions: Json | null
          conditions: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_log: Json | null
          failed_imports: number | null
          id: string
          job_type: string
          source_platform: string | null
          source_url: string | null
          started_at: string | null
          status: string | null
          successful_imports: number | null
          total_products: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_imports?: number | null
          id?: string
          job_type: string
          source_platform?: string | null
          source_url?: string | null
          started_at?: string | null
          status?: string | null
          successful_imports?: number | null
          total_products?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_imports?: number | null
          id?: string
          job_type?: string
          source_platform?: string | null
          source_url?: string | null
          started_at?: string | null
          status?: string | null
          successful_imports?: number | null
          total_products?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      imported_products: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          import_job_id: string | null
          price: number | null
          product_id: string | null
          source_platform: string | null
          source_url: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          import_job_id?: string | null
          price?: number | null
          product_id?: string | null
          source_platform?: string | null
          source_url?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          import_job_id?: string | null
          price?: number | null
          product_id?: string | null
          source_platform?: string | null
          source_url?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imported_products_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imported_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          access_token_encrypted: string | null
          api_key_encrypted: string | null
          api_secret_encrypted: string | null
          config: Json | null
          connection_status: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          platform: string
          platform_name: string | null
          refresh_token_encrypted: string | null
          store_id: string | null
          store_url: string | null
          sync_frequency: string | null
          updated_at: string | null
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          config?: Json | null
          connection_status?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform: string
          platform_name?: string | null
          refresh_token_encrypted?: string | null
          store_id?: string | null
          store_url?: string | null
          sync_frequency?: string | null
          updated_at?: string | null
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          config?: Json | null
          connection_status?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform?: string
          platform_name?: string | null
          refresh_token_encrypted?: string | null
          store_id?: string | null
          store_url?: string | null
          sync_frequency?: string | null
          updated_at?: string | null
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          title?: string
          type?: string | null
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
          qty: number | null
          total_price: number | null
          unit_price: number | null
          variant_title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          qty?: number | null
          total_price?: number | null
          unit_price?: number | null
          variant_title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          qty?: number | null
          total_price?: number | null
          unit_price?: number | null
          variant_title?: string | null
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
          discount_amount: number | null
          fulfillment_status: string | null
          id: string
          notes: string | null
          order_number: string
          payment_status: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          shopify_order_id: string | null
          status: string | null
          subtotal: number | null
          supplier_order_id: string | null
          tax_amount: number | null
          total_amount: number | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_address?: Json | null
          carrier?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          fulfillment_status?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shopify_order_id?: string | null
          status?: string | null
          subtotal?: number | null
          supplier_order_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_address?: Json | null
          carrier?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          fulfillment_status?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shopify_order_id?: string | null
          status?: string | null
          subtotal?: number | null
          supplier_order_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
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
      plan_limits: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          limit_key: string
          limit_value: number
          plan_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          limit_key: string
          limit_value: number
          plan_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          limit_key?: string
          limit_value?: number
          plan_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      price_stock_monitoring: {
        Row: {
          alert_threshold: number | null
          created_at: string | null
          current_price: number | null
          current_stock: number | null
          id: string
          is_active: boolean | null
          last_checked_at: string | null
          previous_price: number | null
          previous_stock: number | null
          price_change_percent: number | null
          product_id: string | null
          supplier_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_threshold?: number | null
          created_at?: string | null
          current_price?: number | null
          current_stock?: number | null
          id?: string
          is_active?: boolean | null
          last_checked_at?: string | null
          previous_price?: number | null
          previous_stock?: number | null
          price_change_percent?: number | null
          product_id?: string | null
          supplier_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_threshold?: number | null
          created_at?: string | null
          current_price?: number | null
          current_stock?: number | null
          id?: string
          is_active?: boolean | null
          last_checked_at?: string | null
          previous_price?: number | null
          previous_stock?: number | null
          price_change_percent?: number | null
          product_id?: string | null
          supplier_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_stock_monitoring_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand: string | null
          category: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          google_product_id: string | null
          id: string
          image_url: string | null
          images: Json | null
          is_published: boolean | null
          name: string | null
          price: number | null
          seo_description: string | null
          seo_title: string | null
          shopify_product_id: string | null
          sku: string | null
          status: string | null
          stock_quantity: number | null
          supplier: string | null
          supplier_product_id: string | null
          supplier_url: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          variants: Json | null
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          google_product_id?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_published?: boolean | null
          name?: string | null
          price?: number | null
          seo_description?: string | null
          seo_title?: string | null
          shopify_product_id?: string | null
          sku?: string | null
          status?: string | null
          stock_quantity?: number | null
          supplier?: string | null
          supplier_product_id?: string | null
          supplier_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          variants?: Json | null
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          google_product_id?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_published?: boolean | null
          name?: string | null
          price?: number | null
          seo_description?: string | null
          seo_title?: string | null
          shopify_product_id?: string | null
          sku?: string | null
          status?: string | null
          stock_quantity?: number | null
          supplier?: string | null
          supplier_product_id?: string | null
          supplier_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          variants?: Json | null
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_mode: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          email_notifications: boolean | null
          full_name: string | null
          id: string
          language: string | null
          last_login_at: string | null
          login_count: number | null
          onboarding_completed: boolean | null
          phone: string | null
          push_notifications: boolean | null
          subscription_plan: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          admin_mode?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id: string
          language?: string | null
          last_login_at?: string | null
          login_count?: number | null
          onboarding_completed?: boolean | null
          phone?: string | null
          push_notifications?: boolean | null
          subscription_plan?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_mode?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          language?: string | null
          last_login_at?: string | null
          login_count?: number | null
          onboarding_completed?: boolean | null
          phone?: string | null
          push_notifications?: boolean | null
          subscription_plan?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_tasks: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          last_status: string | null
          name: string
          next_run_at: string | null
          run_count: number | null
          schedule: string
          task_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          last_status?: string | null
          name: string
          next_run_at?: string | null
          run_count?: number | null
          schedule: string
          task_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          last_status?: string | null
          name?: string
          next_run_at?: string | null
          run_count?: number | null
          schedule?: string
          task_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          api_endpoint: string | null
          api_key_encrypted: string | null
          code: string | null
          config: Json | null
          country: string | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          name: string
          shipping_methods: Json | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          code?: string | null
          config?: Json | null
          country?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          name: string
          shipping_methods?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          code?: string | null
          config?: Json | null
          country?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          name?: string
          shipping_methods?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_stats: {
        Row: {
          active_users: number | null
          api_calls: number | null
          created_at: string | null
          error_count: number | null
          id: string
          stat_date: string
          total_orders: number | null
          total_products: number | null
          total_revenue: number | null
          total_users: number | null
        }
        Insert: {
          active_users?: number | null
          api_calls?: number | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          stat_date?: string
          total_orders?: number | null
          total_products?: number | null
          total_revenue?: number | null
          total_users?: number | null
        }
        Update: {
          active_users?: number | null
          api_calls?: number | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          stat_date?: string
          total_orders?: number | null
          total_products?: number | null
          total_revenue?: number | null
          total_users?: number | null
        }
        Relationships: []
      }
      user_quotas: {
        Row: {
          created_at: string | null
          current_usage: number | null
          id: string
          period_end: string | null
          period_start: string | null
          quota_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_usage?: number | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          quota_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_usage?: number | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          quota_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_tutorials: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          duration: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_type: string | null
          video_url: string | null
          view_count: number | null
          youtube_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_type?: string | null
          video_url?: string | null
          view_count?: number | null
          youtube_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_type?: string | null
          video_url?: string | null
          view_count?: number | null
          youtube_id?: string | null
        }
        Relationships: []
      }
      webhook_delivery_logs: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          response_body: string | null
          status_code: number | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          status_code?: number | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          status_code?: number | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_delivery_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "webhook_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          integration_id: string | null
          payload: Json | null
          platform: string
          processed: boolean | null
          processed_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          integration_id?: string | null
          payload?: Json | null
          platform: string
          processed?: boolean | null
          processed_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          integration_id?: string | null
          payload?: Json | null
          platform?: string
          processed?: boolean | null
          processed_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_subscriptions: {
        Row: {
          created_at: string | null
          events: string[] | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          secret: string | null
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          events?: string[] | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          secret?: string | null
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          events?: string[] | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          secret?: string | null
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: boolean
      }
      admin_update_user_plan: {
        Args: { new_plan: string; target_user_id: string }
        Returns: boolean
      }
      generate_api_key: {
        Args: { key_name: string; key_scopes?: string[] }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_secure: { Args: never; Returns: boolean }
      is_token_revoked: { Args: { token_id?: string }; Returns: boolean }
      unlock_stuck_import_jobs: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
