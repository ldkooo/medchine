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

    // 加载所有销售记录
    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select("*")
      .order("sale_date", { ascending: false });

    if (salesError) {
      console.error("加载销售数据失败:", salesError);
    } else {
      setSales(salesData || []);

      // 计算总收入和总销量
      const revenue = (salesData || []).reduce(
        (sum, s) => sum + s.total,
        0
      );
      const count = (salesData || []).reduce(
        (sum, s) => sum + s.quantity,
        0
      );
      setTotalRevenue(revenue);
      setTotalSales(count);
    }

    // 加载每日统计（通过视图）
    const { data: statsData, error: statsError } = await supabase
      .from("daily_sales")
      .select("*")
      .limit(100);

    if (statsError) {
      console.error("加载统计失败:", statsError);
    } else {
      setDailyStats(statsData || []);
    }

    setLoading(false);
  };

  const filteredSales = dateFilter
    ? sales.filter((s) => s.sale_date_str === dateFilter)
    : sales;

  const filteredStats = dateFilter
    ? dailyStats.filter((s) => s.sale_date_str === dateFilter)
    : dailyStats;

  // 按日期分组
  const groupedByDate = filteredStats.reduce((acc, stat) => {
    if (!acc[stat.sale_date_str]) {
      acc[stat.sale_date_str] = [];
    }
    acc[stat.sale_date_str].push(stat);
    return acc;
  }, {} as Record<string, DailySale[]>);

  // 获取所有日期列表
  const dates = Object.keys(groupedByDate).sort().reverse();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">📊 数据报表</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">筛选日期:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-sm"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              className="text-sm text-blue-600 hover:underline"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-500 mb-1">总销售额</div>
          <div className="text-3xl font-bold text-blue-600">
            ¥{totalRevenue.toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-500 mb-1">总销量</div>
          <div className="text-3xl font-bold text-green-600">{totalSales}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-500 mb-1">订单数</div>
          <div className="text-3xl font-bold text-purple-600">
            {sales.length}
          </div>
        </div>
      </div>

      {/* 每日销售详情 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">每日销售明细</h2>
        </div>

        {dates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {dateFilter ? "该日期暂无销售数据" : "暂无销售数据"}
          </div>
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
                <div key={date} className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">{date}</h3>
                    <div className="text-sm text-gray-600">
                      共售出 {dayQty} 件，收入 ¥{dayTotal.toFixed(2)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dayStats.map((stat) => (
                      <div
                        key={stat.product_id}
                        className="bg-gray-50 rounded-lg p-3 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium">{stat.product_name}</div>
                          <div className="text-sm text-gray-500">
                            {stat.total_quantity} 件
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">
                            ¥{stat.total_revenue.toFixed(2)}
                          </div>
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

      {/* 最近销售记录 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">最近销售记录</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">时间</th>
                <th className="px-4 py-3 text-left">商品</th>
                <th className="px-4 py-3 text-right">单价</th>
                <th className="px-4 py-3 text-right">数量</th>
                <th className="px-4 py-3 text-right">小计</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSales.slice(0, 20).map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(sale.sale_date).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-4 py-3 font-medium">{sale.product_name}</td>
                  <td className="px-4 py-3 text-right">
                    ¥{sale.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">{sale.quantity}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    ¥{sale.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
