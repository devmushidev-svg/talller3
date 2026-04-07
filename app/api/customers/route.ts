import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { upsertCustomerByPhone } from '@/lib/customers'
import { normalizeCustomerPhone } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const phoneRaw = searchParams.get('phone')
    const phone = phoneRaw ? normalizeCustomerPhone(phoneRaw) : null
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

    const result = await upsertCustomerByPhone(supabase, {
      name: body.name,
      phone: body.phone,
      email: body.email,
      address: body.address,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    const phone = normalizeCustomerPhone(body.phone)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Cliente no encontrado tras guardar' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 })
  }
}
