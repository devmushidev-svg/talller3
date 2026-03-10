"use client"

import { useState, useEffect } from "react"
import { Ticket, ShopSettings } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Printer, FileText, Check } from "lucide-react"
import { CustomerTicket } from "./customer-ticket"

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
            Orden de Trabajo - Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Ticket <span className="font-mono font-bold">{ticket.id}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Imprime en hoja tamaño media carta para entregar al cliente
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
