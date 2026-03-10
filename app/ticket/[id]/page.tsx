'use client'

import { use, useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getTicketById } from '@/lib/store'
import { Ticket } from '@/lib/types'
import { TicketReceipt } from '@/components/ticket-receipt'
import { AccessoryLabels } from '@/components/accessory-labels'
import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TicketPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [ticket, setTicket] = useState<Ticket | null>(null)

  useEffect(() => {
    const foundTicket = getTicketById(resolvedParams.id)
    setTicket(foundTicket || null)
  }, [resolvedParams.id])

  const handlePrint = () => {
    window.print()
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Ticket no encontrado</p>
          <Link href="/tickets-activos">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a tickets
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto space-y-6 no-print">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Vista Previa de Impresión
            </h1>
            <p className="text-muted-foreground">
              Ticket #{String(ticket.ticketNumber).padStart(5, '0')}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/tickets-activos">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Preview Cards */}
        <Card className="border-border">
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">Ticket de Recepción</h2>
            <div className="bg-white p-4 rounded border">
              <TicketReceipt ticket={ticket} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">Etiquetas de Accesorios</h2>
            <div className="bg-white p-4 rounded border">
              <AccessoryLabels ticket={ticket} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print area */}
      <div className="print-only hidden print:block">
        <TicketReceipt ticket={ticket} />
        <div style={{ pageBreakBefore: 'always' }} />
        <AccessoryLabels ticket={ticket} />
      </div>
    </DashboardLayout>
  )
}
