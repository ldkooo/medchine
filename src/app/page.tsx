"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Product, CartItem } from "@/types";

const CATEGORY_GRADIENTS: Record<string, string> = {
  饮料: "from-blue-500/20 to-cyan-500/20",
  零食: "from-orange-500/20 to-red-500/20",
  方便食品: "from-yellow-500/20 to-orange-500/20",
  日用品: "from-emerald-500/20 to-teal-500/20",
  冰激凌: "from-pink-500/20 to-purple-500/20",
};

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
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
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

    if (error) {
      console.error("加载商品失败:", error);
    } else {
      setProducts(data || []);
      const cats = ["全部", ...Array.from(new Set((data || []).map((p) => p.category)))];
      setCategories(cats);
    }
    setLoading(false);
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

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

  const filteredProducts =
    selectedCategory === "全部"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
          <p className="text-white/50">正在加载商品...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 欢迎语 */}
      <div className="text-center py-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          欢迎选购
        </h2>
        <p className="text-white/40 mt-2">选择你喜欢的商品，加入购物车即可购买</p>
      </div>

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border ${
              selectedCategory === cat
                ? "bg-white/15 border-white/30 text-white shadow-lg shadow-white/5"
                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:border-white/20 hover:text-white/70"
            }`}
          >
            {cat !== "全部" && (
              <span className="mr-1.5">{CATEGORY_ICONS[cat] || "📦"}</span>
            )}
            {cat}
          </button>
        ))}
      </div>

      {/* 商品网格 */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4 opacity-30">🛒</div>
          <p className="text-white/40 text-lg">暂无商品</p>
          <p className="text-white/20 text-sm mt-1">请联系管理员添加商品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="glass-card-hover group animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* 商品图片区域 */}
              <div className={`h-44 rounded-t-2xl bg-gradient-to-br ${CATEGORY_GRADIENTS[product.category] || "from-white/10 to-white/5"} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50" />
                <span className="text-7xl group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl">
                  {product.image || CATEGORY_ICONS[product.category] || "📦"}
                </span>
                {product.stock < 10 && product.stock > 0 && (
                  <div className="absolute top-3 right-3 bg-orange-500/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                    仅剩 {product.stock} 件
                  </div>
                )}
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <span className="bg-red-500/90 text-white px-4 py-2 rounded-full text-sm font-medium">已售罄</span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-white/90">{product.name}</h3>
                  <span className="glass-badge">{product.category}</span>
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-sm text-white/40">¥</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {product.price.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-red-400'}`} />
                    <span className={`text-sm ${product.stock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {product.stock > 0 ? `库存 ${product.stock}` : "缺货"}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className="glass-button-primary disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                  >
                    <span>🛒</span>
                    加入购物车
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 悬浮购物车按钮 */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowCart(!showCart)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 animate-pulse-glow"
        >
          <span className="text-xl">🛒</span>
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* 购物车弹窗 */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-card w-full max-w-md max-h-[80vh] overflow-auto m-4 animate-slide-up">
            <div className="p-6 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>🛒</span>
                  购物车
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <div className="text-5xl mb-4">🛒</div>
                <p>购物车是空的</p>
                <p className="text-sm mt-1">快去选购商品吧</p>
              </div>
            ) : (
              <>
                <div className="p-6 space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-2xl flex-shrink-0">
                        {item.product.image || CATEGORY_ICONS[item.product.category] || "📦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white/90 truncate">{item.product.name}</p>
                        <p className="text-sm text-white/40">
                          ¥{item.product.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-30"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="ml-2 w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center transition-colors"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 border-t border-white/10">
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-white/50">总计</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      ¥{totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={handlePayment}
                    className="w-full glass-button-success py-3 text-base font-medium"
                  >
                    💳 立即支付
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 支付弹窗 */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-card p-10 text-center animate-slide-up">
            {paymentSuccess ? (
              <div>
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">✅</span>
                </div>
                <h2 className="text-2xl font-bold text-emerald-400">支付成功!</h2>
                <p className="text-white/40 mt-2">感谢您的购买</p>
              </div>
            ) : (
              <div>
                <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <span className="text-4xl">💳</span>
                </div>
                <h2 className="text-xl font-bold">正在处理支付...</h2>
                <p className="text-white/40 mt-2">请稍候</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
