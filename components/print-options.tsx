"use client"

import { useState, useEffect } from "react"
import { Ticket, ShopSettings } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Printer, FileText, Receipt, Tag, X, Check } from "lucide-react"
import { CustomerTicket } from "./customer-ticket"
import { TicketReceipt } from "./ticket-receipt"
import { DeviceLabel } from "./device-label"
import { AccessoryLabels } from "./accessory-labels"

interface PrintOptionsProps {
  ticket: Ticket
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function PrintOptions({ ticket, open, onOpenChange }: PrintOptionsProps) {
  const [settings, setSettings] = useState<ShopSettings>({
    id: 'default',
    shop_name: 'Mi Taller',
    shop_phone: '',
    shop_address: '',
    printer_width: '80mm'
  })
  const [printed, setPrinted] = useState<Record<string, boolean>>({})

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

  const handlePrinted = (type: string) => {
    setPrinted(prev => ({ ...prev, [type]: true }))
  }

  const accessories = typeof ticket.accessories === 'string' 
    ? JSON.parse(ticket.accessories) 
    : ticket.accessories || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Opciones de Impresión - Ticket {ticket.id}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Customer Ticket - A4 Normal Printer */}
          <Card className={printed.customer ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Ticket para Cliente (Impresora Normal A4)
                {printed.customer && <Check className="h-4 w-4 text-green-600 ml-auto" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                Orden de trabajo completa para entregar al cliente. Incluye todos los datos, 
                checkboxes de accesorios, espacio para firma y contraseña.
              </p>
              <CustomerTicket 
                ticket={ticket} 
                settings={settings}
                onPrint={() => handlePrinted('customer')} 
              />
            </CardContent>
          </Card>

          {/* POS Receipt - Thermal Printer */}
          <Card className={printed.pos ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Ticket POS (Impresora Térmica)
                {printed.pos && <Check className="h-4 w-4 text-green-600 ml-auto" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                Ticket compacto para impresora térmica ({settings.printer_width}). 
                Uso interno o copia rápida para el cliente.
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
                Etiqueta con QR para pegar al equipo. Facilita identificación rápida.
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
                  Etiquetas pequeñas para cada accesorio recibido.
                </p>
                <AccessoryLabels 
                  ticket={ticket}
                  onPrint={() => handlePrinted('accessories')} 
                />
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange?.(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Trigger button for use in other components
export function PrintOptionsButton({ ticket }: { ticket: Ticket }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" size="sm">
        <Printer className="mr-2 h-4 w-4" />
        Imprimir
      </Button>
      <PrintOptions ticket={ticket} open={open} onOpenChange={setOpen} />
    </>
  )
}
