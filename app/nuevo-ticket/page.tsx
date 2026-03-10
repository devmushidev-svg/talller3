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
import { Ticket, EquipmentType, EQUIPMENT_LABELS, ACCESSORY_OPTIONS } from '@/lib/types'
import { Save, Printer } from 'lucide-react'
import { TicketReceipt } from '@/components/ticket-receipt'
import { AccessoryLabels } from '@/components/accessory-labels'
import { Spinner } from '@/components/ui/spinner'

export default function NuevoTicketPage() {
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('computadora')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [reportedIssue, setReportedIssue] = useState('')
  const [notes, setNotes] = useState('')
  const [accessories, setAccessories] = useState<string[]>([])
  const [savedTicket, setSavedTicket] = useState<Ticket | null>(null)
  const [showPrint, setShowPrint] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const printRef = useRef<HTMLDivElement>(null)

  const handleAccessoryChange = (accessory: string, checked: boolean) => {
    if (checked) {
      setAccessories(prev => [...prev, accessory])
    } else {
      setAccessories(prev => prev.filter(a => a !== accessory))
    }
  }

  const resetForm = () => {
    setClientName('')
    setClientPhone('')
    setClientEmail('')
    setEquipmentType('computadora')
    setBrand('')
    setModel('')
    setSerialNumber('')
    setReportedIssue('')
    setNotes('')
    setAccessories([])
    setSavedTicket(null)
    setShowPrint(false)
  }

  const handleSave = async (shouldPrint: boolean = false) => {
    if (!clientName || !clientPhone || !brand || !model || !reportedIssue) {
      alert('Por favor complete los campos obligatorios')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientPhone,
          clientEmail: clientEmail || null,
          equipmentType,
          brand,
          model,
          serialNumber: serialNumber || null,
          reportedIssue,
          notes: notes || null,
          accessories
        })
      })

      if (!response.ok) {
        throw new Error('Error al guardar el ticket')
      }

      const ticket = await response.json()
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
        alert(`Ticket ${ticket.id} creado correctamente`)
        resetForm()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar el ticket')
    } finally {
      setIsSaving(false)
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
                <Label htmlFor="clientPhone">Teléfono *</Label>
                <Input
                  id="clientPhone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="555-123-4567"
                  className="h-12 text-lg"
                  type="tel"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="clientEmail">Correo Electrónico (opcional)</Label>
                <Input
                  id="clientEmail"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="h-12 text-lg"
                  type="email"
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
                      {(Object.keys(EQUIPMENT_LABELS) as EquipmentType[]).map(type => (
                        <SelectItem key={type} value={type}>{EQUIPMENT_LABELS[type]}</SelectItem>
                      ))}
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
                <Label htmlFor="reportedIssue">Problema Reportado *</Label>
                <Textarea
                  id="reportedIssue"
                  value={reportedIssue}
                  onChange={(e) => setReportedIssue(e.target.value)}
                  placeholder="Describa el problema del equipo..."
                  className="min-h-24 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observaciones Internas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {ACCESSORY_OPTIONS.map((accessory) => (
                  <div key={accessory} className="flex items-center space-x-2">
                    <Checkbox
                      id={accessory}
                      checked={accessories.includes(accessory)}
                      onCheckedChange={(checked) => handleAccessoryChange(accessory, checked as boolean)}
                    />
                    <Label htmlFor={accessory} className="text-sm cursor-pointer">
                      {accessory}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleSave(false)}
              size="lg"
              variant="secondary"
              className="flex-1 h-14 text-lg"
              disabled={isSaving}
            >
              {isSaving ? <Spinner className="w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Guardar Ticket
            </Button>
            <Button
              onClick={() => handleSave(true)}
              size="lg"
              className="flex-1 h-14 text-lg"
              disabled={isSaving}
            >
              {isSaving ? <Spinner className="w-5 h-5 mr-2" /> : <Printer className="w-5 h-5 mr-2" />}
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
