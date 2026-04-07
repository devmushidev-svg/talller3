import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { normalizeCustomerPhone } from '@/lib/utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const supabase = await createClient()
    const { phone: phoneParam } = await params
    const phone = normalizeCustomerPhone(decodeURIComponent(phoneParam))

    // Get all tickets for this phone number
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('client_phone', phone)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate summary stats
    const totalTickets = data?.length || 0
    const completedTickets = data?.filter(t => t.status === 'entregado').length || 0
    const totalSpent = data?.reduce((sum, t) => sum + (t.total_cost || 0), 0) || 0

    return NextResponse.json({
      tickets: data || [],
      summary: {
        totalTickets,
        completedTickets,
        totalSpent
      }
    })
  } catch (error) {
    console.error('Error fetching customer history:', error)
    return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 })
  }
}
