"use client"

import { useState, useEffect, useRef } from "react"
import { Ticket, ShopSettings } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Printer, FileText, Check } from "lucide-react"
import { CustomerTicket } from "./customer-ticket"
import {
  TicketFullPrintBundle,
  type TicketFullPrintBundleHandle,
} from "./ticket-full-print-bundle"

interface PrintCustomerProps {
  ticket: Ticket
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function PrintCustomer({ ticket, open, onOpenChange }: PrintCustomerProps) {
  const [settings, setSettings] = useState<ShopSettings>({
    id: 'default',
    shop_name: 'Mi Taller',
    shop_phone: '',
    shop_address: '',
    printer_width: '80mm'
  })
  const [printed, setPrinted] = useState(false)
  const printBundleRef = useRef<TicketFullPrintBundleHandle>(null)

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
      setPrinted(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Comprobante para cliente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <TicketFullPrintBundle ref={printBundleRef} ticket={ticket} />
          <Button
            className="w-full h-11"
            onClick={() => void printBundleRef.current?.printAll()}
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir todo (cliente + POS + etiquetas)
          </Button>

          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Ticket N°{" "}
              <span className="font-bold">
                {ticket.ticket_seq != null ? ticket.ticket_seq : ticket.id}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Abajo puede imprimir solo el comprobante en media carta.
            </p>
          </div>

          {printed && (
            <div className="flex items-center justify-center gap-2 p-3 bg-green-100 dark:bg-green-900 rounded-lg text-green-700 dark:text-green-300">
              <Check className="h-5 w-5" />
              <span>Impreso correctamente</span>
            </div>
          )}

          <CustomerTicket 
            ticket={ticket} 
            settings={settings}
            onPrint={() => setPrinted(true)} 
          />

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
