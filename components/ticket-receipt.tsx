"use client"

import { useRef, useEffect, useState } from "react"
import { Ticket, ShopSettings, EQUIPMENT_LABELS } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Receipt } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"

interface TicketReceiptProps {
  ticket: Ticket
  settings: ShopSettings
  onPrint?: () => void
}

export function TicketReceipt({ ticket, settings, onPrint }: TicketReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>("")

  useEffect(() => {
    const timer = setTimeout(() => {
      const canvas = document.querySelector(`#qr-receipt-${ticket.id.replace(/[^a-zA-Z0-9]/g, '')}`) as HTMLCanvasElement
      if (canvas) {
        setQrDataUrl(canvas.toDataURL('image/png'))
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [ticket.id])

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const width = settings.printer_width === '58mm' ? '58mm' : '80mm'

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
            margin: 1mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial Black', 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: #fff;
            width: 100%;
            font-weight: bold;
          }
          .receipt {
            padding: 2mm;
            width: 100%;
          }
          .header {
            text-align: center;
            margin-bottom: 6px;
          }
          .shop-name {
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .shop-phone {
            font-size: 12px;
            font-weight: bold;
          }
          .divider {
            border-top: 2px dashed #000;
            margin: 6px 0;
          }
          .ticket-id {
            text-align: center;
            font-size: 16px;
            font-weight: 900;
            padding: 4px 0;
          }
          .date {
            text-align: center;
            font-size: 11px;
            font-weight: bold;
          }
          .row {
            margin: 4px 0;
            font-size: 12px;
            font-weight: bold;
          }
          .label {
            font-weight: 900;
            text-transform: uppercase;
          }
          .section-title {
            font-size: 13px;
            font-weight: 900;
            text-transform: uppercase;
            margin-top: 6px;
          }
          .accessories {
            margin-left: 4px;
            font-size: 11px;
            font-weight: bold;
          }
          .qr-section {
            text-align: center;
            margin: 10px 0;
          }
          .qr-section img {
            display: block;
            margin: 0 auto;
          }
          .qr-text {
            font-size: 10px;
            font-weight: bold;
            margin-top: 4px;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            margin-top: 10px;
            padding-top: 6px;
            border-top: 2px dashed #000;
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `)
    doc.close()

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch (e) {
        console.error('Print error:', e)
      }
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe)
        }
      }, 1000)
    }, 250)

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

      {/* Hidden QR Canvas */}
      <div className="hidden">
        <QRCodeCanvas 
          id={`qr-receipt-${ticket.id.replace(/[^a-zA-Z0-9]/g, '')}`}
          value={ticket.id} 
          size={80} 
        />
      </div>

      <div ref={printRef} className="hidden">
        <div className="receipt">
          {/* Header */}
          <div className="header">
            <div className="shop-name">{settings.shop_name || 'MULTIPLANET'}</div>
            {settings.shop_phone && <div className="shop-phone">{settings.shop_phone}</div>}
          </div>

          <div className="divider"></div>

          {/* Ticket ID & Date */}
          <div className="ticket-id">TICKET: {ticket.id}</div>
          <div className="date">{formatDate(ticket.created_at)}</div>

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
          {ticket.device_password && (
            <div className="row"><span className="label">Contraseña:</span> {ticket.device_password}</div>
          )}

          <div className="divider"></div>

          {/* Problem */}
          <div className="section-title">Problema:</div>
          <div className="row">{ticket.problem_description}</div>

          {/* Accessories */}
          {accessories.length > 0 && (
            <>
              <div className="divider"></div>
              <div className="section-title">Accesorios:</div>
              <div className="accessories">
                {accessories.map((acc: string, i: number) => (
                  <div key={i}>• {acc}</div>
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
            {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: '70px', height: '70px' }} />}
            <div className="qr-text">Escanear para estado</div>
          </div>

          {/* Footer */}
          <div className="footer">
            <div>CONSERVE ESTE TICKET</div>
            <div>Gracias por su preferencia</div>
          </div>
        </div>
      </div>
    </div>
  )
}
