'use client'

import { Ticket, ACCESSORY_LABELS, AccessoryKey } from '@/lib/types'

interface AccessoryLabelsProps {
  ticket: Ticket
}

export function AccessoryLabels({ ticket }: AccessoryLabelsProps) {
  const selectedAccessories = (Object.keys(ACCESSORY_LABELS) as AccessoryKey[])
    .filter(key => ticket.accessories[key])

  if (selectedAccessories.length === 0) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2mm' }}>
      {selectedAccessories.map((key) => (
        <div
          key={key}
          className="accessory-label"
          style={{
            width: '38mm',
            height: '18mm',
            border: '1px dashed #000',
            padding: '2mm',
            fontFamily: "'Courier New', monospace",
            fontSize: '8px',
            lineHeight: '1.2',
            pageBreakInside: 'avoid',
            display: 'inline-block',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '1mm' }}>
            #{String(ticket.ticketNumber).padStart(5, '0')}
          </div>
          <div style={{ marginBottom: '1mm' }}>
            {ticket.clientName.length > 15 
              ? ticket.clientName.substring(0, 15) + '...' 
              : ticket.clientName}
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '9px' }}>
            {ACCESSORY_LABELS[key]}
            {key === 'otros' && ticket.accessories.otrosDetalle && (
              <span style={{ fontWeight: 'normal' }}>: {ticket.accessories.otrosDetalle.substring(0, 10)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
