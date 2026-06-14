"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Sale } from "@/types";

export default function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("sales")
      .select("*")
      .order("sale_date", { ascending: false });
    setSales(data || []);
    setLoading(false);
  };

  // 获取所有日期（去重，倒序）
  const dates: string[] = [];
  sales.forEach((s) => {
    if (!dates.includes(s.sale_date_str)) dates.push(s.sale_date_str);
  });
  dates.sort().reverse();

  // 按日期分组
  const groupedByDate = dates.reduce((acc, date) => {
    acc[date] = sales.filter((s) => s.sale_date_str === date);
    return acc;
  }, {} as Record<string, Sale[]>);

  // 筛选某一天
  const displayDates = selectedDate ? [selectedDate] : dates;

  if (loading) return <div className="text-center py-20">加载中...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">📊 每日消费记录</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm bg-white/80 rounded-lg px-2 py-1"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate("")}
              className="text-sm text-red-600 bg-white/80 rounded-lg px-2 py-1"
            >
              全部
            </button>
          )}
        </div>
      </div>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-sm text-center">
          <div className="text-sm text-gray-400">总消费</div>
          <div className="text-2xl font-bold text-red-600">
            ¥{sales.reduce((sum, s) => sum + s.total, 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-sm text-center">
          <div className="text-sm text-gray-400">总购买</div>
          <div className="text-2xl font-bold text-red-600">
            {sales.reduce((sum, s) => sum + s.quantity, 0)} 件
          </div>
        </div>
      </div>

      {/* 按日期显示消费记录 */}
      {displayDates.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📊</div>
          <p>暂无消费记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayDates.map((date) => {
            const daySales = groupedByDate[date];
            const dayTotal = daySales.reduce((sum, s) => sum + s.total, 0);
            const dayQty = daySales.reduce((sum, s) => sum + s.quantity, 0);
            return (
              <div key={date} className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b flex justify-between items-center">
                  <span className="font-bold text-lg">📅 {date}</span>
                  <span className="text-sm text-gray-500">
                    共 {dayQty} 件 · ¥{dayTotal.toFixed(2)}
                  </span>
                </div>
                <div className="divide-y">
                  {daySales.map((sale) => (
                    <div key={sale.id} className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-lg">
                          🛒
                        </div>
                        <div>
                          <p className="font-medium">{sale.product_name}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(sale.sale_date).toLocaleTimeString("zh-CN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">
                          ¥{sale.total.toFixed(2)}
                        </p>
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
  );
}
