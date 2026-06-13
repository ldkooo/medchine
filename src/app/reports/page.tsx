"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Sale, DailySale } from "@/types";

export default function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [dailyStats, setDailyStats] = useState<DailySale[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: salesData } = await supabase
      .from("sales")
      .select("*")
      .order("sale_date", { ascending: false });
    if (salesData) {
      setSales(salesData);
      setTotalRevenue(salesData.reduce((sum, s) => sum + s.total, 0));
      setTotalSales(salesData.reduce((sum, s) => sum + s.quantity, 0));
    }
    const { data: statsData } = await supabase
      .from("daily_sales")
      .select("*")
      .limit(100);
    if (statsData) setDailyStats(statsData);
    setLoading(false);
  };

  const filteredSales = dateFilter
    ? sales.filter((s) => s.sale_date_str === dateFilter)
    : sales;
  const filteredStats = dateFilter
    ? dailyStats.filter((s) => s.sale_date_str === dateFilter)
    : dailyStats;

  const groupedByDate = filteredStats.reduce((acc, stat) => {
    if (!acc[stat.sale_date_str]) acc[stat.sale_date_str] = [];
    acc[stat.sale_date_str].push(stat);
    return acc;
  }, {} as Record<string, DailySale[]>);

  const dates = Object.keys(groupedByDate).sort().reverse();

  if (loading) return <div className="text-center py-20">加载中...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">📊 数据报表</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-sm"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              className="text-sm text-red-600"
            >
              清除
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm text-center">
          <div className="text-sm text-gray-400">总销售额</div>
          <div className="text-2xl font-bold text-red-600">
            ¥{totalRevenue.toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm text-center">
          <div className="text-sm text-gray-400">总销量</div>
          <div className="text-2xl font-bold text-red-600">{totalSales}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm text-center">
          <div className="text-sm text-gray-400">订单数</div>
          <div className="text-2xl font-bold text-red-600">
            {sales.length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-bold">每日销售</h2>
        </div>
        {dates.length === 0 ? (
          <div className="text-center py-12 text-gray-400">暂无数据</div>
        ) : (
          <div className="divide-y">
            {dates.map((date) => {
              const dayStats = groupedByDate[date];
              const dayTotal = dayStats.reduce(
                (sum, s) => sum + s.total_revenue,
                0
              );
              const dayQty = dayStats.reduce(
                (sum, s) => sum + s.total_quantity,
                0
              );
              return (
                <div key={date} className="p-4">
                  <div className="flex justify-between mb-3">
                    <span className="font-bold">{date}</span>
                    <span className="text-sm text-gray-500">
                      {dayQty}件 ¥{dayTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {dayStats.map((stat) => (
                      <div
                        key={stat.product_id}
                        className="bg-gray-50 rounded-lg p-3 flex justify-between"
                      >
                        <span className="text-sm">{stat.product_name}</span>
                        <span className="text-sm font-medium text-red-600">
                          {stat.total_quantity}件
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-bold">最近记录</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">时间</th>
              <th className="px-3 py-2">商品</th>
              <th className="px-3 py-2 text-right">金额</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredSales.slice(0, 20).map((sale) => (
              <tr key={sale.id}>
                <td className="px-3 py-2 text-gray-400">
                  {new Date(sale.sale_date).toLocaleString("zh-CN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-3 py-2">{sale.product_name}</td>
                <td className="px-3 py-2 text-right font-medium text-red-600">
                  ¥{sale.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
