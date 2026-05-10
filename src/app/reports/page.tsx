'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { BarChart3, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

interface DailySale {
  date: string
  total: number
}

interface TopProduct {
  name: string
  total_sold: number
  revenue: number
}

export default function ReportsPage() {
  const [dailySales, setDailySales] = useState<DailySale[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    avgOrderValue: 0,
    topProduct: ''
  })
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const days = parseInt(period)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startStr = startDate.toISOString()

      const [salesRes, itemsRes] = await Promise.all([
        supabase.from('sales')
          .select('created_at, total_amount')
          .gte('created_at', startStr),
        supabase.from('sale_items')
          .select('product_id, quantity, subtotal, products(name)')
      ])

      if (salesRes.data) {
        const dailyMap = new Map<string, number>()
        salesRes.data.forEach(sale => {
          const date = sale.created_at.split('T')[0]
          dailyMap.set(date, (dailyMap.get(date) || 0) + sale.total_amount)
        })

        const daily = Array.from(dailyMap.entries())
          .map(([date, total]) => ({ date, total }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-14)

        setDailySales(daily)

        const totalRevenue = salesRes.data.reduce((sum, s) => sum + s.total_amount, 0)
        const totalSales = salesRes.data.length

        setStats({
          totalRevenue,
          totalSales,
          avgOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0,
          topProduct: topProducts[0]?.name || '-'
        })
      }

if (itemsRes.data) {
      const productMap = new Map<string, { name: string; total_sold: number; revenue: number }>()
      itemsRes.data.forEach((item) => {
        const name = item.products?.[0]?.name || 'Unknown'
        const existing = productMap.get(item.product_id) || { name, total_sold: 0, revenue: 0 }
        existing.total_sold += item.quantity
        existing.revenue += item.subtotal
        productMap.set(item.product_id, existing)
      })

        const top = Array.from(productMap.values())
          .sort((a, b) => b.total_sold - a.total_sold)
          .slice(0, 10)
        setTopProducts(top)
      }

      setLoading(false)
    }
    loadData()
  }, [period])

  const COLORS = ['#292524', '#57534e', '#78716c', '#a8a29e', '#d6d3d1']

  const pieData = topProducts.slice(0, 5).map(p => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
    value: p.revenue
  }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Reports</h1>
          <p className="text-stone-500 mt-1">Sales analytics and insights</p>
        </div>
        <div className="flex gap-2">
          {(['7', '30', '90'] as const).map(d => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === d 
                  ? 'bg-stone-800 text-white' 
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-stone-500 py-12">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm text-stone-500">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold text-stone-800">Rs.{stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-stone-500">Total Orders</span>
              </div>
              <p className="text-2xl font-bold text-stone-800">{stats.totalSales}</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm text-stone-500">Avg Order Value</span>
              </div>
              <p className="text-2xl font-bold text-stone-800">Rs.{stats.avgOrderValue.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-stone-600" />
                </div>
                <span className="text-sm text-stone-500">Top Product</span>
              </div>
              <p className="text-xl font-bold text-stone-800 truncate">{topProducts[0]?.name || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h3 className="font-semibold text-stone-800 mb-4">Daily Revenue</h3>
              {dailySales.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailySales}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#78716c' }}
                      tickFormatter={(v) => v.slice(5)}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#78716c' }}
                      tickFormatter={(v) => `Rs.${v}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toFixed(2)}`, 'Revenue']}
                      contentStyle={{ 
                        background: '#fff', 
                        border: '1px solid #e7e5e4',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="total" fill="#292524" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-stone-400">
                  No data available
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h3 className="font-semibold text-stone-800 mb-4">Revenue by Product</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toFixed(2)}`, 'Revenue']}
                      contentStyle={{ 
                        background: '#fff', 
                        border: '1px solid #e7e5e4',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-stone-400">
                  No data available
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-6 mt-6">
            <h3 className="font-semibold text-stone-800 mb-4">Top Selling Products</h3>
            {topProducts.length > 0 ? (
              <table className="w-full">
                <thead className="border-b border-stone-200">
                  <tr>
                    <th className="text-left py-3 text-sm font-medium text-stone-600">Product</th>
                    <th className="text-right py-3 text-sm font-medium text-stone-600">Units Sold</th>
                    <th className="text-right py-3 text-sm font-medium text-stone-600">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, idx) => (
                    <tr key={idx} className="border-b border-stone-100">
                      <td className="py-3 text-stone-800">{product.name}</td>
                      <td className="py-3 text-right text-stone-600">{product.total_sold}</td>
                      <td className="py-3 text-right font-medium text-stone-800">Rs.{product.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-stone-400 py-8">No sales data yet</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}