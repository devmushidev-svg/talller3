import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { upsertCustomerByPhone } from "@/lib/customers"
import { normalizeCustomerPhone } from "@/lib/utils"

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

  const client_phone = normalizeCustomerPhone(body.client_phone || "")
  const client_name = String(body.client_name || "").trim()
  if (!client_phone || !client_name) {
    return NextResponse.json(
      { error: "Nombre y teléfono del cliente son obligatorios" },
      { status: 400 }
    )
  }

  const synced = await upsertCustomerByPhone(supabase, {
    name: client_name,
    phone: client_phone,
  })
  if (!synced.ok) {
    return NextResponse.json({ error: synced.message }, { status: 400 })
  }

  const ticketId = `TK-${Date.now().toString(36).toUpperCase()}`

  let nextSeq = 1
  const { data: lastSeqRow } = await supabase
    .from("tickets")
    .select("ticket_seq")
    .not("ticket_seq", "is", null)
    .order("ticket_seq", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (lastSeqRow?.ticket_seq != null) {
    nextSeq = lastSeqRow.ticket_seq + 1
  }

  const receivedBy =
    typeof body.received_by === "string" && body.received_by.trim()
      ? body.received_by.trim()
      : "Mario"

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      id: ticketId,
      ticket_seq: nextSeq,
      client_name,
      client_phone,
      equipment_type: body.equipment_type,
      brand: body.brand || null,
      model: body.model || null,
      serial_number: body.serial_number || null,
      device_password: body.device_password?.trim() || null,
      received_by: receivedBy,
      problem_description: body.problem_description,
      accessories: JSON.stringify(body.accessories || []),
      status: "recibido",
      estimated_delivery_date: body.estimated_delivery_date || null,
      diagnosis_cost: body.diagnosis_cost || 0,
      internal_notes: body.internal_notes || null,
      photos: JSON.stringify(body.photos || []),
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
