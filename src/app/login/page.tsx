'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ password }),
      headers: { 'Content-Type': 'application/json' }
    })
    if (res.ok) {
      localStorage.setItem('auth', 'verified')
      window.location.href = '/'
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-semibold text-stone-800 mb-6 text-center">
          Everyday Shoes
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false) }}
              className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          {error && (
            <p className="text-red-600 text-sm text-center">Incorrect password</p>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}