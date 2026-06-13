-- 智能贩卖机数据库表结构
-- 在 Supabase SQL Editor 中执行

-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  category TEXT NOT NULL,
  image TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 销售记录表
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  total DECIMAL(10,2) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  sale_date_str TEXT DEFAULT TO_CHAR(TIMEZONE('utc', NOW()), 'YYYY-MM-DD')
);

-- 管理员日志表
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 创建视图：每日销售统计
CREATE OR REPLACE VIEW daily_sales AS
SELECT 
  sale_date_str,
  product_id,
  product_name,
  SUM(quantity) as total_quantity,
  SUM(total) as total_revenue
FROM sales
GROUP BY sale_date_str, product_id, product_name
ORDER BY sale_date_str DESC, total_quantity DESC;

-- 启用 Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- 创建公开访问策略（方便开发，生产环境应限制）
CREATE POLICY "Allow all" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON admin_logs FOR ALL USING (true) WITH CHECK (true);
