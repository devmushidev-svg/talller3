"use client"

import { useRef } from "react"
import { Ticket, ShopSettings } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Tag } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

interface DeviceLabelProps {
  ticket: Ticket
  settings: ShopSettings
  onPrint?: () => void
}

export function DeviceLabel({ ticket, settings, onPrint }: DeviceLabelProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etiqueta - ${ticket.id}</title>
        <style>
          @page {
            size: 58mm auto;
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
          }
          .label {
            width: 48mm;
            max-width: 48mm;
            padding: 2mm;
            border: 1px dashed #000;
          }
          .header {
            text-align: center;
            font-size: 8px;
            font-weight: bold;
            border-bottom: 1px dashed #000;
            padding-bottom: 2mm;
            margin-bottom: 2mm;
          }
          .qr-section {
            text-align: center;
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
        ${printContent.innerHTML}
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)

    onPrint?.()
  }

  const formattedDate = new Date(ticket.created_at || Date.now()).toLocaleDateString('es-HN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  return (
    <div className="space-y-4">
      <Button onClick={handlePrint} variant="outline" className="w-full">
        <Tag className="mr-2 h-4 w-4" />
        Imprimir Etiqueta Equipo
      </Button>

      <div ref={printRef} className="hidden">
        <div className="label">
          <div className="header">{settings.shop_name || 'MI TALLER'}</div>
          
          <div className="qr-section">
            <QRCodeSVG value={ticket.id} size={50} />
          </div>
          
          <div className="ticket-id">{ticket.id}</div>
          
          <div className="divider"></div>
          
          <div className="client-name">{ticket.client_name.toUpperCase()}</div>
          
          <div className="device-info">
            {ticket.brand && <span>{ticket.brand.toUpperCase()} </span>}
            {ticket.model && <span>{ticket.model.toUpperCase()}</span>}
          </div>
          
          <div className="date">{formattedDate}</div>
          
          <div className="divider"></div>
        </div>
      </div>
    </div>
  )
}
