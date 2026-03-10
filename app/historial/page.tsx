"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Ticket, EQUIPMENT_LABELS } from "@/lib/types"
import { Search, Eye } from "lucide-react"
import { store } from "@/lib/store"

export default function HistorialPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  useEffect(() => {
    const completed = store.getCompletedTickets()
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      setTickets(
        completed.filter(
          (t) =>
            t.client_name.toLowerCase().includes(q) ||
            t.client_phone.includes(q) ||
            (t.serial_number && t.serial_number.toLowerCase().includes(q))
        )
      )
    } else {
      setTickets(completed)
    }
  }, [searchTerm])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Historial</h1>
            <p className="text-muted-foreground">
              {tickets.length} tickets completados
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                  {tickets.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No se encontraron tickets en el historial
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-xs font-medium">
                          {ticket.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ticket.client_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {ticket.client_phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div>
                            <p>
                              {ticket.brand} {ticket.model}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {EQUIPMENT_LABELS[ticket.equipment_type]}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {formatDate(ticket.created_at)}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">
                          {formatDate(ticket.updated_at)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {ticket.final_cost
                            ? formatCurrency(ticket.final_cost)
                            : "-"}
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
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
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
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium">
                      {EQUIPMENT_LABELS[selectedTicket.equipment_type]}
                    </p>
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
                    <p className="font-medium">
                      {selectedTicket.serial_number || "-"}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Fecha de Recepción
                    </p>
                    <p className="font-medium">
                      {formatDate(selectedTicket.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Fecha de Entrega
                    </p>
                    <p className="font-medium">
                      {formatDate(selectedTicket.updated_at)}
                    </p>
                  </div>
                </div>

                {/* Problem */}
                <div>
                  <p className="text-sm text-muted-foreground">
                    Problema Reportado
                  </p>
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
                    <p className="text-sm text-muted-foreground">
                      Solución Aplicada
                    </p>
                    <p className="font-medium">{selectedTicket.solution}</p>
                  </div>
                )}

                {/* Accessories */}
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Accesorios Recibidos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTicket.accessories.length > 0 ? (
                      selectedTicket.accessories.map((acc) => (
                        <Badge key={acc} variant="secondary">
                          {acc}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Sin accesorios
                      </span>
                    )}
                  </div>
                </div>

                {/* Total */}
                {selectedTicket.final_cost && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                      Total de Reparación
                    </p>
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
