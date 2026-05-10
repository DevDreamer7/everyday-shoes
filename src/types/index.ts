export interface Product {
  id: string
  name: string
  brand: string
  category: string
  color: string
  size: string
  sku: string
  cost_price: number
  selling_price: number
  stock_quantity: number
  low_stock_threshold: number
  supplier_id: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  contact_name: string
  email: string
  phone: string
  address: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
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

export interface Sale {
  id: string
  customer_id: string | null
  total_amount: number
  payment_method: string
  notes: string | null
  created_at: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface DashboardStats {
  totalProducts: number
  lowStockCount: number
  todaySales: number
  todayRevenue: number
  monthRevenue: number
  topProducts: { name: string; sold: number }[]
}