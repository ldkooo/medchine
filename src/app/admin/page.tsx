"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Product, Sale } from "@/types";

type Tab = "products" | "sales" | "stats";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 商品表单
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "", price: "", stock: "", category: "", image: ""
  });

  const CATEGORIES = ["饮料", "零食", "冰激凌", "方便食品"];

  useEffect(() => { if (isAuthenticated) loadData(); }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: productsData }, { data: salesData }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("sales").select("*").order("sale_date", { ascending: false }).limit(100)
    ]);
    setProducts(productsData || []);
    setSales(salesData || []);
    setLoading(false);
  };

  const handleLogin = () => {
    if (password === "admin123") setIsAuthenticated(true);
    else alert("密码错误！");
  };

  // 添加/编辑商品
  const saveProduct = async () => {
    if (!formData.name || !formData.price || !formData.category) {
      alert("请填写完整信息！"); return;
    }
    const data = {
      name: formData.name,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock) || 0,
      category: formData.category,
      image: formData.image || "📦",
      status: "active" as const,
    };

    if (editingProduct) {
      const { error } = await supabase.from("products").update(data).eq("id", editingProduct.id);
      if (error) alert("更新失败: " + error.message);
      else { setEditingProduct(null); setShowForm(false); loadData(); }
    } else {
      const { error } = await supabase.from("products").insert(data);
      if (error) alert("添加失败: " + error.message);
      else { setShowForm(false); loadData(); }
    }
  };

  // 删除商品
  const deleteProduct = async (product: Product) => {
    if (!confirm(`确定删除商品「${product.name}」吗？此操作不可恢复！`)) return;
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) alert("删除失败: " + error.message);
    else { alert("删除成功！"); loadData(); }
  };

  // 修改库存
  const updateStock = async (product: Product, newStock: number) => {
    if (newStock < 0) { alert("库存不能为负数！"); return; }
    const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", product.id);
    if (error) alert("修改失败: " + error.message);
    else loadData();
  };

  // 上下架
  const toggleStatus = async (product: Product) => {
    const newStatus = product.status === "active" ? "inactive" : "active";
    await supabase.from("products").update({ status: newStatus }).eq("id", product.id);
    loadData();
  };

  // 统计数据
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalQuantity = sales.reduce((sum, s) => sum + s.quantity, 0);
  const totalOrders = sales.length;

  // 按日期分组销售
  const dates = [...new Set(sales.map(s => s.sale_date_str))].sort().reverse();
  const groupedSales = dates.reduce((acc, date) => {
    acc[date] = sales.filter(s => s.sale_date_str === date);
    return acc;
  }, {} as Record<string, Sale[]>);

  const openForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        stock: product.stock.toString(),
        category: product.category,
        image: product.image || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: "", price: "", stock: "", category: "", image: "" });
    }
    setShowForm(true);
  };

  if (!isAuthenticated) return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-lg text-center">
        <div className="text-4xl mb-4">🔐</div>
        <h2 className="text-xl font-bold mb-4">管理员登录</h2>
        <div className="space-y-3">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" onKeyPress={(e) => e.key === "Enter" && handleLogin()} className="w-full" />
          <button onClick={handleLogin} className="w-full btn-primary py-3">登录</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">⚙️ 管理后台</h1>

      {/* 标签切换 */}
      <div className="flex gap-2 bg-white/80 backdrop-blur-md rounded-xl p-1">
        {[
          { key: "products" as Tab, label: "📦 商品管理", count: products.length },
          { key: "sales" as Tab, label: "📊 销售记录", count: sales.length },
          { key: "stats" as Tab, label: "📈 数据统计", count: null },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? "bg-purple-600 text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}>
            {tab.label} {tab.count !== null && <span className="ml-1 text-xs bg-white/20 px-1.5 rounded-full">{tab.count}</span>}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-20">加载中...</div> : (
        <>
          {/* 商品管理 */}
          {activeTab === "products" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold">商品列表</h2>
                <button onClick={() => openForm()} className="btn-primary text-sm">＋ 添加商品</button>
              </div>

              {showForm && (
                <div className="bg-white/95 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-3">
                  <h3 className="font-bold">{editingProduct ? "编辑商品" : "添加新商品"}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="商品名称" />
                    <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="价格" />
                    <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="库存" />
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="border rounded-lg px-3 py-2">
                      <option value="">选择分类</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveProduct} className="btn-primary">{editingProduct ? "保存修改" : "确认添加"}</button>
                    <button onClick={() => setShowForm(false)} className="btn-outline">取消</button>
                  </div>
                </div>
              )}

              <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr><th className="px-3 py-3 text-left">商品</th><th className="px-3 py-3">分类</th><th className="px-3 py-3 text-right">价格</th><th className="px-3 py-3 text-right">库存</th><th className="px-3 py-3 text-center">状态</th><th className="px-3 py-3 text-center">操作</th></tr></thead>
                  <tbody className="divide-y">
                    {products.map((p) => (
                      <tr key={p.id} className={p.status === "inactive" ? "opacity-50" : ""}>
                        <td className="px-3 py-3"><div className="flex items-center gap-2"><span className="text-xl">{p.image || "📦"}</span><span className="font-medium">{p.name}</span></div></td>
                        <td className="px-3 py-3"><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">{p.category}</span></td>
                        <td className="px-3 py-3 text-right font-medium">¥{p.price.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => updateStock(p, p.stock - 1)} className="w-6 h-6 rounded-full bg-gray-200 text-xs" disabled={p.stock <= 0}>−</button>
                            <span className="w-8 text-center">{p.stock}</span>
                            <button onClick={() => updateStock(p, p.stock + 1)} className="w-6 h-6 rounded-full bg-gray-200 text-xs">+</button>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center"><span className={`text-xs px-2 py-1 rounded-full ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.status === "active" ? "上架" : "下架"}</span></td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => openForm(p)} className="text-blue-600 text-xs">编辑</button>
                            <button onClick={() => toggleStatus(p)} className={`text-xs ${p.status === "active" ? "text-orange-600" : "text-green-600"}`}>{p.status === "active" ? "下架" : "上架"}</button>
                            <button onClick={() => deleteProduct(p)} className="text-red-600 text-xs">删除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 销售记录 */}
          {activeTab === "sales" && (
            <div className="space-y-4">
              <h2 className="font-bold">销售记录</h2>
              {sales.length === 0 ? (
                <div className="text-center py-20 text-gray-400"><div className="text-5xl mb-4">📦</div><p>暂无销售记录</p></div>
              ) : (
                <div className="space-y-3">
                  {dates.map(date => {
                    const daySales = groupedSales[date];
                    const dayTotal = daySales.reduce((sum, s) => sum + s.total, 0);
                    return (
                      <div key={date} className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b flex justify-between items-center">
                          <span className="font-bold">📅 {date}</span>
                          <span className="text-sm text-gray-500">{daySales.length} 单 · ¥{dayTotal.toFixed(2)}</span>
                        </div>
                        <div className="divide-y">
                          {daySales.map(sale => (
                            <div key={sale.id} className="p-4 flex justify-between items-center">
                              <div>
                                <p className="font-medium">{sale.product_name}</p>
                                <p className="text-sm text-gray-400">{new Date(sale.sale_date).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-red-600">¥{sale.total.toFixed(2)}</p>
                                <p className="text-sm text-gray-400">x{sale.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 数据统计 */}
          {activeTab === "stats" && (
            <div className="space-y-4">
              <h2 className="font-bold">数据统计</h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/95 backdrop-blur-md p-5 rounded-xl shadow-sm text-center">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="text-sm text-gray-400">总销售额</div>
                  <div className="text-2xl font-bold text-red-600">¥{totalRevenue.toFixed(2)}</div>
                </div>
                <div className="bg-white/95 backdrop-blur-md p-5 rounded-xl shadow-sm text-center">
                  <div className="text-3xl mb-2">📦</div>
                  <div className="text-sm text-gray-400">总销量</div>
                  <div className="text-2xl font-bold text-red-600">{totalQuantity} 件</div>
                </div>
                <div className="bg-white/95 backdrop-blur-md p-5 rounded-xl shadow-sm text-center">
                  <div className="text-3xl mb-2">🛒</div>
                  <div className="text-sm text-gray-400">订单数</div>
                  <div className="text-2xl font-bold text-red-600">{totalOrders}</div>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm p-4">
                <h3 className="font-bold mb-3">商品销售排行</h3>
                {(() => {
                  const productStats = sales.reduce((acc, s) => {
                    if (!acc[s.product_name]) acc[s.product_name] = { quantity: 0, revenue: 0 };
                    acc[s.product_name].quantity += s.quantity;
                    acc[s.product_name].revenue += s.total;
                    return acc;
                  }, {} as Record<string, { quantity: number; revenue: number }>);
                  const sorted = Object.entries(productStats).sort((a, b) => b[1].quantity - a[1].quantity);
                  return sorted.length === 0 ? <p className="text-gray-400 text-center py-8">暂无数据</p> : (
                    <div className="space-y-2">
                      {sorted.map(([name, stats], i) => (
                        <div key={name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</div>
                          <span className="flex-1 font-medium">{name}</span>
                          <span className="text-sm text-gray-500">{stats.quantity}件</span>
                          <span className="font-bold text-red-600">¥{stats.revenue.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
