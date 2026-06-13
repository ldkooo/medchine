import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function POST(request: Request) {
  const body = await request.json()

  const { error } = await supabase
    .from('sales')
    .insert({
      product_id: body.product_id,
      product_name: body.product_name,
      price: body.price,
      quantity: body.quantity,
      total: body.total,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
