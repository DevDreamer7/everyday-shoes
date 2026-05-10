'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Search, Edit2, Trash2, X, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Product {
  id: string
  name: string
  brand: string
  category: string
  color: string
  size: string
  sku: string
  cost_price: number
  selling_price: number
  stock_quantity: number
  low_stock_threshold: number
  supplier_id: string | null
  image_url: string | null
}

interface Supplier {
  id: string
  name: string
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteProduct, setDeleteProduct] = useState<{ name: string; variants: Product[] } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [productsRes, suppliersRes] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('suppliers').select('id, name')
      ])
      if (productsRes.data) setProducts(productsRes.data)
      if (suppliersRes.data) setSuppliers(suppliersRes.data)
      setLoading(false)
    }
    loadData()
  }, [])

  async function handleDelete() {
    if (!deleteProduct) return
    setDeleting(true)
    
    try {
      const idsToDelete = deleteProduct.variants.map(v => v.id)
      
      for (const id of idsToDelete) {
        const { error: deleteError } = await supabase.from('products').delete().eq('id', id)
        if (deleteError) {
          console.error('Delete error:', deleteError)
          alert('Error deleting: ' + deleteError.message)
          setDeleting(false)
          return
        }
      }
      
      const { data } = await supabase.from('products').select('*').order('name')
      if (data) setProducts(data)
      setDeleteProduct(null)
    } catch (err) {
      console.error('Delete catch:', err)
      alert('Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  async function refetchProducts() {
    const { data } = await supabase.from('products').select('*').order('name')
    if (data) setProducts(data)
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const productGroups = filteredProducts.reduce((acc, p) => {
    const key = `${p.name}-${p.brand || ''}-${p.color || ''}`
    if (!acc[key]) {
      acc[key] = { ...p, variants: [], totalStock: 0 }
    }
    acc[key].variants.push(p)
    acc[key].totalStock = (acc[key].totalStock || 0) + (p.stock_quantity || 0)
    return acc
  }, {} as Record<string, Product & { variants: Product[]; totalStock: number }>)

  const groupedProducts = Object.values(productGroups).sort((a, b) => 
    a.name.localeCompare(b.name)
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Inventory</h1>
          <p className="text-stone-500 mt-1">{groupedProducts.length} product models • {products.length} total variants</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl border border-stone-200">
        <div className="p-4 border-b border-stone-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-stone-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-stone-600">Product</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-stone-600">Sizes</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-stone-600">Color</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-stone-600">Cost</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-stone-600">Price</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-stone-600">Stock</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-stone-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedProducts.map((product) => (
                  <tr key={product.id} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-stone-800">{product.name}</p>
                        <p className="text-sm text-stone-500">{product.brand || product.category || ''}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {product.variants.map(v => (
                          <span key={v.id} className="px-2 py-0.5 bg-stone-100 rounded text-xs font-medium text-stone-600">
                            {v.size}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-600">{product.color || '-'}</td>
                    <td className="px-6 py-4 text-right text-stone-600">Rs.{product.cost_price?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-4 text-right font-medium text-stone-800">Rs.{product.selling_price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-1 rounded text-sm font-mono ${
                        product.totalStock === 0 
                          ? 'bg-red-100 text-red-700' 
                          : product.totalStock <= product.low_stock_threshold 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-stone-100 text-stone-600'
                      }`}>
                        {product.totalStock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingProduct(product.variants[0]); setShowModal(true) }}
                          className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteProduct({ name: product.name, variants: product.variants })}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {groupedProducts.length === 0 && (
              <div className="p-8 text-center text-stone-500">
                {searchTerm ? 'No products found' : 'No products yet. Add your first product!'}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <ProductModal
          product={editingProduct}
          suppliers={suppliers}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); refetchProducts() }}
        />
      )}

      {deleteProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-800">Delete Product</h2>
                <p className="text-sm text-stone-500">{deleteProduct.variants.length} variant(s)</p>
              </div>
            </div>
            <p className="text-stone-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">&ldquo;{deleteProduct.name}&rdquo;</span>? 
              This will remove all {deleteProduct.variants.length} size variants and cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteProduct(null)}
                className="px-4 py-2 text-stone-600 hover:text-stone-800"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductModal({ product, suppliers, onClose, onSave }: {
  product: Product | null
  suppliers: Supplier[]
  onClose: () => void
  onSave: () => void
}) {
  const initialSizes = product?.size || '6, 7, 8, 9, 10'
  const [sizesInput, setSizesInput] = useState(initialSizes)
  const [sizeStocks, setSizeStocks] = useState<Record<string, number>>(() => {
    const sizes = initialSizes.split(',').map(s => s.trim()).filter(s => s)
    if (product?.size) {
      return { [product.size]: product.stock_quantity || 0 }
    }
    return sizes.reduce((acc, s) => ({ ...acc, [s]: 5 }), {})
  })
  const [formData, setFormData] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    category: product?.category || '',
    color: product?.color || '',
    sku_prefix: product?.sku || '',
    cost_price: product?.cost_price || 0,
    selling_price: product?.selling_price || 0,
    low_stock_threshold: product?.low_stock_threshold || 10,
    supplier_id: product?.supplier_id || ''
  })

  const supabase = createClient()

  const sizes = sizesInput.split(',').map(s => s.trim()).filter(s => s)
  const totalStock = Object.values(sizeStocks).reduce((a, b) => a + b, 0)

  function generateSKU(prefix: string, size: string, color: string) {
    const colorCode = color ? color.substring(0, 3).toUpperCase() : 'NOS'
    return `${prefix}-${colorCode}-${size}`.toUpperCase().replace(/\s/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const color = formData.color || ''
    const prefix = formData.sku_prefix || formData.name.substring(0, 3).toUpperCase().replace(/\s/g, '')

    if (product) {
      const updateData = {
        name: formData.name,
        brand: formData.brand || null,
        category: formData.category || null,
        color: color || null,
        cost_price: parseFloat(formData.cost_price.toString()),
        selling_price: parseFloat(formData.selling_price.toString()),
        low_stock_threshold: parseInt(formData.low_stock_threshold.toString()),
        supplier_id: formData.supplier_id || null
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id)

      if (error) {
        alert('Error updating product: ' + error.message)
        return
      }
    } else {
      const inserts = sizes.map(size => ({
        name: formData.name,
        brand: formData.brand || null,
        category: formData.category || null,
        color: color || null,
        size: size,
        sku: generateSKU(prefix, size, color),
        cost_price: parseFloat(formData.cost_price.toString()),
        selling_price: parseFloat(formData.selling_price.toString()),
        stock_quantity: sizeStocks[size] || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold.toString()),
        supplier_id: formData.supplier_id || null
      }))

      const { error } = await supabase.from('products').insert(inserts)

      if (error) {
        alert('Error adding product: ' + error.message)
        return
      }
    }
    onSave()
  }

  function handleSizesChange(value: string) {
    setSizesInput(value)
    const newSizes = value.split(',').map(s => s.trim()).filter(s => s)
    setSizeStocks(prev => {
      const updated = { ...prev }
      newSizes.forEach(size => {
        if (!(size in updated)) updated[size] = 5
      })
      return updated
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-stone-800">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">Product Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">SKU Prefix</label>
              <input
                type="text"
                value={formData.sku_prefix}
                onChange={(e) => setFormData({ ...formData, sku_prefix: e.target.value })}
                placeholder="e.g. NAM"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">Sizes</label>
              <input
                type="text"
                required
                value={sizesInput}
                onChange={(e) => handleSizesChange(e.target.value)}
                placeholder="e.g. 6, 7, 8, 9, 10"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-2">Stock per Size</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {sizes.map(size => (
                  <div key={size} className="text-center">
                    <div className="text-xs text-stone-500 mb-1">Size {size}</div>
                    <input
                      type="number"
                      min="0"
                      value={sizeStocks[size] || 0}
                      onChange={(e) => setSizeStocks({ ...sizeStocks, [size]: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 text-center border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm text-stone-600 font-medium">
                Total Stock: {totalStock} units
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Supplier</label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              >
                <option value="">None</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Cost Price (Rs.)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Selling Price (Rs.)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Low Stock Alert</label>
              <input
                type="number"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700"
            >
              {product ? 'Update' : 'Add'} Product
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}