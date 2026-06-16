/** Utilidades para contactar clientes por WhatsApp. */

import { Ticket, EQUIPMENT_LABELS } from "@/lib/types"

/**
 * Normaliza un teléfono a formato internacional para wa.me.
 * Honduras (+504) por defecto: un número local de 8 dígitos recibe el prefijo.
 */
export function toWhatsAppNumber(phone: string | null | undefined, countryCode = "504") {
  const digits = (phone || "").replace(/\D/g, "")
  if (!digits) return ""
  // Ya viene con código de país (más de 8 dígitos y empieza por el código)
  if (digits.length > 8 && digits.startsWith(countryCode)) return digits
  // Número local hondureño de 8 dígitos
  if (digits.length === 8) return countryCode + digits
  // Cualquier otro caso: usar tal cual (puede ser otro país ya con código)
  return digits
}

/** Construye la URL de WhatsApp (wa.me) con un mensaje opcional prellenado. */
export function whatsappUrl(phone: string | null | undefined, message?: string) {
  const num = toWhatsAppNumber(phone)
  if (!num) return ""
  const base = `https://wa.me/${num}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export interface WhatsAppTemplate {
  id: string
  /** Texto corto para el menú */
  label: string
  /** Mensaje completo que se prellenará en WhatsApp */
  text: string
}

/** Descripción legible del equipo: "Laptop HP Pavilion" */
function equipmentDescription(t: Ticket) {
  const desc = [
    EQUIPMENT_LABELS[t.equipment_type] ?? t.equipment_type,
    t.brand,
    t.model,
  ]
    .filter(Boolean)
    .join(" ")
  return desc || "su equipo"
}

/** Número visible del ticket: "N° 64" o el id */
function ticketLabel(t: Ticket) {
  return t.ticket_seq != null ? `N° ${t.ticket_seq}` : t.id
}

/**
 * Plantillas de mensaje por situación, ya personalizadas con el nombre del
 * cliente, el equipo y el número de ticket.
 */
export function buildTicketWhatsAppTemplates(
  t: Ticket,
  shopName = "MULTIPLANET"
): WhatsAppTemplate[] {
  const nombre = t.client_name?.trim() || "cliente"
  const equipo = equipmentDescription(t)
  const no = ticketLabel(t)
  const saludo = `Estimado/a ${nombre}, le saludamos de ${shopName}.`

  return [
    {
      id: "listo",
      label: "✅ Equipo listo para retirar",
      text: `${saludo} Le informamos que su equipo ${equipo} (Ticket ${no}) ya está listo para retirar. Le esperamos en nuestro taller. ¡Gracias por su preferencia!`,
    },
    {
      id: "demora",
      label: "⏳ Necesita más tiempo",
      text: `${saludo} Lamentamos informarle que su equipo ${equipo} (Ticket ${no}) necesita más tiempo en revisión. Nos comunicaremos con usted en cuanto esté listo. Gracias por su paciencia.`,
    },
    {
      id: "diagnostico",
      label: "🔧 Diagnóstico / cotización",
      text: `${saludo} Ya tenemos el diagnóstico de su equipo ${equipo} (Ticket ${no}). El costo estimado de la reparación es de L. ____. ¿Desea que procedamos con el trabajo?`,
    },
    {
      id: "recordatorio",
      label: "🔔 Recordatorio de retiro",
      text: `${saludo} Le recordamos que su equipo ${equipo} (Ticket ${no}) ya está listo y aún no ha sido retirado. Puede pasar a recogerlo en nuestro horario de atención. ¡Gracias!`,
    },
    {
      id: "recibido",
      label: "📥 Equipo recibido",
      text: `${saludo} Confirmamos que recibimos su equipo ${equipo} (Ticket ${no}). Le informaremos sobre el diagnóstico lo antes posible. ¡Gracias por su confianza!`,
    },
  ]
}
