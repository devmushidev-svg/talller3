"use client"

import { useRef } from "react"
import { Ticket, ShopSettings } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

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

    const accessories = typeof ticket.accessories === 'string' 
      ? JSON.parse(ticket.accessories) 
      : ticket.accessories || []

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orden de Trabajo - ${ticket.id}</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: #fff;
          }
          .ticket-container {
            max-width: 180mm;
            margin: 0 auto;
            border: 2px solid #000;
            padding: 8mm;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .shop-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .shop-info {
            font-size: 11px;
          }
          .title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 12px 0;
            padding: 8px 0;
            border-bottom: 1px solid #000;
          }
          .order-title {
            font-size: 16px;
            font-weight: bold;
          }
          .order-number {
            font-size: 20px;
            font-weight: bold;
            color: #c00;
          }
          .date-box {
            display: flex;
            gap: 4px;
            font-size: 11px;
          }
          .date-cell {
            border: 1px solid #000;
            padding: 4px 8px;
            text-align: center;
            min-width: 40px;
          }
          .date-cell span {
            display: block;
            font-size: 9px;
            border-bottom: 1px solid #000;
            margin-bottom: 2px;
          }
          .field-row {
            display: flex;
            margin: 8px 0;
            align-items: baseline;
          }
          .field-label {
            font-weight: bold;
            min-width: 80px;
          }
          .field-value {
            flex: 1;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
            min-height: 18px;
          }
          .checkbox-row {
            display: flex;
            gap: 16px;
            margin: 8px 0;
            flex-wrap: wrap;
          }
          .checkbox-item {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .checkbox {
            width: 14px;
            height: 14px;
            border: 1px solid #000;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          }
          .checkbox.checked::after {
            content: "✓";
            font-weight: bold;
          }
          .section-title {
            font-weight: bold;
            margin-top: 12px;
          }
          .text-area {
            border: 1px solid #000;
            min-height: 50px;
            padding: 4px;
            margin: 4px 0;
          }
          .footer-row {
            display: flex;
            gap: 16px;
            margin-top: 16px;
          }
          .footer-box {
            flex: 1;
            border: 1px solid #000;
            padding: 8px;
            min-height: 60px;
          }
          .footer-box-label {
            font-size: 10px;
            font-weight: bold;
            border-bottom: 1px solid #000;
            margin-bottom: 4px;
            padding-bottom: 2px;
          }
          .disclaimer {
            font-size: 9px;
            text-align: center;
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px solid #000;
          }
          .qr-section {
            text-align: center;
            margin-top: 8px;
          }
          .qr-section svg {
            width: 60px;
            height: 60px;
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
        Imprimir Ticket Cliente (A4)
      </Button>

      <div ref={printRef} className="hidden">
        <div className="ticket-container">
          {/* Header */}
          <div className="header">
            <div className="shop-name">{settings.shop_name || 'MI TALLER'}</div>
            <div className="shop-info">
              {settings.shop_address && <div>{settings.shop_address}</div>}
              {settings.shop_phone && <div>Tel: {settings.shop_phone}</div>}
            </div>
          </div>

          {/* Title Row */}
          <div className="title-row">
            <div>
              <div className="order-title">ORDEN DE TRABAJO</div>
              <div className="order-number">N° {ticket.id}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', marginBottom: '4px' }}>FECHA DE RECIBO</div>
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
            <span className="field-label">Celular:</span>
            <span className="field-value">{ticket.client_phone}</span>
          </div>

          {/* Equipment Type */}
          <div className="checkbox-row" style={{ marginTop: '12px' }}>
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
              <span>Otro: {!['computadora', 'laptop', 'impresora', 'monitor'].includes(ticket.equipment_type) ? ticket.equipment_type : '_______'}</span>
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
          {ticket.serial_number && (
            <div className="field-row">
              <span className="field-label">Serie:</span>
              <span className="field-value">{ticket.serial_number}</span>
            </div>
          )}

          {/* Accessories */}
          <div className="section-title">Accesorios:</div>
          <div className="checkbox-row">
            {allAccessories.map(acc => (
              <div key={acc} className="checkbox-item">
                <span className={`checkbox ${accessories.includes(acc) ? 'checked' : ''}`}></span>
                <span>{acc}</span>
              </div>
            ))}
          </div>
          {accessories.filter((a: string) => !allAccessories.includes(a)).length > 0 && (
            <div className="field-row">
              <span className="field-label">Otros:</span>
              <span className="field-value">
                {accessories.filter((a: string) => !allAccessories.includes(a)).join(', ')}
              </span>
            </div>
          )}

          {/* Work Description */}
          <div className="section-title">Trabajos a Realizar:</div>
          <div className="text-area">{ticket.problem_description}</div>

          {/* Estimated Delivery */}
          {ticket.estimated_delivery_date && (
            <div className="field-row">
              <span className="field-label">Fecha Estimada de Entrega:</span>
              <span className="field-value">
                {new Date(ticket.estimated_delivery_date).toLocaleDateString('es-HN')}
              </span>
            </div>
          )}

          {/* Footer Boxes */}
          <div className="footer-row">
            <div className="footer-box">
              <div className="footer-box-label">COSTO DIAGNÓSTICO</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                {ticket.diagnosis_cost ? `L. ${ticket.diagnosis_cost.toFixed(2)}` : '___________'}
              </div>
            </div>
            <div className="footer-box">
              <div className="footer-box-label">RECIBIDO POR</div>
            </div>
            <div className="footer-box">
              <div className="footer-box-label">CONTRASEÑA EQUIPO</div>
            </div>
          </div>

          {/* QR Code */}
          <div className="qr-section">
            <QRCodeSVG value={ticket.id} size={60} />
            <div style={{ fontSize: '8px', marginTop: '4px' }}>Escanear para verificar estado</div>
          </div>

          {/* Disclaimer */}
          <div className="disclaimer">
            <strong>Nota:</strong> La empresa no se hace responsable por equipos con más de 45 días sin reclamar desde la fecha de ingreso.<br/>
            PARA RECLAMO DE SU ARTÍCULO PRESENTAR ESTE COMPROBANTE.
          </div>
        </div>
      </div>
    </div>
  )
}
