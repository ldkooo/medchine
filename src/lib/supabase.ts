import { createClient } from '@supabase/supabase-js'

// 同时支持两种变量名（NEXT_PUBLIC_ 前缀和没有前缀的）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

// 浏览器端检查：如果环境变量没设置，给个提示但不崩溃
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseKey)) {
  console.warn('⚠️ Supabase 环境变量未设置，请在 .env.local 或 Vercel 环境变量中配置')
}

// 创建 Supabase 客户端（服务端构建时如果没配置，返回 null 避免报错）
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('https://placeholder.supabase.co', 'placeholder')
