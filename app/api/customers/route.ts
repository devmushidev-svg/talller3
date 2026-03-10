import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const search = searchParams.get('search')

    let query = supabase.from('customers').select('*')

    if (phone) {
      query = query.eq('phone', phone)
    } else if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Check if customer already exists
    const { data: existing } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', body.phone)
      .single()

    if (existing) {
      // Update existing customer
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: body.name,
          email: body.email,
          address: body.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    // Create new customer
    const { data, error } = await supabase
      .from('customers')
      .insert({
        id: crypto.randomUUID(),
        name: body.name,
        phone: body.phone,
        email: body.email,
        address: body.address
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 })
  }
}
