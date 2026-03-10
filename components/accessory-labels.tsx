'use client'

import { Ticket } from '@/lib/types'

interface AccessoryLabelsProps {
  ticket: Ticket
}

export function AccessoryLabels({ ticket }: AccessoryLabelsProps) {
  if (ticket.accessories.length === 0) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2mm' }}>
      {ticket.accessories.map((accessory, index) => (
        <div
          key={index}
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
          <div style={{ fontWeight: 'bold', fontSize: '9px', marginBottom: '1mm' }}>
            {ticket.id}
          </div>
          <div style={{ marginBottom: '1mm' }}>
            {ticket.client_name.length > 15 
              ? ticket.client_name.substring(0, 15) + '...' 
              : ticket.client_name}
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '9px' }}>
            {accessory}
          </div>
        </div>
      ))}
    </div>
  )
}
