"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";

const CATEGORY_ICONS: Record<string, string> = {
  饮料: "🥤", 零食: "🍿", 方便食品: "🍜",
  日用品: "🧻", 冰激凌: "🍦", 默认: "📦",
};

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    image: "",
  });

  useEffect(() => {
    if (isAuthenticated) loadProducts();
  }, [isAuthenticated]);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("加载失败:", error);
    else setProducts(data || []);
    setLoading(false);
  };

  const handleLogin = () => {
    if (password === "admin123") {
      setIsAuthenticated(true);
    } else {
      alert("密码错误！");
    }
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      alert("请填写完整信息！");
      return;
    }

    const { error } = await supabase.from("products").insert({
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock) || 0,
      category: newProduct.category,
      image: newProduct.image || CATEGORY_ICONS[newProduct.category] || "📦",
      status: "active",
    });

    if (error) {
      alert("添加失败: " + error.message);
    } else {
      setNewProduct({ name: "", price: "", stock: "", category: "", image: "" });
      setShowAddForm(false);
      loadProducts();
    }
  };

  const restockProduct = async (product: Product, amount: number) => {
    const newStock = product.stock + amount;
    await supabase.from("products").update({ stock: newStock }).eq("id", product.id);
    await supabase.from("admin_logs").insert({
      action: "补货",
      product_id: product.id,
      product_name: product.name,
      details: `补货 ${amount} 件，当前库存: ${newStock}`,
    });
    loadProducts();
  };

  const toggleStatus = async (product: Product) => {
    const newStatus = product.status === "active" ? "inactive" : "active";
    await supabase.from("products").update({ status: newStatus }).eq("id", product.id);
    await supabase.from("admin_logs").insert({
      action: newStatus === "active" ? "上架" : "下架",
      product_id: product.id,
      product_name: product.name,
      details: `商品已${newStatus === "active" ? "上架" : "下架"}`,
    });
    loadProducts();
  };

  const updateProduct = async () => {
    if (!editingProduct) return;
    const { error } = await supabase.from("products").update({
      name: editingProduct.name,
      price: editingProduct.price,
      stock: editingProduct.stock,
      category: editingProduct.category,
    }).eq("id", editingProduct.id);

    if (error) alert("更新失败: " + error.message);
    else {
      setEditingProduct(null);
      loadProducts();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 animate-fade-in">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-3xl mx-auto mb-6">
            🔐
          </div>
          <h2 className="text-2xl font-bold mb-2">管理员登录</h2>
          <p className="text-white/40 mb-6">请输入管理员密码</p>
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            />
            <button
              onClick={handleLogin}
              className="w-full glass-button-primary py-3"
            >
              登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>📦</span>
            商品管理
          </h1>
          <p className="text-white/40 text-sm mt-1">共 {products.length} 件商品</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
            showAddForm
              ? "glass-button"
              : "glass-button-success"
          }`}
        >
          <span>{showAddForm ? "✕" : "＋"}</span>
          {showAddForm ? "取消" : "添加商品"}
        </button>
      </div>

      {/* 添加商品表单 */}
      {showAddForm && (
        <div className="glass-card p-6 animate-slide-up">
          <h3 className="text-lg font-semibold mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm">🆕</span>
            添加新商品
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/50 mb-2">商品名称</label>
              <input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="例如: 可乐" />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">价格 (¥)</label>
              <input type="number" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="3.50" />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">初始库存</label>
              <input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} placeholder="100" />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">分类</label>
              <input value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} placeholder="饮料 / 零食 / 日用品" list="categories" />
              <datalist id="categories">
                <option value="饮料" />
                <option value="零食" />
                <option value="日用品" />
                <option value="方便食品" />
                <option value="冰激凌" />
              </datalist>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-white/50 mb-2">图标 (emoji)</label>
              <input value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} placeholder="例如: 🥤 (选填，不填会自动匹配分类图标)" />
            </div>
          </div>
          <button onClick={addProduct} className="mt-5 glass-button-primary px-6 py-2.5">
            ✓ 确认添加
          </button>
        </div>
      )}

      {/* 商品列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="glass-table">
            <thead>
              <tr>
                <th className="rounded-tl-2xl">商品</th>
                <th>分类</th>
                <th className="text-right">价格</th>
                <th className="text-right">库存</th>
                <th className="text-center">状态</th>
                <th className="text-center rounded-tr-2xl">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, i) => (
                <tr key={product.id} className="group">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-xl">
                        {product.image || CATEGORY_ICONS[product.category] || "📦"}
                      </div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="glass-badge">{product.category}</span>
                  </td>
                  <td className="text-right font-medium">¥{product.price.toFixed(2)}</td>
                  <td className="text-right">
                    <span className={product.stock < 10 ? "text-orange-400 font-bold" : ""}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${
                      product.status === "active"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                        : "bg-white/5 text-white/40 border border-white/10"
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${product.status === "active" ? "bg-emerald-400" : "bg-white/30"}`} />
                      {product.status === "active" ? "上架中" : "已下架"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setEditingProduct(product)} className="px-2 py-1 rounded-lg text-blue-400 hover:bg-blue-500/10 text-sm transition-colors">
                        编辑
                      </button>
                      <button onClick={() => {
                        const amount = parseInt(prompt("补货数量:", "10") || "0");
                        if (amount > 0) restockProduct(product, amount);
                      }} className="px-2 py-1 rounded-lg text-emerald-400 hover:bg-emerald-500/10 text-sm transition-colors">
                        补货
                      </button>
                      <button onClick={() => toggleStatus(product)} className={`px-2 py-1 rounded-lg text-sm transition-colors ${
                        product.status === "active"
                          ? "text-red-400 hover:bg-red-500/10"
                          : "text-emerald-400 hover:bg-emerald-500/10"
                      }`}>
                        {product.status === "active" ? "下架" : "上架"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 编辑弹窗 */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 m-4 animate-slide-up">
            <h3 className="text-lg font-bold mb-5">✏️ 编辑商品</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/50 mb-2">名称</label>
                <input value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/50 mb-2">价格</label>
                  <input type="number" step="0.01" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-2">库存</label>
                  <input type="number" value={editingProduct.stock} onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-2">分类</label>
                <input value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingProduct(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors">
                取消
              </button>
              <button onClick={updateProduct} className="flex-1 glass-button-primary py-2.5">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
