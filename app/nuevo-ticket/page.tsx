"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Ticket,
  EquipmentType,
  EQUIPMENT_LABELS,
  ACCESSORY_OPTIONS,
} from "@/lib/types"
import { Save, Printer, Loader2, Calendar, DollarSign, FileText } from "lucide-react"
import { PhotoUpload } from "@/components/photo-upload"
import { CustomerHistory } from "@/components/customer-history"
import { PrintOptions } from "@/components/print-options"

export default function NuevoTicketPage() {
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [equipmentType, setEquipmentType] = useState<EquipmentType>("computadora")
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [serialNumber, setSerialNumber] = useState("")
  const [problemDescription, setProblemDescription] = useState("")
  const [accessories, setAccessories] = useState<string[]>([])
  
  // New fields
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("")
  const [diagnosisCost, setDiagnosisCost] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [tempTicketId] = useState(() => `TKT-${Date.now()}`)
  
  const [savedTicket, setSavedTicket] = useState<Ticket | null>(null)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customerExists, setCustomerExists] = useState(false)

  // Check if customer exists when phone changes
  useEffect(() => {
    const checkCustomer = async () => {
      if (clientPhone.length >= 8) {
        try {
          const response = await fetch(`/api/customers?phone=${encodeURIComponent(clientPhone)}`)
          if (response.ok) {
            const customers = await response.json()
            if (customers.length > 0) {
              setCustomerExists(true)
              // Auto-fill name if empty
              if (!clientName && customers[0].name) {
                setClientName(customers[0].name)
              }
            } else {
              setCustomerExists(false)
            }
          }
        } catch (error) {
          console.error('Error checking customer:', error)
        }
      } else {
        setCustomerExists(false)
      }
    }
    
    const debounce = setTimeout(checkCustomer, 500)
    return () => clearTimeout(debounce)
  }, [clientPhone, clientName])

  const handleAccessoryChange = (accessory: string, checked: boolean) => {
    if (checked) {
      setAccessories((prev) => [...prev, accessory])
    } else {
      setAccessories((prev) => prev.filter((a) => a !== accessory))
    }
  }

  const resetForm = () => {
    setClientName("")
    setClientPhone("")
    setEquipmentType("computadora")
    setBrand("")
    setModel("")
    setSerialNumber("")
    setProblemDescription("")
    setAccessories([])
    setEstimatedDeliveryDate("")
    setDiagnosisCost("")
    setInternalNotes("")
    setPhotos([])
    setSavedTicket(null)
    setShowPrintDialog(false)
    setCustomerExists(false)
  }

  const handleSave = async (openPrintDialog: boolean = false) => {
    if (!clientName || !clientPhone || !problemDescription) {
      alert("Por favor complete los campos obligatorios: Nombre, Teléfono y Problema")
      return
    }

    setSaving(true)

    try {
      // Save or update customer
      await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientName,
          phone: clientPhone,
        }),
      })

      // Create ticket
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: clientName,
          client_phone: clientPhone,
          equipment_type: equipmentType,
          brand: brand || null,
          model: model || null,
          serial_number: serialNumber || null,
          problem_description: problemDescription,
          accessories,
          estimated_delivery_date: estimatedDeliveryDate || null,
          diagnosis_cost: parseFloat(diagnosisCost) || 0,
          internal_notes: internalNotes || null,
          photos,
        }),
      })

      if (!response.ok) throw new Error("Error al guardar")

      const ticket = await response.json()
      
      const parsedTicket: Ticket = {
        ...ticket,
        accessories: typeof ticket.accessories === "string" 
          ? JSON.parse(ticket.accessories) 
          : ticket.accessories || [],
        photos: typeof ticket.photos === "string"
          ? JSON.parse(ticket.photos)
          : ticket.photos || [],
      }

      setSavedTicket(parsedTicket)

      if (openPrintDialog) {
        setShowPrintDialog(true)
      } else {
        alert(`Ticket ${ticket.id} creado correctamente`)
        resetForm()
      }
    } catch (error) {
      alert("Error al guardar el ticket")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handlePrintDialogClose = (open: boolean) => {
    setShowPrintDialog(open)
    if (!open && savedTicket) {
      // Reset form when closing print dialog
      resetForm()
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Ticket</h1>
          <p className="text-muted-foreground">Registro rápido de equipos</p>
        </div>

        <div className="grid gap-6">
          {/* Client Info */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Datos del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
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
                    placeholder="9999-9999"
                    className="h-12 text-lg"
                    type="tel"
                  />
                </div>
              </div>
              
              {/* Customer history button */}
              {customerExists && clientPhone && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Cliente existente</span>
                  <CustomerHistory phone={clientPhone} name={clientName} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Equipment Info */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Datos del Equipo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="equipmentType">Tipo de Equipo</Label>
                  <Select
                    value={equipmentType}
                    onValueChange={(v) => setEquipmentType(v as EquipmentType)}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(EQUIPMENT_LABELS) as EquipmentType[]).map(
                        (type) => (
                          <SelectItem key={type} value={type}>
                            {EQUIPMENT_LABELS[type]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Input
                    id="brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="HP, Dell, Epson..."
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
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
                <Label htmlFor="problemDescription">Problema Reportado *</Label>
                <Textarea
                  id="problemDescription"
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Describa el problema del equipo..."
                  className="min-h-24 text-base"
                />
              </div>

              {/* Photo Upload */}
              <PhotoUpload
                ticketId={tempTicketId}
                photos={photos}
                onPhotosChange={setPhotos}
                maxPhotos={5}
              />
            </CardContent>
          </Card>

          {/* Accessories */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Accesorios Recibidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {ACCESSORY_OPTIONS.map((accessory) => (
                  <div key={accessory} className="flex items-center space-x-2">
                    <Checkbox
                      id={accessory}
                      checked={accessories.includes(accessory)}
                      onCheckedChange={(checked) =>
                        handleAccessoryChange(accessory, checked as boolean)
                      }
                    />
                    <Label htmlFor={accessory} className="cursor-pointer text-sm">
                      {accessory}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Información Adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="estimatedDelivery" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha Estimada de Entrega
                  </Label>
                  <Input
                    id="estimatedDelivery"
                    type="date"
                    value={estimatedDeliveryDate}
                    onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                    className="h-12"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagnosisCost" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Costo de Diagnóstico (L.)
                  </Label>
                  <Input
                    id="diagnosisCost"
                    type="number"
                    value={diagnosisCost}
                    onChange={(e) => setDiagnosisCost(e.target.value)}
                    placeholder="0.00"
                    className="h-12"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="internalNotes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notas Internas (no se imprimen en ticket cliente)
                </Label>
                <Textarea
                  id="internalNotes"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notas para el técnico, contraseñas, etc..."
                  className="min-h-20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              onClick={() => handleSave(false)}
              size="lg"
              variant="secondary"
              className="h-14 text-base"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Save className="mr-2 h-5 w-5" />
              )}
              Solo Guardar
            </Button>
            <Button
              onClick={() => handleSave(true)}
              size="lg"
              className="h-14 text-base"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Printer className="mr-2 h-5 w-5" />
              )}
              Guardar e Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* Print Dialog */}
      {savedTicket && (
        <PrintOptions 
          ticket={savedTicket} 
          open={showPrintDialog} 
          onOpenChange={handlePrintDialogClose}
        />
      )}
    </DashboardLayout>
  )
}
