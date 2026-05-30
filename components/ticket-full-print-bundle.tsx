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

const QR_WARMUP_MS = 550

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export type TicketFullPrintBundleHandle = {
  /** Varios trabajos de impresión en fila (mejor para cortar en térmica). */
  printAll: () => Promise<void>
}

type TicketFullPrintBundleProps = {
  ticket: Ticket
  /**
   * "thermal" conserva el comprobante compacto en rollo.
   * "full" imprime primero el comprobante de cliente tipo historial/media carta.
   */
  customerLayout?: "thermal" | "full"
}

export const TicketFullPrintBundle = forwardRef<
  TicketFullPrintBundleHandle,
  TicketFullPrintBundleProps
>(function TicketFullPrintBundle({ ticket, customerLayout = "thermal" }, ref) {
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings)

  const customerTicketRef = useRef<CustomerTicketHandle>(null)
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

    if (customerLayout === "full") {
      customerTicketRef.current?.print()
      await sleep(400)
      await thermalRef.current?.printThermalRoll({ includeCustomerReceipt: false })
      return
    }

    await thermalRef.current?.printThermalRoll()
  }, [customerLayout])

  useImperativeHandle(ref, () => ({ printAll }), [printAll])

  return (
    <div
      className="pointer-events-none fixed left-[-10000px] top-0 w-[480px] opacity-0"
      aria-hidden
    >
      {customerLayout === "full" && (
        <CustomerTicket
          ref={customerTicketRef}
          ticket={ticket}
          settings={settings}
          hideTrigger
        />
      )}
      <ThermalRollCombinedPrint
        ref={thermalRef}
        ticket={ticket}
        settings={settings}
      />
    </div>
  )
})
