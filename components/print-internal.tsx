"use client"

import { useState, useEffect, useRef } from "react"
import { Ticket, ShopSettings } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Printer, Receipt, Tag, Check } from "lucide-react"
import { TicketReceipt } from "./ticket-receipt"
import { DeviceLabel } from "./device-label"
import { AccessoryLabels } from "./accessory-labels"
import {
  TicketFullPrintBundle,
  type TicketFullPrintBundleHandle,
} from "./ticket-full-print-bundle"

interface PrintInternalProps {
  ticket: Ticket
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function PrintInternal({ ticket, open, onOpenChange }: PrintInternalProps) {
  const [settings, setSettings] = useState<ShopSettings>({
    id: 'default',
    shop_name: 'Mi Taller',
    shop_phone: '',
    shop_address: '',
    printer_width: '80mm'
  })
  const [printed, setPrinted] = useState<Record<string, boolean>>({})
  const printBundleRef = useRef<TicketFullPrintBundleHandle>(null)

  const displayTicketLabel =
    ticket.ticket_seq != null ? `N° ${ticket.ticket_seq}` : ticket.id

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setSettings(data)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (open) {
      setPrinted({})
    }
  }, [open])

  const handlePrinted = (type: string) => {
    setPrinted(prev => ({ ...prev, [type]: true }))
  }

  const accessories = typeof ticket.accessories === 'string' 
    ? JSON.parse(ticket.accessories) 
    : ticket.accessories || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Impresiones internas — Ticket {displayTicketLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <TicketFullPrintBundle ref={printBundleRef} ticket={ticket} />
          <Button
            className="w-full h-11 font-medium"
            onClick={() => void printBundleRef.current?.printAll()}
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir todo en orden
          </Button>
          <p className="text-xs text-muted-foreground text-center -mt-2">
            Comprobante cliente → ticket POS → etiqueta del equipo → etiquetas de accesorios (si hay).
            Se abre un cuadro de impresión por cada uno.
          </p>

          {/* POS Receipt */}
          <Card className={printed.pos ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Ticket POS ({settings.printer_width})
                {printed.pos && <Check className="h-4 w-4 text-green-600 ml-auto" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                Comprobante para impresora térmica - uso interno
              </p>
              <TicketReceipt 
                ticket={ticket} 
                settings={settings}
                onPrint={() => handlePrinted('pos')} 
              />
            </CardContent>
          </Card>

          {/* Device Label */}
          <Card className={printed.device ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Etiqueta para Equipo
                {printed.device && <Check className="h-4 w-4 text-green-600 ml-auto" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                Etiqueta con QR para pegar al equipo
              </p>
              <DeviceLabel 
                ticket={ticket} 
                settings={settings}
                onPrint={() => handlePrinted('device')} 
              />
            </CardContent>
          </Card>

          {/* Accessory Labels */}
          {accessories.length > 0 && (
            <Card className={printed.accessories ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Etiquetas de Accesorios ({accessories.length})
                  {printed.accessories && <Check className="h-4 w-4 text-green-600 ml-auto" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">
                  Etiquetas para cada accesorio
                </p>
                <AccessoryLabels 
                  ticket={ticket}
                  onPrint={() => handlePrinted('accessories')} 
                />
              </CardContent>
            </Card>
          )}

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => onOpenChange?.(false)}
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
