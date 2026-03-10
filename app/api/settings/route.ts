import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", "default")
    .single()
  
  if (error) {
    // Return default settings if not found
    return NextResponse.json({
      id: "default",
      shop_name: "Mi Taller",
      shop_phone: "",
      shop_address: "",
      printer_width: "80mm"
    })
  }
  
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { data, error } = await supabase
    .from("settings")
    .upsert({
      id: "default",
      shop_name: body.shop_name,
      shop_phone: body.shop_phone,
      shop_address: body.shop_address,
      printer_width: body.printer_width,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
