"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Sale } from "@/types";

export default function OrdersPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    const { data } = await supabase.from("sales").select("*").order("sale_date", { ascending: false }).limit(50);
    setSales(data || []);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-20">加载中...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">📦 我的订单</h1>
      {sales.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📦</div>
          <p>暂无订单</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => (
            <div key={sale.id} className="bg-white rounded-xl p-4 shadow-sm flex justify-between items-center">
              <div>
                <p className="font-medium">{sale.product_name}</p>
                <p className="text-sm text-gray-400">{new Date(sale.sale_date).toLocaleString("zh-CN")}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600">¥{sale.total.toFixed(2)}</p>
                <p className="text-sm text-gray-400">{sale.quantity} 件</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
