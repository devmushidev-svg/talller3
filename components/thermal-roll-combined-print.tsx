"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react"
import { QRCodeCanvas } from "qrcode.react"
import type { Ticket, ShopSettings } from "@/lib/types"
import { EQUIPMENT_LABELS } from "@/lib/types"

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function formatReceiptDate(dateStr?: string) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleString("es-HN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export type ThermalRollCombinedHandle = {
  /** Una sola cola de impresión: POS, etiqueta equipo, cada accesorio — página separada para cortar. */
  printThermalRoll: () => void
}

type Props = {
  ticket: Ticket
  settings: ShopSettings
}

export const ThermalRollCombinedPrint = forwardRef<ThermalRollCombinedHandle, Props>(
  function ThermalRollCombinedPrint({ ticket, settings }, ref) {
    const safeId = ticket.id.replace(/[^a-zA-Z0-9]/g, "")
    const [qrReceipt, setQrReceipt] = useState("")
    const [qrDevice, setQrDevice] = useState("")

    useEffect(() => {
      const t = setTimeout(() => {
        const c1 = document.querySelector(
          `#qr-thermal-roll-rec-${safeId}`
        ) as HTMLCanvasElement | null
        const c2 = document.querySelector(
          `#qr-thermal-roll-dev-${safeId}`
        ) as HTMLCanvasElement | null
        if (c1) setQrReceipt(c1.toDataURL("image/png"))
        if (c2) setQrDevice(c2.toDataURL("image/png"))
      }, 180)
      return () => clearTimeout(t)
    }, [safeId, ticket.id])

    const printThermalRoll = useCallback(() => {
      const width = settings.printer_width === "58mm" ? "58mm" : "80mm"
      const accessories =
        typeof ticket.accessories === "string"
          ? JSON.parse(ticket.accessories)
          : ticket.accessories || []
      const accList = Array.isArray(accessories) ? accessories : []

      const shopName = escapeHtml(settings.shop_name || "MULTIPLANET")
      const shopPhone = settings.shop_phone
        ? escapeHtml(settings.shop_phone)
        : ""
      const receiptPhone = shopPhone
        ? `<div class="shop-phone">${shopPhone}</div>`
        : ""

      const ticketLine = escapeHtml(
        ticket.ticket_seq != null ? String(ticket.ticket_seq) : ticket.id
      )
      const ticketIdFull = escapeHtml(ticket.id)

      const receiptBody = `
        <div class="receipt">
          <div class="header">
            <div class="shop-name">${shopName}</div>
            ${receiptPhone}
          </div>
          <div class="divider"></div>
          <div class="ticket-id">TICKET: ${ticketLine}</div>
          <div class="date sub-id">${ticketIdFull}</div>
          <div class="date">${formatReceiptDate(ticket.created_at)}</div>
          <div class="divider"></div>
          <div class="row"><span class="label">Cliente:</span> ${escapeHtml(ticket.client_name)}</div>
          <div class="row"><span class="label">Tel:</span> ${escapeHtml(ticket.client_phone)}</div>
          <div class="divider"></div>
          <div class="row"><span class="label">Equipo:</span> ${escapeHtml(
            EQUIPMENT_LABELS[ticket.equipment_type] || ticket.equipment_type
          )}</div>
          ${ticket.brand ? `<div class="row"><span class="label">Marca:</span> ${escapeHtml(ticket.brand)}</div>` : ""}
          ${ticket.model ? `<div class="row"><span class="label">Modelo:</span> ${escapeHtml(ticket.model)}</div>` : ""}
          ${ticket.serial_number ? `<div class="row"><span class="label">S/N:</span> ${escapeHtml(ticket.serial_number)}</div>` : ""}
          ${ticket.device_password ? `<div class="row"><span class="label">Contraseña:</span> ${escapeHtml(ticket.device_password)}</div>` : ""}
          <div class="divider"></div>
          <div class="section-title">Problema:</div>
          <div class="row">${escapeHtml(ticket.problem_description)}</div>
          ${
            accList.length > 0
              ? `<div class="divider"></div>
          <div class="section-title">Accesorios:</div>
          <div class="accessories">${accList
            .map((acc: string) => `<div>• ${escapeHtml(acc)}</div>`)
            .join("")}</div>`
              : ""
          }
          ${
            ticket.estimated_delivery_date
              ? `<div class="divider"></div>
          <div class="row"><span class="label">Entrega Est.:</span> ${escapeHtml(
            new Date(ticket.estimated_delivery_date).toLocaleDateString("es-HN")
          )}</div>`
              : ""
          }
          ${
            ticket.diagnosis_cost && ticket.diagnosis_cost > 0
              ? `<div class="row"><span class="label">Diagnóstico:</span> L. ${ticket.diagnosis_cost.toFixed(2)}</div>`
              : ""
          }
          <div class="divider"></div>
          <div class="qr-section">
            ${qrReceipt ? `<img src="${qrReceipt}" alt="QR" style="width:70px;height:70px" />` : ""}
            <div class="qr-text">Escanear para estado</div>
          </div>
          <div class="footer">
            <div>CONSERVE ESTE TICKET</div>
            <div>Gracias por su preferencia</div>
          </div>
        </div>`

      const devDate = new Date(ticket.created_at || Date.now()).toLocaleDateString("es-HN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })

      const deviceBody = `
        <div class="dev-label">
          <div class="dev-header">${shopName}</div>
          <div class="qr-section">
            ${qrDevice ? `<img src="${qrDevice}" alt="QR" style="width:80px;height:80px" />` : ""}
          </div>
          <div class="dev-ticket-id">${ticketIdFull}</div>
          <div class="divider-dashed"></div>
          <div class="client-name">${escapeHtml(ticket.client_name.toUpperCase())}</div>
          <div class="device-info">
            ${ticket.brand ? escapeHtml(ticket.brand.toUpperCase()) + " " : ""}
            ${ticket.model ? escapeHtml(ticket.model.toUpperCase()) : ""}
          </div>
          <div class="dev-date">${escapeHtml(devDate)}</div>
          <div class="divider-dashed"></div>
        </div>`

      const rollPages = `
        <div class="thermal-page">${receiptBody}</div>
        <div class="thermal-page">${deviceBody}</div>
        ${accList
          .map(
            (acc: string) => `<div class="thermal-page">
        <div class="acc-label">
          <div class="acc-ticket-id">${ticketIdFull}</div>
          <div class="acc-name">${escapeHtml(acc)}</div>
          <div class="acc-client">${escapeHtml(ticket.client_name)}</div>
        </div>
      </div>`
          )
          .join("")}`

      const css = `
          @page { size: ${width} auto; margin: 1mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Arial Black', 'Arial', sans-serif;
            color: #000;
            background: #fff;
            font-weight: bold;
          }
          .thermal-page {
            page-break-after: always;
            break-after: page;
            padding-bottom: 2mm;
          }
          .thermal-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          /* ——— Recibo POS ——— */
          .receipt { padding: 2mm; width: 100%; font-size: 12px; line-height: 1.4; }
          .receipt .header { text-align: center; margin-bottom: 6px; }
          .receipt .shop-name { font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
          .receipt .shop-phone { font-size: 12px; font-weight: bold; }
          .receipt .divider { border-top: 2px dashed #000; margin: 6px 0; }
          .receipt .ticket-id { text-align: center; font-size: 16px; font-weight: 900; padding: 4px 0; }
          .receipt .sub-id { text-align: center; font-size: 9px; font-weight: bold; margin-top: -2px; }
          .receipt .date { text-align: center; font-size: 11px; font-weight: bold; }
          .receipt .row { margin: 4px 0; font-size: 12px; font-weight: bold; }
          .receipt .label { font-weight: 900; text-transform: uppercase; }
          .receipt .section-title { font-size: 13px; font-weight: 900; text-transform: uppercase; margin-top: 6px; }
          .receipt .accessories { margin-left: 4px; font-size: 11px; font-weight: bold; }
          .receipt .qr-section { text-align: center; margin: 10px 0; }
          .receipt .qr-text { font-size: 10px; font-weight: bold; margin-top: 4px; }
          .receipt .footer { text-align: center; font-size: 11px; font-weight: bold; margin-top: 10px; padding-top: 6px; border-top: 2px dashed #000; }
          /* ——— Etiqueta equipo ——— */
          .dev-label { width: 100%; padding: 2mm; border: 2px dashed #000; font-size: 12px; }
          .dev-header { text-align: center; font-size: 14px; font-weight: 900; text-transform: uppercase;
            border-bottom: 2px dashed #000; padding-bottom: 3mm; margin-bottom: 3mm; }
          .dev-label .qr-section { text-align: center; margin: 4mm 0; }
          .dev-ticket-id { text-align: center; font-size: 18px; font-weight: 900; margin: 4mm 0; letter-spacing: 1px; }
          .divider-dashed { border-top: 2px dashed #000; margin: 3mm 0; }
          .client-name { font-size: 14px; font-weight: 900; text-align: center; text-transform: uppercase; margin-bottom: 2mm; }
          .device-info { font-size: 12px; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 2mm; }
          .dev-date { font-size: 11px; font-weight: bold; text-align: center; }
          /* ——— Etiqueta accesorio ——— */
          .acc-label { width: 100%; border: 2px dashed #000; padding: 3mm; margin: 0; page-break-inside: avoid; }
          .acc-ticket-id { font-weight: 900; font-size: 14px; text-align: center; margin-bottom: 2mm; letter-spacing: 1px; }
          .acc-name { font-weight: 900; font-size: 13px; text-align: center; margin-bottom: 2mm; text-transform: uppercase;
            padding: 2mm; background: #000; color: #fff; }
          .acc-client { font-size: 11px; font-weight: bold; text-align: center; text-transform: uppercase; }
      `

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Térmica ${ticket.id}</title><style>${css}</style></head><body>${rollPages}</body></html>`

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
      doc.write(html)
      doc.close()

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
        } catch (e) {
          console.error("Print error:", e)
        }
        setTimeout(() => {
          if (iframe.parentNode) document.body.removeChild(iframe)
        }, 1000)
      }, 280)
    }, [ticket, settings, qrReceipt, qrDevice])

    useImperativeHandle(ref, () => ({ printThermalRoll }), [printThermalRoll])

    return (
      <div className="hidden" aria-hidden>
        <QRCodeCanvas id={`qr-thermal-roll-rec-${safeId}`} value={ticket.id} size={80} />
        <QRCodeCanvas id={`qr-thermal-roll-dev-${safeId}`} value={ticket.id} size={100} />
      </div>
    )
  }
)
