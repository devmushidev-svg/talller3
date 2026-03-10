'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCompletedTickets } from '@/lib/store'
import { Ticket, ACCESSORY_LABELS, AccessoryKey } from '@/lib/types'
import { Search, Eye } from 'lucide-react'

export default function HistorialPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  useEffect(() => {
    setTickets(getCompletedTickets())
  }, [])

  const filteredTickets = tickets.filter(ticket =>
    ticket.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticketNumber.toString().includes(searchTerm) ||
    ticket.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.phone.includes(searchTerm)
  )

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value)
  }

  const getSelectedAccessories = (ticket: Ticket) => {
    return (Object.keys(ACCESSORY_LABELS) as AccessoryKey[])
      .filter(key => ticket.accessories[key])
      .map(key => ACCESSORY_LABELS[key])
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Historial</h1>
            <p className="text-muted-foreground">{tickets.length} tickets completados</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, serie, teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <Card className="border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Ticket</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Equipo</TableHead>
                    <TableHead className="hidden md:table-cell">Recepción</TableHead>
                    <TableHead className="hidden lg:table-cell">Entrega</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-16">Ver</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No se encontraron tickets en el historial
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono font-medium">
                          #{String(ticket.ticketNumber).padStart(5, '0')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ticket.clientName}</p>
                            <p className="text-sm text-muted-foreground">{ticket.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div>
                            <p>{ticket.brand} {ticket.model}</p>
                            <p className="text-sm text-muted-foreground">{ticket.equipmentType}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {formatDate(ticket.createdAt)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {ticket.deliveredAt ? formatDate(ticket.deliveredAt) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {ticket.totalRepair ? formatCurrency(ticket.totalRepair) : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="font-mono">Ticket #{String(selectedTicket.ticketNumber).padStart(5, '0')}</span>
                  <Badge variant="secondary">Entregado</Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                {/* Client Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{selectedTicket.clientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{selectedTicket.phone}</p>
                  </div>
                </div>

                {/* Equipment Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium">{selectedTicket.equipmentType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Marca</p>
                    <p className="font-medium">{selectedTicket.brand}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Modelo</p>
                    <p className="font-medium">{selectedTicket.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Serie</p>
                    <p className="font-medium">{selectedTicket.serialNumber || '-'}</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Recepción</p>
                    <p className="font-medium">{formatDate(selectedTicket.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Entrega</p>
                    <p className="font-medium">
                      {selectedTicket.deliveredAt ? formatDate(selectedTicket.deliveredAt) : '-'}
                    </p>
                  </div>
                </div>

                {/* Problem */}
                <div>
                  <p className="text-sm text-muted-foreground">Problema Reportado</p>
                  <p className="font-medium">{selectedTicket.reportedProblem}</p>
                </div>

                {/* Internal Notes */}
                {selectedTicket.internalNotes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observaciones Internas</p>
                    <p className="font-medium">{selectedTicket.internalNotes}</p>
                  </div>
                )}

                {/* Accessories */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Accesorios Recibidos</p>
                  <div className="flex flex-wrap gap-2">
                    {getSelectedAccessories(selectedTicket).length > 0 ? (
                      getSelectedAccessories(selectedTicket).map((acc) => (
                        <Badge key={acc} variant="secondary">{acc}</Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin accesorios</span>
                    )}
                  </div>
                </div>

                {/* Total */}
                {selectedTicket.totalRepair && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Total de Reparación</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(selectedTicket.totalRepair)}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
