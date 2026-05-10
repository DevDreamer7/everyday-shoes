'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  AlertTriangle,
  BarChart3
} from 'lucide-react'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/inventory', icon: Package, label: 'Inventory' },
  { href: '/pos', icon: ShoppingCart, label: 'POS' },
  { href: '/customers', icon: Users, label: 'Customers' },
  { href: '/suppliers', icon: Truck, label: 'Suppliers' },
  { href: '/alerts', icon: AlertTriangle, label: 'Out of Stock' },
  { href: '/reports', icon: BarChart3, label: 'Reports' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-stone-50 border-r border-stone-200 flex flex-col">
      <div className="p-6 border-b border-stone-200">
        <h1 className="text-xl font-semibold text-stone-800 tracking-tight">
          Everyday Shoes
        </h1>
        <p className="text-sm text-stone-500 mt-1">Inventory Manager</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-stone-800 text-white'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-stone-200">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center">
            <span className="text-sm font-medium text-stone-600">ES</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 truncate">Store</p>
            <p className="text-xs text-stone-500">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  )
}