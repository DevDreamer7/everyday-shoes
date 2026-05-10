import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  
  if (body.password === 'Reliance@2080') {
    return NextResponse.json({ success: true })
  }
  
  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}