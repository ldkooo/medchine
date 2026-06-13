export interface Product {
  id: string
  name: string
  price: number
  stock: number
  category: string
  image?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  product_id: string
  product_name: string
  price: number
  quantity: number
  total: number
  sale_date: string
  sale_date_str: string
}

export interface DailySale {
  sale_date_str: string
  product_id: string
  product_name: string
  total_quantity: number
  total_revenue: number
}

export interface AdminLog {
  id: string
  action: string
  product_id: string
  product_name: string
  details: string
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}
