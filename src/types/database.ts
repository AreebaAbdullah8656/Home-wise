export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          currency: string;
          location: string | null;
          location_lat: number | null;
          location_lng: number | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          currency?: string;
          location?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          currency?: string;
          location?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          budget_alerts_enabled: boolean;
          notification_preferences: Json;
          privacy_preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          budget_alerts_enabled?: boolean;
          notification_preferences?: Json;
          privacy_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          budget_alerts_enabled?: boolean;
          notification_preferences?: Json;
          privacy_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          is_default: boolean;
          spending_limit: number | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          is_default?: boolean;
          spending_limit?: number | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          is_default?: boolean;
          spending_limit?: number | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      monthly_budgets: {
        Row: {
          id: string;
          user_id: string;
          year_month: string;
          total_amount: number;
          savings_allocation: number;
          emergency_allocation: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          year_month: string;
          total_amount?: number;
          savings_allocation?: number;
          emergency_allocation?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          year_month?: string;
          total_amount?: number;
          savings_allocation?: number;
          emergency_allocation?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bills: {
        Row: {
          id: string;
          user_id: string;
          store_name: string | null;
          purchase_date: string | null;
          total_amount: number | null;
          storage_path: string | null;
          mime_type: string | null;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          store_name?: string | null;
          purchase_date?: string | null;
          total_amount?: number | null;
          storage_path?: string | null;
          mime_type?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          store_name?: string | null;
          purchase_date?: string | null;
          total_amount?: number | null;
          storage_path?: string | null;
          mime_type?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bill_items: {
        Row: {
          id: string;
          bill_id: string;
          user_id: string;
          product_name: string;
          quantity: number | null;
          unit_price: number | null;
          line_total: number | null;
          category_suggestion: string | null;
          category_id: string | null;
          is_confirmed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bill_id: string;
          user_id: string;
          product_name: string;
          quantity?: number | null;
          unit_price?: number | null;
          line_total?: number | null;
          category_suggestion?: string | null;
          category_id?: string | null;
          is_confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bill_id?: string;
          user_id?: string;
          product_name?: string;
          quantity?: number | null;
          unit_price?: number | null;
          line_total?: number | null;
          category_suggestion?: string | null;
          category_id?: string | null;
          is_confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          name: string;
          amount: number;
          expense_date: string;
          payment_method: string | null;
          notes: string | null;
          source: string;
          bill_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          name: string;
          amount: number;
          expense_date?: string;
          payment_method?: string | null;
          notes?: string | null;
          source?: string;
          bill_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          name?: string;
          amount?: number;
          expense_date?: string;
          payment_method?: string | null;
          notes?: string | null;
          source?: string;
          bill_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          allocated_amount: number;
          actual_amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount?: number;
          allocated_amount?: number;
          actual_amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_amount?: number;
          allocated_amount?: number;
          actual_amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      emergency_funds: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          allocated_amount: number;
          actual_amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          target_amount?: number;
          allocated_amount?: number;
          actual_amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_amount?: number;
          allocated_amount?: number;
          actual_amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      grocery_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          quantity: string | null;
          estimated_price: number | null;
          actual_price: number | null;
          priority: string;
          is_purchased: boolean;
          expense_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          quantity?: string | null;
          estimated_price?: number | null;
          actual_price?: number | null;
          priority?: string;
          is_purchased?: boolean;
          expense_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          quantity?: string | null;
          estimated_price?: number | null;
          actual_price?: number | null;
          priority?: string;
          is_purchased?: boolean;
          expense_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inventory_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          quantity: number;
          purchase_date: string | null;
          price: number | null;
          notes: string | null;
          stock_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category?: string;
          quantity?: number;
          purchase_date?: string | null;
          price?: number | null;
          notes?: string | null;
          stock_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string;
          quantity?: number;
          purchase_date?: string | null;
          price?: number | null;
          notes?: string | null;
          stock_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      saved_recommendations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          payload: Json;
          is_sample: boolean;
          dismissed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          payload?: Json;
          is_sample?: boolean;
          dismissed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          payload?: Json;
          is_sample?: boolean;
          dismissed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookmarked_tips: {
        Row: {
          id: string;
          user_id: string;
          tip_key: string;
          tip_title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tip_key: string;
          tip_title: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tip_key?: string;
          tip_title?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
