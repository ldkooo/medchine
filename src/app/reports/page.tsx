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

    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select("*")
      .order("sale_date", { ascending: false });

    if (salesError) console.error("加载销售数据失败:", salesError);
    else {
      setSales(salesData || []);
      const revenue = (salesData || []).reduce((sum, s) => sum + s.total, 0);
      const count = (salesData || []).reduce((sum, s) => sum + s.quantity, 0);
      setTotalRevenue(revenue);
      setTotalSales(count);
    }

    const { data: statsData, error: statsError } = await supabase
      .from("daily_sales")
      .select("*")
      .limit(100);

    if (statsError) console.error("加载统计失败:", statsError);
    else setDailyStats(statsData || []);

    setLoading(false);
  };

  const filteredSales = dateFilter ? sales.filter((s) => s.sale_date_str === dateFilter) : sales;
  const filteredStats = dateFilter ? dailyStats.filter((s) => s.sale_date_str === dateFilter) : dailyStats;

  const groupedByDate = filteredStats.reduce((acc, stat) => {
    if (!acc[stat.sale_date_str]) acc[stat.sale_date_str] = [];
    acc[stat.sale_date_str].push(stat);
    return acc;
  }, {} as Record<string, DailySale[]>);

  const dates = Object.keys(groupedByDate).sort().reverse();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 标题 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>📊</span>
            数据报表
          </h1>
          <p className="text-white/40 text-sm mt-1">查看销售数据和统计信息</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-white/40">筛选日期:</label>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="text-sm w-auto" />
          {dateFilter && (
            <button onClick={() => setDateFilter("")} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              清除
            </button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform" />
          <div className="relative">
            <div className="text-sm text-white/40 mb-2">总销售额</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ¥{totalRevenue.toFixed(2)}
            </div>
            <div className="text-xs text-white/20 mt-2">累计收入</div>
          </div>
        </div>
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform" />
          <div className="relative">
            <div className="text-sm text-white/40 mb-2">总销量</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {totalSales}
            </div>
            <div className="text-xs text-white/20 mt-2">件商品已售出</div>
          </div>
        </div>
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform" />
          <div className="relative">
            <div className="text-sm text-white/40 mb-2">订单数</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {sales.length}
            </div>
            <div className="text-xs text-white/20 mt-2">笔交易记录</div>
          </div>
        </div>
      </div>

      {/* 每日销售详情 */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold">📅 每日销售明细</h2>
        </div>
        {dates.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <div className="text-5xl mb-4">📈</div>
            <p>{dateFilter ? "该日期暂无销售数据" : "暂无销售数据"}</p>
            <p className="text-sm mt-1">开始销售后数据会自动显示</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {dates.map((date) => {
              const dayStats = groupedByDate[date];
              const dayTotal = dayStats.reduce((sum, s) => sum + s.total_revenue, 0);
              const dayQty = dayStats.reduce((sum, s) => sum + s.total_quantity, 0);

              return (
                <div key={date} className="p-6">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-sm">📆</span>
                      {date}
                    </h3>
                    <div className="text-sm text-white/40">
                      售出 <span className="text-emerald-400 font-medium">{dayQty}</span> 件，收入 <span className="text-blue-400 font-medium">¥{dayTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dayStats.map((stat) => (
                      <div key={stat.product_id} className="glass-card p-4 flex justify-between items-center">
                        <div>
                          <div className="font-medium text-white/90">{stat.product_name}</div>
                          <div className="text-sm text-white/40">{stat.total_quantity} 件</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-400">¥{stat.total_revenue.toFixed(2)}</div>
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
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold">📝 最近销售记录</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="glass-table">
            <thead>
              <tr>
                <th className="rounded-tl-2xl">时间</th>
                <th>商品</th>
                <th className="text-right">单价</th>
                <th className="text-right">数量</th>
                <th className="text-right rounded-tr-2xl">小计</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.slice(0, 20).map((sale) => (
                <tr key={sale.id}>
                  <td className="text-sm text-white/40">
                    {new Date(sale.sale_date).toLocaleString("zh-CN", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="font-medium">{sale.product_name}</td>
                  <td className="text-right text-white/60">¥{sale.price.toFixed(2)}</td>
                  <td className="text-right">{sale.quantity}</td>
                  <td className="text-right font-medium text-blue-400">¥{sale.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
