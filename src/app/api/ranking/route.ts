import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function GET() {
  const { data, error } = await supabase
    .from('sales')
    .select('product_name, product_id, price, quantity')
    .order('quantity', { ascending: false })
    .limit(5)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 聚合统计
  const salesMap = new Map()
  data?.forEach((sale) => {
    const key = sale.product_id
    if (salesMap.has(key)) {
      salesMap.get(key).total_quantity += sale.quantity
    } else {
      salesMap.set(key, {
        product_name: sale.product_name,
        product_id: sale.product_id,
        total_quantity: sale.quantity
      })
    }
  })

  const ranked = Array.from(salesMap.values())
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, 5)

  return NextResponse.json({ ranking: ranked })
}
