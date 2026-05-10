export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          brand: string | null
          category: string | null
          color: string | null
          size: string | null
          sku: string | null
          cost_price: number
          selling_price: number
          stock_quantity: number
          low_stock_threshold: number
          supplier_id: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          brand?: string | null
          category?: string | null
          color?: string | null
          size?: string | null
          sku?: string | null
          cost_price?: number
          selling_price: number
          stock_quantity?: number
          low_stock_threshold?: number
          supplier_id?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          brand?: string | null
          category?: string | null
          color?: string | null
          size?: string | null
          sku?: string | null
          cost_price?: number
          selling_price?: number
          stock_quantity?: number
          low_stock_threshold?: number
          supplier_id?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          contact_name: string | null
          email: string | null
          phone: string | null
          address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string
          address: string | null
          notes: string | null
          total_purchases: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone: string
          address?: string | null
          notes?: string | null
          total_purchases?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string
          address?: string | null
          notes?: string | null
          total_purchases?: number
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          customer_id: string | null
          total_amount: number
          payment_method: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          total_amount: number
          payment_method?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          total_amount?: number
          payment_method?: string
          notes?: string | null
          created_at?: string
        }
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          product_id: string | null
          quantity: number
          unit_price: number
          subtotal: number
        }
        Insert: {
          id?: string
          sale_id: string
          product_id?: string | null
          quantity: number
          unit_price: number
          subtotal: number
        }
        Update: {
          id?: string
          sale_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
          subtotal?: number
        }
      }
    }
  }
}