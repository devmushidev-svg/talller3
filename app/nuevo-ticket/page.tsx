'use client'

import { useState, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTicket } from '@/lib/store'
import { Ticket, EquipmentType, ACCESSORY_LABELS, AccessoryKey } from '@/lib/types'
import { Save, Printer } from 'lucide-react'
import { TicketReceipt } from '@/components/ticket-receipt'
import { AccessoryLabels } from '@/components/accessory-labels'

const initialAccessories = {
  cablePoder: false,
  cableUSB: false,
  cargador: false,
  cartucho: false,
  toner: false,
  otros: false,
  otrosDetalle: ''
}

export default function NuevoTicketPage() {
  const [clientName, setClientName] = useState('')
  const [phone, setPhone] = useState('')
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('Computadora')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [reportedProblem, setReportedProblem] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [accessories, setAccessories] = useState(initialAccessories)
  const [savedTicket, setSavedTicket] = useState<Ticket | null>(null)
  const [showPrint, setShowPrint] = useState(false)
  
  const printRef = useRef<HTMLDivElement>(null)

  const handleAccessoryChange = (key: AccessoryKey, checked: boolean) => {
    setAccessories(prev => ({ ...prev, [key]: checked }))
  }

  const resetForm = () => {
    setClientName('')
    setPhone('')
    setEquipmentType('Computadora')
    setBrand('')
    setModel('')
    setSerialNumber('')
    setReportedProblem('')
    setInternalNotes('')
    setAccessories(initialAccessories)
    setSavedTicket(null)
    setShowPrint(false)
  }

  const handleSave = (shouldPrint: boolean = false) => {
    if (!clientName || !phone || !brand || !model || !reportedProblem) {
      alert('Por favor complete los campos obligatorios')
      return
    }

    const ticket = createTicket({
      clientName,
      phone,
      equipmentType,
      brand,
      model,
      serialNumber,
      reportedProblem,
      internalNotes,
      accessories,
      status: 'Recibido'
    })

    setSavedTicket(ticket)

    if (shouldPrint) {
      setShowPrint(true)
      setTimeout(() => {
        window.print()
        setTimeout(() => {
          resetForm()
        }, 500)
      }, 100)
    } else {
      resetForm()
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Ticket</h1>
          <p className="text-muted-foreground">Registro rápido de equipos</p>
        </div>

        {/* Form */}
        <div className="grid gap-6">
          {/* Client Info */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Datos del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nombre del Cliente *</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nombre completo"
                  className="h-12 text-lg"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="555-123-4567"
                  className="h-12 text-lg"
                  type="tel"
                />
              </div>
            </CardContent>
          </Card>

          {/* Equipment Info */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Datos del Equipo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="equipmentType">Tipo de Equipo</Label>
                  <Select value={equipmentType} onValueChange={(v) => setEquipmentType(v as EquipmentType)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computadora">Computadora</SelectItem>
                      <SelectItem value="Impresora">Impresora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca *</Label>
                  <Input
                    id="brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="HP, Dell, Epson..."
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo *</Label>
                  <Input
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Modelo"
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Número de Serie</Label>
                  <Input
                    id="serialNumber"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="S/N"
                    className="h-12 text-base"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reportedProblem">Problema Reportado *</Label>
                <Textarea
                  id="reportedProblem"
                  value={reportedProblem}
                  onChange={(e) => setReportedProblem(e.target.value)}
                  placeholder="Describa el problema del equipo..."
                  className="min-h-24 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="internalNotes">Observaciones Internas</Label>
                <Textarea
                  id="internalNotes"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notas para el técnico..."
                  className="min-h-20 text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Accessories */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Accesorios Recibidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {(Object.keys(ACCESSORY_LABELS) as AccessoryKey[]).map((key) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={accessories[key]}
                      onCheckedChange={(checked) => handleAccessoryChange(key, checked as boolean)}
                    />
                    <Label htmlFor={key} className="text-sm cursor-pointer">
                      {ACCESSORY_LABELS[key]}
                    </Label>
                  </div>
                ))}
              </div>
              {accessories.otros && (
                <div className="mt-4">
                  <Label htmlFor="otrosDetalle">Especificar otros</Label>
                  <Input
                    id="otrosDetalle"
                    value={accessories.otrosDetalle}
                    onChange={(e) => setAccessories(prev => ({ ...prev, otrosDetalle: e.target.value }))}
                    placeholder="Detalle de otros accesorios..."
                    className="mt-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleSave(false)}
              size="lg"
              variant="secondary"
              className="flex-1 h-14 text-lg"
            >
              <Save className="w-5 h-5 mr-2" />
              Guardar Ticket
            </Button>
            <Button
              onClick={() => handleSave(true)}
              size="lg"
              className="flex-1 h-14 text-lg"
            >
              <Printer className="w-5 h-5 mr-2" />
              Guardar e Imprimir Ticket
            </Button>
          </div>
        </div>
      </div>

      {/* Print area - only visible when printing */}
      {showPrint && savedTicket && (
        <div ref={printRef} className="print-only hidden print:block">
          <TicketReceipt ticket={savedTicket} />
          <div className="page-break" />
          <AccessoryLabels ticket={savedTicket} />
        </div>
      )}
    </DashboardLayout>
  )
}
