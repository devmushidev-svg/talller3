'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Ticket } from '@/lib/types'

interface DeviceLabelProps {
  ticket: Ticket
  shopName?: string
}

export function DeviceLabel({ ticket, shopName = 'Mi Taller' }: DeviceLabelProps) {
  const formattedDate = new Date(ticket.created_at).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  return (
    <div 
      className="device-label print-only"
      style={{
        width: '48mm',
        maxWidth: '48mm',
        padding: '2mm',
        fontFamily: "'Courier New', monospace",
        fontSize: '10px',
        lineHeight: '1.3',
        backgroundColor: '#fff',
        color: '#000',
        border: '1px dashed #000',
        pageBreakInside: 'avoid',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2mm', borderBottom: '1px dashed #000', paddingBottom: '2mm' }}>
        <div style={{ fontSize: '8px', fontWeight: 'bold' }}>{shopName}</div>
      </div>

      {/* QR Code */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2mm' }}>
        <QRCodeSVG 
          value={ticket.id} 
          size={50}
          level="M"
        />
      </div>

      {/* Ticket ID */}
      <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', marginBottom: '2mm' }}>
        {ticket.id}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '2mm 0' }} />

      {/* Client Name */}
      <div style={{ fontSize: '11px', fontWeight: 'bold', textAlign: 'center', marginBottom: '1mm' }}>
        {ticket.client_name.toUpperCase()}
      </div>

      {/* Device Info */}
      <div style={{ fontSize: '10px', textAlign: 'center', marginBottom: '1mm' }}>
        {ticket.brand && <span>{ticket.brand.toUpperCase()} </span>}
        {ticket.model && <span>{ticket.model.toUpperCase()}</span>}
      </div>

      {/* Date */}
      <div style={{ fontSize: '9px', textAlign: 'center', color: '#333' }}>
        {formattedDate}
      </div>

      {/* Footer Divider */}
      <div style={{ borderTop: '1px dashed #000', marginTop: '2mm' }} />
    </div>
  )
}

export function printDeviceLabel(ticket: Ticket, shopName?: string) {
  const printWindow = window.open('', '_blank', 'width=300,height=400')
  if (!printWindow) return

  const formattedDate = new Date(ticket.created_at).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Etiqueta de Equipo - ${ticket.id}</title>
      <style>
        @page { margin: 0; size: 58mm auto; }
        body { 
          margin: 0; 
          padding: 2mm;
          font-family: 'Courier New', monospace;
          font-size: 10px;
          line-height: 1.3;
        }
        .label {
          width: 48mm;
          max-width: 48mm;
          border: 1px dashed #000;
          padding: 2mm;
          box-sizing: border-box;
        }
        .header {
          text-align: center;
          margin-bottom: 2mm;
          border-bottom: 1px dashed #000;
          padding-bottom: 2mm;
          font-size: 8px;
          font-weight: bold;
        }
        .qr-container {
          display: flex;
          justify-content: center;
          margin-bottom: 2mm;
        }
        .ticket-id {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 2mm;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 2mm 0;
        }
        .client-name {
          font-size: 11px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 1mm;
        }
        .device-info {
          font-size: 10px;
          text-align: center;
          margin-bottom: 1mm;
        }
        .date {
          font-size: 9px;
          text-align: center;
          color: #333;
        }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="header">${shopName || 'Mi Taller'}</div>
        <div class="qr-container">
          <svg viewBox="0 0 50 50" width="50" height="50">
            <rect fill="#FFFFFF" x="0" y="0" width="50" height="50"/>
            <text x="25" y="30" text-anchor="middle" font-size="6">QR</text>
          </svg>
        </div>
        <div class="ticket-id">${ticket.id}</div>
        <div class="divider"></div>
        <div class="client-name">${ticket.client_name.toUpperCase()}</div>
        <div class="device-info">${ticket.brand?.toUpperCase() || ''} ${ticket.model?.toUpperCase() || ''}</div>
        <div class="date">${formattedDate}</div>
        <div class="divider"></div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
      <script>
        const qrContainer = document.querySelector('.qr-container');
        QRCode.toCanvas(document.createElement('canvas'), '${ticket.id}', { width: 50 }, function(error, canvas) {
          if (!error) {
            qrContainer.innerHTML = '';
            qrContainer.appendChild(canvas);
            setTimeout(() => window.print(), 100);
          }
        });
      <\/script>
    </body>
    </html>
  `)
  printWindow.document.close()
}
