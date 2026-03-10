"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Ticket,
  TicketStatus,
  STATUS_COLORS,
  STATUS_LABELS,
  EQUIPMENT_LABELS,
  EquipmentType,
} from "@/lib/types"
import { 
  Search, 
  Eye, 
  Printer, 
  Loader2, 
  Filter, 
  ChevronDown,
  Calendar,
  DollarSign,
  Tag,
  Image as ImageIcon
} from "lucide-react"
import { QRScanner } from "@/components/qr-scanner"
import { CustomerHistory } from "@/components/customer-history"
import { PrintCustomer } from "@/components/print-customer"
import { PrintInternal } from "@/components/print-internal"

const statusOptions: TicketStatus[] = [
  "recibido",
  "en_diagnostico",
  "en_reparacion",
  "listo",
  "entregado",
]

export default function TicketsActivosPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [printTicket, setPrintTicket] = useState<Ticket | null>(null)
  const [showCustomerPrint, setShowCustomerPrint] = useState(false)
  const [showInternalPrint, setShowInternalPrint] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
  // Advanced filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  
  // Edit mode
  const [editMode, setEditMode] = useState(false)
  const [editDiagnosis, setEditDiagnosis] = useState("")
  const [editRepairNotes, setEditRepairNotes] = useState("")
  const [editLaborCost, setEditLaborCost] = useState("")
  const [editPartsCost, setEditPartsCost] = useState("")
  const [editAmountPaid, setEditAmountPaid] = useState("")

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set('q', searchTerm)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (equipmentFilter !== 'all') params.set('equipment_type', equipmentFilter)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      
      const url = params.toString() ? `/api/search?${params}` : '/api/tickets'
      const response = await fetch(url)
      const data = await response.json()
      
      const parsedTickets = (Array.isArray(data) ? data : [])
        .map((t: Ticket) => ({
          ...t,
          accessories: typeof t.accessories === "string" 
            ? JSON.parse(t.accessories) 
            : t.accessories || [],
          photos: typeof t.photos === "string"
            ? JSON.parse(t.photos)
            : t.photos || [],
        }))
        .filter((t: Ticket) => statusFilter === 'all' ? t.status !== "entregado" : true)

      setTickets(parsedTickets)
    } catch (error) {
      console.error("Error fetching tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      setLoading(true)
      fetchTickets()
    }, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm, statusFilter, equipmentFilter, dateFrom, dateTo])

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus }
      if (newStatus === 'entregado') {
        updateData.delivered_at = new Date().toISOString()
      }
      
      await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      )

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) =>
          prev ? { ...prev, status: newStatus } : null
        )
      }

      if (newStatus === "entregado" && statusFilter === 'all') {
        setTickets((prev) => prev.filter((t) => t.id !== ticketId))
        setSelectedTicket(null)
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const handleSaveDetails = async () => {
    if (!selectedTicket) return
    
    const laborCost = parseFloat(editLaborCost) || 0
    const partsCost = parseFloat(editPartsCost) || 0
    const totalCost = laborCost + partsCost
    const amountPaid = parseFloat(editAmountPaid) || 0
    
    try {
      await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis: editDiagnosis,
          repair_notes: editRepairNotes,
          labor_cost: laborCost,
          parts_cost: partsCost,
          total_cost: totalCost,
          amount_paid: amountPaid,
          payment_status: amountPaid >= totalCost ? 'pagado' : 'pendiente',
        }),
      })
      
      const updatedTicket = {
        ...selectedTicket,
        diagnosis: editDiagnosis,
        repair_notes: editRepairNotes,
        labor_cost: laborCost,
        parts_cost: partsCost,
        total_cost: totalCost,
        amount_paid: amountPaid,
        payment_status: amountPaid >= totalCost ? 'pagado' : 'pendiente',
      }
      
      setSelectedTicket(updatedTicket)
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t))
      setEditMode(false)
    } catch (error) {
      console.error("Error saving details:", error)
    }
  }

  const openTicketDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setEditDiagnosis(ticket.diagnosis || '')
    setEditRepairNotes(ticket.repair_notes || '')
    setEditLaborCost(ticket.labor_cost?.toString() || '0')
    setEditPartsCost(ticket.parts_cost?.toString() || '0')
    setEditAmountPaid(ticket.amount_paid?.toString() || '0')
    setEditMode(false)
  }

  const handleCustomerPrint = (ticket: Ticket) => {
    setPrintTicket(ticket)
    setShowCustomerPrint(true)
  }

  const handleInternalPrint = (ticket: Ticket) => {
    setPrintTicket(ticket)
    setShowInternalPrint(true)
  }

  const handleQRScan = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId)
    if (ticket) {
      openTicketDetail(ticket)
    } else {
      // Ticket not in current view, search for it
      setSearchTerm(ticketId)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const clearFilters = () => {
    setStatusFilter("all")
    setEquipmentFilter("all")
    setDateFrom("")
    setDateTo("")
    setSearchTerm("")
  }

  const hasActiveFilters = statusFilter !== 'all' || equipmentFilter !== 'all' || dateFrom || dateTo

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tickets Activos</h1>
            <p className="text-muted-foreground">
              {tickets.length} equipos encontrados
            </p>
          </div>
          <div className="flex gap-2">
            <QRScanner onScan={handleQRScan} />
          </div>
        </div>

        {/* Search & Filters */}
        <Card className="border-border">
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, ticket, serie, marca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                <CollapsibleTrigger asChild>
                  <Button variant={hasActiveFilters ? "default" : "outline"} size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            </div>

            <Collapsible open={showFilters} onOpenChange={setShowFilters}>
              <CollapsibleContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los activos</SelectItem>
                        {statusOptions.map(status => (
                          <SelectItem key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tipo de Equipo</Label>
                    <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {Object.entries(EQUIPMENT_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Fecha Desde</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Fecha Hasta</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
                
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Ticket</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="hidden sm:table-cell">Equipo</TableHead>
                      <TableHead className="hidden md:table-cell">Marca/Modelo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                      <TableHead className="hidden lg:table-cell">Total</TableHead>
                      <TableHead className="w-28">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No se encontraron tickets
                        </TableCell>
                      </TableRow>
                    ) : (
                      tickets.map((ticket) => (
                        <TableRow
                          key={ticket.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => openTicketDetail(ticket)}
                        >
                          <TableCell className="font-mono text-xs font-medium">
                            {ticket.id}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{ticket.client_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {ticket.client_phone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {EQUIPMENT_LABELS[ticket.equipment_type]}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {ticket.brand} {ticket.model}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={ticket.status}
                              onValueChange={(value) =>
                                handleStatusChange(ticket.id, value as TicketStatus)
                              }
                            >
                              <SelectTrigger className="h-8 w-36">
                                <Badge
                                  className={`${STATUS_COLORS[ticket.status]} text-xs`}
                                >
                                  {STATUS_LABELS[ticket.status]}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    <Badge
                                      className={`${STATUS_COLORS[status]} text-xs`}
                                    >
                                      {STATUS_LABELS[status]}
                                    </Badge>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground sm:table-cell">
                            {formatDate(ticket.created_at)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {ticket.total_cost > 0 ? (
                              <span className="font-medium text-green-600">
                                ${ticket.total_cost.toFixed(2)}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                                            <div className="flex gap-1">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Ver detalles"
                                                onClick={() => openTicketDetail(ticket)}
                                              >
                                                <Eye className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Imprimir ticket cliente"
                                                onClick={() => handleCustomerPrint(ticket)}
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
        )}
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog
        open={!!selectedTicket && !showPrint}
        onOpenChange={() => setSelectedTicket(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="font-mono text-sm">{selectedTicket.id}</span>
                  <Badge className={STATUS_COLORS[selectedTicket.status]}>
                    {STATUS_LABELS[selectedTicket.status]}
                  </Badge>
                  {selectedTicket.total_cost > 0 && (
                    <Badge variant={selectedTicket.amount_paid >= selectedTicket.total_cost ? "default" : "destructive"}>
                      {selectedTicket.amount_paid >= selectedTicket.total_cost ? "Pagado" : "Pendiente"}
                    </Badge>
                  )}
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{selectedTicket.client_phone}</p>
                      <CustomerHistory phone={selectedTicket.client_phone} name={selectedTicket.client_name} />
                    </div>
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
                    <p className="font-medium">{selectedTicket.brand || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Modelo</p>
                    <p className="font-medium">{selectedTicket.model || "-"}</p>
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
                    <p className="text-sm text-muted-foreground">Fecha de Recepción</p>
                    <p className="font-medium">{formatDate(selectedTicket.created_at)}</p>
                  </div>
                  {selectedTicket.estimated_delivery_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">Entrega Estimada</p>
                      <p className="font-medium">{formatDate(selectedTicket.estimated_delivery_date)}</p>
                    </div>
                  )}
                </div>

                {/* Problem */}
                <div>
                  <p className="text-sm text-muted-foreground">Problema Reportado</p>
                  <p className="font-medium">{selectedTicket.problem_description}</p>
                </div>

                {/* Photos */}
                {selectedTicket.photos && selectedTicket.photos.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Fotos del Equipo
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedTicket.photos.map((photo, index) => (
                        <a key={index} href={photo} target="_blank" rel="noopener noreferrer">
                          <img
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="w-full aspect-square object-cover rounded-lg border hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
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

                {/* Diagnosis & Repair (editable) */}
                {editMode ? (
                  <div className="space-y-4 p-4 bg-muted rounded-lg">
                    <div>
                      <Label>Diagnóstico</Label>
                      <Textarea
                        value={editDiagnosis}
                        onChange={(e) => setEditDiagnosis(e.target.value)}
                        placeholder="Resultado del diagnóstico..."
                      />
                    </div>
                    <div>
                      <Label>Notas de Reparación</Label>
                      <Textarea
                        value={editRepairNotes}
                        onChange={(e) => setEditRepairNotes(e.target.value)}
                        placeholder="Detalles de la reparación..."
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Mano de Obra ($)</Label>
                        <Input
                          type="number"
                          value={editLaborCost}
                          onChange={(e) => setEditLaborCost(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label>Piezas ($)</Label>
                        <Input
                          type="number"
                          value={editPartsCost}
                          onChange={(e) => setEditPartsCost(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label>Total ($)</Label>
                        <Input
                          type="number"
                          value={(parseFloat(editLaborCost || '0') + parseFloat(editPartsCost || '0')).toFixed(2)}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Monto Pagado ($)</Label>
                      <Input
                        type="number"
                        value={editAmountPaid}
                        onChange={(e) => setEditAmountPaid(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveDetails}>Guardar</Button>
                      <Button variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(selectedTicket.diagnosis || selectedTicket.repair_notes) && (
                      <>
                        {selectedTicket.diagnosis && (
                          <div>
                            <p className="text-sm text-muted-foreground">Diagnóstico</p>
                            <p className="font-medium">{selectedTicket.diagnosis}</p>
                          </div>
                        )}
                        {selectedTicket.repair_notes && (
                          <div>
                            <p className="text-sm text-muted-foreground">Notas de Reparación</p>
                            <p className="font-medium">{selectedTicket.repair_notes}</p>
                          </div>
                        )}
                      </>
                    )}
                    
                    {selectedTicket.total_cost > 0 && (
                      <div className="grid grid-cols-4 gap-4 p-3 bg-muted rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Mano de Obra</p>
                          <p className="font-medium">${selectedTicket.labor_cost?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Piezas</p>
                          <p className="font-medium">${selectedTicket.parts_cost?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-bold text-green-600">${selectedTicket.total_cost?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Pagado</p>
                          <p className="font-medium">${selectedTicket.amount_paid?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    )}
                    
                    <Button variant="outline" onClick={() => setEditMode(true)}>
                      Editar Diagnóstico y Costos
                    </Button>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-4 border-t pt-4">
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) =>
                      handleStatusChange(selectedTicket.id, value as TicketStatus)
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button onClick={() => handleCustomerPrint(selectedTicket)} className="h-12">
                      <Printer className="mr-2 h-4 w-4" />
                      Orden de Trabajo (Cliente)
                    </Button>
                    <Button variant="secondary" onClick={() => handleInternalPrint(selectedTicket)} className="h-12">
                      <Tag className="mr-2 h-4 w-4" />
                      POS / Etiquetas (Interno)
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Dialogs */}
      {printTicket && (
        <>
          <PrintCustomer 
            ticket={printTicket} 
            open={showCustomerPrint} 
            onOpenChange={setShowCustomerPrint}
          />
          <PrintInternal 
            ticket={printTicket} 
            open={showInternalPrint} 
            onOpenChange={setShowInternalPrint}
          />
        </>
      )}
    </DashboardLayout>
  )
}
