'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Package, ShoppingCart, AlertTriangle, TrendingUp, DollarSign, Box } from 'lucide-react'

interface OutOfStockItem {
  id: string
  name: string
  stock_quantity: number
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    outOfStockItems: [] as OutOfStockItem[],
    todayRevenue: 0,
    monthRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (localStorage.getItem('auth') !== 'verified') {
      window.location.href = '/login'
      return
    }

    async function loadStats() {
      const supabase = createClient()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString()
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const startOfMonthStr = startOfMonth.toISOString()

      const [productsRes, outOfStockRes, todaySalesRes, monthSalesRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id, name, stock_quantity').eq('stock_quantity', 0),
        supabase.from('sales').select('total_amount').gte('created_at', todayStr),
        supabase.from('sales').select('total_amount').gte('created_at', startOfMonthStr)
      ])

      const todayRevenue = todaySalesRes.data?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0
      const monthRevenue = monthSalesRes.data?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0

      setStats({
        totalProducts: productsRes.count || 0,
        outOfStockItems: outOfStockRes.data || [],
        todayRevenue,
        monthRevenue
      })
      setLoading(false)
    }
    loadStats()
  }, [])

  const isConnected = process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here'

  if (loading) {
    return <div className="p-8"><div className="text-center text-stone-500">Loading...</div></div>
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-800">Dashboard</h1>
        <p className="text-stone-500 mt-1">Overview of your store</p>
      </div>

      {!isConnected && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 text-sm">Supabase not connected.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Package} label="Total Products" value={stats.totalProducts.toString()} href="/inventory" color="stone" />
        <StatCard icon={AlertTriangle} label="Out of Stock" value={stats.outOfStockItems.length.toString()} href="/alerts" color="red" />
        <StatCard icon={DollarSign} label="Today's Revenue" value={`Rs.${stats.todayRevenue.toFixed(2)}`} href="/reports" color="emerald" />
        <StatCard icon={TrendingUp} label="Month Revenue" value={`Rs.${stats.monthRevenue.toFixed(2)}`} href="/reports" color="blue" />
      </div>

      {stats.outOfStockItems.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-stone-800">Out of Stock</h2>
            <Link href="/alerts" className="text-sm text-stone-500 hover:text-stone-700">View all →</Link>
          </div>
          <div className="space-y-3">
            {stats.outOfStockItems.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <span className="text-stone-700">{item.name}</span>
                <span className="text-red-600 font-medium">Out of stock</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <QuickAction href="/pos" icon={ShoppingCart} title="New Sale" description="Record a new sale transaction" />
        <QuickAction href="/inventory" icon={Box} title="Add Product" description="Add new inventory item" />
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, href, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  href: string
  color: 'stone' | 'amber' | 'emerald' | 'blue'
}) {
  const colors = { stone: 'bg-stone-800 text-white', red: 'bg-red-600 text-white', emerald: 'bg-emerald-600 text-white', blue: 'bg-blue-600 text-white' }
  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-xl border border-stone-200 p-6 hover:border-stone-300 transition-colors">
        <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center mb-4`}>
          <Icon className="w-6 h-6" />
        </div>
        <p className="text-stone-500 text-sm">{label}</p>
        <p className="text-2xl font-semibold text-stone-800 mt-1">{value}</p>
      </div>
    </Link>
  )
}

function QuickAction({ href, icon: Icon, title, description }: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-xl border border-stone-200 p-6 hover:border-stone-300 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center">
            <Icon className="w-6 h-6 text-stone-600" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-800">{title}</h3>
            <p className="text-sm text-stone-500">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}