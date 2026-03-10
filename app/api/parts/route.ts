import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("parts")
    .select("*")
    .order("name", { ascending: true })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const partId = `PT-${Date.now().toString(36).toUpperCase()}`
  
  const { data, error } = await supabase
    .from("parts")
    .insert({
      id: partId,
      name: body.name,
      category: body.category,
      quantity: body.quantity || 0,
      min_stock: body.min_stock || 5,
      cost_price: body.cost_price || 0,
      sell_price: body.sell_price || 0,
      supplier: body.supplier || null,
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
