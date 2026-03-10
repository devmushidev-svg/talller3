'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, Phone, User, Package, DollarSign, Loader2 } from 'lucide-react'
import { Ticket } from '@/lib/types'

interface CustomerHistoryProps {
  phone: string
  name?: string
}

interface HistoryData {
  tickets: Ticket[]
  summary: {
    totalTickets: number
    completedTickets: number
    totalSpent: number
  }
}

const statusColors: Record<string, string> = {
  recibido: 'bg-blue-100 text-blue-800',
  'en_diagnostico': 'bg-yellow-100 text-yellow-800',
  'en_reparacion': 'bg-orange-100 text-orange-800',
  listo: 'bg-green-100 text-green-800',
  entregado: 'bg-gray-100 text-gray-800',
}

const statusLabels: Record<string, string> = {
  recibido: 'Recibido',
  'en_diagnostico': 'En Diagnóstico',
  'en_reparacion': 'En Reparación',
  listo: 'Listo',
  entregado: 'Entregado',
}

export function CustomerHistory({ phone, name }: CustomerHistoryProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<HistoryData | null>(null)

  const fetchHistory = async () => {
    if (!phone) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/customers/${encodeURIComponent(phone)}/history`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && phone) {
      fetchHistory()
    }
  }, [open, phone])

  if (!phone) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-primary">
          <History className="h-4 w-4 mr-1" />
          Ver Historial
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Historial del Cliente
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Customer Info */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{name || 'Cliente'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{phone}</span>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card>
                <CardContent className="p-3 text-center">
                  <Package className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-2xl font-bold">{data.summary.totalTickets}</p>
                  <p className="text-xs text-muted-foreground">Total Tickets</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <History className="h-5 w-5 mx-auto text-green-600 mb-1" />
                  <p className="text-2xl font-bold">{data.summary.completedTickets}</p>
                  <p className="text-xs text-muted-foreground">Completados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <DollarSign className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                  <p className="text-2xl font-bold">${data.summary.totalSpent.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Total Gastado</p>
                </CardContent>
              </Card>
            </div>

            {/* Tickets List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {data.tickets.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay tickets anteriores
                </p>
              ) : (
                data.tickets.map((ticket) => (
                  <Card key={ticket.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-medium">{ticket.id}</span>
                            <Badge className={statusColors[ticket.status] || 'bg-gray-100'}>
                              {statusLabels[ticket.status] || ticket.status}
                            </Badge>
                          </div>
                          <p className="text-sm">
                            {ticket.equipment_type} - {ticket.brand} {ticket.model}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(ticket.created_at).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        {ticket.total_cost > 0 && (
                          <span className="font-medium text-green-600">
                            ${ticket.total_cost.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No se pudo cargar el historial
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
