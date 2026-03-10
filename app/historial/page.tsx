'use client'

import { useState } from 'react'
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
import { Ticket, EQUIPMENT_LABELS } from '@/lib/types'
import { Search, Eye } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function HistorialPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  const { data: tickets = [], isLoading } = useSWR<Ticket[]>(
    `/api/tickets?status=completed&search=${encodeURIComponent(searchTerm)}`,
    fetcher
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
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
                    <TableHead className="w-28">Ticket</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Equipo</TableHead>
                    <TableHead className="hidden md:table-cell">Recepción</TableHead>
                    <TableHead className="hidden lg:table-cell">Entrega</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-16">Ver</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Spinner className="h-8 w-8 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No se encontraron tickets en el historial
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono font-medium text-xs">
                          {ticket.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ticket.client_name}</p>
                            <p className="text-sm text-muted-foreground">{ticket.client_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div>
                            <p>{ticket.brand} {ticket.model}</p>
                            <p className="text-sm text-muted-foreground">
                              {EQUIPMENT_LABELS[ticket.equipment_type]}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {formatDate(ticket.created_at)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {formatDate(ticket.updated_at)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {ticket.final_cost ? formatCurrency(ticket.final_cost) : '-'}
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
                  <span className="font-mono text-sm">{selectedTicket.id}</span>
                  <Badge variant="secondary">Entregado</Badge>
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

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Recepción</p>
                    <p className="font-medium">{formatDate(selectedTicket.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Entrega</p>
                    <p className="font-medium">{formatDate(selectedTicket.updated_at)}</p>
                  </div>
                </div>

                {/* Problem */}
                <div>
                  <p className="text-sm text-muted-foreground">Problema Reportado</p>
                  <p className="font-medium">{selectedTicket.reported_issue}</p>
                </div>

                {/* Diagnosis */}
                {selectedTicket.diagnosis && (
                  <div>
                    <p className="text-sm text-muted-foreground">Diagnóstico</p>
                    <p className="font-medium">{selectedTicket.diagnosis}</p>
                  </div>
                )}

                {/* Solution */}
                {selectedTicket.solution && (
                  <div>
                    <p className="text-sm text-muted-foreground">Solución Aplicada</p>
                    <p className="font-medium">{selectedTicket.solution}</p>
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

                {/* Total */}
                {selectedTicket.final_cost && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Total de Reparación</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(selectedTicket.final_cost)}
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
