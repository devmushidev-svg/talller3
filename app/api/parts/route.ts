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
  
  const partId = `PZ-${Date.now().toString(36).toUpperCase()}`
  
  const { data, error } = await supabase
    .from("parts")
    .insert({
      id: partId,
      name: body.name,
      model: body.model || null,
      size: body.size || null,
      category: body.category,
      condition: body.condition || 'bueno',
      notes: body.notes || null,
      quantity: body.quantity || 1,
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
