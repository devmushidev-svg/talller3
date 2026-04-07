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
import {
  ACCESSORY_CHECKBOX_LABELS,
  EQUIPMENT_LABELS,
  accessoryMatchesCheckbox,
  isStandardAccessoryStored,
} from "@/lib/types"

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

function formatPrintDateOnly(iso?: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-HN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export type ThermalRollCombinedHandle = {
  /**
   * Varios cuadros de impresión seguidos (un bloque por trabajo): comprobante → POS → equipo → cada accesorio.
   * Muchas térmicas no cortan con `page-break`; trabajos separados suelen disparar corte/avance.
   */
  printThermalRoll: () => Promise<void>
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

    const printThermalRoll = useCallback(async () => {
      const width = settings.printer_width === "58mm" ? "58mm" : "80mm"
      const accessories =
        typeof ticket.accessories === "string"
          ? JSON.parse(ticket.accessories)
          : ticket.accessories || []
      const accList = Array.isArray(accessories) ? accessories : []

      const receivedByName = escapeHtml(ticket.received_by?.trim() || "Mario")
      const shopAddress = escapeHtml(
        settings.shop_address?.trim() ||
          "B° El Centro, Contiguo A Edificio Makelo, Tocoa, Colón."
      )
      const shopPhonesLine = escapeHtml(
        settings.shop_phone?.trim() || "3171-3287 · 9647-3966"
      )
      const displayTicketNumber = escapeHtml(
        ticket.ticket_seq != null ? String(ticket.ticket_seq) : ticket.id
      )
      const emissionDate = escapeHtml(formatPrintDateOnly(ticket.created_at))
      const expectedDate = escapeHtml(formatPrintDateOnly(ticket.estimated_delivery_date))
      const customAccText = escapeHtml(
        accList.filter((a: string) => !isStandardAccessoryStored(a)).join(", ")
      )
      const isOtherEq = !["computadora", "laptop", "impresora", "monitor"].includes(
        ticket.equipment_type
      )
      const accBoxesHtml = ACCESSORY_CHECKBOX_LABELS.map((acc) => {
        const on = accList.some((a: string) => accessoryMatchesCheckbox(a, acc))
        return `<span class="cust-acc-item">${on ? "✓" : "·"} ${escapeHtml(acc)}</span>`
      }).join("")

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

      const customerThermalBody = `
        <div class="customer-roll">
          <div class="cust-header">
            <img class="cust-logo" src="/logo-multiplanet.png" alt="" />
            <div class="cust-head-text">
              <div class="cust-shop">${shopName}</div>
              <div class="cust-addr">${shopAddress}</div>
              <div class="cust-phones">${shopPhonesLine}</div>
            </div>
          </div>
          <div class="cust-divider"></div>
          <div class="cust-title-block">
            <div class="cust-ticket-lbl">COMPROBANTE — Ticket N°</div>
            <div class="cust-ticket-num">${displayTicketNumber}</div>
            <div class="cust-dates">
              <div><span class="cust-dk">Emisión:</span> ${emissionDate}</div>
              <div><span class="cust-dk">Entrega est.:</span> ${expectedDate}</div>
            </div>
          </div>
          <div class="cust-row"><span class="cust-k">Cliente:</span> ${escapeHtml(ticket.client_name)}</div>
          <div class="cust-row"><span class="cust-k">Celular:</span> ${escapeHtml(ticket.client_phone)}</div>
          <div class="cust-eq-line">
            <span>${ticket.equipment_type === "computadora" ? "✓" : "·"} PC</span>
            <span>${ticket.equipment_type === "laptop" ? "✓" : "·"} Laptop</span>
            <span>${ticket.equipment_type === "impresora" ? "✓" : "·"} Impresora</span>
            <span>${ticket.equipment_type === "monitor" ? "✓" : "·"} Monitor</span>
            <span>${isOtherEq ? "✓" : "·"} Otro</span>
          </div>
          <div class="cust-row"><span class="cust-k">Marca:</span> ${escapeHtml(ticket.brand || "—")}</div>
          <div class="cust-row"><span class="cust-k">Modelo:</span> ${escapeHtml(ticket.model || "—")}</div>
          ${
            ticket.device_password
              ? `<div class="cust-row"><span class="cust-k">Contraseña:</span> ${escapeHtml(ticket.device_password)}</div>`
              : ""
          }
          <div class="cust-acc-wrap">${accBoxesHtml}</div>
          <div class="cust-row"><span class="cust-k">Otro acc.:</span> ${customAccText || "—"}</div>
          <div class="cust-sect">Trabajos a realizar</div>
          <div class="cust-problem">${escapeHtml(ticket.problem_description)}</div>
          <div class="cust-sect">Observaciones</div>
          <div class="cust-problem cust-empty"></div>
          <div class="cust-footer-2">
            <div class="cust-fbox"><div class="cust-fl">TOTAL A PAGAR</div></div>
            <div class="cust-fbox"><div class="cust-fl">Recibido por</div><div class="cust-fn">${receivedByName}</div></div>
          </div>
          <div class="cust-disclaimer">
            Nota: la empresa no se hace responsable por equipos con más de 45 días sin reclamar.
            Para reclamo presentar factura correspondiente.
          </div>
        </div>`

      const accBodies = accList.map(
        (acc: string) => `
        <div class="acc-label">
          <div class="acc-ticket-id">${ticketIdFull}</div>
          <div class="acc-name">${escapeHtml(acc)}</div>
          <div class="acc-client">${escapeHtml(ticket.client_name)}</div>
        </div>`
      )

      const sectionBodies = [customerThermalBody, receiptBody, deviceBody, ...accBodies]

      // Un documento por trabajo: @page auto para una sola tira corta por impresión (mejor para cortadoras).
      const css = `
          @page { size: ${width} auto; margin: 1mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            height: auto;
            font-family: 'Arial Black', 'Arial', sans-serif;
            color: #000;
            background: #fff;
            font-weight: bold;
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
          /* ——— Comprobante cliente (térmica) ——— */
          .customer-roll { padding: 2mm; font-size: 10px; line-height: 1.35; font-weight: bold; }
          .cust-header { display: flex; align-items: flex-start; gap: 2mm; margin-bottom: 2mm; }
          .cust-logo { width: 12mm; height: 12mm; object-fit: contain; flex-shrink: 0; }
          .cust-head-text { flex: 1; min-width: 0; }
          .cust-shop { font-size: 13px; font-weight: 900; text-transform: uppercase; }
          .cust-addr { font-size: 8px; font-weight: bold; margin-top: 1mm; }
          .cust-phones { font-size: 10px; font-weight: 900; margin-top: 1mm; }
          .cust-divider { border-top: 2px solid #000; margin: 2mm 0; }
          .cust-title-block { margin-bottom: 2mm; }
          .cust-ticket-lbl { font-size: 9px; font-weight: 900; }
          .cust-ticket-num { font-size: 22px; font-weight: 900; color: #c00; line-height: 1.1; margin: 1mm 0; }
          .cust-dates { font-size: 9px; margin-top: 2mm; }
          .cust-dk { font-weight: 900; }
          .cust-row { margin: 2mm 0; font-size: 10px; }
          .cust-k { font-weight: 900; text-transform: uppercase; margin-right: 1mm; }
          .cust-eq-line { display: flex; flex-wrap: wrap; gap: 2mm 3mm; font-size: 9px; margin: 2mm 0; }
          .cust-acc-wrap { display: flex; flex-wrap: wrap; gap: 1mm 2mm; font-size: 8px; margin: 2mm 0; }
          .cust-acc-item { white-space: nowrap; }
          .cust-sect { font-weight: 900; font-size: 9px; text-transform: uppercase; margin-top: 3mm; }
          .cust-problem { border: 1px solid #000; padding: 2mm; min-height: 10mm; font-size: 9px; font-weight: bold; margin-top: 1mm; }
          .cust-problem.cust-empty { min-height: 8mm; }
          .cust-footer-2 { display: flex; gap: 2mm; margin-top: 4mm; }
          .cust-fbox { flex: 1; border: 1px solid #000; padding: 2mm; min-height: 14mm; }
          .cust-fl { font-size: 8px; font-weight: 900; border-bottom: 1px solid #000; padding-bottom: 1mm; margin-bottom: 2mm; }
          .cust-fn { font-size: 11px; font-weight: 900; }
          .cust-disclaimer { font-size: 7px; text-align: center; margin-top: 3mm; padding-top: 2mm; border-top: 1px solid #000; font-weight: bold; }
      `

      const printDelayMs = 280
      const afterPrintMs = 1300

      const runOnePrintJob = (bodyHtml: string, jobIndex: number) =>
        new Promise<void>((resolve) => {
          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Térmica ${ticket.id} (${jobIndex + 1}/${sectionBodies.length})</title><style>${css}</style></head><body>${bodyHtml}</body></html>`
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
            iframe.remove()
            resolve()
            return
          }
          doc.open()
          doc.write(html)
          doc.close()

          window.setTimeout(() => {
            try {
              iframe.contentWindow?.focus()
              iframe.contentWindow?.print()
            } catch (e) {
              console.error("Print error:", e)
            }
            window.setTimeout(() => {
              iframe.remove()
              resolve()
            }, afterPrintMs)
          }, printDelayMs)
        })

      for (let i = 0; i < sectionBodies.length; i++) {
        await runOnePrintJob(sectionBodies[i], i)
      }
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
