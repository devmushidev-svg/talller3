'use client'

import { Ticket, EQUIPMENT_LABELS } from '@/lib/types'
import { QRCodeSVG } from 'qrcode.react'

interface TicketReceiptProps {
  ticket: Ticket
  shopName?: string
}

export function TicketReceipt({ ticket, shopName = 'TALLER DE REPARACIÓN' }: TicketReceiptProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-MX', {
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
        <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>
          TICKET: {ticket.id}
        </p>
        <p style={{ fontSize: '10px', margin: '2px 0' }}>
          {formatDate(ticket.created_at)}
        </p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

      {/* Client Info */}
      <div style={{ marginBottom: '8px' }}>
        <p style={{ fontSize: '11px', margin: '2px 0' }}>
          <strong>Cliente:</strong> {ticket.client_name}
        </p>
        <p style={{ fontSize: '11px', margin: '2px 0' }}>
          <strong>Tel:</strong> {ticket.client_phone}
        </p>
        {ticket.client_email && (
          <p style={{ fontSize: '11px', margin: '2px 0' }}>
            <strong>Email:</strong> {ticket.client_email}
          </p>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

      {/* Equipment Info */}
      <div style={{ marginBottom: '8px' }}>
        <p style={{ fontSize: '11px', margin: '2px 0' }}>
          <strong>Equipo:</strong> {EQUIPMENT_LABELS[ticket.equipment_type]}
        </p>
        <p style={{ fontSize: '11px', margin: '2px 0' }}>
          <strong>Marca:</strong> {ticket.brand}
        </p>
        <p style={{ fontSize: '11px', margin: '2px 0' }}>
          <strong>Modelo:</strong> {ticket.model}
        </p>
        {ticket.serial_number && (
          <p style={{ fontSize: '11px', margin: '2px 0' }}>
            <strong>Serie:</strong> {ticket.serial_number}
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
          {ticket.problem_description}
        </p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

      {/* Accessories */}
      {ticket.accessories.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '2px 0' }}>
            ACCESORIOS RECIBIDOS:
          </p>
          {ticket.accessories.map(acc => (
            <p key={acc} style={{ fontSize: '10px', margin: '1px 0' }}>
              {'✓'} {acc}
            </p>
          ))}
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

      {/* QR Code */}
      <div style={{ textAlign: 'center', marginTop: '8px', marginBottom: '8px' }}>
        <QRCodeSVG 
          value={`TICKET-${ticket.id}`}
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
