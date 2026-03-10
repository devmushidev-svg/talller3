'use client'

import { Ticket, ACCESSORY_LABELS, AccessoryKey } from '@/lib/types'
import { QRCodeSVG } from 'qrcode.react'

interface TicketReceiptProps {
  ticket: Ticket
  shopName?: string
}

export function TicketReceipt({ ticket, shopName = 'TALLER DE REPARACIÓN' }: TicketReceiptProps) {
  const selectedAccessories = (Object.keys(ACCESSORY_LABELS) as AccessoryKey[])
    .filter(key => ticket.accessories[key])
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="receipt-ticket" style={{ fontFamily: "'Courier New', monospace" }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{shopName}</h1>
        <p style={{ fontSize: '10px', margin: '2px 0' }}>Sistema de Tickets de Taller</p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

      {/* Ticket Info */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
          TICKET #{String(ticket.ticketNumber).padStart(5, '0')}
        </p>
        <p style={{ fontSize: '10px', margin: '2px 0' }}>
          {formatDate(ticket.createdAt)}
        </p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

      {/* Client Info */}
      <div style={{ marginBottom: '8px' }}>
        <p style={{ fontSize: '11px', margin: '2px 0' }}>
          <strong>Cliente:</strong> {ticket.clientName}
        </p>
        <p style={{ fontSize: '11px', margin: '2px 0' }}>
          <strong>Tel:</strong> {ticket.phone}
        </p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

      {/* Equipment Info */}
      <div style={{ marginBottom: '8px' }}>
        <p style={{ fontSize: '11px', margin: '2px 0' }}>
          <strong>Equipo:</strong> {ticket.equipmentType}
        </p>
        <p style={{ fontSize: '11px', margin: '2px 0' }}>
          <strong>Marca:</strong> {ticket.brand}
        </p>
        <p style={{ fontSize: '11px', margin: '2px 0' }}>
          <strong>Modelo:</strong> {ticket.model}
        </p>
        {ticket.serialNumber && (
          <p style={{ fontSize: '11px', margin: '2px 0' }}>
            <strong>Serie:</strong> {ticket.serialNumber}
          </p>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

      {/* Problem */}
      <div style={{ marginBottom: '8px' }}>
        <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '2px 0' }}>
          PROBLEMA REPORTADO:
        </p>
        <p style={{ fontSize: '10px', margin: '2px 0' }}>
          {ticket.reportedProblem}
        </p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

      {/* Accessories */}
      {selectedAccessories.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '2px 0' }}>
            ACCESORIOS RECIBIDOS:
          </p>
          {selectedAccessories.map(key => (
            <p key={key} style={{ fontSize: '10px', margin: '1px 0' }}>
              {'✓'} {ACCESSORY_LABELS[key]}
              {key === 'otros' && ticket.accessories.otrosDetalle && `: ${ticket.accessories.otrosDetalle}`}
            </p>
          ))}
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

      {/* QR Code */}
      <div style={{ textAlign: 'center', marginTop: '8px', marginBottom: '8px' }}>
        <QRCodeSVG 
          value={`TICKET-${ticket.ticketNumber}`}
          size={64}
          style={{ margin: '0 auto' }}
        />
        <p style={{ fontSize: '8px', marginTop: '4px' }}>
          Escanee para consultar estado
        </p>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '9px', margin: '2px 0' }}>
          Conserve este ticket para recoger su equipo
        </p>
        <p style={{ fontSize: '9px', margin: '2px 0' }}>
          Gracias por su preferencia
        </p>
      </div>
    </div>
  )
}
