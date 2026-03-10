import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()
  
  const updateData: Record<string, unknown> = {
    ...body,
    updated_at: new Date().toISOString(),
  }
  
  if (body.status === "entregado" && !body.delivered_at) {
    updateData.delivered_at = new Date().toISOString()
  }
  
  if (body.accessories) {
    updateData.accessories = JSON.stringify(body.accessories)
  }
  
  if (body.parts_used) {
    updateData.parts_used = JSON.stringify(body.parts_used)
  }
  
  const { data, error } = await supabase
    .from("tickets")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("tickets")
    .delete()
    .eq("id", id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
