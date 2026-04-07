import { createClient } from '@/lib/supabase/server'
import { normalizeCustomerPhone } from '@/lib/utils'

type DbClient = Awaited<ReturnType<typeof createClient>>

export async function upsertCustomerByPhone(
  supabase: DbClient,
  body: {
    name: string
    phone: string
    email?: string | null
    address?: string | null
  }
): Promise<{ ok: true } | { ok: false; message: string }> {
  const phone = normalizeCustomerPhone(body.phone)
  const name = body.name?.trim()
  if (!phone || !name) {
    return { ok: false, message: 'Teléfono y nombre son obligatorios' }
  }

  const { data: existing, error: findErr } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()

  if (findErr) {
    return { ok: false, message: findErr.message }
  }

  const now = new Date().toISOString()
  const email = body.email ?? null
  const address = body.address ?? null

  if (existing) {
    const { error } = await supabase
      .from('customers')
      .update({
        name,
        email,
        address,
        updated_at: now,
      })
      .eq('id', existing.id)

    if (error) return { ok: false, message: error.message }
    return { ok: true }
  }

  const { error } = await supabase.from('customers').insert({
    id: crypto.randomUUID(),
    name,
    phone,
    email,
    address,
  })

  if (error) return { ok: false, message: error.message }
  return { ok: true }
}
