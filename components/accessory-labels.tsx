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
          <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '1mm', textAlign: 'center' }}>
            {ticket.id}
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '9px', textAlign: 'center', marginBottom: '1mm' }}>
            {accessory.toUpperCase()}
          </div>
          <div style={{ fontSize: '8px', textAlign: 'center' }}>
            {ticket.client_name.length > 18 
              ? ticket.client_name.substring(0, 18) + '...' 
              : ticket.client_name}
          </div>
        </div>
      ))}
    </div>
  )
}

export function printAccessoryLabels(ticket: Ticket) {
  if (ticket.accessories.length === 0) return

  const printWindow = window.open('', '_blank', 'width=300,height=400')
  if (!printWindow) return

  const labelsHtml = ticket.accessories.map(accessory => `
    <div class="label">
      <div class="ticket-id">${ticket.id}</div>
      <div class="accessory">${accessory.toUpperCase()}</div>
      <div class="client">${ticket.client_name.length > 18 ? ticket.client_name.substring(0, 18) + '...' : ticket.client_name}</div>
    </div>
  `).join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Etiquetas de Accesorios - ${ticket.id}</title>
      <style>
        @page { margin: 1mm; size: 58mm auto; }
        body { 
          margin: 0; 
          padding: 1mm;
          font-family: 'Courier New', monospace;
          font-size: 8px;
          line-height: 1.2;
        }
        .label {
          width: 48mm;
          border: 1px dashed #000;
          padding: 2mm;
          margin-bottom: 2mm;
          box-sizing: border-box;
          page-break-inside: avoid;
        }
        .ticket-id {
          font-weight: bold;
          font-size: 10px;
          text-align: center;
          margin-bottom: 1mm;
        }
        .accessory {
          font-weight: bold;
          font-size: 9px;
          text-align: center;
          margin-bottom: 1mm;
        }
        .client {
          font-size: 8px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      ${labelsHtml}
      <script>
        window.onload = function() { window.print(); }
      <\/script>
    </body>
    </html>
  `)
  printWindow.document.close()
}
