"use client"

import { useRef } from "react"
import { Ticket, ShopSettings } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface CustomerTicketProps {
  ticket: Ticket
  settings: ShopSettings
  onPrint?: () => void
}

export function CustomerTicket({ ticket, settings, onPrint }: CustomerTicketProps) {
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
        <title>Orden de Trabajo - ${ticket.id}</title>
        <style>
          @page {
            size: half-letter portrait;
            margin: 5mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.3;
            color: #000;
            background: #fff;
          }
          .ticket-container {
            max-width: 140mm;
            margin: 0 auto;
            border: 2px solid #000;
            padding: 5mm;
          }
          .header {
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 2px solid #000;
            padding-bottom: 6px;
            margin-bottom: 6px;
          }
          .logo {
            width: 50px;
            height: 50px;
            object-fit: contain;
          }
          .header-text {
            flex: 1;
          }
          .shop-name {
            font-size: 22px;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .shop-info {
            font-size: 10px;
          }
          .title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 8px 0;
            padding-bottom: 6px;
            border-bottom: 1px solid #000;
          }
          .order-title {
            font-size: 13px;
            font-weight: bold;
          }
          .order-number {
            font-size: 18px;
            font-weight: bold;
            color: #c00;
          }
          .date-box {
            display: flex;
            gap: 3px;
            font-size: 10px;
          }
          .date-cell {
            border: 1px solid #000;
            padding: 2px 6px;
            text-align: center;
            min-width: 32px;
          }
          .date-cell span {
            display: block;
            font-size: 8px;
            border-bottom: 1px solid #000;
            margin-bottom: 1px;
          }
          .field-row {
            display: flex;
            margin: 5px 0;
            align-items: baseline;
          }
          .field-label {
            font-weight: bold;
            min-width: 65px;
            font-size: 10px;
          }
          .field-value {
            flex: 1;
            border-bottom: 1px solid #000;
            padding-bottom: 1px;
            min-height: 14px;
          }
          .checkbox-row {
            display: flex;
            gap: 10px;
            margin: 6px 0;
            flex-wrap: wrap;
          }
          .checkbox-item {
            display: flex;
            align-items: center;
            gap: 3px;
            font-size: 10px;
          }
          .checkbox {
            width: 12px;
            height: 12px;
            border: 1px solid #000;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
          }
          .checkbox.checked::after {
            content: "✓";
            font-weight: bold;
          }
          .section-title {
            font-weight: bold;
            margin-top: 8px;
            font-size: 10px;
          }
          .text-area {
            border: 1px solid #000;
            min-height: 35px;
            padding: 3px;
            margin: 3px 0;
            font-size: 10px;
          }
          .footer-row {
            display: flex;
            gap: 8px;
            margin-top: 10px;
          }
          .footer-box {
            flex: 1;
            border: 1px solid #000;
            padding: 4px;
            min-height: 40px;
          }
          .footer-box-label {
            font-size: 8px;
            font-weight: bold;
            border-bottom: 1px solid #000;
            margin-bottom: 2px;
            padding-bottom: 1px;
          }
          .disclaimer {
            font-size: 8px;
            text-align: center;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px solid #000;
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

  const accessories = typeof ticket.accessories === 'string' 
    ? JSON.parse(ticket.accessories) 
    : ticket.accessories || []

  const createdDate = new Date(ticket.created_at || Date.now())
  const day = createdDate.getDate().toString().padStart(2, '0')
  const month = (createdDate.getMonth() + 1).toString().padStart(2, '0')
  const year = createdDate.getFullYear().toString().slice(-2)

  const allAccessories = [
    'Cargador', 'Cable USB', 'Cable Energía', 'Maletín', 'Monitor', 'CPU', 'Mouse', 'Teclado'
  ]

  return (
    <div className="space-y-4">
      <Button onClick={handlePrint} className="w-full">
        <Printer className="mr-2 h-4 w-4" />
        Imprimir Orden de Trabajo
      </Button>

      <div ref={printRef} className="hidden">
        <div className="ticket-container">
          {/* Header with Logo */}
          <div className="header">
            <img src="/logo-multiplanet.png" alt="Multiplanet" className="logo" />
            <div className="header-text">
              <div className="shop-name">MULTIPLANET</div>
              <div className="shop-info">
                B° El Centro, Contiguo A Edificio Makelo, Tocoa, Colón.<br/>
                Cel.: 3171-3287 * 9647-3966 E-mail: multiplanettocoa@yahoo.com
              </div>
            </div>
          </div>

          {/* Title Row */}
          <div className="title-row">
            <div>
              <div className="order-title">ORDEN DE TRABAJO</div>
              <div className="order-number">N° {ticket.id}</div>
            </div>
            <div>
              <div style={{ fontSize: '9px', marginBottom: '3px' }}>FECHA DE RECIBO</div>
              <div className="date-box">
                <div className="date-cell">
                  <span>DÍA</span>
                  {day}
                </div>
                <div className="date-cell">
                  <span>MES</span>
                  {month}
                </div>
                <div className="date-cell">
                  <span>AÑO</span>
                  {year}
                </div>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="field-row">
            <span className="field-label">Cliente:</span>
            <span className="field-value">{ticket.client_name}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Dirección:</span>
            <span className="field-value"></span>
          </div>
          <div className="field-row">
            <span className="field-label">Celular:</span>
            <span className="field-value">{ticket.client_phone}</span>
          </div>

          {/* Equipment Type */}
          <div className="checkbox-row" style={{ marginTop: '8px' }}>
            <div className="checkbox-item">
              <span className={`checkbox ${ticket.equipment_type === 'computadora' ? 'checked' : ''}`}></span>
              <span>Computadora</span>
            </div>
            <div className="checkbox-item">
              <span className={`checkbox ${ticket.equipment_type === 'laptop' ? 'checked' : ''}`}></span>
              <span>Laptop</span>
            </div>
            <div className="checkbox-item">
              <span className={`checkbox ${ticket.equipment_type === 'impresora' ? 'checked' : ''}`}></span>
              <span>Impresora</span>
            </div>
            <div className="checkbox-item">
              <span className={`checkbox ${ticket.equipment_type === 'monitor' ? 'checked' : ''}`}></span>
              <span>Monitor</span>
            </div>
            <div className="checkbox-item">
              <span className={`checkbox ${!['computadora', 'laptop', 'impresora', 'monitor'].includes(ticket.equipment_type) ? 'checked' : ''}`}></span>
              <span>Otro</span>
            </div>
          </div>

          {/* Brand & Model */}
          <div className="field-row">
            <span className="field-label">Marca:</span>
            <span className="field-value">{ticket.brand || ''}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Modelo:</span>
            <span className="field-value">{ticket.model || ''}</span>
          </div>

          {/* Accessories */}
          <div className="checkbox-row">
            {allAccessories.slice(0, 6).map(acc => (
              <div key={acc} className="checkbox-item">
                <span className={`checkbox ${accessories.includes(acc) ? 'checked' : ''}`}></span>
                <span>{acc}</span>
              </div>
            ))}
          </div>
          <div className="field-row">
            <span className="field-label">Otro:</span>
            <span className="field-value">
              {accessories.filter((a: string) => !allAccessories.slice(0, 6).includes(a)).join(', ')}
            </span>
          </div>

          {/* Work Description */}
          <div className="section-title">Trabajos a Realizar:</div>
          <div className="text-area">{ticket.problem_description}</div>

          {/* Observations */}
          <div className="section-title">Observaciones:</div>
          <div className="text-area"></div>

          {/* Footer Boxes */}
          <div className="footer-row">
            <div className="footer-box">
              <div className="footer-box-label">TOTAL A PAGAR</div>
            </div>
            <div className="footer-box">
              <div className="footer-box-label">Recibido por:</div>
            </div>
            <div className="footer-box">
              <div className="footer-box-label">Escriba su contraseña</div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="disclaimer">
            <strong>Nota:</strong> La empresa no se hace responsable por equipos con más de 45 días<br/>
            sin reclamar desde la fecha de ingreso.<br/>
            <strong>PARA RECLAMO DE SU ARTÍCULO PRESENTAR FACTURA CORRESPONDIENTE.</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
