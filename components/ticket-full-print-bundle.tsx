"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import type { Ticket, ShopSettings } from "@/lib/types"
import { CustomerTicket, type CustomerTicketHandle } from "./customer-ticket"
import {
  ThermalRollCombinedPrint,
  type ThermalRollCombinedHandle,
} from "./thermal-roll-combined-print"

const defaultSettings: ShopSettings = {
  id: "default",
  shop_name: "MULTIPLANET",
  shop_phone: "",
  shop_address: "",
  printer_width: "80mm",
}

const BETWEEN_PRINTS_MS = 1100
const QR_WARMUP_MS = 550

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export type TicketFullPrintBundleHandle = {
  /** Comprobante cliente → una cola térmica (POS + equipo + accesorios, páginas separadas). */
  printAll: () => Promise<void>
}

type TicketFullPrintBundleProps = {
  ticket: Ticket
}

export const TicketFullPrintBundle = forwardRef<
  TicketFullPrintBundleHandle,
  TicketFullPrintBundleProps
>(function TicketFullPrintBundle({ ticket }, ref) {
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings)

  const customerRef = useRef<CustomerTicketHandle>(null)
  const thermalRef = useRef<ThermalRollCombinedHandle>(null)

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setSettings(data)
        }
      })
      .catch(console.error)
  }, [])

  const printAll = useCallback(async () => {
    await sleep(QR_WARMUP_MS)
    customerRef.current?.print()
    await sleep(BETWEEN_PRINTS_MS)
    thermalRef.current?.printThermalRoll()
  }, [])

  useImperativeHandle(ref, () => ({ printAll }), [printAll])

  return (
    <div
      className="pointer-events-none fixed left-[-10000px] top-0 w-[480px] opacity-0"
      aria-hidden
    >
      <CustomerTicket
        ref={customerRef}
        ticket={ticket}
        settings={settings}
        hideTrigger
      />
      <ThermalRollCombinedPrint
        ref={thermalRef}
        ticket={ticket}
        settings={settings}
      />
    </div>
  )
})
