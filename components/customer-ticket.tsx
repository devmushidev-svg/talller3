"use client"

import { forwardRef, useCallback, useImperativeHandle, useRef } from "react"
import { formatDateOnlyForDisplay } from "@/lib/date-utils"
import {
  Ticket,
  ShopSettings,
  ACCESSORY_CHECKBOX_LABELS,
  accessoryMatchesCheckbox,
  isStandardAccessoryStored,
} from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export type CustomerTicketHandle = { print: () => void }

interface CustomerTicketProps {
  ticket: Ticket
  settings: ShopSettings
  onPrint?: () => void
  /** Ocultar el botón (p. ej. impresión en lote) */
  hideTrigger?: boolean
}

function formatPrintDate(iso?: string | null) {
  return formatDateOnlyForDisplay(iso, "es-HN")
}

export const CustomerTicket = forwardRef<CustomerTicketHandle, CustomerTicketProps>(
  function CustomerTicket({ ticket, settings, onPrint, hideTrigger = false }, ref) {
  const printRef = useRef<HTMLDivElement>(null)

  const displayTicketNumber =
    ticket.ticket_seq != null ? String(ticket.ticket_seq) : ticket.id

  const receivedByName = ticket.received_by?.trim() || "Mario"

  const shopAddress =
    settings.shop_address?.trim() ||
    "B° El Centro, Contiguo A Edificio Makelo, Tocoa, Colón."

  const shopPhonesLine =
    settings.shop_phone?.trim() || "3171-3287 · 9647-3966"

  const handlePrint = useCallback(() => {
    const printContent = printRef.current
    if (!printContent) return

    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "none"
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
        <title>Ticket N° ${displayTicketNumber}</title>
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
            line-height: 1.35;
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
            margin-bottom: 8px;
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
          .shop-address {
            font-size: 10px;
            margin-top: 2px;
          }
          .shop-phones {
            font-size: 14px;
            font-weight: bold;
            margin-top: 5px;
            letter-spacing: 0.3px;
          }
          .title-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 10px;
            margin: 8px 0;
            padding-bottom: 8px;
            border-bottom: 1px solid #000;
          }
          .ticket-num-wrap {
            flex: 1;
          }
          .ticket-num-label {
            font-size: 11px;
            font-weight: bold;
          }
          .ticket-num-value {
            font-size: 28px;
            font-weight: bold;
            color: #c00;
            line-height: 1.1;
            margin-top: 2px;
          }
          .dates-block {
            text-align: right;
            font-size: 11px;
            line-height: 1.5;
          }
          .dates-block strong {
            display: inline-block;
            min-width: 118px;
            text-align: left;
          }
          .field-row {
            display: flex;
            margin: 5px 0;
            align-items: baseline;
          }
          .field-label {
            font-weight: bold;
            min-width: 72px;
            font-size: 10px;
          }
          .field-value {
            flex: 1;
            border-bottom: 1px solid #000;
            padding-bottom: 1px;
            min-height: 14px;
          }
          .client-phone-value {
            font-size: 15px;
            font-weight: bold;
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
            gap: 10px;
            margin-top: 12px;
          }
          .footer-box {
            flex: 1;
            border: 1px solid #000;
            padding: 6px;
            min-height: 48px;
          }
          .footer-box-label {
            font-size: 9px;
            font-weight: bold;
            border-bottom: 1px solid #000;
            margin-bottom: 6px;
            padding-bottom: 2px;
          }
          .footer-received-name {
            font-size: 13px;
            font-weight: bold;
          }
          .disclaimer {
            font-size: 8px;
            text-align: center;
            margin-top: 10px;
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
    doc.close()

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch (e) {
        console.error("Print error:", e)
      }
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe)
        }
      }, 1000)
    }, 250)

    onPrint?.()
  }, [ticket, settings, onPrint, displayTicketNumber, receivedByName, shopAddress, shopPhonesLine])

  useImperativeHandle(ref, () => ({ print: handlePrint }), [handlePrint])

  const accessories =
    typeof ticket.accessories === "string"
      ? JSON.parse(ticket.accessories)
      : ticket.accessories || []

  const customAccessoriesText = accessories
    .filter((a: string) => !isStandardAccessoryStored(a))
    .join(", ")

  const emissionDate = formatPrintDate(ticket.created_at)
  const expectedDate = formatPrintDate(ticket.estimated_delivery_date)

  return (
    <div className="space-y-4">
      {!hideTrigger && (
        <Button onClick={handlePrint} className="w-full">
          <Printer className="mr-2 h-4 w-4" />
          Imprimir comprobante
        </Button>
      )}

      <div ref={printRef} className="hidden">
        <div className="ticket-container">
          <div className="header">
            <img src="/logo-multiplanet.png" alt="Multiplanet" className="logo" />
            <div className="header-text">
              <div className="shop-name">{settings.shop_name?.trim() || "MULTIPLANET"}</div>
              <div className="shop-address">{shopAddress}</div>
              <div className="shop-phones">{shopPhonesLine}</div>
            </div>
          </div>

          <div className="title-row">
            <div className="ticket-num-wrap">
              <div className="ticket-num-label">Ticket N°</div>
              <div className="ticket-num-value">{displayTicketNumber}</div>
            </div>
            <div className="dates-block">
              <div>
                <strong>Fecha de emisión:</strong> {emissionDate}
              </div>
              <div>
                <strong>Entrega estimada:</strong> {expectedDate}
              </div>
            </div>
          </div>

          <div className="field-row">
            <span className="field-label">Cliente:</span>
            <span className="field-value">{ticket.client_name}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Celular:</span>
            <span className="field-value client-phone-value">{ticket.client_phone}</span>
          </div>

          <div className="checkbox-row" style={{ marginTop: "8px" }}>
            <div className="checkbox-item">
              <span
                className={`checkbox ${ticket.equipment_type === "computadora" ? "checked" : ""}`}
              ></span>
              <span>Computadora</span>
            </div>
            <div className="checkbox-item">
              <span
                className={`checkbox ${ticket.equipment_type === "laptop" ? "checked" : ""}`}
              ></span>
              <span>Laptop</span>
            </div>
            <div className="checkbox-item">
              <span
                className={`checkbox ${ticket.equipment_type === "impresora" ? "checked" : ""}`}
              ></span>
              <span>Impresora</span>
            </div>
            <div className="checkbox-item">
              <span
                className={`checkbox ${ticket.equipment_type === "monitor" ? "checked" : ""}`}
              ></span>
              <span>Monitor</span>
            </div>
            <div className="checkbox-item">
              <span
                className={`checkbox ${!["computadora", "laptop", "impresora", "monitor"].includes(ticket.equipment_type) ? "checked" : ""}`}
              ></span>
              <span>Otro</span>
            </div>
          </div>

          <div className="field-row">
            <span className="field-label">Marca:</span>
            <span className="field-value">{ticket.brand || ""}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Modelo:</span>
            <span className="field-value">{ticket.model || ""}</span>
          </div>
          {ticket.device_password && (
            <div className="field-row">
              <span className="field-label">Contraseña:</span>
              <span className="field-value" style={{ fontFamily: "monospace" }}>
                {ticket.device_password}
              </span>
            </div>
          )}

          <div className="checkbox-row">
            {ACCESSORY_CHECKBOX_LABELS.map((acc) => (
              <div key={acc} className="checkbox-item">
                <span
                  className={`checkbox ${
                    accessories.some((a: string) => accessoryMatchesCheckbox(a, acc))
                      ? "checked"
                      : ""
                  }`}
                ></span>
                <span>{acc}</span>
              </div>
            ))}
          </div>
          <div className="field-row">
            <span className="field-label">Otro:</span>
            <span className="field-value">{customAccessoriesText}</span>
          </div>

          <div className="section-title">Trabajos a Realizar:</div>
          <div className="text-area">{ticket.problem_description}</div>

          <div className="section-title">Observaciones:</div>
          <div className="text-area"></div>

          <div className="footer-row">
            <div className="footer-box">
              <div className="footer-box-label">TOTAL A PAGAR</div>
            </div>
            <div className="footer-box">
              <div className="footer-box-label">Recibido por</div>
              <div className="footer-received-name">{receivedByName}</div>
            </div>
          </div>

          <div className="disclaimer">
            <strong>Nota:</strong> La empresa no se hace responsable por equipos con más de 45
            días
            <br />
            sin reclamar desde la fecha de ingreso.
            <br />
            <strong>PARA RECLAMO DE SU ARTÍCULO PRESENTAR FACTURA CORRESPONDIENTE.</strong>
          </div>
        </div>
      </div>
    </div>
  )
})
