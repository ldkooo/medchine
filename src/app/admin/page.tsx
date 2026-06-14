"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", stock: "", category: "", image: "" });

  useEffect(() => { if (isAuthenticated) loadProducts(); }, [isAuthenticated]);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const handleLogin = () => { if (password === "admin123") setIsAuthenticated(true); else alert("密码错误！"); };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category) { alert("请填写完整信息！"); return; }
    const { error } = await supabase.from("products").insert({
      name: newProduct.name, price: parseFloat(newProduct.price), stock: parseInt(newProduct.stock) || 0,
      category: newProduct.category, image: newProduct.image || "📦", status: "active",
    });
    if (error) alert("添加失败: " + error.message);
    else { setNewProduct({ name: "", price: "", stock: "", category: "", image: "" }); setShowAddForm(false); loadProducts(); }
  };

  const restockProduct = async (product: Product, amount: number) => {
    const newStock = product.stock + amount;
    const { error: updateError } = await supabase.from("products").update({ stock: newStock }).eq("id", product.id);
    if (updateError) {
      alert("补货失败: " + updateError.message);
      return;
    }
    // 如果 admin_logs 表存在，记录日志；否则忽略
    try {
      await supabase.from("admin_logs").insert({ action: "补货", product_id: product.id, product_name: product.name, details: `补货 ${amount} 件` });
    } catch (e) {
      console.log("日志记录失败:", e);
    }
    alert(`成功补货 ${amount} 件！当前库存: ${newStock}`);
    loadProducts();
  };

  const toggleStatus = async (product: Product) => {
    const newStatus = product.status === "active" ? "inactive" : "active";
    await supabase.from("products").update({ status: newStatus }).eq("id", product.id);
    await supabase.from("admin_logs").insert({ action: newStatus === "active" ? "上架" : "下架", product_id: product.id, product_name: product.name });
    loadProducts();
  };

  const updateProduct = async () => {
    if (!editingProduct) return;
    await supabase.from("products").update({ name: editingProduct.name, price: editingProduct.price, stock: editingProduct.stock, category: editingProduct.category }).eq("id", editingProduct.id);
    setEditingProduct(null); loadProducts();
  };

  if (!isAuthenticated) return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
        <div className="text-4xl mb-4">🔐</div>
        <h2 className="text-xl font-bold mb-4">管理员登录</h2>
        <div className="space-y-3">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" onKeyPress={(e) => e.key === "Enter" && handleLogin()} />
          <button onClick={handleLogin} className="w-full btn-red py-3">登录</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">📦 商品管理</h1>
        <button onClick={() => setShowAddForm(!showAddForm)} className={showAddForm ? "btn-outline" : "btn-red"}>
          {showAddForm ? "取消" : "＋ 添加商品"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-5 rounded-xl shadow-sm space-y-3">
          <h3 className="font-bold">添加新商品</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="商品名称" />
            <input type="number" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="价格" />
            <input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} placeholder="库存" />
            <input value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} placeholder="分类" list="cats" />
            <datalist id="cats"><option value="饮料" /><option value="零食" /><option value="方便食品" /><option value="日用品" /><option value="冰激凌" /></datalist>
          </div>
          <button onClick={addProduct} className="btn-red">确认添加</button>
        </div>
      )}

      {loading ? <div className="text-center py-20">加载中...</div> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="px-3 py-3 text-left">商品</th><th className="px-3 py-3">分类</th><th className="px-3 py-3 text-right">价格</th><th className="px-3 py-3 text-right">库存</th><th className="px-3 py-3 text-center">状态</th><th className="px-3 py-3 text-center">操作</th></tr></thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-3"><div className="flex items-center gap-2"><span className="text-xl">{p.image || "📦"}</span><span className="font-medium">{p.name}</span></div></td>
                  <td className="px-3 py-3"><span className="bg-gray-100 px-2 py-1 rounded-full text-xs">{p.category}</span></td>
                  <td className="px-3 py-3 text-right font-medium">¥{p.price.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right">{p.stock}</td>
                  <td className="px-3 py-3 text-center"><span className={`text-xs px-2 py-1 rounded-full ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.status === "active" ? "上架" : "下架"}</span></td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => setEditingProduct(p)} className="text-blue-600 text-xs">编辑</button>
                      <button onClick={() => { const amount = parseInt(prompt("补货数量:", "10") || "0"); if (amount > 0) restockProduct(p, amount); }} className="text-green-600 text-xs">补货</button>
                      <button onClick={() => toggleStatus(p)} className={`text-xs ${p.status === "active" ? "text-red-600" : "text-green-600"}`}>{p.status === "active" ? "下架" : "上架"}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm m-4">
            <h3 className="font-bold mb-4">编辑商品</h3>
            <div className="space-y-3">
              <input value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} />
              <input type="number" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })} />
              <input type="number" value={editingProduct.stock} onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })} />
              <input value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditingProduct(null)} className="flex-1 py-2 border rounded-lg">取消</button>
              <button onClick={updateProduct} className="flex-1 btn-red">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
