'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getActiveTickets, updateTicketStatus } from '@/lib/store'
import { Ticket, TicketStatus, STATUS_COLORS, ACCESSORY_LABELS, AccessoryKey } from '@/lib/types'
import { Search, Eye, Printer } from 'lucide-react'
import { TicketReceipt } from '@/components/ticket-receipt'

const statusOptions: TicketStatus[] = ['Recibido', 'En Diagnóstico', 'En Reparación', 'Listo', 'Entregado']

export default function TicketsActivosPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showPrint, setShowPrint] = useState(false)

  useEffect(() => {
    setTickets(getActiveTickets())
  }, [])

  const filteredTickets = tickets.filter(ticket =>
    ticket.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticketNumber.toString().includes(searchTerm) ||
    ticket.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.phone.includes(searchTerm)
  )

  const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
    updateTicketStatus(ticketId, newStatus)
    setTickets(getActiveTickets())
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null)
    }
  }

  const handlePrint = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setShowPrint(true)
    setTimeout(() => {
      window.print()
      setShowPrint(false)
    }, 100)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
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
            <h1 className="text-2xl font-bold text-foreground">Tickets Activos</h1>
            <p className="text-muted-foreground">{tickets.length} equipos en reparación</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, ticket, serie..."
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
                    <TableHead className="hidden md:table-cell">Marca</TableHead>
                    <TableHead className="hidden lg:table-cell">Modelo</TableHead>
                    <TableHead className="hidden xl:table-cell">Problema</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No se encontraron tickets
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono font-medium">
                          #{String(ticket.ticketNumber).padStart(5, '0')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ticket.clientName}</p>
                            <p className="text-sm text-muted-foreground sm:hidden">{ticket.equipmentType}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{ticket.equipmentType}</TableCell>
                        <TableCell className="hidden md:table-cell">{ticket.brand}</TableCell>
                        <TableCell className="hidden lg:table-cell">{ticket.model}</TableCell>
                        <TableCell className="hidden xl:table-cell max-w-48 truncate">
                          {ticket.reportedProblem}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={ticket.status}
                            onValueChange={(value) => handleStatusChange(ticket.id, value as TicketStatus)}
                          >
                            <SelectTrigger className="w-36 h-8">
                              <Badge className={`${STATUS_COLORS[ticket.status]} text-xs`}>
                                {ticket.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                  <Badge className={`${STATUS_COLORS[status]} text-xs`}>
                                    {status}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {formatDate(ticket.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedTicket(ticket)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePrint(ticket)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
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
      <Dialog open={!!selectedTicket && !showPrint} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="font-mono">Ticket #{String(selectedTicket.ticketNumber).padStart(5, '0')}</span>
                  <Badge className={STATUS_COLORS[selectedTicket.status]}>
                    {selectedTicket.status}
                  </Badge>
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

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => handleStatusChange(selectedTicket.id, value as TicketStatus)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => handlePrint(selectedTicket)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir Ticket
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Print area */}
      {showPrint && selectedTicket && (
        <div className="print-only hidden print:block">
          <TicketReceipt ticket={selectedTicket} />
        </div>
      )}
    </DashboardLayout>
  )
}
