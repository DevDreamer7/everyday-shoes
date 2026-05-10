'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { ShoppingCart, Trash2, Search, User, CreditCard, Banknote, X, ChevronDown, ChevronUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Product {
  id: string
  name: string
  size: string
  color: string
  stock_quantity: number
  selling_price: number
  sku: string
  brand: string
}

interface Customer {
  id: string
  name: string
  phone: string
  total_purchases: number
}

interface CartItem {
  product: Product
  quantity: number
}

interface ProductGroup {
  name: string
  brand: string
  color: string
  selling_price: number
  variants: { size: string; id: string; stock: number }[]
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const [productsRes, customersRes] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('customers').select('*').order('name')
      ])
      if (productsRes.data) setProducts(productsRes.data)
      if (customersRes.data) setCustomers(customersRes.data)
    }
    loadData()
  }, [])

  const groupedProducts = products.reduce((acc, p) => {
    const key = `${p.name}-${p.brand || ''}-${p.color || ''}-${p.selling_price}`
    if (!acc[key]) {
      acc[key] = {
        name: p.name,
        brand: p.brand || '',
        color: p.color || '',
        selling_price: p.selling_price,
        variants: []
      }
    }
    acc[key].variants.push({ size: p.size, id: p.id, stock: p.stock_quantity })
    return acc
  }, {} as Record<string, ProductGroup>)

  const productGroups = Object.values(groupedProducts)
    .filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  const allProductsGrouped = Object.values(groupedProducts).sort((a, b) => a.name.localeCompare(b.name))

  const displayGroups = searchTerm ? productGroups : allProductsGrouped

  function addToCart(productId: string, size: string) {
    const product = products.find(p => p.id === productId)
    if (!product) return

    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId)
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev
        return prev.map(item =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  function removeFromCart(productId: string) {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, quantity: Math.min(quantity, item.product.stock_quantity) }
        : item
    ))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0)

  async function completeSale() {
    if (cart.length === 0) return

    const { data: sale, error: saleError } = await supabase.from('sales').insert({
      customer_id: selectedCustomer?.id || null,
      total_amount: cartTotal,
      payment_method: paymentMethod,
      created_at: new Date().toISOString()
    }).select().single()

    if (saleError) {
      alert('Error creating sale')
      return
    }

    const saleItems = cart.map(item => ({
      sale_id: sale.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.selling_price,
      subtotal: item.product.selling_price * item.quantity
    }))

    await supabase.from('sale_items').insert(saleItems)

    for (const item of cart) {
      const newStock = item.product.stock_quantity - item.quantity
      await supabase.from('products').update({ stock_quantity: newStock }).eq('id', item.product.id)
    }

    if (selectedCustomer) {
      await supabase.from('customers')
        .update({ total_purchases: selectedCustomer.total_purchases + 1 })
        .eq('id', selectedCustomer.id)
    }

    setCart([])
    setSelectedCustomer(null)
    const { data } = await supabase.from('products').select('*').order('name')
    if (data) setProducts(data)
    alert('Sale completed successfully!')
  }

  function getVariantStock(group: ProductGroup, size: string) {
    const variant = group.variants.find(v => v.size === size)
    return variant?.stock || 0
  }

  return (
    <div className="p-8 h-full flex gap-6">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-stone-800">New Sale</h1>
          <p className="text-stone-500 mt-1">Select products to add to cart</p>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {displayGroups.map((group, idx) => {
            const isExpanded = expandedGroup === `${group.name}-${idx}`
            const totalStock = group.variants.reduce((sum, v) => sum + v.stock, 0)
            const allOutOfStock = group.variants.every(v => v.stock === 0)

            return (
              <div
                key={`${group.name}-${idx}`}
                className={`bg-white rounded-xl border transition-all ${
                  allOutOfStock ? 'border-stone-200 opacity-60' : 'border-stone-200 hover:border-stone-400'
                }`}
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-stone-800 text-lg">{group.name}</p>
                      {group.brand && (
                        <span className="px-2 py-0.5 bg-stone-100 rounded text-xs text-stone-500">{group.brand}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xl font-bold text-stone-800">Rs.{group.selling_price.toFixed(2)}</span>
                      <span className="text-sm text-stone-500">
                        {group.color && `${group.color} •`} {group.variants.length} sizes • {totalStock} in stock
                      </span>
                    </div>
                  </div>
                  {group.variants.length > 1 && !allOutOfStock && (
                    <button
                      onClick={() => setExpandedGroup(isExpanded ? null : `${group.name}-${idx}`)}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {isExpanded ? 'Hide sizes' : 'Show sizes'}
                    </button>
                  )}
                </div>

                {!isExpanded && !allOutOfStock && (
                  <div className="px-4 pb-4">
                    <div className="flex flex-wrap gap-2">
                      {group.variants.filter(v => v.stock > 0).slice(0, 6).map(variant => {
                        const product = products.find(p => p.id === variant.id)
                        return (
                          <button
                            key={variant.id}
                            onClick={() => addToCart(variant.id, variant.size)}
                            className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors flex items-center gap-2"
                          >
                            Size {variant.size}
                            <span className="opacity-70">({variant.stock})</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-stone-100 pt-4">
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {group.variants.map(variant => {
                        const product = products.find(p => p.id === variant.id)
                        const inCart = cart.find(item => item.product.id === variant.id)
                        const isOutOfStock = variant.stock === 0

                        return (
                          <button
                            key={variant.id}
                            onClick={() => !isOutOfStock && addToCart(variant.id, variant.size)}
                            disabled={isOutOfStock}
                            className={`p-3 rounded-lg border text-center transition-all ${
                              isOutOfStock
                                ? 'border-stone-200 bg-stone-50 opacity-50 cursor-not-allowed'
                                : inCart
                                  ? 'border-stone-800 bg-stone-800 text-white'
                                  : 'border-stone-200 hover:border-stone-400 hover:bg-stone-50'
                            }`}
                          >
                            <div className="text-lg font-bold">{variant.size}</div>
                            <div className={`text-xs ${isOutOfStock ? 'text-stone-400' : inCart ? 'text-stone-300' : 'text-stone-500'}`}>
                              {variant.stock} left
                            </div>
                            {inCart && (
                              <div className="mt-1 flex items-center justify-center gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateQuantity(variant.id, inCart.quantity - 1) }}
                                  className="w-5 h-5 rounded bg-white/20 text-white text-xs hover:bg-white/30"
                                >
                                  -
                                </button>
                                <span className="text-xs font-medium">{inCart.quantity}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateQuantity(variant.id, inCart.quantity + 1) }}
                                  className="w-5 h-5 rounded bg-white/20 text-white text-xs hover:bg-white/30"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {displayGroups.length === 0 && (
            <div className="text-center text-stone-500 py-12">
              {searchTerm ? 'No products found' : 'No products available'}
            </div>
          )}
        </div>
      </div>

      <div className="w-96 bg-white rounded-xl border border-stone-200 flex flex-col">
        <div className="p-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-stone-600" />
            <span className="font-semibold text-stone-800">Cart</span>
            <span className="text-sm text-stone-500">({cart.length})</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <p className="text-center text-stone-500 py-8">Cart is empty</p>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.product.id} className="flex gap-3 p-3 bg-stone-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 truncate">{item.product.name}</p>
                    <p className="text-sm text-stone-500">Size {item.product.size}</p>
                    <p className="text-sm font-medium text-stone-800">Rs.{item.product.selling_price.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-stone-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-stone-200 text-stone-600 hover:bg-stone-300"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-stone-200 text-stone-600 hover:bg-stone-300"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-stone-200 space-y-3">
          <button
            onClick={() => setShowCustomerModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50"
          >
            <User className="w-4 h-4" />
            {selectedCustomer ? selectedCustomer.name : 'Add Customer (Optional)'}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border ${
                paymentMethod === 'cash' 
                  ? 'bg-stone-800 text-white border-stone-800' 
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Banknote className="w-4 h-4" />
              Cash
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border ${
                paymentMethod === 'card' 
                  ? 'bg-stone-800 text-white border-stone-800' 
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Card
            </button>
          </div>

          <div className="flex justify-between items-center py-3 border-t border-stone-200">
            <span className="text-stone-600">Total</span>
            <span className="text-2xl font-bold text-stone-800">Rs.{cartTotal.toFixed(2)}</span>
          </div>

          <button
            onClick={completeSale}
            disabled={cart.length === 0}
            className="w-full py-3 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Sale
          </button>
        </div>
      </div>

      {showCustomerModal && (
        <CustomerSelectModal
          customers={customers}
          selected={selectedCustomer}
          onSelect={(customer) => { setSelectedCustomer(customer); setShowCustomerModal(false) }}
          onClose={() => setShowCustomerModal(false)}
        />
      )}
    </div>
  )
}

function CustomerSelectModal({ customers, selected, onSelect, onClose }: {
  customers: Customer[]
  selected: Customer | null
  onSelect: (customer: Customer | null) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h2 className="font-semibold text-stone-800">Select Customer</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
          <button
            onClick={() => onSelect(null)}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 ${
              selected === null ? 'bg-stone-800 text-white' : 'hover:bg-stone-50 border border-stone-200'
            }`}
          >
            Walk-in Customer
          </button>
          {customers.map(customer => (
            <button
              key={customer.id}
              onClick={() => onSelect(customer)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 ${
                selected?.id === customer.id ? 'bg-stone-800 text-white' : 'hover:bg-stone-50 border border-stone-200'
              }`}
            >
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm opacity-70">{customer.phone}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}