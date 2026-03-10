"use client"

import { useRef } from "react"
import { Ticket, ShopSettings, EQUIPMENT_LABELS } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Receipt } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

interface TicketReceiptProps {
  ticket: Ticket
  settings: ShopSettings
  onPrint?: () => void
}

export function TicketReceipt({ ticket, settings, onPrint }: TicketReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const width = settings.printer_width === '58mm' ? '48mm' : '72mm'

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) {
      document.body.removeChild(iframe)
      return
    }

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket POS - ${ticket.id}</title>
        <style>
          @page {
            size: ${width} auto;
            margin: 2mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            line-height: 1.3;
            color: #000;
            background: #fff;
            width: ${width};
          }
          .receipt {
            padding: 2mm;
          }
          .header {
            text-align: center;
            margin-bottom: 4px;
          }
          .shop-name {
            font-size: 14px;
            font-weight: bold;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 4px 0;
          }
          .ticket-id {
            text-align: center;
            font-size: 12px;
            font-weight: bold;
          }
          .row {
            margin: 2px 0;
          }
          .label {
            font-weight: bold;
          }
          .accessories {
            margin-left: 8px;
          }
          .qr-section {
            text-align: center;
            margin: 8px 0;
          }
          .footer {
            text-align: center;
            font-size: 8px;
            margin-top: 8px;
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `)
    doc.close()

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 100)
      }, 100)
    }

    onPrint?.()
  }

  const accessories = typeof ticket.accessories === 'string' 
    ? JSON.parse(ticket.accessories) 
    : ticket.accessories || []

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      <Button onClick={handlePrint} variant="outline" className="w-full">
        <Receipt className="mr-2 h-4 w-4" />
        Imprimir Ticket POS ({settings.printer_width || '80mm'})
      </Button>

      <div ref={printRef} className="hidden">
        <div className="receipt">
          {/* Header */}
          <div className="header">
            <div className="shop-name">{settings.shop_name || 'MI TALLER'}</div>
            {settings.shop_phone && <div>{settings.shop_phone}</div>}
          </div>

          <div className="divider"></div>

          {/* Ticket ID & Date */}
          <div className="ticket-id">TICKET: {ticket.id}</div>
          <div style={{ textAlign: 'center', fontSize: '9px' }}>
            {formatDate(ticket.created_at)}
          </div>

          <div className="divider"></div>

          {/* Client Info */}
          <div className="row"><span className="label">Cliente:</span> {ticket.client_name}</div>
          <div className="row"><span className="label">Tel:</span> {ticket.client_phone}</div>

          <div className="divider"></div>

          {/* Equipment Info */}
          <div className="row">
            <span className="label">Equipo:</span> {EQUIPMENT_LABELS[ticket.equipment_type] || ticket.equipment_type}
          </div>
          {ticket.brand && <div className="row"><span className="label">Marca:</span> {ticket.brand}</div>}
          {ticket.model && <div className="row"><span className="label">Modelo:</span> {ticket.model}</div>}
          {ticket.serial_number && <div className="row"><span className="label">S/N:</span> {ticket.serial_number}</div>}

          <div className="divider"></div>

          {/* Problem */}
          <div className="row"><span className="label">PROBLEMA:</span></div>
          <div style={{ fontSize: '9px', marginLeft: '4px' }}>{ticket.problem_description}</div>

          {/* Accessories */}
          {accessories.length > 0 && (
            <>
              <div className="divider"></div>
              <div className="row"><span className="label">ACCESORIOS:</span></div>
              <div className="accessories">
                {accessories.map((acc: string, i: number) => (
                  <div key={i}>- {acc}</div>
                ))}
              </div>
            </>
          )}

          {/* Estimated Delivery */}
          {ticket.estimated_delivery_date && (
            <>
              <div className="divider"></div>
              <div className="row">
                <span className="label">Entrega Est.:</span> {new Date(ticket.estimated_delivery_date).toLocaleDateString('es-HN')}
              </div>
            </>
          )}

          {/* Diagnosis Cost */}
          {ticket.diagnosis_cost > 0 && (
            <div className="row">
              <span className="label">Diagnóstico:</span> L. {ticket.diagnosis_cost.toFixed(2)}
            </div>
          )}

          <div className="divider"></div>

          {/* QR Code */}
          <div className="qr-section">
            <QRCodeSVG value={ticket.id} size={50} />
            <div style={{ fontSize: '8px' }}>Escanear para estado</div>
          </div>

          {/* Footer */}
          <div className="footer">
            <div>Conserve este ticket</div>
            <div>Gracias por su preferencia</div>
          </div>
        </div>
      </div>
    </div>
  )
}
