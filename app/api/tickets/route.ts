import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const ticketId = `TK-${Date.now().toString(36).toUpperCase()}`
  
  const { data, error } = await supabase
    .from("tickets")
    .insert({
      id: ticketId,
      client_name: body.client_name,
      client_phone: body.client_phone,
      equipment_type: body.equipment_type,
      brand: body.brand || null,
      model: body.model || null,
      serial_number: body.serial_number || null,
      problem_description: body.problem_description,
      accessories: JSON.stringify(body.accessories || []),
      status: "recibido",
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
