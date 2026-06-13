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

    if (error) {
      console.error("加载失败:", error);
    } else {
      setProducts(data || []);
    }
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
      image: newProduct.image || "📦",
      status: "active",
    });

    if (error) {
      alert("添加失败: " + error.message);
    } else {
      alert("添加成功！");
      setNewProduct({ name: "", price: "", stock: "", category: "", image: "" });
      setShowAddForm(false);
      loadProducts();
    }
  };

  const restockProduct = async (product: Product, amount: number) => {
    const newStock = product.stock + amount;
    const { error } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", product.id);

    if (error) {
      alert("补货失败: " + error.message);
    } else {
      // 记录日志
      await supabase.from("admin_logs").insert({
        action: "补货",
        product_id: product.id,
        product_name: product.name,
        details: `补货 ${amount} 件，当前库存: ${newStock}`,
      });
      loadProducts();
    }
  };

  const toggleStatus = async (product: Product) => {
    const newStatus = product.status === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("products")
      .update({ status: newStatus })
      .eq("id", product.id);

    if (error) {
      alert("操作失败: " + error.message);
    } else {
      await supabase.from("admin_logs").insert({
        action: newStatus === "active" ? "上架" : "下架",
        product_id: product.id,
        product_name: product.name,
        details: `商品已${newStatus === "active" ? "上架" : "下架"}`,
      });
      loadProducts();
    }
  };

  const updateProduct = async () => {
    if (!editingProduct) return;

    const { error } = await supabase
      .from("products")
      .update({
        name: editingProduct.name,
        price: editingProduct.price,
        stock: editingProduct.stock,
        category: editingProduct.category,
      })
      .eq("id", editingProduct.id);

    if (error) {
      alert("更新失败: " + error.message);
    } else {
      alert("更新成功！");
      setEditingProduct(null);
      loadProducts();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-white p-8 rounded-xl shadow-sm border">
          <h2 className="text-2xl font-bold text-center mb-6">🔐 管理员登录</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                管理员密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full"
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">📦 商品管理</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          {showAddForm ? "取消" : "+ 添加商品"}
        </button>
      </div>

      {/* 添加商品表单 */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">添加新商品</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">商品名称</label>
              <input
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                placeholder="例如: 可乐"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">价格 (¥)</label>
              <input
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
                placeholder="3.50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">初始库存</label>
              <input
                type="number"
                value={newProduct.stock}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, stock: e.target.value })
                }
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">分类</label>
              <input
                value={newProduct.category}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, category: e.target.value })
                }
                placeholder="饮料/零食/日用品"
                list="categories"
              />
              <datalist id="categories">
                <option value="饮料" />
                <option value="零食" />
                <option value="日用品" />
                <option value="方便食品" />
              </datalist>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">图标 (emoji)</label>
              <input
                value={newProduct.image}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, image: e.target.value })
                }
                placeholder="例如: 🥤 (选填)"
              />
            </div>
          </div>
          <button
            onClick={addProduct}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            确认添加
          </button>
        </div>
      )}

      {/* 商品列表 */}
      {loading ? (
        <div className="text-center py-12">加载中...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">商品</th>
                <th className="px-4 py-3 text-left">分类</th>
                <th className="px-4 py-3 text-right">价格</th>
                <th className="px-4 py-3 text-right">库存</th>
                <th className="px-4 py-3 text-center">状态</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{product.image || "📦"}</span>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{product.category}</td>
                  <td className="px-4 py-3 text-right">
                    ¥{product.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        product.stock < 10 ? "text-red-500 font-bold" : ""
                      }
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        product.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {product.status === "active" ? "上架中" : "已下架"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-center">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => {
                          const amount = parseInt(
                            prompt("补货数量:", "10") || "0"
                          );
                          if (amount > 0) restockProduct(product, amount);
                        }}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        补货
                      </button>
                      <button
                        onClick={() => toggleStatus(product)}
                        className={`text-sm ${
                          product.status === "active"
                            ? "text-red-500 hover:text-red-700"
                            : "text-green-500 hover:text-green-700"
                        }`}
                      >
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">编辑商品</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">名称</label>
                <input
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">价格</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">库存</label>
                <input
                  type="number"
                  value={editingProduct.stock}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      stock: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">分类</label>
                <input
                  value={editingProduct.category}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      category: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={updateProduct}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
