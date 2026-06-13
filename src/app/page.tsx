"use client";

import { useEffect, useState } from "react";
import { Product, CartItem } from "@/types";

const CATEGORY_LIST = ["全部", "饮料", "零食", "冰激凌", "方便食品"];

const CATEGORY_ICONS: Record<string, string> = {
  饮料: "🥤",
  零食: "🍿",
  冰激凌: "🍦",
  方便食品: "🍜",
};

// 商品图片（占位图）
const PRODUCT_IMAGES: Record<string, string> = {
  可乐: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&h=300&fit=crop",
  雪碧: "https://images.unsplash.com/photo-1621506821957-1b50ab7787a4?w=300&h=300&fit=crop",
  橙汁: "https://images.unsplash.com/photo-1613478223719-2b802b91911d?w=300&h=300&fit=crop",
  矿泉水: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&h=300&fit=crop",
  薯片: "https://images.unsplash.com/photo-1566478989037-eec784893be2?w=300&h=300&fit=crop",
  巧克力: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&h=300&fit=crop",
  饼干: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&h=300&fit=crop",
  果冻: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&h=300&fit=crop",
  香草冰淇淋: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=300&fit=crop",
  草莓冰淇淋: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=300&fit=crop",
  巧克力甜筒: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&h=300&fit=crop",
  泡面: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=300&fit=crop",
  自热火锅: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=300&fit=crop",
  八宝粥: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=300&fit=crop",
};

interface RankingItem {
  product_name: string;
  product_id: string;
  total_quantity: number;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [showRanking, setShowRanking] = useState(true);

  useEffect(() => {
    loadProducts();
    loadRanking();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('请求失败:', err);
      setProducts([]);
    }
    setLoading(false);
  };

  const loadRanking = async () => {
    try {
      const res = await fetch('/api/ranking');
      const data = await res.json();
      if (data.ranking) {
        setRanking(data.ranking);
      }
    } catch (err) {
      console.error('排行榜加载失败:', err);
    }
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
    await new Promise((resolve) => setTimeout(resolve, 3000));

    for (const item of cart) {
      const newStock = item.product.stock - item.quantity;
      await fetch('/api/products/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.product.id, stock: newStock }),
      });
      await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: item.product.id,
          product_name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          total: item.product.price * item.quantity,
        }),
      });
    }

    setPaymentSuccess(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setCart([]);
    setShowPayment(false);
    setPaymentSuccess(false);
    loadProducts();
    loadRanking();
  };

  const filteredProducts = selectedCategory === "全部" ? products : products.filter((p) => p.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 欢迎语 */}
      <div className="text-center py-4">
        <h2 className="text-3xl font-bold text-white drop-shadow-lg">
          欢迎选购
        </h2>
        <p className="text-white/70 mt-2">选择你喜欢的商品，加入购物车即可购买</p>
      </div>

      {/* 热销排行榜 */}
      {showRanking && ranking.length > 0 && (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span>🏆</span> 热销排行榜
            </h3>
            <button onClick={() => setShowRanking(false)} className="text-gray-400 text-sm">✕</button>
          </div>
          <div className="space-y-2">
            {ranking.map((item, index) => (
              <div key={item.product_id} className="flex items-center gap-3 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-yellow-400 text-white' : 
                  index === 1 ? 'bg-gray-300 text-white' : 
                  index === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <span className="flex-1 font-medium">{item.product_name}</span>
                <span className="text-orange-600 font-bold">{item.total_quantity}件</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 分类标签 */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORY_LIST.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg ${
              selectedCategory === cat ? "tag-active" : "tag-inactive"
            }`}
          >
            {cat !== "全部" && <span className="mr-1">{CATEGORY_ICONS[cat] || "📦"}</span>}
            {cat}
          </button>
        ))}
      </div>

      {/* 商品网格 */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-white/70 text-lg">暂无商品</p>
          <p className="text-white/50 text-sm mt-1">请联系管理员添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="card-white-hover">
              <div className="h-40 relative rounded-t-xl overflow-hidden">
                <img 
                  src={PRODUCT_IMAGES[product.name] || "https://via.placeholder.com/300x300?text=No+Image"} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm">已售罄</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-purple-600 font-bold text-lg">¥{product.price.toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className="bg-purple-600 text-white w-9 h-9 rounded-full flex items-center justify-center text-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
                  >
                    ＋
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  库存: {product.stock}
                </div>
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
            className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-600/30 relative animate-bounce"
          >
            <span className="text-xl">🛒</span>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
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
              <h2 className="text-lg font-bold">🛒 购物车</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400">✕</button>
            </div>
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={PRODUCT_IMAGES[item.product.name] || "https://via.placeholder.com/100"} 
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-400">¥{item.product.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">−</button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">合计</span>
                <span className="text-2xl font-bold text-purple-600">¥{totalAmount.toFixed(2)}</span>
              </div>
              <button onClick={handlePayment} className="w-full btn-primary py-3 text-lg">💳 立即支付</button>
            </div>
          </div>
        </div>
      )}

      {/* 支付二维码弹窗 */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full mx-4">
            {paymentSuccess ? (
              <div>
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">✅</span>
                </div>
                <h2 className="text-xl font-bold text-green-600">支付成功!</h2>
                <p className="text-gray-400 mt-2">感谢您的购买</p>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-bold mb-4">扫码支付</h2>
                <div className="w-48 h-48 mx-auto bg-white border-2 border-purple-200 rounded-xl flex items-center justify-center relative overflow-hidden">
                  {/* 模拟二维码 */}
                  <div className="grid grid-cols-6 gap-1 p-4">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-6 h-6 rounded-sm ${Math.random() > 0.5 ? 'bg-purple-900' : 'bg-white'}`}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 border-4 border-purple-600 rounded-xl opacity-50"></div>
                </div>
                <p className="text-2xl font-bold text-purple-600 mt-4">¥{totalAmount.toFixed(2)}</p>
                <p className="text-gray-400 mt-2">请使用微信或支付宝扫码</p>
                <div className="mt-4 flex justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
