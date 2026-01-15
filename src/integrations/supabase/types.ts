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
      ab_test_experiments: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          metrics: Json | null
          name: string
          start_date: string | null
          status: string | null
          updated_at: string
          user_id: string
          variants: Json | null
          winner_variant_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          metrics?: Json | null
          name: string
          start_date?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          variants?: Json | null
          winner_variant_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          metrics?: Json | null
          name?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          variants?: Json | null
          winner_variant_id?: string | null
        }
        Relationships: []
      }
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
          source: string | null
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
          source?: string | null
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
          source?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ad_accounts: {
        Row: {
          clicks: number | null
          conversions: number | null
          created_at: string
          credentials_encrypted: string | null
          id: string
          impressions: number | null
          last_sync_at: string | null
          name: string
          platform: string
          spend: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          credentials_encrypted?: string | null
          id?: string
          impressions?: number | null
          last_sync_at?: string | null
          name: string
          platform: string
          spend?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          credentials_encrypted?: string | null
          id?: string
          impressions?: number | null
          last_sync_at?: string | null
          name?: string
          platform?: string
          spend?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ad_campaigns: {
        Row: {
          ad_account_id: string | null
          budget: number | null
          clicks: number | null
          conversions: number | null
          cpc: number | null
          created_at: string
          ctr: number | null
          end_date: string | null
          id: string
          impressions: number | null
          name: string
          platform: string
          roas: number | null
          spend: number | null
          start_date: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_account_id?: string | null
          budget?: number | null
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          name: string
          platform: string
          roas?: number | null
          spend?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_account_id?: string | null
          budget?: number | null
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          name?: string
          platform?: string
          roas?: number | null
          spend?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_collection_items: {
        Row: {
          ad_id: string
          added_at: string | null
          collection_id: string
          id: string
          notes: string | null
        }
        Insert: {
          ad_id: string
          added_at?: string | null
          collection_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          ad_id?: string
          added_at?: string | null
          collection_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_collection_items_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "competitor_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "ad_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_collections: {
        Row: {
          ad_count: number | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ad_count?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ad_count?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ad_searches: {
        Row: {
          filters: Json | null
          id: string
          platform: string | null
          query: string
          results_count: number | null
          searched_at: string | null
          user_id: string
        }
        Insert: {
          filters?: Json | null
          id?: string
          platform?: string | null
          query: string
          results_count?: number | null
          searched_at?: string | null
          user_id: string
        }
        Update: {
          filters?: Json | null
          id?: string
          platform?: string | null
          query?: string
          results_count?: number | null
          searched_at?: string | null
          user_id?: string
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
      ai_content_batches: {
        Row: {
          completed_at: string | null
          created_at: string
          error_log: Json | null
          failed_count: number | null
          id: string
          name: string
          processed_products: number | null
          product_filter: Json | null
          started_at: string | null
          status: string | null
          successful_count: number | null
          template_id: string | null
          total_products: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          failed_count?: number | null
          id?: string
          name: string
          processed_products?: number | null
          product_filter?: Json | null
          started_at?: string | null
          status?: string | null
          successful_count?: number | null
          template_id?: string | null
          total_products?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          failed_count?: number | null
          id?: string
          name?: string
          processed_products?: number | null
          product_filter?: Json | null
          started_at?: string | null
          status?: string | null
          successful_count?: number | null
          template_id?: string | null
          total_products?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_batches_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ai_content_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_content_templates: {
        Row: {
          content_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          language: string | null
          max_tokens: number | null
          name: string
          prompt_template: string
          tone: string | null
          updated_at: string
          usage_count: number | null
          user_id: string
          variables: Json | null
        }
        Insert: {
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          max_tokens?: number | null
          name: string
          prompt_template: string
          tone?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
          variables?: Json | null
        }
        Update: {
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          max_tokens?: number | null
          name?: string
          prompt_template?: string
          tone?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
          variables?: Json | null
        }
        Relationships: []
      }
      ai_generated_content: {
        Row: {
          applied_at: string | null
          content_type: string
          created_at: string
          generated_content: string
          generation_time_ms: number | null
          id: string
          original_content: string | null
          product_id: string | null
          quality_score: number | null
          status: string | null
          template_id: string | null
          tokens_used: number | null
          user_id: string
          variables_used: Json | null
        }
        Insert: {
          applied_at?: string | null
          content_type: string
          created_at?: string
          generated_content: string
          generation_time_ms?: number | null
          id?: string
          original_content?: string | null
          product_id?: string | null
          quality_score?: number | null
          status?: string | null
          template_id?: string | null
          tokens_used?: number | null
          user_id: string
          variables_used?: Json | null
        }
        Update: {
          applied_at?: string | null
          content_type?: string
          created_at?: string
          generated_content?: string
          generation_time_ms?: number | null
          id?: string
          original_content?: string | null
          product_id?: string | null
          quality_score?: number | null
          status?: string | null
          template_id?: string | null
          tokens_used?: number | null
          user_id?: string
          variables_used?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generated_content_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generated_content_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ai_content_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_optimization_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          job_type: string
          metrics: Json | null
          output_data: Json | null
          priority: number | null
          started_at: string | null
          status: string | null
          target_id: string | null
          target_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type: string
          metrics?: Json | null
          output_data?: Json | null
          priority?: number | null
          started_at?: string | null
          status?: string | null
          target_id?: string | null
          target_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type?: string
          metrics?: Json | null
          output_data?: Json | null
          priority?: number | null
          started_at?: string | null
          status?: string | null
          target_id?: string | null
          target_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analytics_dashboards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          layout: Json | null
          name: string
          updated_at: string
          user_id: string
          widgets: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          layout?: Json | null
          name: string
          updated_at?: string
          user_id: string
          widgets?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          layout?: Json | null
          name?: string
          updated_at?: string
          user_id?: string
          widgets?: Json | null
        }
        Relationships: []
      }
      analytics_insights: {
        Row: {
          category: string | null
          comparison_value: number | null
          confidence_score: number | null
          created_at: string | null
          id: string
          insights: Json | null
          metadata: Json | null
          metric_name: string
          metric_type: string | null
          metric_value: number | null
          period: string | null
          prediction_type: string | null
          predictions: Json | null
          recorded_at: string | null
          trend: string | null
          trend_percentage: number | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          comparison_value?: number | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          insights?: Json | null
          metadata?: Json | null
          metric_name: string
          metric_type?: string | null
          metric_value?: number | null
          period?: string | null
          prediction_type?: string | null
          predictions?: Json | null
          recorded_at?: string | null
          trend?: string | null
          trend_percentage?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          comparison_value?: number | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          insights?: Json | null
          metadata?: Json | null
          metric_name?: string
          metric_type?: string | null
          metric_value?: number | null
          period?: string | null
          prediction_type?: string | null
          predictions?: Json | null
          recorded_at?: string | null
          trend?: string | null
          trend_percentage?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_snapshots: {
        Row: {
          comparisons: Json | null
          created_at: string
          id: string
          metrics: Json
          snapshot_date: string
          snapshot_type: string
          user_id: string
        }
        Insert: {
          comparisons?: Json | null
          created_at?: string
          id?: string
          metrics: Json
          snapshot_date: string
          snapshot_type: string
          user_id: string
        }
        Update: {
          comparisons?: Json | null
          created_at?: string
          id?: string
          metrics?: Json
          snapshot_date?: string
          snapshot_type?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_widgets: {
        Row: {
          config: Json | null
          created_at: string
          dashboard_id: string | null
          data_source: string
          id: string
          position: Json | null
          refresh_interval_seconds: number | null
          title: string
          updated_at: string
          user_id: string
          widget_type: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          dashboard_id?: string | null
          data_source: string
          id?: string
          position?: Json | null
          refresh_interval_seconds?: number | null
          title: string
          updated_at?: string
          user_id: string
          widget_type: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          dashboard_id?: string | null
          data_source?: string
          id?: string
          position?: Json | null
          refresh_interval_seconds?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          widget_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_widgets_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "analytics_dashboards"
            referencedColumns: ["id"]
          },
        ]
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
          key_hash: string | null
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
          key_hash?: string | null
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
          key_hash?: string | null
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
      automated_campaigns: {
        Row: {
          actions: Json | null
          created_at: string
          current_metrics: Json | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          trigger_config: Json | null
          trigger_count: number | null
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json | null
          created_at?: string
          current_metrics?: Json | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          trigger_config?: Json | null
          trigger_count?: number | null
          trigger_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json | null
          created_at?: string
          current_metrics?: Json | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          trigger_config?: Json | null
          trigger_count?: number | null
          trigger_type?: string
          updated_at?: string
          user_id?: string
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
      automation_executions: {
        Row: {
          actions_log: Json | null
          completed_at: string | null
          contact_data: Json | null
          contact_email: string
          current_step: number | null
          entered_at: string | null
          flow_id: string
          id: string
          last_action_at: string | null
          status: string | null
        }
        Insert: {
          actions_log?: Json | null
          completed_at?: string | null
          contact_data?: Json | null
          contact_email: string
          current_step?: number | null
          entered_at?: string | null
          flow_id: string
          id?: string
          last_action_at?: string | null
          status?: string | null
        }
        Update: {
          actions_log?: Json | null
          completed_at?: string | null
          contact_data?: Json | null
          contact_email?: string
          current_step?: number | null
          entered_at?: string | null
          flow_id?: string
          id?: string
          last_action_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "automation_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_flows: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          stats: Json | null
          status: string | null
          steps: Json | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          stats?: Json | null
          status?: string | null
          steps?: Json | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          stats?: Json | null
          status?: string | null
          steps?: Json | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      blog_posts: {
        Row: {
          ai_generated: boolean | null
          category: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          id: string
          image_url: string | null
          publish_date: string | null
          seo_description: string | null
          seo_title: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          views: number | null
        }
        Insert: {
          ai_generated?: boolean | null
          category?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          publish_date?: string | null
          seo_description?: string | null
          seo_title?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          views?: number | null
        }
        Update: {
          ai_generated?: boolean | null
          category?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          publish_date?: string | null
          seo_description?: string | null
          seo_title?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views?: number | null
        }
        Relationships: []
      }
      bulk_order_items: {
        Row: {
          bulk_order_id: string
          carrier_code: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          notes: string | null
          product_id: string | null
          product_sku: string | null
          product_title: string
          quantity: number
          status: string | null
          supplier_id: string | null
          total_price: number | null
          tracking_number: string | null
          unit_price: number
          updated_at: string | null
          variant_info: Json | null
        }
        Insert: {
          bulk_order_id: string
          carrier_code?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          product_id?: string | null
          product_sku?: string | null
          product_title: string
          quantity?: number
          status?: string | null
          supplier_id?: string | null
          total_price?: number | null
          tracking_number?: string | null
          unit_price: number
          updated_at?: string | null
          variant_info?: Json | null
        }
        Update: {
          bulk_order_id?: string
          carrier_code?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          product_id?: string | null
          product_sku?: string | null
          product_title?: string
          quantity?: number
          status?: string | null
          supplier_id?: string | null
          total_price?: number | null
          tracking_number?: string | null
          unit_price?: number
          updated_at?: string | null
          variant_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_order_items_bulk_order_id_fkey"
            columns: ["bulk_order_id"]
            isOneToOne: false
            referencedRelation: "bulk_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_order_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_order_supplier_groups: {
        Row: {
          bulk_order_id: string
          created_at: string | null
          id: string
          items_count: number | null
          metadata: Json | null
          ordered_at: string | null
          shipping_cost: number | null
          status: string | null
          subtotal: number | null
          supplier_id: string | null
          supplier_order_number: string | null
          updated_at: string | null
        }
        Insert: {
          bulk_order_id: string
          created_at?: string | null
          id?: string
          items_count?: number | null
          metadata?: Json | null
          ordered_at?: string | null
          shipping_cost?: number | null
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          supplier_order_number?: string | null
          updated_at?: string | null
        }
        Update: {
          bulk_order_id?: string
          created_at?: string | null
          id?: string
          items_count?: number | null
          metadata?: Json | null
          ordered_at?: string | null
          shipping_cost?: number | null
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          supplier_order_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_order_supplier_groups_bulk_order_id_fkey"
            columns: ["bulk_order_id"]
            isOneToOne: false
            referencedRelation: "bulk_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_order_supplier_groups_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_orders: {
        Row: {
          completed_at: string | null
          created_at: string | null
          currency: string | null
          estimated_delivery_date: string | null
          id: string
          metadata: Json | null
          name: string | null
          notes: string | null
          order_number: string
          primary_supplier_id: string | null
          processed_at: string | null
          shipped_at: string | null
          shipping_cost: number | null
          shipping_method: string | null
          status: string | null
          submitted_at: string | null
          total_amount: number | null
          total_items: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          estimated_delivery_date?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          notes?: string | null
          order_number: string
          primary_supplier_id?: string | null
          processed_at?: string | null
          shipped_at?: string | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: string | null
          submitted_at?: string | null
          total_amount?: number | null
          total_items?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          estimated_delivery_date?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          notes?: string | null
          order_number?: string
          primary_supplier_id?: string | null
          processed_at?: string | null
          shipped_at?: string | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: string | null
          submitted_at?: string | null
          total_amount?: number | null
          total_items?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_orders_primary_supplier_id_fkey"
            columns: ["primary_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
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
      campaign_ab_tests: {
        Row: {
          auto_select_winner: boolean | null
          campaign_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          name: string
          results: Json | null
          started_at: string | null
          status: string | null
          test_type: string | null
          traffic_split: Json | null
          updated_at: string | null
          user_id: string
          variants: Json
          winner_after_hours: number | null
          winner_criteria: string | null
          winner_variant: string | null
        }
        Insert: {
          auto_select_winner?: boolean | null
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          name: string
          results?: Json | null
          started_at?: string | null
          status?: string | null
          test_type?: string | null
          traffic_split?: Json | null
          updated_at?: string | null
          user_id: string
          variants?: Json
          winner_after_hours?: number | null
          winner_criteria?: string | null
          winner_variant?: string | null
        }
        Update: {
          auto_select_winner?: boolean | null
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          name?: string
          results?: Json | null
          started_at?: string | null
          status?: string | null
          test_type?: string | null
          traffic_split?: Json | null
          updated_at?: string | null
          user_id?: string
          variants?: Json
          winner_after_hours?: number | null
          winner_criteria?: string | null
          winner_variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_ab_tests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_creatives: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          creative_type: string
          generated_assets: Json | null
          id: string
          name: string
          performance_data: Json | null
          status: string | null
          template_data: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          creative_type: string
          generated_assets?: Json | null
          id?: string
          name: string
          performance_data?: Json | null
          status?: string | null
          template_data?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          creative_type?: string
          generated_assets?: Json | null
          id?: string
          name?: string
          performance_data?: Json | null
          status?: string | null
          template_data?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      campaign_performance: {
        Row: {
          additional_metrics: Json | null
          campaign_id: string | null
          clicks: number | null
          conversions: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          platform: string
          revenue: number | null
          roas: number | null
          spend: number | null
          user_id: string
        }
        Insert: {
          additional_metrics?: Json | null
          campaign_id?: string | null
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          platform: string
          revenue?: number | null
          roas?: number | null
          spend?: number | null
          user_id: string
        }
        Update: {
          additional_metrics?: Json | null
          campaign_id?: string | null
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          platform?: string
          revenue?: number | null
          roas?: number | null
          spend?: number | null
          user_id?: string
        }
        Relationships: []
      }
      campaign_product_feeds: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          feed_type: string
          feed_url: string | null
          generation_status: string | null
          id: string
          last_generated_at: string | null
          name: string
          product_count: number | null
          settings: Json | null
          updated_at: string | null
          user_id: string
          validation_errors: Json | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          feed_type: string
          feed_url?: string | null
          generation_status?: string | null
          id?: string
          last_generated_at?: string | null
          name: string
          product_count?: number | null
          settings?: Json | null
          updated_at?: string | null
          user_id: string
          validation_errors?: Json | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          feed_type?: string
          feed_url?: string | null
          generation_status?: string | null
          id?: string
          last_generated_at?: string | null
          name?: string
          product_count?: number | null
          settings?: Json | null
          updated_at?: string | null
          user_id?: string
          validation_errors?: Json | null
        }
        Relationships: []
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          email: string
          error_message: string | null
          id: string
          metadata: Json | null
          name: string | null
          opened_at: string | null
          phone: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          opened_at?: string | null
          phone?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          opened_at?: string | null
          phone?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_stats: {
        Row: {
          bounce_rate: number | null
          campaign_id: string
          click_rate: number | null
          id: string
          open_rate: number | null
          revenue_generated: number | null
          total_bounced: number | null
          total_clicked: number | null
          total_complaints: number | null
          total_delivered: number | null
          total_opened: number | null
          total_sent: number | null
          total_unsubscribed: number | null
          unsubscribe_rate: number | null
          updated_at: string | null
        }
        Insert: {
          bounce_rate?: number | null
          campaign_id: string
          click_rate?: number | null
          id?: string
          open_rate?: number | null
          revenue_generated?: number | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_complaints?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_sent?: number | null
          total_unsubscribed?: number | null
          unsubscribe_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          bounce_rate?: number | null
          campaign_id?: string
          click_rate?: number | null
          id?: string
          open_rate?: number | null
          revenue_generated?: number | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_complaints?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_sent?: number | null
          total_unsubscribed?: number | null
          unsubscribe_rate?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_stats_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      canva_designs: {
        Row: {
          canva_design_id: string | null
          canva_integration_id: string | null
          created_at: string
          design_type: string | null
          design_url: string | null
          export_urls: Json | null
          id: string
          last_modified_at: string | null
          metadata: Json | null
          status: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          canva_design_id?: string | null
          canva_integration_id?: string | null
          created_at?: string
          design_type?: string | null
          design_url?: string | null
          export_urls?: Json | null
          id?: string
          last_modified_at?: string | null
          metadata?: Json | null
          status?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          canva_design_id?: string | null
          canva_integration_id?: string | null
          created_at?: string
          design_type?: string | null
          design_url?: string | null
          export_urls?: Json | null
          id?: string
          last_modified_at?: string | null
          metadata?: Json | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canva_designs_canva_integration_id_fkey"
            columns: ["canva_integration_id"]
            isOneToOne: false
            referencedRelation: "canva_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      canva_integrations: {
        Row: {
          access_token: string | null
          canva_brand_id: string | null
          canva_team_id: string | null
          canva_user_id: string | null
          created_at: string
          id: string
          refresh_token: string | null
          status: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          canva_brand_id?: string | null
          canva_team_id?: string | null
          canva_user_id?: string | null
          created_at?: string
          id?: string
          refresh_token?: string | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          canva_brand_id?: string | null
          canva_team_id?: string | null
          canva_user_id?: string | null
          created_at?: string
          id?: string
          refresh_token?: string | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      canva_webhook_events: {
        Row: {
          canva_design_id: string | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          processed: boolean | null
          user_id: string | null
        }
        Insert: {
          canva_design_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          processed?: boolean | null
          user_id?: string | null
        }
        Update: {
          canva_design_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          processed?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      carriers: {
        Row: {
          carrier_code: string
          config: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          tracking_url_template: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          carrier_code: string
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          tracking_url_template?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          carrier_code?: string
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          tracking_url_template?: string | null
          updated_at?: string
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
      category_mapping_rules: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_manual: boolean | null
          source_category: string
          target_category: string
          target_category_id: string | null
          target_platform: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_manual?: boolean | null
          source_category: string
          target_category: string
          target_category_id?: string | null
          target_platform: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_manual?: boolean | null
          source_category?: string
          target_category?: string
          target_category_id?: string | null
          target_platform?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      category_mappings: {
        Row: {
          auto_map_enabled: boolean | null
          created_at: string | null
          default_category: string | null
          description: string | null
          destination_id: string | null
          destination_type: string
          id: string
          is_active: boolean | null
          last_applied_at: string | null
          mappings: Json
          name: string
          products_mapped: number | null
          source_id: string | null
          source_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_map_enabled?: boolean | null
          created_at?: string | null
          default_category?: string | null
          description?: string | null
          destination_id?: string | null
          destination_type: string
          id?: string
          is_active?: boolean | null
          last_applied_at?: string | null
          mappings?: Json
          name: string
          products_mapped?: number | null
          source_id?: string | null
          source_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_map_enabled?: boolean | null
          created_at?: string | null
          default_category?: string | null
          description?: string | null
          destination_id?: string | null
          destination_type?: string
          id?: string
          is_active?: boolean | null
          last_applied_at?: string | null
          mappings?: Json
          name?: string
          products_mapped?: number | null
          source_id?: string | null
          source_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      category_suggestions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          mapping_id: string | null
          resolved_at: string | null
          source_category: string
          status: string | null
          suggested_category: string
          suggested_category_id: string | null
          user_choice: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          mapping_id?: string | null
          resolved_at?: string | null
          source_category: string
          status?: string | null
          suggested_category: string
          suggested_category_id?: string | null
          user_choice?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          mapping_id?: string | null
          resolved_at?: string | null
          source_category?: string
          status?: string | null
          suggested_category?: string
          suggested_category_id?: string | null
          user_choice?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_suggestions_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "category_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      category_taxonomies: {
        Row: {
          category_id: string
          category_name: string
          created_at: string | null
          full_path: string | null
          id: string
          is_global: boolean | null
          is_leaf: boolean | null
          level: number | null
          metadata: Json | null
          parent_id: string | null
          product_count: number | null
          taxonomy_type: string
          user_id: string | null
        }
        Insert: {
          category_id: string
          category_name: string
          created_at?: string | null
          full_path?: string | null
          id?: string
          is_global?: boolean | null
          is_leaf?: boolean | null
          level?: number | null
          metadata?: Json | null
          parent_id?: string | null
          product_count?: number | null
          taxonomy_type: string
          user_id?: string | null
        }
        Update: {
          category_id?: string
          category_name?: string
          created_at?: string | null
          full_path?: string | null
          id?: string
          is_global?: boolean | null
          is_leaf?: boolean | null
          level?: number | null
          metadata?: Json | null
          parent_id?: string | null
          product_count?: number | null
          taxonomy_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      channel_product_mappings: {
        Row: {
          channel_id: string
          created_at: string
          external_product_id: string | null
          external_sku: string | null
          id: string
          last_synced_at: string | null
          metadata: Json | null
          price_override: number | null
          product_id: string
          stock_override: number | null
          sync_errors: Json | null
          sync_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          external_product_id?: string | null
          external_sku?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          price_override?: number | null
          product_id: string
          stock_override?: number | null
          sync_errors?: Json | null
          sync_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          external_product_id?: string | null
          external_sku?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          price_override?: number | null
          product_id?: string
          stock_override?: number | null
          sync_errors?: Json | null
          sync_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_product_mappings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "sales_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_product_mappings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_sync_logs: {
        Row: {
          channel_id: string
          completed_at: string | null
          direction: string | null
          duration_ms: number | null
          error_details: Json | null
          id: string
          items_failed: number | null
          items_processed: number | null
          items_succeeded: number | null
          started_at: string
          status: string | null
          sync_type: string
          user_id: string
        }
        Insert: {
          channel_id: string
          completed_at?: string | null
          direction?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          id?: string
          items_failed?: number | null
          items_processed?: number | null
          items_succeeded?: number | null
          started_at?: string
          status?: string | null
          sync_type: string
          user_id: string
        }
        Update: {
          channel_id?: string
          completed_at?: string | null
          direction?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          id?: string
          items_failed?: number | null
          items_processed?: number | null
          items_succeeded?: number | null
          started_at?: string
          status?: string | null
          sync_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_sync_logs_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "sales_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      colors: {
        Row: {
          category: string | null
          created_at: string | null
          hex_value: string
          id: string
          is_active: boolean | null
          name: string
          rgb_value: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          hex_value: string
          id?: string
          is_active?: boolean | null
          name: string
          rgb_value?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          hex_value?: string
          id?: string
          is_active?: boolean | null
          name?: string
          rgb_value?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      competitive_intelligence: {
        Row: {
          competitive_data: Json | null
          competitor_name: string
          competitor_price: number | null
          competitor_url: string | null
          created_at: string | null
          id: string
          last_checked_at: string | null
          market_position: string | null
          price_analysis: Json | null
          price_difference: number | null
          product_id: string | null
          recommendations: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          competitive_data?: Json | null
          competitor_name: string
          competitor_price?: number | null
          competitor_url?: string | null
          created_at?: string | null
          id?: string
          last_checked_at?: string | null
          market_position?: string | null
          price_analysis?: Json | null
          price_difference?: number | null
          product_id?: string | null
          recommendations?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          competitive_data?: Json | null
          competitor_name?: string
          competitor_price?: number | null
          competitor_url?: string | null
          created_at?: string | null
          id?: string
          last_checked_at?: string | null
          market_position?: string | null
          price_analysis?: Json | null
          price_difference?: number | null
          product_id?: string | null
          recommendations?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitive_intelligence_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_ads: {
        Row: {
          ad_cta: string | null
          ad_headline: string | null
          ad_id: string | null
          ad_text: string | null
          advertiser_name: string | null
          age_range: string | null
          ai_analysis: Json | null
          countries: string[] | null
          created_at: string | null
          engagement_score: number | null
          estimated_reach: number | null
          estimated_spend_max: number | null
          estimated_spend_min: number | null
          first_seen_at: string | null
          gender_targeting: string | null
          id: string
          image_urls: string[] | null
          interests: string[] | null
          is_active: boolean | null
          landing_page_url: string | null
          last_seen_at: string | null
          platform: string
          product_category: string | null
          running_days: number | null
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          ad_cta?: string | null
          ad_headline?: string | null
          ad_id?: string | null
          ad_text?: string | null
          advertiser_name?: string | null
          age_range?: string | null
          ai_analysis?: Json | null
          countries?: string[] | null
          created_at?: string | null
          engagement_score?: number | null
          estimated_reach?: number | null
          estimated_spend_max?: number | null
          estimated_spend_min?: number | null
          first_seen_at?: string | null
          gender_targeting?: string | null
          id?: string
          image_urls?: string[] | null
          interests?: string[] | null
          is_active?: boolean | null
          landing_page_url?: string | null
          last_seen_at?: string | null
          platform: string
          product_category?: string | null
          running_days?: number | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          ad_cta?: string | null
          ad_headline?: string | null
          ad_id?: string | null
          ad_text?: string | null
          advertiser_name?: string | null
          age_range?: string | null
          ai_analysis?: Json | null
          countries?: string[] | null
          created_at?: string | null
          engagement_score?: number | null
          estimated_reach?: number | null
          estimated_spend_max?: number | null
          estimated_spend_min?: number | null
          first_seen_at?: string | null
          gender_targeting?: string | null
          id?: string
          image_urls?: string[] | null
          interests?: string[] | null
          is_active?: boolean | null
          landing_page_url?: string | null
          last_seen_at?: string | null
          platform?: string
          product_category?: string | null
          running_days?: number | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          responded_at: string | null
          response_notes: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          responded_at?: string | null
          response_notes?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          responded_at?: string | null
          response_notes?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      content_ab_tests: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          ended_at: string | null
          id: string
          results: Json | null
          started_at: string | null
          status: string | null
          test_element: string
          test_name: string
          updated_at: string
          user_id: string
          variants: Json
          winner_criteria: string | null
          winner_variant_id: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          ended_at?: string | null
          id?: string
          results?: Json | null
          started_at?: string | null
          status?: string | null
          test_element: string
          test_name: string
          updated_at?: string
          user_id: string
          variants: Json
          winner_criteria?: string | null
          winner_variant_id?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          results?: Json | null
          started_at?: string | null
          status?: string | null
          test_element?: string
          test_name?: string
          updated_at?: string
          user_id?: string
          variants?: Json
          winner_criteria?: string | null
          winner_variant_id?: string | null
        }
        Relationships: []
      }
      content_analytics: {
        Row: {
          avg_read_time: number | null
          content_id: string
          content_type: string
          conversions: number | null
          created_at: string
          cta_clicks: number | null
          date: string
          device_breakdown: Json | null
          id: string
          revenue_generated: number | null
          scroll_depth: number | null
          shares: number | null
          source_breakdown: Json | null
          unique_views: number | null
          user_id: string
          views: number | null
        }
        Insert: {
          avg_read_time?: number | null
          content_id: string
          content_type: string
          conversions?: number | null
          created_at?: string
          cta_clicks?: number | null
          date?: string
          device_breakdown?: Json | null
          id?: string
          revenue_generated?: number | null
          scroll_depth?: number | null
          shares?: number | null
          source_breakdown?: Json | null
          unique_views?: number | null
          user_id: string
          views?: number | null
        }
        Update: {
          avg_read_time?: number | null
          content_id?: string
          content_type?: string
          conversions?: number | null
          created_at?: string
          cta_clicks?: number | null
          date?: string
          device_breakdown?: Json | null
          id?: string
          revenue_generated?: number | null
          scroll_depth?: number | null
          shares?: number | null
          source_breakdown?: Json | null
          unique_views?: number | null
          user_id?: string
          views?: number | null
        }
        Relationships: []
      }
      content_calendar: {
        Row: {
          color: string | null
          content_id: string | null
          content_type: string
          created_at: string
          id: string
          notes: string | null
          platform: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          content_id?: string | null
          content_type: string
          created_at?: string
          id?: string
          notes?: string | null
          platform?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          content_id?: string | null
          content_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          platform?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_library: {
        Row: {
          ai_generated: boolean | null
          content: string
          content_type: string
          created_at: string
          id: string
          is_favorite: boolean | null
          metadata: Json | null
          tags: string[] | null
          title: string
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          content: string
          content_type: string
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          metadata?: Json | null
          tags?: string[] | null
          title: string
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          ai_generated?: boolean | null
          content?: string
          content_type?: string
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          metadata?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      content_optimizations: {
        Row: {
          applied_at: string | null
          created_at: string | null
          id: string
          is_applied: boolean | null
          optimization_score: number | null
          optimization_type: string
          optimized_content: Json | null
          original_content: Json | null
          platform: string
          product_id: string | null
          suggestions: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string | null
          id?: string
          is_applied?: boolean | null
          optimization_score?: number | null
          optimization_type: string
          optimized_content?: Json | null
          original_content?: Json | null
          platform: string
          product_id?: string | null
          suggestions?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string | null
          id?: string
          is_applied?: boolean | null
          optimization_score?: number | null
          optimization_type?: string
          optimized_content?: Json | null
          original_content?: Json | null
          platform?: string
          product_id?: string | null
          suggestions?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_optimizations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      content_team_members: {
        Row: {
          accepted_at: string | null
          id: string
          invited_at: string
          is_active: boolean | null
          member_email: string
          member_user_id: string | null
          permissions: Json | null
          role: Database["public"]["Enums"]["content_role"]
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          is_active?: boolean | null
          member_email: string
          member_user_id?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["content_role"]
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          is_active?: boolean | null
          member_email?: string
          member_user_id?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["content_role"]
          user_id?: string
        }
        Relationships: []
      }
      content_templates: {
        Row: {
          category: string | null
          content: Json
          created_at: string
          id: string
          is_favorite: boolean | null
          name: string
          template_type: string
          updated_at: string
          usage_count: number | null
          user_id: string
          variables: string[] | null
        }
        Insert: {
          category?: string | null
          content?: Json
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          name: string
          template_type: string
          updated_at?: string
          usage_count?: number | null
          user_id: string
          variables?: string[] | null
        }
        Update: {
          category?: string | null
          content?: Json
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          name?: string
          template_type?: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      content_translations: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          original_content: Json
          quality_score: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_language: string
          target_language: string
          translated_content: Json
          translation_status: string
          translator_notes: string | null
          translator_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          original_content: Json
          quality_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_language?: string
          target_language: string
          translated_content: Json
          translation_status?: string
          translator_notes?: string | null
          translator_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          original_content?: Json
          quality_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_language?: string
          target_language?: string
          translated_content?: Json
          translation_status?: string
          translator_notes?: string | null
          translator_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_versions: {
        Row: {
          change_summary: string | null
          content_id: string
          content_snapshot: Json
          content_type: string
          created_at: string
          created_by: string
          id: string
          is_auto_backup: boolean | null
          user_id: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          content_id: string
          content_snapshot: Json
          content_type: string
          created_at?: string
          created_by: string
          id?: string
          is_auto_backup?: boolean | null
          user_id: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          content_id?: string
          content_snapshot?: Json
          content_type?: string
          created_at?: string
          created_by?: string
          id?: string
          is_auto_backup?: boolean | null
          user_id?: string
          version_number?: number
        }
        Relationships: []
      }
      content_workflows: {
        Row: {
          assigned_to: string | null
          comments: Json | null
          content_id: string
          content_type: string
          created_at: string
          current_status: string
          due_date: string | null
          history: Json | null
          id: string
          priority: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          comments?: Json | null
          content_id: string
          content_type: string
          created_at?: string
          current_status?: string
          due_date?: string | null
          history?: Json | null
          id?: string
          priority?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          comments?: Json | null
          content_id?: string
          content_type?: string
          created_at?: string
          current_status?: string
          due_date?: string | null
          history?: Json | null
          id?: string
          priority?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversion_events: {
        Row: {
          campaign_id: string | null
          created_at: string
          customer_id: string | null
          event_data: Json | null
          event_type: string
          id: string
          revenue: number | null
          source: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          customer_id?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          revenue?: number | null
          source?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          customer_id?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          revenue?: number | null
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_loyalty: {
        Row: {
          available_points: number
          created_at: string
          customer_id: string | null
          id: string
          lifetime_points: number
          tier_id: string | null
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_points?: number
          created_at?: string
          customer_id?: string | null
          id?: string
          lifetime_points?: number
          tier_id?: string | null
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_points?: number
          created_at?: string
          customer_id?: string | null
          id?: string
          lifetime_points?: number
          tier_id?: string | null
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_loyalty_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_loyalty_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_rfm_scores: {
        Row: {
          avg_order_value: number | null
          calculated_at: string
          customer_id: string
          days_since_last_order: number | null
          frequency_score: number | null
          id: string
          monetary_score: number | null
          recency_score: number | null
          rfm_segment: string | null
          total_orders: number | null
          total_spent: number | null
          user_id: string
        }
        Insert: {
          avg_order_value?: number | null
          calculated_at?: string
          customer_id: string
          days_since_last_order?: number | null
          frequency_score?: number | null
          id?: string
          monetary_score?: number | null
          recency_score?: number | null
          rfm_segment?: string | null
          total_orders?: number | null
          total_spent?: number | null
          user_id: string
        }
        Update: {
          avg_order_value?: number | null
          calculated_at?: string
          customer_id?: string
          days_since_last_order?: number | null
          frequency_score?: number | null
          id?: string
          monetary_score?: number | null
          recency_score?: number | null
          rfm_segment?: string | null
          total_orders?: number | null
          total_spent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_rfm_scores_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segment_members: {
        Row: {
          added_at: string
          customer_id: string
          id: string
          metadata: Json | null
          score: number | null
          segment_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          customer_id: string
          id?: string
          metadata?: Json | null
          score?: number | null
          segment_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          customer_id?: string
          id?: string
          metadata?: Json | null
          score?: number | null
          segment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_segment_members_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segment_members_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segments: {
        Row: {
          auto_update: boolean | null
          avg_order_value: number | null
          created_at: string
          customer_count: number | null
          description: string | null
          id: string
          is_active: boolean | null
          last_calculated_at: string | null
          name: string
          rules: Json | null
          segment_type: string | null
          tags: string[] | null
          total_revenue: number | null
          update_frequency: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_update?: boolean | null
          avg_order_value?: number | null
          created_at?: string
          customer_count?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_calculated_at?: string | null
          name: string
          rules?: Json | null
          segment_type?: string | null
          tags?: string[] | null
          total_revenue?: number | null
          update_frequency?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_update?: boolean | null
          avg_order_value?: number | null
          created_at?: string
          customer_count?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_calculated_at?: string | null
          name?: string
          rules?: Json | null
          segment_type?: string | null
          tags?: string[] | null
          total_revenue?: number | null
          update_frequency?: string | null
          updated_at?: string
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
      deliverability_stats: {
        Row: {
          bounced_count: number | null
          clicked_count: number | null
          complained_count: number | null
          date: string
          delivered_count: number | null
          domain: string | null
          id: string
          opened_count: number | null
          reputation_score: number | null
          sent_count: number | null
          user_id: string
        }
        Insert: {
          bounced_count?: number | null
          clicked_count?: number | null
          complained_count?: number | null
          date?: string
          delivered_count?: number | null
          domain?: string | null
          id?: string
          opened_count?: number | null
          reputation_score?: number | null
          sent_count?: number | null
          user_id: string
        }
        Update: {
          bounced_count?: number | null
          clicked_count?: number | null
          complained_count?: number | null
          date?: string
          delivered_count?: number | null
          domain?: string | null
          id?: string
          opened_count?: number | null
          reputation_score?: number | null
          sent_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      dynamic_ad_campaigns: {
        Row: {
          bid_amount: number | null
          bid_strategy: string | null
          budget_daily: number | null
          budget_spent: number | null
          budget_total: number | null
          campaign_type: string
          created_at: string | null
          creative_template: Json | null
          description: string | null
          id: string
          name: string
          performance_metrics: Json | null
          platforms: Json | null
          product_filter: Json | null
          schedule_end: string | null
          schedule_start: string | null
          status: string | null
          targeting_rules: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bid_amount?: number | null
          bid_strategy?: string | null
          budget_daily?: number | null
          budget_spent?: number | null
          budget_total?: number | null
          campaign_type: string
          created_at?: string | null
          creative_template?: Json | null
          description?: string | null
          id?: string
          name: string
          performance_metrics?: Json | null
          platforms?: Json | null
          product_filter?: Json | null
          schedule_end?: string | null
          schedule_start?: string | null
          status?: string | null
          targeting_rules?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bid_amount?: number | null
          bid_strategy?: string | null
          budget_daily?: number | null
          budget_spent?: number | null
          budget_total?: number | null
          campaign_type?: string
          created_at?: string | null
          creative_template?: Json | null
          description?: string | null
          id?: string
          name?: string
          performance_metrics?: Json | null
          platforms?: Json | null
          product_filter?: Json | null
          schedule_end?: string | null
          schedule_start?: string | null
          status?: string | null
          targeting_rules?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          created_at: string | null
          html_content: string | null
          id: string
          name: string
          recipient_count: number | null
          scheduled_at: string | null
          segment_id: string | null
          sent_at: string | null
          sent_count: number | null
          settings: Json | null
          status: string | null
          subject: string
          template_id: string | null
          text_content: string | null
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          html_content?: string | null
          id?: string
          name: string
          recipient_count?: number | null
          scheduled_at?: string | null
          segment_id?: string | null
          sent_at?: string | null
          sent_count?: number | null
          settings?: Json | null
          status?: string | null
          subject: string
          template_id?: string | null
          text_content?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          html_content?: string | null
          id?: string
          name?: string
          recipient_count?: number | null
          scheduled_at?: string | null
          segment_id?: string | null
          sent_at?: string | null
          sent_count?: number | null
          settings?: Json | null
          status?: string | null
          subject?: string
          template_id?: string | null
          text_content?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sending_logs: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          event_data: Json | null
          id: string
          ip_address: string | null
          message_id: string | null
          provider: string | null
          recipient_email: string
          status: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          id?: string
          ip_address?: string | null
          message_id?: string | null
          provider?: string | null
          recipient_email: string
          status?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          id?: string
          ip_address?: string | null
          message_id?: string | null
          provider?: string | null
          recipient_email?: string
          status?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sending_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string | null
          created_at: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          text_content: string | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
          variables: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          text_content?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
          variables?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          text_content?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
          variables?: Json | null
        }
        Relationships: []
      }
      email_unsubscribes: {
        Row: {
          campaign_id: string | null
          email: string
          id: string
          reason: string | null
          unsubscribed_at: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          email: string
          id?: string
          reason?: string | null
          unsubscribed_at?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          email?: string
          id?: string
          reason?: string | null
          unsubscribed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_unsubscribes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
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
      extension_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          extension_id: string
          id: string
          is_active: boolean
          last_used_at: string | null
          metadata: Json | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          extension_id?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          metadata?: Json | null
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          extension_id?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          metadata?: Json | null
          token?: string
          user_id?: string
        }
        Relationships: []
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
      feed_generations: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          error_message: string | null
          failed_products: number | null
          feed_id: string
          generation_type: string | null
          id: string
          output_url: string | null
          processed_products: number | null
          started_at: string | null
          status: string | null
          successful_products: number | null
          total_products: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          failed_products?: number | null
          feed_id: string
          generation_type?: string | null
          id?: string
          output_url?: string | null
          processed_products?: number | null
          started_at?: string | null
          status?: string | null
          successful_products?: number | null
          total_products?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          failed_products?: number | null
          feed_id?: string
          generation_type?: string | null
          id?: string
          output_url?: string | null
          processed_products?: number | null
          started_at?: string | null
          status?: string | null
          successful_products?: number | null
          total_products?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_generations_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "marketplace_feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_products: {
        Row: {
          created_at: string | null
          currency: string | null
          description_score: number | null
          exclusion_reason: string | null
          feed_id: string
          feed_price: number | null
          id: string
          image_score: number | null
          is_excluded: boolean | null
          optimized_category: string | null
          optimized_description: string | null
          optimized_images: string[] | null
          optimized_tags: string[] | null
          optimized_title: string | null
          original_price: number | null
          platform_category_id: string | null
          seo_score: number | null
          source_product_id: string | null
          source_sku: string
          title_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description_score?: number | null
          exclusion_reason?: string | null
          feed_id: string
          feed_price?: number | null
          id?: string
          image_score?: number | null
          is_excluded?: boolean | null
          optimized_category?: string | null
          optimized_description?: string | null
          optimized_images?: string[] | null
          optimized_tags?: string[] | null
          optimized_title?: string | null
          original_price?: number | null
          platform_category_id?: string | null
          seo_score?: number | null
          source_product_id?: string | null
          source_sku: string
          title_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description_score?: number | null
          exclusion_reason?: string | null
          feed_id?: string
          feed_price?: number | null
          id?: string
          image_score?: number | null
          is_excluded?: boolean | null
          optimized_category?: string | null
          optimized_description?: string | null
          optimized_images?: string[] | null
          optimized_tags?: string[] | null
          optimized_title?: string | null
          original_price?: number | null
          platform_category_id?: string | null
          seo_score?: number | null
          source_product_id?: string | null
          source_sku?: string
          title_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_products_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "marketplace_feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_rule_executions: {
        Row: {
          changes_summary: Json | null
          error_message: string | null
          executed_at: string | null
          execution_time_ms: number | null
          feed_id: string | null
          id: string
          products_matched: number | null
          products_modified: number | null
          rule_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          changes_summary?: Json | null
          error_message?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          feed_id?: string | null
          id?: string
          products_matched?: number | null
          products_modified?: number | null
          rule_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          changes_summary?: Json | null
          error_message?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          feed_id?: string | null
          id?: string
          products_matched?: number | null
          products_modified?: number | null
          rule_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_rule_executions_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "campaign_product_feeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_rule_executions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "feed_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_rule_templates: {
        Row: {
          actions: Json
          category: string | null
          conditions: Json
          created_at: string | null
          description: string | null
          id: string
          is_global: boolean | null
          match_type: string | null
          name: string
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          actions?: Json
          category?: string | null
          conditions?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_global?: boolean | null
          match_type?: string | null
          name: string
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          actions?: Json
          category?: string | null
          conditions?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_global?: boolean | null
          match_type?: string | null
          name?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      feed_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string | null
          description: string | null
          execution_count: number | null
          feed_id: string | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          match_type: string | null
          name: string
          priority: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          feed_id?: string | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          match_type?: string | null
          name: string
          priority?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          feed_id?: string | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          match_type?: string | null
          name?: string
          priority?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_rules_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "campaign_product_feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      field_mappings: {
        Row: {
          created_at: string | null
          default_value: string | null
          id: string
          integration_id: string | null
          is_required: boolean | null
          source_entity: string
          source_field: string
          target_entity: string
          target_field: string
          transformation_rule: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          id?: string
          integration_id?: string | null
          is_required?: boolean | null
          source_entity: string
          source_field: string
          target_entity: string
          target_field: string
          transformation_rule?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          id?: string
          integration_id?: string | null
          is_required?: boolean | null
          source_entity?: string
          source_field?: string
          target_entity?: string
          target_field?: string
          transformation_rule?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fulfillment_carriers: {
        Row: {
          account_number: string | null
          api_key_encrypted: string | null
          api_secret_encrypted: string | null
          carrier_code: string
          carrier_name: string
          created_at: string | null
          default_service: string | null
          id: string
          is_active: boolean | null
          supported_services: Json | null
          tracking_url_template: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          carrier_code: string
          carrier_name: string
          created_at?: string | null
          default_service?: string | null
          id?: string
          is_active?: boolean | null
          supported_services?: Json | null
          tracking_url_template?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          carrier_code?: string
          carrier_name?: string
          created_at?: string | null
          default_service?: string | null
          id?: string
          is_active?: boolean | null
          supported_services?: Json | null
          tracking_url_template?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fulfillment_shipments: {
        Row: {
          carrier_code: string | null
          carrier_id: string | null
          created_at: string | null
          delivered_at: string | null
          dimensions: Json | null
          estimated_delivery: string | null
          id: string
          label_data: Json | null
          label_url: string | null
          order_id: string | null
          service_code: string | null
          shipped_at: string | null
          shipping_cost: number | null
          status: string | null
          tracking_events: Json | null
          tracking_number: string | null
          updated_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          carrier_code?: string | null
          carrier_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          dimensions?: Json | null
          estimated_delivery?: string | null
          id?: string
          label_data?: Json | null
          label_url?: string | null
          order_id?: string | null
          service_code?: string | null
          shipped_at?: string | null
          shipping_cost?: number | null
          status?: string | null
          tracking_events?: Json | null
          tracking_number?: string | null
          updated_at?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          carrier_code?: string | null
          carrier_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          dimensions?: Json | null
          estimated_delivery?: string | null
          id?: string
          label_data?: Json | null
          label_url?: string | null
          order_id?: string | null
          service_code?: string | null
          shipped_at?: string | null
          shipping_cost?: number | null
          status?: string | null
          tracking_events?: Json | null
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_shipments_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "fulfillment_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      gdpr_consents: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          granted_at: string | null
          id: string
          ip_address: string | null
          revoked_at: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      import_history: {
        Row: {
          action_type: string
          created_at: string | null
          error_message: string | null
          id: string
          import_job_id: string | null
          metadata: Json | null
          shopify_product_id: string | null
          status: string | null
          supplier_product_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          import_job_id?: string | null
          metadata?: Json | null
          shopify_product_id?: string | null
          status?: string | null
          supplier_product_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          import_job_id?: string | null
          metadata?: Json | null
          shopify_product_id?: string | null
          status?: string | null
          supplier_product_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_history_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
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
          brand: string | null
          category: string | null
          cost_price: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          image_urls: string[] | null
          import_job_id: string | null
          metadata: Json | null
          name: string | null
          price: number | null
          product_id: string | null
          sku: string | null
          source_platform: string | null
          source_url: string | null
          status: string | null
          stock_quantity: number | null
          supplier_name: string | null
          supplier_product_id: string | null
          sync_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          import_job_id?: string | null
          metadata?: Json | null
          name?: string | null
          price?: number | null
          product_id?: string | null
          sku?: string | null
          source_platform?: string | null
          source_url?: string | null
          status?: string | null
          stock_quantity?: number | null
          supplier_name?: string | null
          supplier_product_id?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          import_job_id?: string | null
          metadata?: Json | null
          name?: string | null
          price?: number | null
          product_id?: string | null
          sku?: string | null
          source_platform?: string | null
          source_url?: string | null
          status?: string | null
          stock_quantity?: number | null
          supplier_name?: string | null
          supplier_product_id?: string | null
          sync_status?: string | null
          updated_at?: string | null
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
          auto_sync_config: Json | null
          auto_sync_enabled: boolean | null
          auto_sync_interval: number | null
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
          auto_sync_config?: Json | null
          auto_sync_enabled?: boolean | null
          auto_sync_interval?: number | null
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
          auto_sync_config?: Json | null
          auto_sync_enabled?: boolean | null
          auto_sync_interval?: number | null
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
      invoice_history: {
        Row: {
          amount: number | null
          created_at: string
          customer_id: string | null
          due_date: string | null
          id: string
          invoice_number: string
          metadata: Json | null
          paid_at: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          metadata?: Json | null
          paid_at?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          metadata?: Json | null
          paid_at?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_templates: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          template_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          template_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          template_data?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      landing_pages: {
        Row: {
          content: Json
          created_at: string
          description: string | null
          id: string
          og_image: string | null
          page_type: string | null
          published_at: string | null
          published_by: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string | null
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          og_image?: string | null
          page_type?: string | null
          published_at?: string | null
          published_by?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          og_image?: string | null
          page_type?: string | null
          published_at?: string | null
          published_by?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      loyalty_rewards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          points_cost: number
          stock: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_cost?: number
          stock?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_cost?: number
          stock?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_tiers: {
        Row: {
          benefits: Json | null
          color: string | null
          created_at: string
          discount_percent: number | null
          icon: string | null
          id: string
          min_points: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          benefits?: Json | null
          color?: string | null
          created_at?: string
          discount_percent?: number | null
          icon?: string | null
          id?: string
          min_points?: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          benefits?: Json | null
          color?: string | null
          created_at?: string
          discount_percent?: number | null
          icon?: string | null
          id?: string
          min_points?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          customer_loyalty_id: string | null
          description: string | null
          id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_loyalty_id?: string | null
          description?: string | null
          id?: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_loyalty_id?: string | null
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_loyalty_id_fkey"
            columns: ["customer_loyalty_id"]
            isOneToOne: false
            referencedRelation: "customer_loyalty"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_ai_images: {
        Row: {
          category: string | null
          created_at: string
          height: number | null
          id: string
          image_base64: string | null
          image_url: string | null
          metadata: Json | null
          model: string | null
          prompt: string
          style: string | null
          user_id: string
          width: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          height?: number | null
          id?: string
          image_base64?: string | null
          image_url?: string | null
          metadata?: Json | null
          model?: string | null
          prompt: string
          style?: string | null
          user_id: string
          width?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          height?: number | null
          id?: string
          image_base64?: string | null
          image_url?: string | null
          metadata?: Json | null
          model?: string | null
          prompt?: string
          style?: string | null
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          budget: number | null
          budget_spent: number | null
          created_at: string
          end_date: string | null
          id: string
          metrics: Json | null
          name: string
          start_date: string | null
          status: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number | null
          budget_spent?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          metrics?: Json | null
          name: string
          start_date?: string | null
          status?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number | null
          budget_spent?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          metrics?: Json | null
          name?: string
          start_date?: string | null
          status?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketing_segments: {
        Row: {
          contact_count: number | null
          created_at: string
          criteria: Json | null
          description: string | null
          id: string
          is_dynamic: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_count?: number | null
          created_at?: string
          criteria?: Json | null
          description?: string | null
          id?: string
          is_dynamic?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_count?: number | null
          created_at?: string
          criteria?: Json | null
          description?: string | null
          id?: string
          is_dynamic?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_connections: {
        Row: {
          api_version: string | null
          created_at: string | null
          credentials_encrypted: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_status: string | null
          name: string
          platform: string
          settings: Json | null
          shop_domain: string | null
          sync_enabled: boolean | null
          sync_frequency: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_version?: string | null
          created_at?: string | null
          credentials_encrypted?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          name: string
          platform: string
          settings?: Json | null
          shop_domain?: string | null
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_version?: string | null
          created_at?: string | null
          credentials_encrypted?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          name?: string
          platform?: string
          settings?: Json | null
          shop_domain?: string | null
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      marketplace_feeds: {
        Row: {
          auto_categorize: boolean | null
          clicks: number | null
          conversions: number | null
          created_at: string | null
          feed_url: string | null
          format: string
          id: string
          impressions: number | null
          last_generated_at: string | null
          name: string
          next_update_at: string | null
          optimize_descriptions: boolean | null
          optimize_titles: boolean | null
          platform: string
          product_count: number | null
          settings: Json | null
          status: string | null
          target_country: string | null
          update_frequency_hours: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_categorize?: boolean | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          feed_url?: string | null
          format?: string
          id?: string
          impressions?: number | null
          last_generated_at?: string | null
          name: string
          next_update_at?: string | null
          optimize_descriptions?: boolean | null
          optimize_titles?: boolean | null
          platform?: string
          product_count?: number | null
          settings?: Json | null
          status?: string | null
          target_country?: string | null
          update_frequency_hours?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_categorize?: boolean | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          feed_url?: string | null
          format?: string
          id?: string
          impressions?: number | null
          last_generated_at?: string | null
          name?: string
          next_update_at?: string | null
          optimize_descriptions?: boolean | null
          optimize_titles?: boolean | null
          platform?: string
          product_count?: number | null
          settings?: Json | null
          status?: string | null
          target_country?: string | null
          update_frequency_hours?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      marketplace_product_mappings: {
        Row: {
          connection_id: string | null
          created_at: string | null
          external_product_id: string | null
          external_sku: string | null
          external_variant_id: string | null
          field_mappings: Json | null
          id: string
          last_synced_at: string | null
          price_override: number | null
          product_id: string | null
          stock_override: number | null
          sync_error: string | null
          sync_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string | null
          external_product_id?: string | null
          external_sku?: string | null
          external_variant_id?: string | null
          field_mappings?: Json | null
          id?: string
          last_synced_at?: string | null
          price_override?: number | null
          product_id?: string | null
          stock_override?: number | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string | null
          external_product_id?: string | null
          external_sku?: string | null
          external_variant_id?: string | null
          field_mappings?: Json | null
          id?: string
          last_synced_at?: string | null
          price_override?: number | null
          product_id?: string | null
          stock_override?: number | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt_text: string | null
          category: string | null
          created_at: string
          description: string | null
          duration: number | null
          file_name: string
          file_path: string
          file_size: number
          file_url: string
          folder_path: string | null
          height: number | null
          id: string
          is_favorite: boolean | null
          media_type: string
          metadata: Json | null
          mime_type: string
          original_name: string
          tags: string[] | null
          title: string | null
          updated_at: string
          usage_count: number | null
          usage_rights: Json | null
          user_id: string
          variants: Json | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          file_name: string
          file_path: string
          file_size?: number
          file_url: string
          folder_path?: string | null
          height?: number | null
          id?: string
          is_favorite?: boolean | null
          media_type?: string
          metadata?: Json | null
          mime_type: string
          original_name: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          usage_count?: number | null
          usage_rights?: Json | null
          user_id: string
          variants?: Json | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_url?: string
          folder_path?: string | null
          height?: number | null
          id?: string
          is_favorite?: boolean | null
          media_type?: string
          metadata?: Json | null
          mime_type?: string
          original_name?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          usage_count?: number | null
          usage_rights?: Json | null
          user_id?: string
          variants?: Json | null
          width?: number | null
        }
        Relationships: []
      }
      media_folders: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          parent_id: string | null
          path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "media_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          categories: Json | null
          created_at: string
          digest_frequency: string | null
          email_enabled: boolean | null
          id: string
          push_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sms_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          categories?: Json | null
          created_at?: string
          digest_frequency?: string | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          categories?: Json | null
          created_at?: string
          digest_frequency?: string | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean | null
          updated_at?: string
          user_id?: string
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
      page_components: {
        Row: {
          category: string
          component_data: Json
          created_at: string
          description: string | null
          id: string
          is_premium: boolean | null
          is_public: boolean | null
          name: string
          thumbnail_url: string | null
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          category: string
          component_data: Json
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean | null
          is_public?: boolean | null
          name: string
          thumbnail_url?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          category?: string
          component_data?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean | null
          is_public?: boolean | null
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
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
      platform_metrics: {
        Row: {
          conversion_rate: number | null
          created_at: string | null
          id: string
          metric_date: string
          platform: string
          roas: number | null
          total_fees: number | null
          total_orders: number | null
          total_profit: number | null
          total_revenue: number | null
          updated_at: string | null
          user_id: string
          views: number | null
        }
        Insert: {
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          metric_date?: string
          platform: string
          roas?: number | null
          total_fees?: number | null
          total_orders?: number | null
          total_profit?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id: string
          views?: number | null
        }
        Update: {
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          metric_date?: string
          platform?: string
          roas?: number | null
          total_fees?: number | null
          total_orders?: number | null
          total_profit?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id?: string
          views?: number | null
        }
        Relationships: []
      }
      platform_sync_configs: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          platform: string
          sync_frequency: string | null
          sync_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform: string
          sync_frequency?: string | null
          sync_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform?: string
          sync_frequency?: string | null
          sync_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          items_failed: number | null
          items_synced: number | null
          platform: string
          started_at: string | null
          status: string | null
          sync_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          items_failed?: number | null
          items_synced?: number | null
          platform: string
          started_at?: string | null
          status?: string | null
          sync_type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          items_failed?: number | null
          items_synced?: number | null
          platform?: string
          started_at?: string | null
          status?: string | null
          sync_type?: string
          user_id?: string
        }
        Relationships: []
      }
      ppc_feed_links: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          description: string | null
          feed_id: string | null
          field_mappings: Json | null
          filters: Json | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          name: string
          next_sync_at: string | null
          platform: string
          products_synced: number | null
          sync_errors: Json | null
          sync_frequency: string | null
          sync_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          feed_id?: string | null
          field_mappings?: Json | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name: string
          next_sync_at?: string | null
          platform: string
          products_synced?: number | null
          sync_errors?: Json | null
          sync_frequency?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          feed_id?: string | null
          field_mappings?: Json | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string
          next_sync_at?: string | null
          platform?: string
          products_synced?: number | null
          sync_errors?: Json | null
          sync_frequency?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppc_feed_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppc_feed_links_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "campaign_product_feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      ppc_link_performance: {
        Row: {
          clicks: number | null
          conversions: number | null
          cpc: number | null
          created_at: string | null
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          link_id: string | null
          products_active: number | null
          products_converting: number | null
          revenue: number | null
          roas: number | null
          spend: number | null
          user_id: string
        }
        Insert: {
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          link_id?: string | null
          products_active?: number | null
          products_converting?: number | null
          revenue?: number | null
          roas?: number | null
          spend?: number | null
          user_id: string
        }
        Update: {
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          link_id?: string | null
          products_active?: number | null
          products_converting?: number | null
          revenue?: number | null
          roas?: number | null
          spend?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppc_link_performance_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "ppc_feed_links"
            referencedColumns: ["id"]
          },
        ]
      }
      ppc_sync_logs: {
        Row: {
          completed_at: string | null
          duration_ms: number | null
          error_details: Json | null
          errors_count: number | null
          id: string
          link_id: string | null
          products_added: number | null
          products_processed: number | null
          products_removed: number | null
          products_updated: number | null
          started_at: string | null
          status: string | null
          sync_type: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          errors_count?: number | null
          id?: string
          link_id?: string | null
          products_added?: number | null
          products_processed?: number | null
          products_removed?: number | null
          products_updated?: number | null
          started_at?: string | null
          status?: string | null
          sync_type?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          errors_count?: number | null
          id?: string
          link_id?: string | null
          products_added?: number | null
          products_processed?: number | null
          products_removed?: number | null
          products_updated?: number | null
          started_at?: string | null
          status?: string | null
          sync_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppc_sync_logs_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "ppc_feed_links"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_supplier_connections: {
        Row: {
          connection_status: string | null
          created_at: string | null
          credentials_encrypted: string | null
          error_message: string | null
          id: string
          last_sync_at: string | null
          premium_supplier_id: string | null
          settings: Json | null
          sync_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connection_status?: string | null
          created_at?: string | null
          credentials_encrypted?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          premium_supplier_id?: string | null
          settings?: Json | null
          sync_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connection_status?: string | null
          created_at?: string | null
          credentials_encrypted?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          premium_supplier_id?: string | null
          settings?: Json | null
          sync_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_supplier_connections_premium_supplier_id_fkey"
            columns: ["premium_supplier_id"]
            isOneToOne: false
            referencedRelation: "premium_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_suppliers: {
        Row: {
          api_type: string | null
          avg_shipping_days: number | null
          category: string | null
          country: string | null
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_featured: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          min_order_value: number | null
          name: string
          pricing_info: Json | null
          rating: number | null
          review_count: number | null
          slug: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          api_type?: string | null
          avg_shipping_days?: number | null
          category?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          min_order_value?: number | null
          name: string
          pricing_info?: Json | null
          rating?: number | null
          review_count?: number | null
          slug?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          api_type?: string | null
          avg_shipping_days?: number | null
          category?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          min_order_value?: number | null
          name?: string
          pricing_info?: Json | null
          rating?: number | null
          review_count?: number | null
          slug?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      price_history: {
        Row: {
          applied_at: string | null
          change_reason: string | null
          competitor_price: number | null
          created_at: string | null
          id: string
          margin: number | null
          new_price: number | null
          old_price: number | null
          price_change: number | null
          product_id: string | null
          rule_id: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          change_reason?: string | null
          competitor_price?: number | null
          created_at?: string | null
          id?: string
          margin?: number | null
          new_price?: number | null
          old_price?: number | null
          price_change?: number | null
          product_id?: string | null
          rule_id?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          change_reason?: string | null
          competitor_price?: number | null
          created_at?: string | null
          id?: string
          margin?: number | null
          new_price?: number | null
          old_price?: number | null
          price_change?: number | null
          product_id?: string | null
          rule_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_rule_logs: {
        Row: {
          action: string
          avg_price_change_percent: number | null
          details: Json | null
          executed_at: string | null
          id: string
          products_count: number | null
          rule_id: string | null
          total_price_change: number | null
          user_id: string
        }
        Insert: {
          action: string
          avg_price_change_percent?: number | null
          details?: Json | null
          executed_at?: string | null
          id?: string
          products_count?: number | null
          rule_id?: string | null
          total_price_change?: number | null
          user_id: string
        }
        Update: {
          action?: string
          avg_price_change_percent?: number | null
          details?: Json | null
          executed_at?: string | null
          id?: string
          products_count?: number | null
          rule_id?: string | null
          total_price_change?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_rule_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "price_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      price_rules: {
        Row: {
          apply_filter: Json | null
          apply_to: string | null
          calculation: Json
          conditions: Json
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_applied_at: string | null
          name: string
          priority: number | null
          products_affected: number | null
          rule_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          apply_filter?: Json | null
          apply_to?: string | null
          calculation?: Json
          conditions?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_applied_at?: string | null
          name: string
          priority?: number | null
          products_affected?: number | null
          rule_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          apply_filter?: Json | null
          apply_to?: string | null
          calculation?: Json
          conditions?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_applied_at?: string | null
          name?: string
          priority?: number | null
          products_affected?: number | null
          rule_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      price_simulations: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          name: string
          products_simulated: number | null
          results_summary: Json | null
          rules_applied: Json | null
          sample_results: Json | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          name: string
          products_simulated?: number | null
          results_summary?: Json | null
          rules_applied?: Json | null
          sample_results?: Json | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          name?: string
          products_simulated?: number | null
          results_summary?: Json | null
          rules_applied?: Json | null
          sample_results?: Json | null
          status?: string | null
          user_id?: string
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
      pricing_rules: {
        Row: {
          actions: Json | null
          conditions: Json | null
          created_at: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          max_price: number | null
          min_price: number | null
          name: string
          priority: number | null
          products_affected: number | null
          rule_type: string | null
          target_margin: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          max_price?: number | null
          min_price?: number | null
          name: string
          priority?: number | null
          products_affected?: number | null
          rule_type?: string | null
          target_margin?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          max_price?: number | null
          min_price?: number | null
          name?: string
          priority?: number | null
          products_affected?: number | null
          rule_type?: string | null
          target_margin?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      product_ai_attributes: {
        Row: {
          attribute_key: string
          attribute_type: string
          attribute_value: string | null
          confidence_score: number | null
          created_at: string | null
          id: string
          is_approved: boolean | null
          product_id: string | null
          source: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attribute_key: string
          attribute_type: string
          attribute_value?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          product_id?: string | null
          source?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attribute_key?: string
          attribute_type?: string
          attribute_value?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          product_id?: string | null
          source?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ai_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_enrichment: {
        Row: {
          ai_suggestions: Json | null
          completeness_score: number | null
          created_at: string | null
          enriched_at: string | null
          enriched_data: Json | null
          enrichment_status: string | null
          enrichment_type: string | null
          id: string
          original_data: Json | null
          product_id: string | null
          quality_score: number | null
          seo_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_suggestions?: Json | null
          completeness_score?: number | null
          created_at?: string | null
          enriched_at?: string | null
          enriched_data?: Json | null
          enrichment_status?: string | null
          enrichment_type?: string | null
          id?: string
          original_data?: Json | null
          product_id?: string | null
          quality_score?: number | null
          seo_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_suggestions?: Json | null
          completeness_score?: number | null
          created_at?: string | null
          enriched_at?: string | null
          enriched_data?: Json | null
          enrichment_status?: string | null
          enrichment_type?: string | null
          id?: string
          original_data?: Json | null
          product_id?: string | null
          quality_score?: number | null
          seo_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_enrichment_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_feeds: {
        Row: {
          created_at: string
          feed_type: string
          feed_url: string | null
          generation_status: string | null
          id: string
          last_generated_at: string | null
          name: string
          product_count: number | null
          settings: Json | null
          updated_at: string
          user_id: string
          validation_errors: Json | null
        }
        Insert: {
          created_at?: string
          feed_type: string
          feed_url?: string | null
          generation_status?: string | null
          id?: string
          last_generated_at?: string | null
          name: string
          product_count?: number | null
          settings?: Json | null
          updated_at?: string
          user_id: string
          validation_errors?: Json | null
        }
        Update: {
          created_at?: string
          feed_type?: string
          feed_url?: string | null
          generation_status?: string | null
          id?: string
          last_generated_at?: string | null
          name?: string
          product_count?: number | null
          settings?: Json | null
          updated_at?: string
          user_id?: string
          validation_errors?: Json | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          file_size: number | null
          height: number | null
          id: string
          is_primary: boolean | null
          position: number | null
          product_id: string
          url: string
          user_id: string
          variant_id: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_size?: number | null
          height?: number | null
          id?: string
          is_primary?: boolean | null
          position?: number | null
          product_id: string
          url: string
          user_id: string
          variant_id?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_size?: number | null
          height?: number | null
          id?: string
          is_primary?: boolean | null
          position?: number | null
          product_id?: string
          url?: string
          user_id?: string
          variant_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_rewrites: {
        Row: {
          applied_at: string | null
          created_at: string | null
          id: string
          language: string | null
          original_description: string | null
          original_title: string | null
          product_id: string | null
          product_source: string | null
          rewrite_type: string | null
          rewritten_description: string | null
          rewritten_title: string | null
          tone: string | null
          updated_at: string | null
          user_id: string
          was_applied: boolean | null
        }
        Insert: {
          applied_at?: string | null
          created_at?: string | null
          id?: string
          language?: string | null
          original_description?: string | null
          original_title?: string | null
          product_id?: string | null
          product_source?: string | null
          rewrite_type?: string | null
          rewritten_description?: string | null
          rewritten_title?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id: string
          was_applied?: boolean | null
        }
        Update: {
          applied_at?: string | null
          created_at?: string | null
          id?: string
          language?: string | null
          original_description?: string | null
          original_title?: string | null
          product_id?: string | null
          product_source?: string | null
          rewrite_type?: string | null
          rewritten_description?: string | null
          rewritten_title?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id?: string
          was_applied?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "product_rewrites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_scores: {
        Row: {
          attributes_score: number | null
          created_at: string | null
          description_score: number | null
          id: string
          images_score: number | null
          issues: Json | null
          last_analyzed_at: string | null
          overall_score: number | null
          pricing_score: number | null
          product_id: string | null
          recommendations: Json | null
          seo_score: number | null
          title_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attributes_score?: number | null
          created_at?: string | null
          description_score?: number | null
          id?: string
          images_score?: number | null
          issues?: Json | null
          last_analyzed_at?: string | null
          overall_score?: number | null
          pricing_score?: number | null
          product_id?: string | null
          recommendations?: Json | null
          seo_score?: number | null
          title_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attributes_score?: number | null
          created_at?: string | null
          description_score?: number | null
          id?: string
          images_score?: number | null
          issues?: Json | null
          last_analyzed_at?: string | null
          overall_score?: number | null
          pricing_score?: number | null
          product_id?: string | null
          recommendations?: Json | null
          seo_score?: number | null
          title_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_scores_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_supplier_mapping: {
        Row: {
          auto_switch_enabled: boolean | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          last_price_update: string | null
          last_stock_update: string | null
          lead_time_days: number | null
          min_order_quantity: number | null
          priority: number | null
          product_id: string | null
          supplier_id: string | null
          supplier_price: number | null
          supplier_sku: string | null
          supplier_stock: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_switch_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          last_price_update?: string | null
          last_stock_update?: string | null
          lead_time_days?: number | null
          min_order_quantity?: number | null
          priority?: number | null
          product_id?: string | null
          supplier_id?: string | null
          supplier_price?: number | null
          supplier_sku?: string | null
          supplier_stock?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_switch_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          last_price_update?: string | null
          last_stock_update?: string | null
          lead_time_days?: number | null
          min_order_quantity?: number | null
          priority?: number | null
          product_id?: string | null
          supplier_id?: string | null
          supplier_price?: number | null
          supplier_sku?: string | null
          supplier_stock?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_supplier_mapping_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_supplier_mapping_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          cost_price: number | null
          created_at: string
          id: string
          image_url: string | null
          is_default: boolean | null
          name: string
          option1_name: string | null
          option1_value: string | null
          option2_name: string | null
          option2_value: string | null
          option3_name: string | null
          option3_value: string | null
          price: number | null
          product_id: string
          sku: string | null
          status: string | null
          stock_quantity: number | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_default?: boolean | null
          name: string
          option1_name?: string | null
          option1_value?: string | null
          option2_name?: string | null
          option2_value?: string | null
          option3_name?: string | null
          option3_value?: string | null
          price?: number | null
          product_id: string
          sku?: string | null
          status?: string | null
          stock_quantity?: number | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_default?: boolean | null
          name?: string
          option1_name?: string | null
          option1_value?: string | null
          option2_name?: string | null
          option2_value?: string | null
          option3_name?: string | null
          option3_value?: string | null
          price?: number | null
          product_id?: string
          sku?: string | null
          status?: string | null
          stock_quantity?: number | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
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
      promotional_coupons: {
        Row: {
          applicable_categories: Json | null
          applicable_products: Json | null
          code: string
          created_at: string | null
          current_uses: number | null
          description: string | null
          discount_type: string | null
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_purchase_amount: number | null
          starts_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applicable_categories?: Json | null
          applicable_products?: Json | null
          code: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string | null
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          starts_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applicable_categories?: Json | null
          applicable_products?: Json | null
          code?: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          starts_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_tracking: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_address: string | null
          request_count: number | null
          user_id: string | null
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: string | null
          request_count?: number | null
          user_id?: string | null
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string | null
          request_count?: number | null
          user_id?: string | null
          window_start?: string
        }
        Relationships: []
      }
      reorder_suggestions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          estimated_cost: number | null
          expected_delivery_date: string | null
          id: string
          order_placed_at: string | null
          priority_score: number | null
          product_id: string
          reasoning: Json | null
          status: string
          store_id: string | null
          suggested_quantity: number
          suggested_reorder_point: number | null
          supplier_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          estimated_cost?: number | null
          expected_delivery_date?: string | null
          id?: string
          order_placed_at?: string | null
          priority_score?: number | null
          product_id: string
          reasoning?: Json | null
          status?: string
          store_id?: string | null
          suggested_quantity?: number
          suggested_reorder_point?: number | null
          supplier_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          estimated_cost?: number | null
          expected_delivery_date?: string | null
          id?: string
          order_placed_at?: string | null
          priority_score?: number | null
          product_id?: string
          reasoning?: Json | null
          status?: string
          store_id?: string | null
          suggested_quantity?: number
          suggested_reorder_point?: number | null
          supplier_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      returns: {
        Row: {
          carrier: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          images: string[] | null
          inspected_at: string | null
          items: Json
          notes: string | null
          order_id: string | null
          reason: string
          reason_category: string | null
          received_at: string | null
          refund_amount: number | null
          refund_method: string | null
          refunded_at: string | null
          rma_number: string
          status: string
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          inspected_at?: string | null
          items?: Json
          notes?: string | null
          order_id?: string | null
          reason: string
          reason_category?: string | null
          received_at?: string | null
          refund_amount?: number | null
          refund_method?: string | null
          refunded_at?: string | null
          rma_number: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          inspected_at?: string | null
          items?: Json
          notes?: string | null
          order_id?: string | null
          reason?: string
          reason_category?: string | null
          received_at?: string | null
          refund_amount?: number | null
          refund_method?: string | null
          refunded_at?: string | null
          rma_number?: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      returns_rma: {
        Row: {
          created_at: string
          customer_notes: string | null
          id: string
          images: string[] | null
          inspected_at: string | null
          internal_notes: string | null
          metadata: Json | null
          order_id: string | null
          product_id: string | null
          product_name: string | null
          product_sku: string | null
          quantity: number | null
          reason: string | null
          reason_category: string
          received_at: string | null
          refund_amount: number | null
          refund_method: string | null
          refund_status: string | null
          refunded_at: string | null
          requested_at: string | null
          resolved_at: string | null
          return_carrier: string | null
          return_label_url: string | null
          return_tracking_number: string | null
          rma_number: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_notes?: string | null
          id?: string
          images?: string[] | null
          inspected_at?: string | null
          internal_notes?: string | null
          metadata?: Json | null
          order_id?: string | null
          product_id?: string | null
          product_name?: string | null
          product_sku?: string | null
          quantity?: number | null
          reason?: string | null
          reason_category: string
          received_at?: string | null
          refund_amount?: number | null
          refund_method?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          requested_at?: string | null
          resolved_at?: string | null
          return_carrier?: string | null
          return_label_url?: string | null
          return_tracking_number?: string | null
          rma_number: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_notes?: string | null
          id?: string
          images?: string[] | null
          inspected_at?: string | null
          internal_notes?: string | null
          metadata?: Json | null
          order_id?: string | null
          product_id?: string | null
          product_name?: string | null
          product_sku?: string | null
          quantity?: number | null
          reason?: string | null
          reason_category?: string
          received_at?: string | null
          refund_amount?: number | null
          refund_method?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          requested_at?: string | null
          resolved_at?: string | null
          return_carrier?: string | null
          return_label_url?: string | null
          return_tracking_number?: string | null
          rma_number?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_channels: {
        Row: {
          api_credentials: Json | null
          channel_type: string
          created_at: string
          id: string
          last_sync_at: string | null
          last_sync_status: string | null
          name: string
          orders_synced: number | null
          products_synced: number | null
          settings: Json | null
          status: string | null
          sync_config: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_credentials?: Json | null
          channel_type: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          last_sync_status?: string | null
          name: string
          orders_synced?: number | null
          products_synced?: number | null
          settings?: Json | null
          status?: string | null
          sync_config?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_credentials?: Json | null
          channel_type?: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          last_sync_status?: string | null
          name?: string
          orders_synced?: number | null
          products_synced?: number | null
          settings?: Json | null
          status?: string | null
          sync_config?: Json | null
          updated_at?: string
          user_id?: string
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
      scoring_batches: {
        Row: {
          avg_score: number | null
          completed_at: string | null
          id: string
          products_analyzed: number | null
          score_distribution: Json | null
          started_at: string | null
          status: string | null
          top_issues: Json | null
          user_id: string
        }
        Insert: {
          avg_score?: number | null
          completed_at?: string | null
          id?: string
          products_analyzed?: number | null
          score_distribution?: Json | null
          started_at?: string | null
          status?: string | null
          top_issues?: Json | null
          user_id: string
        }
        Update: {
          avg_score?: number | null
          completed_at?: string | null
          id?: string
          products_analyzed?: number | null
          score_distribution?: Json | null
          started_at?: string | null
          status?: string | null
          top_issues?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      scoring_rules: {
        Row: {
          category: string
          config: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          is_global: boolean | null
          name: string
          penalty: number | null
          rule_type: string
          user_id: string
          weight: number | null
        }
        Insert: {
          category: string
          config?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          name: string
          penalty?: number | null
          rule_type: string
          user_id: string
          weight?: number | null
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          name?: string
          penalty?: number | null
          rule_type?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
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
      seo_templates: {
        Row: {
          created_at: string | null
          description_max_length: number | null
          description_template: string | null
          id: string
          is_active: boolean | null
          name: string
          platform: string
          title_max_length: number | null
          title_template: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description_max_length?: number | null
          description_template?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          platform: string
          title_max_length?: number | null
          title_template?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description_max_length?: number | null
          description_template?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          platform?: string
          title_max_length?: number | null
          title_template?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          access_token_encrypted: string | null
          account_id: string | null
          account_name: string
          created_at: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          platform: string
          profile_image: string | null
          profile_url: string | null
          refresh_token_encrypted: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          account_id?: string | null
          account_name: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform: string
          profile_image?: string | null
          profile_url?: string | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          account_id?: string | null
          account_name?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform?: string
          profile_image?: string | null
          profile_url?: string | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          content_id: string | null
          content_type: string | null
          created_at: string
          engagement_data: Json | null
          error_message: string | null
          id: string
          media_urls: string[] | null
          platform: string
          platform_post_id: string | null
          post_content: string
          published_at: string | null
          scheduled_at: string | null
          social_account_id: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          engagement_data?: Json | null
          error_message?: string | null
          id?: string
          media_urls?: string[] | null
          platform: string
          platform_post_id?: string | null
          post_content: string
          published_at?: string | null
          scheduled_at?: string | null
          social_account_id?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          engagement_data?: Json | null
          error_message?: string | null
          id?: string
          media_urls?: string[] | null
          platform?: string
          platform_post_id?: string | null
          post_content?: string
          published_at?: string | null
          scheduled_at?: string | null
          social_account_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_alerts: {
        Row: {
          action_data: Json | null
          alert_type: string
          created_at: string | null
          current_stock: number | null
          current_value: number | null
          id: string
          is_read: boolean
          is_resolved: boolean | null
          message: string | null
          product_id: string | null
          recommended_action: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          store_id: string | null
          threshold_value: number | null
          title: string
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          action_data?: Json | null
          alert_type: string
          created_at?: string | null
          current_stock?: number | null
          current_value?: number | null
          id?: string
          is_read?: boolean
          is_resolved?: boolean | null
          message?: string | null
          product_id?: string | null
          recommended_action?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          store_id?: string | null
          threshold_value?: number | null
          title?: string
          updated_at?: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          action_data?: Json | null
          alert_type?: string
          created_at?: string | null
          current_stock?: number | null
          current_value?: number | null
          id?: string
          is_read?: boolean
          is_resolved?: boolean | null
          message?: string | null
          product_id?: string | null
          recommended_action?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          store_id?: string | null
          threshold_value?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_levels: {
        Row: {
          available_quantity: number | null
          batch_number: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          last_counted_at: string | null
          location_in_warehouse: string | null
          max_stock_level: number | null
          min_stock_level: number | null
          product_id: string | null
          quantity: number | null
          reorder_point: number | null
          reserved_quantity: number | null
          updated_at: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          available_quantity?: number | null
          batch_number?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          last_counted_at?: string | null
          location_in_warehouse?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          product_id?: string | null
          quantity?: number | null
          reorder_point?: number | null
          reserved_quantity?: number | null
          updated_at?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          available_quantity?: number | null
          batch_number?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          last_counted_at?: string | null
          location_in_warehouse?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          product_id?: string | null
          quantity?: number | null
          reorder_point?: number | null
          reserved_quantity?: number | null
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_levels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_levels_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string | null
          id: string
          movement_type: string
          notes: string | null
          performed_by: string | null
          product_id: string | null
          quantity: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          performed_by?: string | null
          product_id?: string | null
          quantity: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          performed_by?: string | null
          product_id?: string | null
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_predictions: {
        Row: {
          confidence_score: number
          created_at: string
          current_stock: number
          daily_sale_velocity: number
          id: string
          last_calculated_at: string
          predicted_days_until_stockout: number | null
          predicted_stockout_date: string | null
          product_id: string
          recommendation: string | null
          reorder_quantity: number | null
          reorder_urgency: string
          store_id: string | null
          trend_direction: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          current_stock?: number
          daily_sale_velocity?: number
          id?: string
          last_calculated_at?: string
          predicted_days_until_stockout?: number | null
          predicted_stockout_date?: string | null
          product_id: string
          recommendation?: string | null
          reorder_quantity?: number | null
          reorder_urgency?: string
          store_id?: string | null
          trend_direction?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          current_stock?: number
          daily_sale_velocity?: number
          id?: string
          last_calculated_at?: string
          predicted_days_until_stockout?: number | null
          predicted_stockout_date?: string | null
          product_id?: string
          recommendation?: string | null
          reorder_quantity?: number | null
          reorder_urgency?: string
          store_id?: string | null
          trend_direction?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      store_integrations: {
        Row: {
          access_token_encrypted: string | null
          api_key_encrypted: string | null
          api_secret_encrypted: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          platform: string
          settings: Json | null
          store_name: string
          store_url: string | null
          sync_inventory: boolean | null
          sync_orders: boolean | null
          sync_products: boolean | null
          sync_status: string | null
          updated_at: string | null
          user_id: string
          webhook_secret: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform: string
          settings?: Json | null
          store_name: string
          store_url?: string | null
          sync_inventory?: boolean | null
          sync_orders?: boolean | null
          sync_products?: boolean | null
          sync_status?: string | null
          updated_at?: string | null
          user_id: string
          webhook_secret?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform?: string
          settings?: Json | null
          store_name?: string
          store_url?: string | null
          sync_inventory?: boolean | null
          sync_orders?: boolean | null
          sync_products?: boolean | null
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      supplier_analytics: {
        Row: {
          avg_delivery_time_days: number | null
          communication_score: number | null
          created_at: string | null
          defect_rate: number | null
          id: string
          on_time_delivery_rate: number | null
          period_end: string
          period_start: string
          quality_score: number | null
          return_rate: number | null
          supplier_id: string | null
          total_amount: number | null
          total_orders: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_delivery_time_days?: number | null
          communication_score?: number | null
          created_at?: string | null
          defect_rate?: number | null
          id?: string
          on_time_delivery_rate?: number | null
          period_end: string
          period_start: string
          quality_score?: number | null
          return_rate?: number | null
          supplier_id?: string | null
          total_amount?: number | null
          total_orders?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_delivery_time_days?: number | null
          communication_score?: number | null
          created_at?: string | null
          defect_rate?: number | null
          id?: string
          on_time_delivery_rate?: number | null
          period_end?: string
          period_start?: string
          quality_score?: number | null
          return_rate?: number | null
          supplier_id?: string | null
          total_amount?: number | null
          total_orders?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_analytics_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_catalog: {
        Row: {
          attributes: Json | null
          barcode: string | null
          brand: string | null
          category: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          external_product_id: string
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          last_synced_at: string | null
          price: number | null
          sku: string | null
          source_url: string | null
          stock_quantity: number | null
          supplier_id: string | null
          supplier_name: string
          title: string
          updated_at: string | null
          variants: Json | null
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          attributes?: Json | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_product_id: string
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          last_synced_at?: string | null
          price?: number | null
          sku?: string | null
          source_url?: string | null
          stock_quantity?: number | null
          supplier_id?: string | null
          supplier_name: string
          title: string
          updated_at?: string | null
          variants?: Json | null
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          attributes?: Json | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_product_id?: string
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          last_synced_at?: string | null
          price?: number | null
          sku?: string | null
          source_url?: string | null
          stock_quantity?: number | null
          supplier_id?: string | null
          supplier_name?: string
          title?: string
          updated_at?: string | null
          variants?: Json | null
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_catalog_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "premium_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_connections: {
        Row: {
          connected_at: string | null
          connector_id: string
          connector_name: string
          credentials_encrypted: string | null
          id: string
          last_sync_at: string | null
          settings: Json | null
          status: string | null
          sync_stats: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connected_at?: string | null
          connector_id: string
          connector_name: string
          credentials_encrypted?: string | null
          id?: string
          last_sync_at?: string | null
          settings?: Json | null
          status?: string | null
          sync_stats?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connected_at?: string | null
          connector_id?: string
          connector_name?: string
          credentials_encrypted?: string | null
          id?: string
          last_sync_at?: string | null
          settings?: Json | null
          status?: string | null
          sync_stats?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      supplier_credentials_vault: {
        Row: {
          created_at: string | null
          credential_type: string
          credentials_encrypted: string | null
          expires_at: string | null
          id: string
          is_valid: boolean | null
          last_validated_at: string | null
          supplier_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credential_type: string
          credentials_encrypted?: string | null
          expires_at?: string | null
          id?: string
          is_valid?: boolean | null
          last_validated_at?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credential_type?: string
          credentials_encrypted?: string | null
          expires_at?: string | null
          id?: string
          is_valid?: boolean | null
          last_validated_at?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_credentials_vault_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          notification_type: string
          priority: string | null
          supplier_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          notification_type: string
          priority?: string | null
          supplier_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          notification_type?: string
          priority?: string | null
          supplier_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_notifications_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_orders: {
        Row: {
          carrier: string | null
          created_at: string | null
          delivered_at: string | null
          estimated_delivery: string | null
          id: string
          items: Json | null
          metadata: Json | null
          order_id: string | null
          shipped_at: string | null
          shipping_cost: number | null
          status: string | null
          supplier_id: string
          supplier_order_id: string | null
          total_cost: number | null
          tracking_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string | null
          delivered_at?: string | null
          estimated_delivery?: string | null
          id?: string
          items?: Json | null
          metadata?: Json | null
          order_id?: string | null
          shipped_at?: string | null
          shipping_cost?: number | null
          status?: string | null
          supplier_id: string
          supplier_order_id?: string | null
          total_cost?: number | null
          tracking_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          carrier?: string | null
          created_at?: string | null
          delivered_at?: string | null
          estimated_delivery?: string | null
          id?: string
          items?: Json | null
          metadata?: Json | null
          order_id?: string | null
          shipped_at?: string | null
          shipping_cost?: number | null
          status?: string | null
          supplier_id?: string
          supplier_order_id?: string | null
          total_cost?: number | null
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      supplier_pricing_rules: {
        Row: {
          applies_to_categories: string[] | null
          applies_to_products: string[] | null
          created_at: string | null
          fixed_markup_amount: number | null
          id: string
          is_active: boolean | null
          max_price: number | null
          min_price: number | null
          name: string
          percentage_markup: number | null
          pricing_type: string
          priority: number | null
          round_to: number | null
          supplier_id: string | null
          target_margin_percent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applies_to_categories?: string[] | null
          applies_to_products?: string[] | null
          created_at?: string | null
          fixed_markup_amount?: number | null
          id?: string
          is_active?: boolean | null
          max_price?: number | null
          min_price?: number | null
          name: string
          percentage_markup?: number | null
          pricing_type: string
          priority?: number | null
          round_to?: number | null
          supplier_id?: string | null
          target_margin_percent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applies_to_categories?: string[] | null
          applies_to_products?: string[] | null
          created_at?: string | null
          fixed_markup_amount?: number | null
          id?: string
          is_active?: boolean | null
          max_price?: number | null
          min_price?: number | null
          name?: string
          percentage_markup?: number | null
          pricing_type?: string
          priority?: number | null
          round_to?: number | null
          supplier_id?: string | null
          target_margin_percent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_pricing_rules_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          attributes: Json | null
          cost_price: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          external_product_id: string | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          last_synced_at: string | null
          price: number | null
          processing_time: string | null
          product_id: string | null
          shipping_info: Json | null
          source_url: string | null
          stock_quantity: number | null
          stock_status: string | null
          supplier_id: string | null
          title: string
          updated_at: string | null
          user_id: string
          variants: Json | null
        }
        Insert: {
          attributes?: Json | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_product_id?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          last_synced_at?: string | null
          price?: number | null
          processing_time?: string | null
          product_id?: string | null
          shipping_info?: Json | null
          source_url?: string | null
          stock_quantity?: number | null
          stock_status?: string | null
          supplier_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          variants?: Json | null
        }
        Update: {
          attributes?: Json | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_product_id?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          last_synced_at?: string | null
          price?: number | null
          processing_time?: string | null
          product_id?: string | null
          shipping_info?: Json | null
          source_url?: string | null
          stock_quantity?: number | null
          stock_status?: string | null
          supplier_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          variants?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
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
      supported_languages: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          native_name: string
          url_prefix: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          native_name: string
          url_prefix?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          native_name?: string
          url_prefix?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sync_conflicts: {
        Row: {
          conflict_type: string
          connection_id: string | null
          created_at: string | null
          id: string
          local_value: Json | null
          product_id: string | null
          remote_value: Json | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          user_id: string
        }
        Insert: {
          conflict_type: string
          connection_id?: string | null
          created_at?: string | null
          id?: string
          local_value?: Json | null
          product_id?: string | null
          remote_value?: Json | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          user_id: string
        }
        Update: {
          conflict_type?: string
          connection_id?: string | null
          created_at?: string | null
          id?: string
          local_value?: Json | null
          product_id?: string | null
          remote_value?: Json | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          integration_id: string | null
          records_synced: number | null
          started_at: string | null
          status: string
          sync_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          integration_id?: string | null
          records_synced?: number | null
          started_at?: string | null
          status?: string
          sync_type?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          integration_id?: string | null
          records_synced?: number | null
          started_at?: string | null
          status?: string
          sync_type?: string
          user_id?: string
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
      sync_queue: {
        Row: {
          attempts: number | null
          completed_at: string | null
          connection_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          max_attempts: number | null
          payload: Json | null
          priority: number | null
          product_id: string | null
          result: Json | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          sync_direction: string | null
          sync_type: string
          user_id: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          payload?: Json | null
          priority?: number | null
          product_id?: string | null
          result?: Json | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          sync_direction?: string | null
          sync_type: string
          user_id: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          payload?: Json | null
          priority?: number | null
          product_id?: string | null
          result?: Json | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          sync_direction?: string | null
          sync_type?: string
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
      user_kpis: {
        Row: {
          created_at: string
          current_value: number
          id: string
          kpi_type: string
          name: string
          period: string
          target: number
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          id?: string
          kpi_type?: string
          name: string
          period?: string
          target?: number
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number
          id?: string
          kpi_type?: string
          name?: string
          period?: string
          target?: number
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          category: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          priority: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          category?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type?: string
          priority?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          category?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          priority?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
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
      user_video_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          total_seconds: number | null
          updated_at: string | null
          user_id: string
          video_id: string
          watched_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          total_seconds?: number | null
          updated_at?: string | null
          user_id: string
          video_id: string
          watched_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          total_seconds?: number | null
          updated_at?: string | null
          user_id?: string
          video_id?: string
          watched_seconds?: number | null
        }
        Relationships: []
      }
      variant_mapping_rules: {
        Row: {
          apply_to_all_products: boolean | null
          created_at: string | null
          id: string
          is_active: boolean | null
          option_type: string
          priority: number | null
          rule_name: string
          source_pattern: string
          supplier_id: string | null
          target_value: string
          transformation_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          apply_to_all_products?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          option_type: string
          priority?: number | null
          rule_name: string
          source_pattern: string
          supplier_id?: string | null
          target_value: string
          transformation_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          apply_to_all_products?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          option_type?: string
          priority?: number | null
          rule_name?: string
          source_pattern?: string
          supplier_id?: string | null
          target_value?: string
          transformation_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_mapping_rules_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_mapping_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_global: boolean | null
          mappings: Json
          name: string
          option_type: string
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_global?: boolean | null
          mappings?: Json
          name: string
          option_type: string
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_global?: boolean | null
          mappings?: Json
          name?: string
          option_type?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      variant_mappings: {
        Row: {
          auto_sync: boolean | null
          created_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          priority: number | null
          product_id: string | null
          source_option_name: string
          source_option_value: string
          source_sku: string | null
          source_variant_id: string | null
          supplier_id: string | null
          target_option_name: string
          target_option_value: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_sync?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          priority?: number | null
          product_id?: string | null
          source_option_name: string
          source_option_value: string
          source_sku?: string | null
          source_variant_id?: string | null
          supplier_id?: string | null
          target_option_name: string
          target_option_value: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_sync?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          priority?: number | null
          product_id?: string | null
          source_option_name?: string
          source_option_value?: string
          source_sku?: string | null
          source_variant_id?: string | null
          supplier_id?: string | null
          target_option_name?: string
          target_option_value?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_mappings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_mappings_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
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
      warehouses: {
        Row: {
          address: string | null
          capacity: number | null
          city: string | null
          code: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          current_occupancy: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          user_id: string
          warehouse_type: string | null
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          city?: string | null
          code?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          current_occupancy?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
          warehouse_type?: string | null
        }
        Update: {
          address?: string | null
          capacity?: number | null
          city?: string | null
          code?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          current_occupancy?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
          warehouse_type?: string | null
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
          webhook_data: Json | null
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
          webhook_data?: Json | null
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
          webhook_data?: Json | null
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
      workflow_executions: {
        Row: {
          completed_at: string | null
          current_step: number | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          started_at: string
          status: string | null
          step_results: Json | null
          total_steps: number | null
          user_id: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          current_step?: number | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string
          status?: string | null
          step_results?: Json | null
          total_steps?: number | null
          user_id: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          current_step?: number | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string
          status?: string | null
          step_results?: Json | null
          total_steps?: number | null
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_step_definitions: {
        Row: {
          category: string | null
          config_schema: Json | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_global: boolean | null
          name: string
          step_type: string
        }
        Insert: {
          category?: string | null
          config_schema?: Json | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_global?: boolean | null
          name: string
          step_type: string
        }
        Update: {
          category?: string | null
          config_schema?: Json | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_global?: boolean | null
          name?: string
          step_type?: string
        }
        Relationships: []
      }
      workflow_templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          last_executed_at: string | null
          name: string
          steps: Json | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          last_executed_at?: string | null
          name: string
          steps?: Json | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          last_executed_at?: string | null
          name?: string
          steps?: Json | null
          trigger_config?: Json | null
          trigger_type?: string
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
      admin_get_all_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_admin: boolean
          last_login_at: string
          last_sign_in_at: string
          login_count: number
          plan: string
          role: string
          role_updated_at: string
          subscription_status: string
        }[]
      }
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
      anonymize_customer_data: {
        Args: { customer_id_param: string }
        Returns: boolean
      }
      export_user_data: { Args: never; Returns: Json }
      generate_api_key: {
        Args: { key_name: string; key_scopes?: string[] }
        Returns: string
      }
      generate_bulk_order_number: { Args: never; Returns: string }
      generate_rma_number: { Args: never; Returns: string }
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
      validate_api_key: {
        Args: { input_key: string }
        Returns: {
          is_active: boolean
          key_name: string
          scopes: string[]
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      content_role: "viewer" | "writer" | "editor" | "publisher" | "admin"
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
      content_role: ["viewer", "writer", "editor", "publisher", "admin"],
    },
  },
} as const
