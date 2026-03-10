'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
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
import { Ticket, TicketStatus, STATUS_COLORS, STATUS_LABELS, EQUIPMENT_LABELS } from '@/lib/types'
import { Search, Eye, Printer } from 'lucide-react'
import { TicketReceipt } from '@/components/ticket-receipt'
import { Spinner } from '@/components/ui/spinner'
import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const statusOptions: TicketStatus[] = ['recibido', 'en_diagnostico', 'en_reparacion', 'listo', 'entregado']

export default function TicketsActivosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showPrint, setShowPrint] = useState(false)

  const { data: tickets = [], isLoading } = useSWR<Ticket[]>(
    `/api/tickets?status=active&search=${encodeURIComponent(searchTerm)}`,
    fetcher,
    { refreshInterval: 10000 }
  )

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      // Refresh the data
      mutate(`/api/tickets?status=active&search=${encodeURIComponent(searchTerm)}`)
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error al actualizar el estado')
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
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
                    <TableHead className="w-28">Ticket</TableHead>
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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <Spinner className="h-8 w-8 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No se encontraron tickets
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((ticket) => (
                      <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono font-medium text-xs">
                          {ticket.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ticket.client_name}</p>
                            <p className="text-sm text-muted-foreground sm:hidden">
                              {EQUIPMENT_LABELS[ticket.equipment_type]}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {EQUIPMENT_LABELS[ticket.equipment_type]}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{ticket.brand}</TableCell>
                        <TableCell className="hidden lg:table-cell">{ticket.model}</TableCell>
                        <TableCell className="hidden xl:table-cell max-w-48 truncate">
                          {ticket.reported_issue}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={ticket.status}
                            onValueChange={(value) => handleStatusChange(ticket.id, value as TicketStatus)}
                          >
                            <SelectTrigger className="w-36 h-8">
                              <Badge className={`${STATUS_COLORS[ticket.status]} text-xs`}>
                                {STATUS_LABELS[ticket.status]}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                  <Badge className={`${STATUS_COLORS[status]} text-xs`}>
                                    {STATUS_LABELS[status]}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {formatDate(ticket.created_at)}
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
                  <span className="font-mono text-sm">{selectedTicket.id}</span>
                  <Badge className={STATUS_COLORS[selectedTicket.status]}>
                    {STATUS_LABELS[selectedTicket.status]}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                {/* Client Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{selectedTicket.client_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{selectedTicket.client_phone}</p>
                  </div>
                </div>

                {/* Equipment Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium">{EQUIPMENT_LABELS[selectedTicket.equipment_type]}</p>
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
                    <p className="font-medium">{selectedTicket.serial_number || '-'}</p>
                  </div>
                </div>

                {/* Problem */}
                <div>
                  <p className="text-sm text-muted-foreground">Problema Reportado</p>
                  <p className="font-medium">{selectedTicket.reported_issue}</p>
                </div>

                {/* Internal Notes */}
                {selectedTicket.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observaciones Internas</p>
                    <p className="font-medium">{selectedTicket.notes}</p>
                  </div>
                )}

                {/* Accessories */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Accesorios Recibidos</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTicket.accessories.length > 0 ? (
                      selectedTicket.accessories.map((acc) => (
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
                        <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
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
