"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Product, CartItem } from "@/types";

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
      // 提取分类
      const cats = ["全部", ...new Set((data || []).map((p) => p.category))];
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

    // 模拟支付过程
    setShowPayment(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 扣减库存并记录销售
    for (const item of cart) {
      const newStock = item.product.stock - item.quantity;
      await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", item.product.id);

      // 记录销售
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
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border hover:bg-gray-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 商品网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden"
          >
            <div className="h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-6xl">
              {product.image || "📦"}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {product.category}
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-600 mb-2">
                ¥{product.price.toFixed(2)}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm ${
                    product.stock > 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {product.stock > 0 ? `库存: ${product.stock}` : "缺货"}
                </span>
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  加入购物车
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 购物车按钮 */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => setShowCart(!showCart)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors relative"
        >
          🛒 {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* 购物车弹窗 */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">购物车</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">购物车是空的</p>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between border-b pb-3"
                    >
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-500">
                          ¥{item.product.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.product.stock}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 ml-2"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold mb-4">
                    <span>总计:</span>
                    <span>¥{totalAmount.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handlePayment}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    立即支付
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 支付弹窗 */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center">
            {paymentSuccess ? (
              <div>
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-xl font-bold text-green-600">支付成功!</h2>
                <p className="text-gray-500 mt-2">感谢您的购买</p>
              </div>
            ) : (
              <div>
                <div className="text-6xl mb-4">💳</div>
                <h2 className="text-xl font-bold mb-2">正在支付...</h2>
                <p className="text-gray-500">请稍候</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
