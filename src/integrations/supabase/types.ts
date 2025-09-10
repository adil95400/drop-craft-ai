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
      ab_test_experiments: {
        Row: {
          confidence_interval: Json | null
          control_variant: Json
          created_at: string
          current_results: Json
          ended_at: string | null
          experiment_name: string
          experiment_type: string
          hypothesis: string | null
          id: string
          started_at: string | null
          statistical_significance: number | null
          status: string
          success_metrics: Json
          test_variants: Json
          traffic_allocation: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_interval?: Json | null
          control_variant?: Json
          created_at?: string
          current_results?: Json
          ended_at?: string | null
          experiment_name: string
          experiment_type: string
          hypothesis?: string | null
          id?: string
          started_at?: string | null
          statistical_significance?: number | null
          status?: string
          success_metrics?: Json
          test_variants?: Json
          traffic_allocation?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_interval?: Json | null
          control_variant?: Json
          created_at?: string
          current_results?: Json
          ended_at?: string | null
          experiment_name?: string
          experiment_type?: string
          hypothesis?: string | null
          id?: string
          started_at?: string | null
          statistical_significance?: number | null
          status?: string
          success_metrics?: Json
          test_variants?: Json
          traffic_allocation?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      advanced_reports: {
        Row: {
          created_at: string
          expires_at: string | null
          file_url: string | null
          generated_at: string
          id: string
          report_config: Json
          report_data: Json
          report_name: string
          report_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          file_url?: string | null
          generated_at?: string
          id?: string
          report_config?: Json
          report_data?: Json
          report_name: string
          report_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          file_url?: string | null
          generated_at?: string
          id?: string
          report_config?: Json
          report_data?: Json
          report_name?: string
          report_type?: string
          status?: string
          updated_at?: string
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
      ai_tasks: {
        Row: {
          cost: number | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json
          output_data: Json | null
          priority: number | null
          processing_time_ms: number | null
          status: string | null
          task_type: string
          tokens_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json
          output_data?: Json | null
          priority?: number | null
          processing_time_ms?: number | null
          status?: string | null
          task_type: string
          tokens_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json
          output_data?: Json | null
          priority?: number | null
          processing_time_ms?: number | null
          status?: string | null
          task_type?: string
          tokens_used?: number | null
          updated_at?: string | null
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
      automated_campaigns: {
        Row: {
          ai_optimization_data: Json
          ai_segmentation: Json
          automation_flow: Json
          campaign_name: string
          campaign_type: string
          content_templates: Json
          created_at: string
          current_metrics: Json
          execution_schedule: Json
          id: string
          last_executed_at: string | null
          next_execution_at: string | null
          performance_goals: Json
          status: string
          success_metrics: Json
          target_criteria: Json
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_optimization_data?: Json
          ai_segmentation?: Json
          automation_flow?: Json
          campaign_name: string
          campaign_type: string
          content_templates?: Json
          created_at?: string
          current_metrics?: Json
          execution_schedule?: Json
          id?: string
          last_executed_at?: string | null
          next_execution_at?: string | null
          performance_goals?: Json
          status?: string
          success_metrics?: Json
          target_criteria?: Json
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_optimization_data?: Json
          ai_segmentation?: Json
          automation_flow?: Json
          campaign_name?: string
          campaign_type?: string
          content_templates?: Json
          created_at?: string
          current_metrics?: Json
          execution_schedule?: Json
          id?: string
          last_executed_at?: string | null
          next_execution_at?: string | null
          performance_goals?: Json
          status?: string
          success_metrics?: Json
          target_criteria?: Json
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      automated_decisions: {
        Row: {
          actual_outcome: Json
          ai_reasoning: Json
          confidence_level: number
          created_at: string
          decision_parameters: Json
          decision_title: string
          decision_type: string
          entity_id: string | null
          entity_type: string
          executed_at: string | null
          execution_mode: string
          expected_outcome: Json
          id: string
          input_data: Json
          learning_feedback: Json
          performance_score: number | null
          recommended_action: Json
          risk_assessment: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_outcome?: Json
          ai_reasoning?: Json
          confidence_level?: number
          created_at?: string
          decision_parameters?: Json
          decision_title: string
          decision_type: string
          entity_id?: string | null
          entity_type: string
          executed_at?: string | null
          execution_mode?: string
          expected_outcome?: Json
          id?: string
          input_data?: Json
          learning_feedback?: Json
          performance_score?: number | null
          recommended_action?: Json
          risk_assessment?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_outcome?: Json
          ai_reasoning?: Json
          confidence_level?: number
          created_at?: string
          decision_parameters?: Json
          decision_title?: string
          decision_type?: string
          entity_id?: string | null
          entity_type?: string
          executed_at?: string | null
          execution_mode?: string
          expected_outcome?: Json
          id?: string
          input_data?: Json
          learning_feedback?: Json
          performance_score?: number | null
          recommended_action?: Json
          risk_assessment?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_actions: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string
          execution_order: number
          id: string
          is_active: boolean
          trigger_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          created_at?: string
          execution_order?: number
          id?: string
          is_active?: boolean
          trigger_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string
          execution_order?: number
          id?: string
          is_active?: boolean
          trigger_id?: string
          updated_at?: string
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
          action_id: string
          completed_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_data: Json
          output_data: Json
          started_at: string | null
          status: string
          trigger_id: string
          user_id: string
        }
        Insert: {
          action_id: string
          completed_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json
          output_data?: Json
          started_at?: string | null
          status?: string
          trigger_id: string
          user_id: string
        }
        Update: {
          action_id?: string
          completed_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json
          output_data?: Json
          started_at?: string | null
          status?: string
          trigger_id?: string
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
          completed_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_data: Json | null
          output_data: Json | null
          started_at: string | null
          status: string | null
          step_results: Json | null
          user_id: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          step_results?: Json | null
          user_id: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          step_results?: Json | null
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json
          ai_conditions: Json
          created_at: string
          description: string | null
          execution_count: number
          id: string
          is_active: boolean
          last_executed_at: string | null
          name: string
          performance_metrics: Json
          priority: number
          rule_type: string
          success_rate: number
          trigger_conditions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json
          ai_conditions?: Json
          created_at?: string
          description?: string | null
          execution_count?: number
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          name: string
          performance_metrics?: Json
          priority?: number
          rule_type: string
          success_rate?: number
          trigger_conditions?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json
          ai_conditions?: Json
          created_at?: string
          description?: string | null
          execution_count?: number
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          name?: string
          performance_metrics?: Json
          priority?: number
          rule_type?: string
          success_rate?: number
          trigger_conditions?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_triggers: {
        Row: {
          conditions: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_workflows: {
        Row: {
          created_at: string | null
          description: string | null
          execution_count: number | null
          failure_count: number | null
          id: string
          last_executed_at: string | null
          name: string
          status: string | null
          steps: Json
          success_count: number | null
          trigger_config: Json
          trigger_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          failure_count?: number | null
          id?: string
          last_executed_at?: string | null
          name: string
          status?: string | null
          steps?: Json
          success_count?: number | null
          trigger_config?: Json
          trigger_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          failure_count?: number | null
          id?: string
          last_executed_at?: string | null
          name?: string
          status?: string | null
          steps?: Json
          success_count?: number | null
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
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
      business_intelligence_insights: {
        Row: {
          acknowledged_at: string | null
          acted_upon_at: string | null
          actionable_recommendations: Json
          ai_analysis: Json
          category: string
          confidence_score: number
          created_at: string
          description: string
          expires_at: string | null
          id: string
          impact_score: number
          insight_type: string
          outcome_data: Json
          priority: number
          severity: string
          status: string
          supporting_data: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acted_upon_at?: string | null
          actionable_recommendations?: Json
          ai_analysis?: Json
          category: string
          confidence_score?: number
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          impact_score?: number
          insight_type: string
          outcome_data?: Json
          priority?: number
          severity?: string
          status?: string
          supporting_data?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acted_upon_at?: string | null
          actionable_recommendations?: Json
          ai_analysis?: Json
          category?: string
          confidence_score?: number
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          impact_score?: number
          insight_type?: string
          outcome_data?: Json
          priority?: number
          severity?: string
          status?: string
          supporting_data?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      canva_designs: {
        Row: {
          canva_design_id: string
          canva_integration_id: string
          created_at: string
          design_type: string | null
          design_url: string | null
          export_urls: Json | null
          id: string
          last_modified_at: string | null
          metadata: Json | null
          status: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          canva_design_id: string
          canva_integration_id: string
          created_at?: string
          design_type?: string | null
          design_url?: string | null
          export_urls?: Json | null
          id?: string
          last_modified_at?: string | null
          metadata?: Json | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          canva_design_id?: string
          canva_integration_id?: string
          created_at?: string
          design_type?: string | null
          design_url?: string | null
          export_urls?: Json | null
          id?: string
          last_modified_at?: string | null
          metadata?: Json | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_canva_designs_integration"
            columns: ["canva_integration_id"]
            isOneToOne: false
            referencedRelation: "canva_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      canva_integrations: {
        Row: {
          access_token: string
          canva_brand_id: string | null
          canva_team_id: string | null
          canva_user_id: string
          created_at: string
          id: string
          refresh_token: string | null
          status: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          canva_brand_id?: string | null
          canva_team_id?: string | null
          canva_user_id: string
          created_at?: string
          id?: string
          refresh_token?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          canva_brand_id?: string | null
          canva_team_id?: string | null
          canva_user_id?: string
          created_at?: string
          id?: string
          refresh_token?: string | null
          status?: string
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
          event_data: Json
          event_type: string
          id: string
          processed: boolean
          user_id: string | null
        }
        Insert: {
          canva_design_id?: string | null
          created_at?: string
          event_data: Json
          event_type: string
          id?: string
          processed?: boolean
          user_id?: string | null
        }
        Update: {
          canva_design_id?: string | null
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          processed?: boolean
          user_id?: string | null
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
      category_mapping_rules: {
        Row: {
          confidence: number
          created_at: string
          id: string
          is_ai: boolean
          keywords: string[] | null
          supplier_category: string
          target_category: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          id?: string
          is_ai?: boolean
          keywords?: string[] | null
          supplier_category: string
          target_category: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          is_ai?: boolean
          keywords?: string[] | null
          supplier_category?: string
          target_category?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      competitive_intelligence: {
        Row: {
          competitive_data: Json
          competitor_name: string
          created_at: string
          gap_opportunities: Json
          id: string
          market_position: Json
          price_analysis: Json
          product_id: string | null
          threat_level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          competitive_data?: Json
          competitor_name: string
          created_at?: string
          gap_opportunities?: Json
          id?: string
          market_position?: Json
          price_analysis?: Json
          product_id?: string | null
          threat_level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          competitive_data?: Json
          competitor_name?: string
          created_at?: string
          gap_opportunities?: Json
          id?: string
          market_position?: Json
          price_analysis?: Json
          product_id?: string | null
          threat_level?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          attribution: Json | null
          company: string | null
          created_at: string | null
          custom_fields: Json | null
          email: string
          external_id: string | null
          id: string
          last_activity_at: string | null
          last_contacted_at: string | null
          lead_score: number | null
          lifecycle_stage: string | null
          name: string
          phone: string | null
          position: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attribution?: Json | null
          company?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email: string
          external_id?: string | null
          id?: string
          last_activity_at?: string | null
          last_contacted_at?: string | null
          lead_score?: number | null
          lifecycle_stage?: string | null
          name: string
          phone?: string | null
          position?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attribution?: Json | null
          company?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string
          external_id?: string | null
          id?: string
          last_activity_at?: string | null
          last_contacted_at?: string | null
          lead_score?: number | null
          lifecycle_stage?: string | null
          name?: string
          phone?: string | null
          position?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customer_behavior_analytics: {
        Row: {
          analysis_data: Json
          behavior_type: string
          behavioral_score: number
          churn_probability: number | null
          created_at: string
          customer_id: string | null
          id: string
          lifetime_value: number | null
          recommendations: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_data?: Json
          behavior_type: string
          behavioral_score?: number
          churn_probability?: number | null
          created_at?: string
          customer_id?: string | null
          id?: string
          lifetime_value?: number | null
          recommendations?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_data?: Json
          behavior_type?: string
          behavioral_score?: number
          churn_probability?: number | null
          created_at?: string
          customer_id?: string | null
          id?: string
          lifetime_value?: number | null
          recommendations?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: Json | null
          country: string | null
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
          country?: string | null
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
          country?: string | null
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
      deduplication_results: {
        Row: {
          algorithm_used: string | null
          created_at: string | null
          deduplication_rate: number | null
          duplicates_found: number | null
          execution_time_ms: number | null
          id: string
          job_id: string | null
          merged_products: number | null
          results_data: Json | null
          total_products: number
          unique_products: number | null
          user_id: string
        }
        Insert: {
          algorithm_used?: string | null
          created_at?: string | null
          deduplication_rate?: number | null
          duplicates_found?: number | null
          execution_time_ms?: number | null
          id?: string
          job_id?: string | null
          merged_products?: number | null
          results_data?: Json | null
          total_products: number
          unique_products?: number | null
          user_id: string
        }
        Update: {
          algorithm_used?: string | null
          created_at?: string | null
          deduplication_rate?: number | null
          duplicates_found?: number | null
          execution_time_ms?: number | null
          id?: string
          job_id?: string | null
          merged_products?: number | null
          results_data?: Json | null
          total_products?: number
          unique_products?: number | null
          user_id?: string
        }
        Relationships: []
      }
      dynamic_pricing: {
        Row: {
          ai_confidence: number
          applied_at: string | null
          competitor_analysis: Json
          created_at: string
          current_price: number
          demand_forecast: Json
          expected_sales_impact: number
          expires_at: string | null
          id: string
          market_factors: Json
          original_price: number
          performance_data: Json
          price_change_reason: string
          product_id: string | null
          profit_impact: number
          status: string
          suggested_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence?: number
          applied_at?: string | null
          competitor_analysis?: Json
          created_at?: string
          current_price: number
          demand_forecast?: Json
          expected_sales_impact?: number
          expires_at?: string | null
          id?: string
          market_factors?: Json
          original_price: number
          performance_data?: Json
          price_change_reason: string
          product_id?: string | null
          profit_impact?: number
          status?: string
          suggested_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence?: number
          applied_at?: string | null
          competitor_analysis?: Json
          created_at?: string
          current_price?: number
          demand_forecast?: Json
          expected_sales_impact?: number
          expires_at?: string | null
          id?: string
          market_factors?: Json
          original_price?: number
          performance_data?: Json
          price_change_reason?: string
          product_id?: string | null
          profit_impact?: number
          status?: string
          suggested_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      enterprise_integrations: {
        Row: {
          authentication_data: Json
          configuration: Json
          created_at: string
          error_logs: Json
          id: string
          integration_type: string
          is_active: boolean
          last_sync_at: string | null
          performance_metrics: Json
          provider_name: string
          sync_frequency: string
          sync_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          authentication_data?: Json
          configuration?: Json
          created_at?: string
          error_logs?: Json
          id?: string
          integration_type: string
          is_active?: boolean
          last_sync_at?: string | null
          performance_metrics?: Json
          provider_name: string
          sync_frequency?: string
          sync_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          authentication_data?: Json
          configuration?: Json
          created_at?: string
          error_logs?: Json
          id?: string
          integration_type?: string
          is_active?: boolean
          last_sync_at?: string | null
          performance_metrics?: Json
          provider_name?: string
          sync_frequency?: string
          sync_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      enterprise_settings: {
        Row: {
          access_level: string
          created_at: string
          id: string
          is_encrypted: boolean
          setting_category: string
          setting_key: string
          setting_value: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          id?: string
          is_encrypted?: boolean
          setting_category: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          access_level?: string
          created_at?: string
          id?: string
          is_encrypted?: boolean
          setting_category?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      extension_data: {
        Row: {
          ai_enhanced: boolean | null
          ai_metadata: Json
          created_at: string
          data_content: Json
          data_type: string
          extension_id: string
          external_id: string | null
          id: string
          job_id: string | null
          quality_score: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_enhanced?: boolean | null
          ai_metadata?: Json
          created_at?: string
          data_content?: Json
          data_type: string
          extension_id: string
          external_id?: string | null
          id?: string
          job_id?: string | null
          quality_score?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_enhanced?: boolean | null
          ai_metadata?: Json
          created_at?: string
          data_content?: Json
          data_type?: string
          extension_id?: string
          external_id?: string | null
          id?: string
          job_id?: string | null
          quality_score?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extension_data_extension_id_fkey"
            columns: ["extension_id"]
            isOneToOne: false
            referencedRelation: "extensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extension_data_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "extension_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      extension_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_details: Json
          error_items: number | null
          extension_id: string
          id: string
          input_data: Json
          job_type: string
          output_data: Json
          processed_items: number | null
          progress: number
          started_at: string | null
          status: string
          success_items: number | null
          total_items: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json
          error_items?: number | null
          extension_id: string
          id?: string
          input_data?: Json
          job_type: string
          output_data?: Json
          processed_items?: number | null
          progress?: number
          started_at?: string | null
          status?: string
          success_items?: number | null
          total_items?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json
          error_items?: number | null
          extension_id?: string
          id?: string
          input_data?: Json
          job_type?: string
          output_data?: Json
          processed_items?: number | null
          progress?: number
          started_at?: string | null
          status?: string
          success_items?: number | null
          total_items?: number | null
          updated_at?: string
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
      extension_webhooks: {
        Row: {
          created_at: string
          error_count: number | null
          event_types: string[]
          extension_id: string
          id: string
          is_active: boolean
          last_triggered_at: string | null
          success_count: number | null
          updated_at: string
          user_id: string
          webhook_secret: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string
          error_count?: number | null
          event_types?: string[]
          extension_id: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          success_count?: number | null
          updated_at?: string
          user_id: string
          webhook_secret?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string
          error_count?: number | null
          event_types?: string[]
          extension_id?: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          success_count?: number | null
          updated_at?: string
          user_id?: string
          webhook_secret?: string | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "extension_webhooks_extension_id_fkey"
            columns: ["extension_id"]
            isOneToOne: false
            referencedRelation: "extensions"
            referencedColumns: ["id"]
          },
        ]
      }
      extensions: {
        Row: {
          api_endpoints: Json
          category: string
          configuration: Json
          created_at: string
          description: string | null
          display_name: string
          id: string
          install_date: string
          last_sync_at: string | null
          metadata: Json
          name: string
          permissions: Json
          provider: string
          rate_limits: Json
          status: string
          sync_frequency: string | null
          updated_at: string
          user_id: string
          version: string
        }
        Insert: {
          api_endpoints?: Json
          category: string
          configuration?: Json
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          install_date?: string
          last_sync_at?: string | null
          metadata?: Json
          name: string
          permissions?: Json
          provider: string
          rate_limits?: Json
          status?: string
          sync_frequency?: string | null
          updated_at?: string
          user_id: string
          version?: string
        }
        Update: {
          api_endpoints?: Json
          category?: string
          configuration?: Json
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          install_date?: string
          last_sync_at?: string | null
          metadata?: Json
          name?: string
          permissions?: Json
          provider?: string
          rate_limits?: Json
          status?: string
          sync_frequency?: string | null
          updated_at?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          ai_model: string | null
          content_type: string
          created_at: string | null
          generated_content: string | null
          generated_meta_description: string | null
          generated_title: string | null
          id: string
          language: string | null
          optimization_score: number | null
          target_keyword: string | null
          tokens_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          content_type: string
          created_at?: string | null
          generated_content?: string | null
          generated_meta_description?: string | null
          generated_title?: string | null
          id?: string
          language?: string | null
          optimization_score?: number | null
          target_keyword?: string | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          content_type?: string
          created_at?: string | null
          generated_content?: string | null
          generated_meta_description?: string | null
          generated_title?: string | null
          id?: string
          language?: string | null
          optimization_score?: number | null
          target_keyword?: string | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      import_batches: {
        Row: {
          batch_type: string
          completed_at: string | null
          created_at: string | null
          error_details: Json | null
          failed_imports: number | null
          id: string
          processed_products: number | null
          processing_time_ms: number | null
          started_at: string | null
          status: string | null
          successful_imports: number | null
          supplier_id: string
          total_products: number | null
          user_id: string
        }
        Insert: {
          batch_type: string
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          failed_imports?: number | null
          id?: string
          processed_products?: number | null
          processing_time_ms?: number | null
          started_at?: string | null
          status?: string | null
          successful_imports?: number | null
          supplier_id: string
          total_products?: number | null
          user_id: string
        }
        Update: {
          batch_type?: string
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          failed_imports?: number | null
          id?: string
          processed_products?: number | null
          processing_time_ms?: number | null
          started_at?: string | null
          status?: string | null
          successful_imports?: number | null
          supplier_id?: string
          total_products?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
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
          completed_at: string | null
          created_at: string
          error_rows: number | null
          errors: string[] | null
          file_data: Json | null
          id: string
          mapping_config: Json | null
          processed_rows: number | null
          result_data: Json | null
          scheduled_at: string | null
          source_type: string
          source_url: string | null
          started_at: string | null
          status: string
          success_rows: number | null
          total_rows: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_rows?: number | null
          errors?: string[] | null
          file_data?: Json | null
          id?: string
          mapping_config?: Json | null
          processed_rows?: number | null
          result_data?: Json | null
          scheduled_at?: string | null
          source_type: string
          source_url?: string | null
          started_at?: string | null
          status?: string
          success_rows?: number | null
          total_rows?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_rows?: number | null
          errors?: string[] | null
          file_data?: Json | null
          id?: string
          mapping_config?: Json | null
          processed_rows?: number | null
          result_data?: Json | null
          scheduled_at?: string | null
          source_type?: string
          source_url?: string | null
          started_at?: string | null
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
          barcode: string | null
          brand: string | null
          category: string | null
          color: string | null
          compare_at_price: number | null
          condition: string | null
          cost_price: number | null
          country_of_origin: string | null
          created_at: string | null
          currency: string | null
          data_completeness_score: number | null
          description: string | null
          dimension_unit: string | null
          ean: string | null
          gtin: string | null
          height: number | null
          id: string
          image_urls: string[] | null
          import_id: string | null
          import_quality_score: number | null
          keywords: string[] | null
          language: string | null
          length: number | null
          material: string | null
          max_order: number | null
          meta_description: string | null
          meta_tags: string[] | null
          meta_title: string | null
          min_order: number | null
          name: string
          price: number
          published_at: string | null
          review_status: string | null
          reviewed_at: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          shipping_cost: number | null
          shipping_time: string | null
          size: string | null
          sku: string | null
          status: string | null
          stock_quantity: number | null
          style: string | null
          sub_category: string | null
          suggested_price: number | null
          supplier_name: string | null
          supplier_price: number | null
          supplier_product_id: string | null
          supplier_sku: string | null
          supplier_url: string | null
          tags: string[] | null
          upc: string | null
          updated_at: string | null
          user_id: string
          variant_group: string | null
          variant_name: string | null
          variant_sku: string | null
          video_urls: string[] | null
          weight: number | null
          weight_unit: string | null
          width: number | null
        }
        Insert: {
          ai_optimization_data?: Json | null
          ai_optimized?: boolean | null
          ai_recommendations?: Json | null
          ai_score?: number | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          color?: string | null
          compare_at_price?: number | null
          condition?: string | null
          cost_price?: number | null
          country_of_origin?: string | null
          created_at?: string | null
          currency?: string | null
          data_completeness_score?: number | null
          description?: string | null
          dimension_unit?: string | null
          ean?: string | null
          gtin?: string | null
          height?: number | null
          id?: string
          image_urls?: string[] | null
          import_id?: string | null
          import_quality_score?: number | null
          keywords?: string[] | null
          language?: string | null
          length?: number | null
          material?: string | null
          max_order?: number | null
          meta_description?: string | null
          meta_tags?: string[] | null
          meta_title?: string | null
          min_order?: number | null
          name: string
          price: number
          published_at?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          shipping_cost?: number | null
          shipping_time?: string | null
          size?: string | null
          sku?: string | null
          status?: string | null
          stock_quantity?: number | null
          style?: string | null
          sub_category?: string | null
          suggested_price?: number | null
          supplier_name?: string | null
          supplier_price?: number | null
          supplier_product_id?: string | null
          supplier_sku?: string | null
          supplier_url?: string | null
          tags?: string[] | null
          upc?: string | null
          updated_at?: string | null
          user_id: string
          variant_group?: string | null
          variant_name?: string | null
          variant_sku?: string | null
          video_urls?: string[] | null
          weight?: number | null
          weight_unit?: string | null
          width?: number | null
        }
        Update: {
          ai_optimization_data?: Json | null
          ai_optimized?: boolean | null
          ai_recommendations?: Json | null
          ai_score?: number | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          color?: string | null
          compare_at_price?: number | null
          condition?: string | null
          cost_price?: number | null
          country_of_origin?: string | null
          created_at?: string | null
          currency?: string | null
          data_completeness_score?: number | null
          description?: string | null
          dimension_unit?: string | null
          ean?: string | null
          gtin?: string | null
          height?: number | null
          id?: string
          image_urls?: string[] | null
          import_id?: string | null
          import_quality_score?: number | null
          keywords?: string[] | null
          language?: string | null
          length?: number | null
          material?: string | null
          max_order?: number | null
          meta_description?: string | null
          meta_tags?: string[] | null
          meta_title?: string | null
          min_order?: number | null
          name?: string
          price?: number
          published_at?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          shipping_cost?: number | null
          shipping_time?: string | null
          size?: string | null
          sku?: string | null
          status?: string | null
          stock_quantity?: number | null
          style?: string | null
          sub_category?: string | null
          suggested_price?: number | null
          supplier_name?: string | null
          supplier_price?: number | null
          supplier_product_id?: string | null
          supplier_sku?: string | null
          supplier_url?: string | null
          tags?: string[] | null
          upc?: string | null
          updated_at?: string | null
          user_id?: string
          variant_group?: string | null
          variant_name?: string | null
          variant_sku?: string | null
          video_urls?: string[] | null
          weight?: number | null
          weight_unit?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "imported_products_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_count: number | null
          errors: Json | null
          id: string
          job_type: string
          mapping_config: Json | null
          priority: number | null
          processed_items: number | null
          progress: number | null
          results: Json | null
          scheduled_at: string | null
          source_config: Json | null
          source_type: string | null
          started_at: string | null
          status: string | null
          success_count: number | null
          supplier_id: string | null
          total_items: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_count?: number | null
          errors?: Json | null
          id?: string
          job_type: string
          mapping_config?: Json | null
          priority?: number | null
          processed_items?: number | null
          progress?: number | null
          results?: Json | null
          scheduled_at?: string | null
          source_config?: Json | null
          source_type?: string | null
          started_at?: string | null
          status?: string | null
          success_count?: number | null
          supplier_id?: string | null
          total_items?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_count?: number | null
          errors?: Json | null
          id?: string
          job_type?: string
          mapping_config?: Json | null
          priority?: number | null
          processed_items?: number | null
          progress?: number | null
          results?: Json | null
          scheduled_at?: string | null
          source_config?: Json | null
          source_type?: string | null
          started_at?: string | null
          status?: string | null
          success_count?: number | null
          supplier_id?: string | null
          total_items?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_jobs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
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
      inventory_levels: {
        Row: {
          available_quantity: number
          created_at: string | null
          id: string
          last_synced_at: string | null
          location_id: string | null
          location_name: string
          platform: string
          product_id: string | null
          reserved_quantity: number | null
          updated_at: string | null
          user_id: string
          variant_id: string | null
        }
        Insert: {
          available_quantity?: number
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          location_id?: string | null
          location_name?: string
          platform: string
          product_id?: string | null
          reserved_quantity?: number | null
          updated_at?: string | null
          user_id: string
          variant_id?: string | null
        }
        Update: {
          available_quantity?: number
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          location_id?: string | null
          location_name?: string
          platform?: string
          product_id?: string | null
          reserved_quantity?: number | null
          updated_at?: string | null
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_levels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_levels_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          budget_spent: number | null
          budget_total: number | null
          content: Json | null
          created_at: string | null
          description: string | null
          ended_at: string | null
          id: string
          metrics: Json | null
          name: string
          scheduled_at: string | null
          settings: Json | null
          started_at: string | null
          status: string | null
          target_audience: Json | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_spent?: number | null
          budget_total?: number | null
          content?: Json | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          metrics?: Json | null
          name: string
          scheduled_at?: string | null
          settings?: Json | null
          started_at?: string | null
          status?: string | null
          target_audience?: Json | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_spent?: number | null
          budget_total?: number | null
          content?: Json | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          metrics?: Json | null
          name?: string
          scheduled_at?: string | null
          settings?: Json | null
          started_at?: string | null
          status?: string | null
          target_audience?: Json | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      marketing_intelligence: {
        Row: {
          attribution_model: string
          audience_insights: Json
          campaign_id: string | null
          channel: string
          conversion_data: Json
          created_at: string
          id: string
          optimization_suggestions: Json
          performance_score: number
          roi_analysis: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          attribution_model?: string
          audience_insights?: Json
          campaign_id?: string | null
          channel: string
          conversion_data?: Json
          created_at?: string
          id?: string
          optimization_suggestions?: Json
          performance_score?: number
          roi_analysis?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          attribution_model?: string
          audience_insights?: Json
          campaign_id?: string | null
          channel?: string
          conversion_data?: Json
          created_at?: string
          id?: string
          optimization_suggestions?: Json
          performance_score?: number
          roi_analysis?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketing_segments: {
        Row: {
          contact_count: number | null
          created_at: string | null
          criteria: Json
          description: string | null
          id: string
          last_updated: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_count?: number | null
          created_at?: string | null
          criteria?: Json
          description?: string | null
          id?: string
          last_updated?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_count?: number | null
          created_at?: string | null
          criteria?: Json
          description?: string | null
          id?: string
          last_updated?: string | null
          name?: string
          updated_at?: string | null
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
      order_routing: {
        Row: {
          created_at: string | null
          currency: string | null
          customer_info: Json | null
          external_order_id: string | null
          id: string
          notes: string | null
          order_data: Json
          products: Json
          shipping_address: Json | null
          status: string | null
          store_integration_id: string | null
          supplier_id: string | null
          supplier_order_id: string | null
          total_amount: number | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          customer_info?: Json | null
          external_order_id?: string | null
          id?: string
          notes?: string | null
          order_data: Json
          products?: Json
          shipping_address?: Json | null
          status?: string | null
          store_integration_id?: string | null
          supplier_id?: string | null
          supplier_order_id?: string | null
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          customer_info?: Json | null
          external_order_id?: string | null
          id?: string
          notes?: string | null
          order_data?: Json
          products?: Json
          shipping_address?: Json | null
          status?: string | null
          store_integration_id?: string | null
          supplier_id?: string | null
          supplier_order_id?: string | null
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_routing_store_integration_id_fkey"
            columns: ["store_integration_id"]
            isOneToOne: false
            referencedRelation: "store_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_routing_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      order_routing_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          notes: string | null
          order_id: string
          routing_data: Json | null
          routing_method: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          notes?: string | null
          order_id: string
          routing_data?: Json | null
          routing_method: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          routing_data?: Json | null
          routing_method?: string
          status?: string
          user_id?: string
        }
        Relationships: []
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
          tracking_info: Json | null
          tracking_number: string | null
          tracking_status: string | null
          tracking_updated_at: string | null
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
          tracking_info?: Json | null
          tracking_number?: string | null
          tracking_status?: string | null
          tracking_updated_at?: string | null
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
          tracking_info?: Json | null
          tracking_number?: string | null
          tracking_status?: string | null
          tracking_updated_at?: string | null
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
      performance_metrics: {
        Row: {
          collected_at: string
          created_at: string
          dimensions: Json
          id: string
          metadata: Json
          metric_name: string
          metric_type: string
          metric_unit: string | null
          metric_value: number
          user_id: string
        }
        Insert: {
          collected_at?: string
          created_at?: string
          dimensions?: Json
          id?: string
          metadata?: Json
          metric_name: string
          metric_type: string
          metric_unit?: string | null
          metric_value: number
          user_id: string
        }
        Update: {
          collected_at?: string
          created_at?: string
          dimensions?: Json
          id?: string
          metadata?: Json
          metric_name?: string
          metric_type?: string
          metric_unit?: string | null
          metric_value?: number
          user_id?: string
        }
        Relationships: []
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
      platform_integrations: {
        Row: {
          created_at: string | null
          credentials: Json | null
          error_message: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          platform_config: Json | null
          platform_name: string
          platform_type: string
          sync_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credentials?: Json | null
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform_config?: Json | null
          platform_name: string
          platform_type: string
          sync_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credentials?: Json | null
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform_config?: Json | null
          platform_name?: string
          platform_type?: string
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      predictive_analytics: {
        Row: {
          accuracy_score: number | null
          confidence_level: number
          created_at: string
          id: string
          input_data: Json
          model_version: string
          prediction_period: string
          prediction_results: Json
          prediction_type: string
          target_metric: string
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          accuracy_score?: number | null
          confidence_level?: number
          created_at?: string
          id?: string
          input_data?: Json
          model_version?: string
          prediction_period: string
          prediction_results?: Json
          prediction_type: string
          target_metric: string
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          accuracy_score?: number | null
          confidence_level?: number
          created_at?: string
          id?: string
          input_data?: Json
          model_version?: string
          prediction_period?: string
          prediction_results?: Json
          prediction_type?: string
          target_metric?: string
          updated_at?: string
          user_id?: string
          valid_until?: string | null
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
      product_variants: {
        Row: {
          cost_price: number | null
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          options: Json | null
          parent_sku: string | null
          price: number
          product_id: string | null
          shopify_variant_id: string | null
          stock_quantity: number | null
          updated_at: string | null
          user_id: string
          variant_sku: string | null
          woocommerce_variant_id: string | null
        }
        Insert: {
          cost_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          options?: Json | null
          parent_sku?: string | null
          price?: number
          product_id?: string | null
          shopify_variant_id?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          user_id: string
          variant_sku?: string | null
          woocommerce_variant_id?: string | null
        }
        Update: {
          cost_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          options?: Json | null
          parent_sku?: string | null
          price?: number
          product_id?: string | null
          shopify_variant_id?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          user_id?: string
          variant_sku?: string | null
          woocommerce_variant_id?: string | null
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
          admin_mode: string | null
          avatar_url: string | null
          business_goals: string[] | null
          business_name: string | null
          business_type: string | null
          company: string | null
          company_name: string | null
          company_website: string | null
          created_at: string | null
          email_notifications: boolean | null
          experience_level: string | null
          feature_flags: Json | null
          full_name: string | null
          id: string
          interests: string[] | null
          is_admin: boolean | null
          last_login_at: string | null
          login_count: number | null
          monthly_volume: string | null
          notification_settings: Json | null
          onboarding_completed: boolean | null
          plan: Database["public"]["Enums"]["plan_type"] | null
          preferences: Json | null
          role: string
          role_updated_at: string | null
          settings: Json | null
          subscription_expires_at: string | null
          subscription_plan: string | null
          subscription_status: string | null
          timezone: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          admin_mode?: string | null
          avatar_url?: string | null
          business_goals?: string[] | null
          business_name?: string | null
          business_type?: string | null
          company?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          experience_level?: string | null
          feature_flags?: Json | null
          full_name?: string | null
          id: string
          interests?: string[] | null
          is_admin?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          monthly_volume?: string | null
          notification_settings?: Json | null
          onboarding_completed?: boolean | null
          plan?: Database["public"]["Enums"]["plan_type"] | null
          preferences?: Json | null
          role?: string
          role_updated_at?: string | null
          settings?: Json | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          admin_mode?: string | null
          avatar_url?: string | null
          business_goals?: string[] | null
          business_name?: string | null
          business_type?: string | null
          company?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          experience_level?: string | null
          feature_flags?: Json | null
          full_name?: string | null
          id?: string
          interests?: string[] | null
          is_admin?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          monthly_volume?: string | null
          notification_settings?: Json | null
          onboarding_completed?: boolean | null
          plan?: Database["public"]["Enums"]["plan_type"] | null
          preferences?: Json | null
          role?: string
          role_updated_at?: string | null
          settings?: Json | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      realtime_chat_messages: {
        Row: {
          audio_data: string | null
          content: string | null
          created_at: string
          function_arguments: Json | null
          function_name: string | null
          function_result: Json | null
          id: string
          message_type: string
          metadata: Json | null
          role: string
          session_id: string
          transcript: string | null
        }
        Insert: {
          audio_data?: string | null
          content?: string | null
          created_at?: string
          function_arguments?: Json | null
          function_name?: string | null
          function_result?: Json | null
          id?: string
          message_type?: string
          metadata?: Json | null
          role: string
          session_id: string
          transcript?: string | null
        }
        Update: {
          audio_data?: string | null
          content?: string | null
          created_at?: string
          function_arguments?: Json | null
          function_name?: string | null
          function_result?: Json | null
          id?: string
          message_type?: string
          metadata?: Json | null
          role?: string
          session_id?: string
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "realtime_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "realtime_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      realtime_chat_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          language: string
          session_name: string
          status: string
          updated_at: string
          user_id: string
          voice_preference: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          language?: string
          session_name?: string
          status?: string
          updated_at?: string
          user_id: string
          voice_preference?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          language?: string
          session_name?: string
          status?: string
          updated_at?: string
          user_id?: string
          voice_preference?: string
        }
        Relationships: []
      }
      realtime_presence: {
        Row: {
          channel_name: string
          created_at: string
          id: string
          is_active: boolean
          last_seen: string
          presence_data: Json
          user_id: string
        }
        Insert: {
          channel_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_seen?: string
          presence_data?: Json
          user_id: string
        }
        Update: {
          channel_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_seen?: string
          presence_data?: Json
          user_id?: string
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
      revoked_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          reason: string | null
          revoked_at: string | null
          revoked_by: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          reason?: string | null
          revoked_at?: string | null
          revoked_by: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          actions: string[] | null
          conditions: Json | null
          created_at: string | null
          id: string
          permission_name: string
          resource_type: string | null
          role_name: string
        }
        Insert: {
          actions?: string[] | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          permission_name: string
          resource_type?: string | null
          role_name: string
        }
        Update: {
          actions?: string[] | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          permission_name?: string
          resource_type?: string | null
          role_name?: string
        }
        Relationships: []
      }
      sales_intelligence: {
        Row: {
          analysis_type: string
          confidence_score: number
          created_at: string
          id: string
          market_insights: Json
          predictions: Json
          product_id: string | null
          recommended_actions: Json
          time_period: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_type: string
          confidence_score?: number
          created_at?: string
          id?: string
          market_insights?: Json
          predictions?: Json
          product_id?: string | null
          recommended_actions?: Json
          time_period: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_type?: string
          confidence_score?: number
          created_at?: string
          id?: string
          market_insights?: Json
          predictions?: Json
          product_id?: string | null
          recommended_actions?: Json
          time_period?: string
          updated_at?: string
          user_id?: string
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
      seo_analyses: {
        Row: {
          accessibility_score: number | null
          best_practices_score: number | null
          competitors_data: Json | null
          content_analysis: Json | null
          created_at: string | null
          domain: string | null
          h1_tag: string | null
          id: string
          issues: Json | null
          meta_description: string | null
          meta_keywords: string[] | null
          performance_score: number | null
          recommendations: Json | null
          seo_score: number | null
          technical_analysis: Json | null
          title: string | null
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          accessibility_score?: number | null
          best_practices_score?: number | null
          competitors_data?: Json | null
          content_analysis?: Json | null
          created_at?: string | null
          domain?: string | null
          h1_tag?: string | null
          id?: string
          issues?: Json | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          performance_score?: number | null
          recommendations?: Json | null
          seo_score?: number | null
          technical_analysis?: Json | null
          title?: string | null
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          accessibility_score?: number | null
          best_practices_score?: number | null
          competitors_data?: Json | null
          content_analysis?: Json | null
          created_at?: string | null
          domain?: string | null
          h1_tag?: string | null
          id?: string
          issues?: Json | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          performance_score?: number | null
          recommendations?: Json | null
          seo_score?: number | null
          technical_analysis?: Json | null
          title?: string | null
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      seo_keywords: {
        Row: {
          competition: string | null
          cpc: number | null
          created_at: string | null
          current_position: number | null
          difficulty_score: number | null
          id: string
          keyword: string
          related_keywords: string[] | null
          search_volume: number | null
          target_url: string | null
          tracking_active: boolean | null
          trends: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          competition?: string | null
          cpc?: number | null
          created_at?: string | null
          current_position?: number | null
          difficulty_score?: number | null
          id?: string
          keyword: string
          related_keywords?: string[] | null
          search_volume?: number | null
          target_url?: string | null
          tracking_active?: boolean | null
          trends?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          competition?: string | null
          cpc?: number | null
          created_at?: string | null
          current_position?: number | null
          difficulty_score?: number | null
          id?: string
          keyword?: string
          related_keywords?: string[] | null
          search_volume?: number | null
          target_url?: string | null
          tracking_active?: boolean | null
          trends?: Json | null
          updated_at?: string | null
          user_id?: string
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
      smart_inventory: {
        Row: {
          auto_reorder_enabled: boolean
          cost_optimization: Json
          created_at: string
          current_stock: number
          demand_forecast: Json
          id: string
          last_reorder_at: string | null
          maximum_threshold: number
          minimum_threshold: number
          next_reorder_prediction: string | null
          optimal_stock: number
          performance_metrics: Json
          product_id: string
          reorder_point: number
          reorder_quantity: number
          seasonality_data: Json
          stock_risk_level: string
          supplier_performance: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_reorder_enabled?: boolean
          cost_optimization?: Json
          created_at?: string
          current_stock?: number
          demand_forecast?: Json
          id?: string
          last_reorder_at?: string | null
          maximum_threshold?: number
          minimum_threshold?: number
          next_reorder_prediction?: string | null
          optimal_stock?: number
          performance_metrics?: Json
          product_id: string
          reorder_point?: number
          reorder_quantity?: number
          seasonality_data?: Json
          stock_risk_level?: string
          supplier_performance?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_reorder_enabled?: boolean
          cost_optimization?: Json
          created_at?: string
          current_stock?: number
          demand_forecast?: Json
          id?: string
          last_reorder_at?: string | null
          maximum_threshold?: number
          minimum_threshold?: number
          next_reorder_prediction?: string | null
          optimal_stock?: number
          performance_metrics?: Json
          product_id?: string
          reorder_point?: number
          reorder_quantity?: number
          seasonality_data?: Json
          stock_risk_level?: string
          supplier_performance?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      store_integrations: {
        Row: {
          connection_status: string | null
          created_at: string | null
          credentials: Json
          error_log: Json | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          order_count: number | null
          platform: string
          product_count: number | null
          store_name: string
          store_url: string | null
          sync_frequency: string | null
          sync_settings: Json | null
          updated_at: string | null
          user_id: string
          webhook_config: Json | null
        }
        Insert: {
          connection_status?: string | null
          created_at?: string | null
          credentials?: Json
          error_log?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          order_count?: number | null
          platform: string
          product_count?: number | null
          store_name: string
          store_url?: string | null
          sync_frequency?: string | null
          sync_settings?: Json | null
          updated_at?: string | null
          user_id: string
          webhook_config?: Json | null
        }
        Update: {
          connection_status?: string | null
          created_at?: string | null
          credentials?: Json
          error_log?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          order_count?: number | null
          platform?: string
          product_count?: number | null
          store_name?: string
          store_url?: string | null
          sync_frequency?: string | null
          sync_settings?: Json | null
          updated_at?: string | null
          user_id?: string
          webhook_config?: Json | null
        }
        Relationships: []
      }
      stripe_webhooks: {
        Row: {
          created_at: string | null
          data: Json
          event_type: string
          id: string
          processed: boolean | null
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          event_type: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          event_type?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: []
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
      supplier_feeds: {
        Row: {
          authentication: Json | null
          created_at: string | null
          error_log: Json | null
          feed_config: Json | null
          feed_type: string
          feed_url: string | null
          field_mapping: Json | null
          id: string
          is_active: boolean | null
          last_import_at: string | null
          last_import_status: string | null
          supplier_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          authentication?: Json | null
          created_at?: string | null
          error_log?: Json | null
          feed_config?: Json | null
          feed_type: string
          feed_url?: string | null
          field_mapping?: Json | null
          id?: string
          is_active?: boolean | null
          last_import_at?: string | null
          last_import_status?: string | null
          supplier_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          authentication?: Json | null
          created_at?: string | null
          error_log?: Json | null
          feed_config?: Json | null
          feed_type?: string
          feed_url?: string | null
          field_mapping?: Json | null
          id?: string
          is_active?: boolean | null
          last_import_at?: string | null
          last_import_status?: string | null
          supplier_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_feeds_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_marketplace: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          display_order: number | null
          id: string
          integration_complexity: string | null
          is_featured: boolean | null
          marketing_copy: string | null
          min_order_value: number | null
          setup_time_minutes: number | null
          supplier_id: string
          supported_countries: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          integration_complexity?: string | null
          is_featured?: boolean | null
          marketing_copy?: string | null
          min_order_value?: number | null
          setup_time_minutes?: number | null
          supplier_id: string
          supported_countries?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          integration_complexity?: string | null
          is_featured?: boolean | null
          marketing_copy?: string | null
          min_order_value?: number | null
          setup_time_minutes?: number | null
          supplier_id?: string
          supported_countries?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_marketplace_supplier_id_fkey"
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
          brand: string | null
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          ean: string | null
          external_sku: string
          global_sku: string | null
          id: string
          image_urls: string[] | null
          import_batch_id: string | null
          last_updated: string | null
          name: string
          price: number
          raw_data: Json | null
          stock_quantity: number | null
          subcategory: string | null
          supplier_id: string
          upc: string | null
          user_id: string
        }
        Insert: {
          attributes?: Json | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          ean?: string | null
          external_sku: string
          global_sku?: string | null
          id?: string
          image_urls?: string[] | null
          import_batch_id?: string | null
          last_updated?: string | null
          name: string
          price: number
          raw_data?: Json | null
          stock_quantity?: number | null
          subcategory?: string | null
          supplier_id: string
          upc?: string | null
          user_id: string
        }
        Update: {
          attributes?: Json | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          ean?: string | null
          external_sku?: string
          global_sku?: string | null
          id?: string
          image_urls?: string[] | null
          import_batch_id?: string | null
          last_updated?: string | null
          name?: string
          price?: number
          raw_data?: Json | null
          stock_quantity?: number | null
          subcategory?: string | null
          supplier_id?: string
          upc?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_routing_rules: {
        Row: {
          api_endpoint: string | null
          created_at: string
          edi_config: Json | null
          email_address: string | null
          id: string
          is_active: boolean
          routing_method: string
          supplier_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_endpoint?: string | null
          created_at?: string
          edi_config?: Json | null
          email_address?: string | null
          id?: string
          is_active?: boolean
          routing_method: string
          supplier_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_endpoint?: string | null
          created_at?: string
          edi_config?: Json | null
          email_address?: string | null
          id?: string
          is_active?: boolean
          routing_method?: string
          supplier_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supplier_sync_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_details: Json | null
          error_items: number | null
          id: string
          job_type: string
          processed_items: number | null
          progress: number | null
          results: Json | null
          started_at: string | null
          status: string
          success_items: number | null
          supplier_id: string
          sync_config: Json | null
          total_items: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          error_items?: number | null
          id?: string
          job_type?: string
          processed_items?: number | null
          progress?: number | null
          results?: Json | null
          started_at?: string | null
          status?: string
          success_items?: number | null
          supplier_id: string
          sync_config?: Json | null
          total_items?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          error_items?: number | null
          id?: string
          job_type?: string
          processed_items?: number | null
          progress?: number | null
          results?: Json | null
          started_at?: string | null
          status?: string
          success_items?: number | null
          supplier_id?: string
          sync_config?: Json | null
          total_items?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_sync_jobs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          access_count: number | null
          api_endpoint: string | null
          api_key: string | null
          commission_rate: number | null
          connection_status: string | null
          connector_type: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          credentials_updated_at: string | null
          delivery_time_days: number | null
          description: string | null
          encrypted_credentials: Json | null
          error_count: number | null
          id: string
          integration_features: Json | null
          is_premium: boolean | null
          last_access_at: string | null
          last_sync_at: string | null
          last_sync_status: string | null
          logo_url: string | null
          minimum_order_value: number | null
          monthly_fee: number | null
          name: string
          next_sync_at: string | null
          product_count: number | null
          rate_limits: Json | null
          rating: number | null
          sector: string | null
          setup_complexity: string | null
          setup_fee: number | null
          slug: string | null
          status: string | null
          success_rate: number | null
          supplier_type: string | null
          supported_regions: string[] | null
          sync_enabled: boolean | null
          sync_frequency: string | null
          tags: string[] | null
          total_products: number | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          access_count?: number | null
          api_endpoint?: string | null
          api_key?: string | null
          commission_rate?: number | null
          connection_status?: string | null
          connector_type?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          credentials_updated_at?: string | null
          delivery_time_days?: number | null
          description?: string | null
          encrypted_credentials?: Json | null
          error_count?: number | null
          id?: string
          integration_features?: Json | null
          is_premium?: boolean | null
          last_access_at?: string | null
          last_sync_at?: string | null
          last_sync_status?: string | null
          logo_url?: string | null
          minimum_order_value?: number | null
          monthly_fee?: number | null
          name: string
          next_sync_at?: string | null
          product_count?: number | null
          rate_limits?: Json | null
          rating?: number | null
          sector?: string | null
          setup_complexity?: string | null
          setup_fee?: number | null
          slug?: string | null
          status?: string | null
          success_rate?: number | null
          supplier_type?: string | null
          supported_regions?: string[] | null
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          tags?: string[] | null
          total_products?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          access_count?: number | null
          api_endpoint?: string | null
          api_key?: string | null
          commission_rate?: number | null
          connection_status?: string | null
          connector_type?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          credentials_updated_at?: string | null
          delivery_time_days?: number | null
          description?: string | null
          encrypted_credentials?: Json | null
          error_count?: number | null
          id?: string
          integration_features?: Json | null
          is_premium?: boolean | null
          last_access_at?: string | null
          last_sync_at?: string | null
          last_sync_status?: string | null
          logo_url?: string | null
          minimum_order_value?: number | null
          monthly_fee?: number | null
          name?: string
          next_sync_at?: string | null
          product_count?: number | null
          rate_limits?: Json | null
          rating?: number | null
          sector?: string | null
          setup_complexity?: string | null
          setup_fee?: number | null
          slug?: string | null
          status?: string | null
          success_rate?: number | null
          supplier_type?: string | null
          supported_regions?: string[] | null
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          tags?: string[] | null
          total_products?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      sync_history: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          entity_id: string | null
          entity_type: string
          errors: Json | null
          id: string
          items_processed: number | null
          items_total: number | null
          metadata: Json | null
          status: string | null
          sync_type: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          entity_id?: string | null
          entity_type: string
          errors?: Json | null
          id?: string
          items_processed?: number | null
          items_total?: number | null
          metadata?: Json | null
          status?: string | null
          sync_type?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          entity_id?: string | null
          entity_type?: string
          errors?: Json | null
          id?: string
          items_processed?: number | null
          items_total?: number | null
          metadata?: Json | null
          status?: string | null
          sync_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sync_jobs: {
        Row: {
          config: Json | null
          created_at: string
          error_count: number
          frequency: string
          id: string
          last_sync: string | null
          name: string
          next_sync: string | null
          products_count: number
          status: string
          supplier: string
          updated_at: string
          updated_count: number
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          error_count?: number
          frequency?: string
          id?: string
          last_sync?: string | null
          name: string
          next_sync?: string | null
          products_count?: number
          status?: string
          supplier: string
          updated_at?: string
          updated_count?: number
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          error_count?: number
          frequency?: string
          id?: string
          last_sync?: string | null
          name?: string
          next_sync?: string | null
          products_count?: number
          status?: string
          supplier?: string
          updated_at?: string
          updated_count?: number
          user_id?: string
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
      sync_schedules: {
        Row: {
          created_at: string | null
          frequency_minutes: number
          id: string
          integration_id: string | null
          is_active: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          sync_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          frequency_minutes?: number
          id?: string
          integration_id?: string | null
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          sync_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          frequency_minutes?: number
          id?: string
          integration_id?: string | null
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          sync_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_schedules_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_statistics: {
        Row: {
          created_at: string | null
          errors_count: number | null
          execution_time_ms: number | null
          id: string
          metadata: Json | null
          products_processed: number | null
          products_updated: number | null
          sync_date: string | null
          sync_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          errors_count?: number | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          products_processed?: number | null
          products_updated?: number | null
          sync_date?: string | null
          sync_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          errors_count?: number | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          products_processed?: number | null
          products_updated?: number | null
          sync_date?: string | null
          sync_type?: string
          user_id?: string
        }
        Relationships: []
      }
      system_health_monitoring: {
        Row: {
          alerts_triggered: Json
          component_name: string
          component_type: string
          created_at: string
          error_rate: number
          health_status: string
          id: string
          last_check_at: string
          metrics_data: Json
          performance_score: number
          response_time_ms: number | null
          updated_at: string
          uptime_percentage: number
          user_id: string
        }
        Insert: {
          alerts_triggered?: Json
          component_name: string
          component_type: string
          created_at?: string
          error_rate?: number
          health_status?: string
          id?: string
          last_check_at?: string
          metrics_data?: Json
          performance_score?: number
          response_time_ms?: number | null
          updated_at?: string
          uptime_percentage?: number
          user_id: string
        }
        Update: {
          alerts_triggered?: Json
          component_name?: string
          component_type?: string
          created_at?: string
          error_rate?: number
          health_status?: string
          id?: string
          last_check_at?: string
          metrics_data?: Json
          performance_score?: number
          response_time_ms?: number | null
          updated_at?: string
          uptime_percentage?: number
          user_id?: string
        }
        Relationships: []
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
      user_notifications: {
        Row: {
          category: string
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          message: string
          priority: number | null
          read: boolean | null
          read_at: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          message: string
          priority?: number | null
          read?: boolean | null
          read_at?: string | null
          title: string
          type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          message?: string
          priority?: number | null
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          dashboard_config: Json
          id: string
          notification_settings: Json
          preferences: Json
          shortcuts: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dashboard_config?: Json
          id?: string
          notification_settings?: Json
          preferences?: Json
          shortcuts?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dashboard_config?: Json
          id?: string
          notification_settings?: Json
          preferences?: Json
          shortcuts?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_activity_at: string | null
          location: Json | null
          session_token: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity_at?: string | null
          location?: Json | null
          session_token: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity_at?: string | null
          location?: Json | null
          session_token?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_configurations: {
        Row: {
          created_at: string | null
          endpoint_url: string
          error_count: number | null
          events_enabled: string[] | null
          id: string
          is_active: boolean | null
          last_event_at: string | null
          platform_type: string
          updated_at: string | null
          user_id: string
          webhook_secret: string
        }
        Insert: {
          created_at?: string | null
          endpoint_url: string
          error_count?: number | null
          events_enabled?: string[] | null
          id?: string
          is_active?: boolean | null
          last_event_at?: string | null
          platform_type: string
          updated_at?: string | null
          user_id: string
          webhook_secret: string
        }
        Update: {
          created_at?: string | null
          endpoint_url?: string
          error_count?: number | null
          events_enabled?: string[] | null
          id?: string
          is_active?: boolean | null
          last_event_at?: string | null
          platform_type?: string
          updated_at?: string | null
          user_id?: string
          webhook_secret?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          integration_id: string | null
          platform: string
          processed: boolean | null
          processed_at: string | null
          webhook_data: Json
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          integration_id?: string | null
          platform: string
          processed?: boolean | null
          processed_at?: string | null
          webhook_data?: Json
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          integration_id?: string | null
          platform?: string
          processed?: boolean | null
          processed_at?: string | null
          webhook_data?: Json
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_change_user_role: {
        Args: { new_role: string; target_user_id: string }
        Returns: Json
      }
      admin_get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          last_login_at: string
          login_count: number
          plan: string
          role: Database["public"]["Enums"]["user_role"]
          subscription_status: string
          updated_at: string
        }[]
      }
      admin_set_role: {
        Args: { new_role: string; target_user_id: string }
        Returns: Json
      }
      admin_set_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["user_role"]
          target_user_id: string
        }
        Returns: Json
      }
      admin_update_user_plan: {
        Args: { new_plan: string; target_user_id: string }
        Returns: Json
      }
      admin_update_user_role: {
        Args: { new_role: string; target_user_id: string }
        Returns: Json
      }
      calculate_profit_margin: {
        Args: { cost_price: number; price: number }
        Returns: number
      }
      check_quota: {
        Args: { quota_key_param: string; user_id_param: string }
        Returns: boolean
      }
      check_security_configuration: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      clean_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_and_secure_all_policies: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_security_events: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_revoked_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      configure_auth_security_settings: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
      get_current_user_admin_mode: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      get_dashboard_analytics: {
        Args: { user_id_param?: string }
        Returns: Json
      }
      get_effective_plan: {
        Args: {
          user_admin_mode?: string
          user_plan: Database["public"]["Enums"]["plan_type"]
          user_role: string
        }
        Returns: Database["public"]["Enums"]["plan_type"]
      }
      get_final_security_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
      get_secure_catalog_products: {
        Args: {
          category_filter?: string
          limit_count?: number
          search_term?: string
        }
        Returns: {
          availability_status: string
          brand: string
          category: string
          competition_score: number
          cost_price: number
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
          profit_margin: number
          rating: number
          reviews_count: number
          sales_count: number
          sku: string
          subcategory: string
          supplier_name: string
          supplier_url: string
          tags: string[]
          updated_at: string
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
      get_security_configuration_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
      get_supplier_stats: {
        Args: { user_id_param: string }
        Returns: Json
      }
      get_user_plan: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_user_role: {
        Args: { check_user_id?: string }
        Returns: string
      }
      get_user_role_secure: {
        Args: { user_id_param?: string }
        Returns: string
      }
      has_feature_flag: {
        Args: { flag_name: string; user_id_param: string }
        Returns: boolean
      }
      has_permission: {
        Args: {
          action_param?: string
          permission_name_param: string
          resource_type_param?: string
        }
        Returns: boolean
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
      is_admin: {
        Args: { user_id_param?: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_supplier_owner: {
        Args: { _supplier_id: string; _user_id: string }
        Returns: boolean
      }
      is_token_revoked: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      is_user_admin: {
        Args: Record<PropertyKey, never> | { check_user_id?: string }
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
      process_automation_trigger: {
        Args: { context_data?: Json; trigger_id: string }
        Returns: Json
      }
      public_newsletter_signup: {
        Args: { email_param: string }
        Returns: Json
      }
      revoke_user_sessions: {
        Args: { session_ids?: string[]; target_user_id: string }
        Returns: Json
      }
      revoke_user_token: {
        Args: {
          admin_user_id: string
          revoke_reason?: string
          target_user_id: string
        }
        Returns: Json
      }
      rotate_api_key: {
        Args: { key_id: string }
        Returns: Json
      }
      search_suppliers: {
        Args: {
          country_filter?: string
          limit_count?: number
          offset_count?: number
          search_term?: string
          sector_filter?: string
          supplier_type_filter?: string
        }
        Returns: {
          connection_status: string
          country: string
          created_at: string
          description: string
          id: string
          logo_url: string
          name: string
          product_count: number
          rating: number
          sector: string
          supplier_type: string
          tags: string[]
        }[]
      }
      secure_admin_set_role: {
        Args: { new_role: string; target_user_id: string }
        Returns: Json
      }
      secure_all_user_tables: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      secure_newsletter_signup: {
        Args: { email_param: string; source_param?: string; user_ip?: unknown }
        Returns: Json
      }
      seed_sample_data: {
        Args: Record<PropertyKey, never>
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
        Args:
          | { _role: Database["public"]["Enums"]["app_role"] }
          | { required_role: string; user_id: string }
        Returns: boolean
      }
      validate_customer_access: {
        Args: { customer_id: string }
        Returns: boolean
      }
      verify_security_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      verify_supplier_ownership: {
        Args: { supplier_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "staff"
      enhanced_app_role: "admin" | "manager" | "user"
      plan_type: "standard" | "pro" | "ultra_pro" | "free"
      user_role: "user" | "admin" | "manager"
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
      enhanced_app_role: ["admin", "manager", "user"],
      plan_type: ["standard", "pro", "ultra_pro", "free"],
      user_role: ["user", "admin", "manager"],
    },
  },
} as const
