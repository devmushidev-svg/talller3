"use client"

import { useRef } from "react"
import { Ticket } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Tags } from "lucide-react"

interface AccessoryLabelsProps {
  ticket: Ticket
  onPrint?: () => void
}

export function AccessoryLabels({ ticket, onPrint }: AccessoryLabelsProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const accessories = typeof ticket.accessories === 'string' 
    ? JSON.parse(ticket.accessories) 
    : ticket.accessories || []

  const handlePrint = () => {
    if (accessories.length === 0) return

    const printContent = printRef.current
    if (!printContent) return

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
        <title>Etiquetas Accesorios - ${ticket.id}</title>
        <style>
          @page {
            size: 58mm auto;
            margin: 1mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial Black', 'Arial', sans-serif;
            font-size: 11px;
            line-height: 1.3;
            color: #000;
            background: #fff;
            width: 100%;
            font-weight: bold;
            padding: 1mm;
          }
          .label {
            width: 100%;
            border: 2px dashed #000;
            padding: 3mm;
            margin-bottom: 3mm;
            page-break-inside: avoid;
          }
          .ticket-id {
            font-weight: 900;
            font-size: 14px;
            text-align: center;
            margin-bottom: 2mm;
            letter-spacing: 1px;
          }
          .accessory {
            font-weight: 900;
            font-size: 13px;
            text-align: center;
            margin-bottom: 2mm;
            text-transform: uppercase;
            padding: 2mm;
            background: #000;
            color: #fff;
          }
          .client {
            font-size: 11px;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
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

  if (accessories.length === 0) return null

  return (
    <div className="space-y-4">
      <Button onClick={handlePrint} variant="outline" className="w-full">
        <Tags className="mr-2 h-4 w-4" />
        Imprimir Etiquetas Accesorios ({accessories.length})
      </Button>

      <div ref={printRef} className="hidden">
        {accessories.map((accessory: string, index: number) => (
          <div key={index} className="label">
            <div className="ticket-id">{ticket.id}</div>
            <div className="accessory">{accessory}</div>
            <div className="client">{ticket.client_name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
