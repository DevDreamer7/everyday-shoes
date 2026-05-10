'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string
  address: string | null
  notes: string | null
  total_purchases: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const { data } = await supabase.from('customers').select('*').order('name')
      if (data) setCustomers(data)
      setLoading(false)
    }
    loadData()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this customer?')) return
    await supabase.from('customers').delete().eq('id', id)
    const { data } = await supabase.from('customers').select('*').order('name')
    if (data) setCustomers(data)
  }

  async function refetchCustomers() {
    const { data } = await supabase.from('customers').select('*').order('name')
    if (data) setCustomers(data)
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Customers</h1>
          <p className="text-stone-500 mt-1">{customers.length} customers</p>
        </div>
        <button
          onClick={() => { setEditingCustomer(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-xl border border-stone-200">
        <div className="p-4 border-b border-stone-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-stone-500">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-stone-600">Customer</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-stone-600">Contact</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-stone-600">Phone</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-stone-600">Total Purchases</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-stone-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="border-b border-stone-100 hover:bg-stone-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-stone-600">
                          {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-stone-800">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-stone-600">
                    {customer.email || '-'}
                  </td>
                  <td className="px-6 py-4 text-stone-600">{customer.phone}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-1 bg-stone-100 rounded text-sm font-medium text-stone-700">
                      {customer.total_purchases}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingCustomer(customer); setShowModal(true) }}
                        className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filteredCustomers.length === 0 && (
          <div className="p-8 text-center text-stone-500">
            {searchTerm ? 'No customers found' : 'No customers yet. Add your first customer!'}
          </div>
        )}
      </div>

      {showModal && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); refetchCustomers() }}
        />
      )}
    </div>
  )
}

function CustomerModal({ customer, onClose, onSave }: {
  customer: Customer | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    notes: customer?.notes || ''
  })

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const data = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone,
      address: formData.address || null,
      notes: formData.notes || null
    }

    let error
    if (customer) {
      ({ error } = await supabase.from('customers').update(data).eq('id', customer.id))
    } else {
      ({ error } = await supabase.from('customers').insert({ ...data, total_purchases: 0 }))
    }

    if (error) {
      alert('Error saving customer: ' + error.message)
      return
    }
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-stone-800">
            {customer ? 'Edit Customer' : 'Add Customer'}
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-stone-600 hover:text-stone-800">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700">
              {customer ? 'Update' : 'Add'} Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}