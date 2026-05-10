'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Package } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Product {
  id: string
  name: string
  sku: string
  stock_quantity: number
  brand: string
  size: string
  color: string
}

export default function AlertsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('stock_quantity', 0)
        .order('name')
      
      if (data) setProducts(data)
      setLoading(false)
    }
    loadData()
  }, [])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Out of Stock</h1>
          <p className="text-stone-500 mt-1">Products that need restocking</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-stone-500 py-8">Loading...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
          <Package className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500">All products are in stock!</p>
          <Link href="/inventory" className="text-stone-600 hover:text-stone-800 text-sm mt-2 inline-block">
            View inventory →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-stone-600">Product</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-stone-600">SKU</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-stone-600">Details</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-stone-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="border-b border-stone-100 hover:bg-stone-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-stone-800">{product.name}</span>
                    <span className="text-sm text-stone-500 ml-2">{product.brand}</span>
                  </td>
                  <td className="px-6 py-4 text-stone-600">{product.sku}</td>
                  <td className="px-6 py-4 text-stone-600 text-sm">
                    {product.size} • {product.color}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-1 bg-red-100 rounded text-xs font-medium text-red-700">
                      OUT OF STOCK
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}