"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Product, CartItem } from "@/types";

const CATEGORY_LIST = ["全部", "饮料", "零食", "方便食品", "日用品", "冰激凌"];

const CATEGORY_ICONS: Record<string, string> = {
  饮料: "🥤",
  零食: "🍿",
  方便食品: "🍜",
  日用品: "🧻",
  冰激凌: "🍦",
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) console.error("加载商品失败:", error);
    else setProducts(data || []);
    setLoading(false);
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((prev) => prev.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item)));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handlePayment = async () => {
    if (cart.length === 0) return;
    setShowPayment(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    for (const item of cart) {
      const newStock = item.product.stock - item.quantity;
      await supabase.from("products").update({ stock: newStock }).eq("id", item.product.id);
      await supabase.from("sales").insert({
        product_id: item.product.id,
        product_name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        total: item.product.price * item.quantity,
      });
    }

    setPaymentSuccess(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setCart([]);
    setShowPayment(false);
    setPaymentSuccess(false);
    loadProducts();
  };

  const filteredProducts = selectedCategory === "全部" ? products : products.filter((p) => p.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 分类标签 */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORY_LIST.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat ? "tag-red" : "tag-outline"
            }`}
          >
            {cat !== "全部" && <span className="mr-1">{CATEGORY_ICONS[cat] || "📦"}</span>}
            {cat}
          </button>
        ))}
      </div>

      {/* 商品网格 */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">🛒</div>
          <p>暂无商品</p>
          <p className="text-sm mt-1">请联系管理员添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProducts.map((product) => (
            <div key={product.id} className="card-white overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center text-5xl relative">
                {product.image || CATEGORY_ICONS[product.category] || "📦"}
                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs">已售罄</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm text-gray-900 truncate">{product.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-purple-600 font-bold">¥{product.price.toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm hover:bg-purple-700 disabled:bg-gray-300"
                  >
                    ＋
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-1">库存: {product.stock}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 购物车按钮 */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 right-4 z-40">
          <button
            onClick={() => setShowCart(true)}
            className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg relative"
          >
            <span className="text-xl">🛒</span>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </button>
        </div>
      )}

      {/* 购物车弹窗 */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 max-h-[70vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">购物车</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400">✕</button>
            </div>
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-3xl">{item.product.image || "📦"}</div>
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-400">¥{item.product.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">−</button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">合计</span>
                <span className="text-xl font-bold text-purple-600">¥{totalAmount.toFixed(2)}</span>
              </div>
              <button onClick={handlePayment} className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700">立即支付</button>
            </div>
          </div>
        </div>
      )}

      {/* 支付弹窗 */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center">
            {paymentSuccess ? (
              <div>
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-lg font-bold text-green-600">支付成功!</h2>
              </div>
            ) : (
              <div>
                <div className="text-5xl mb-4">💳</div>
                <h2 className="text-lg font-bold">处理中...</h2>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
