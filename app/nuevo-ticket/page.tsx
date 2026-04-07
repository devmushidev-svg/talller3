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
  ACCESSORY_CHECKBOX_LABELS,
  accessoryMatchesCheckbox,
  isStandardAccessoryStored,
} from "@/lib/types"
import { Save, Printer, Loader2, Calendar, DollarSign, FileText, Plus, X } from "lucide-react"
import { PhotoUpload } from "@/components/photo-upload"
import { CustomerHistory } from "@/components/customer-history"
import { PrintCustomer } from "@/components/print-customer"
import { PrintInternal } from "@/components/print-internal"

/** Valor para <input type="date"> en hora local (evita desfase UTC). */
function getLocalDateInputValue(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export default function NuevoTicketPage() {
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [equipmentType, setEquipmentType] = useState<EquipmentType>("computadora")
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [devicePassword, setDevicePassword] = useState("")
  const [problemDescription, setProblemDescription] = useState("")
  const [accessories, setAccessories] = useState<string[]>([])
  const [otherAccessoryInput, setOtherAccessoryInput] = useState("")
  
  // New fields — entrega estimada: hoy por defecto
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(
    () => getLocalDateInputValue()
  )
  const [diagnosisCost, setDiagnosisCost] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [tempTicketId] = useState(() => `TKT-${Date.now()}`)
  
  const [savedTicket, setSavedTicket] = useState<Ticket | null>(null)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [showInternalPrint, setShowInternalPrint] = useState(false)
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

  const handleAccessoryChange = (checkboxLabel: string, checked: boolean) => {
    setAccessories((prev) => {
      if (checked) {
        if (prev.some((a) => accessoryMatchesCheckbox(a, checkboxLabel))) return prev
        return [...prev, checkboxLabel]
      }
      return prev.filter((a) => !accessoryMatchesCheckbox(a, checkboxLabel))
    })
  }

  const handleAddOtherAccessory = () => {
    const text = otherAccessoryInput.trim()
    if (!text) return
    setAccessories((prev) => [...prev, text])
    setOtherAccessoryInput("")
  }

  const removeAccessory = (item: string) => {
    setAccessories((prev) => prev.filter((a) => a !== item))
  }

  const resetForm = () => {
    setClientName("")
    setClientPhone("")
    setEquipmentType("computadora")
    setBrand("")
    setModel("")
    setDevicePassword("")
    setProblemDescription("")
    setAccessories([])
    setOtherAccessoryInput("")
    setEstimatedDeliveryDate(getLocalDateInputValue())
    setDiagnosisCost("")
    setInternalNotes("")
    setPhotos([])
    setSavedTicket(null)
    setShowPrintDialog(false)
    setShowInternalPrint(false)
    setCustomerExists(false)
  }

  const handleSave = async (openPrintDialog: boolean = false) => {
    if (!clientName || !clientPhone || !problemDescription) {
      alert("Por favor complete los campos obligatorios: Nombre, Teléfono y Problema")
      return
    }

    setSaving(true)

    try {
      const customerRes = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientName,
          phone: clientPhone,
        }),
      })
      if (!customerRes.ok) {
        const errBody = await customerRes.json().catch(() => ({}))
        throw new Error(
          typeof errBody.error === "string" ? errBody.error : "Error al guardar el cliente"
        )
      }

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
          serial_number: null,
          device_password: devicePassword.trim() || null,
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

  const handleNewTicket = () => {
    resetForm()
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="devicePassword">Contraseña del equipo</Label>
                <Input
                  id="devicePassword"
                  type="password"
                  autoComplete="new-password"
                  value={devicePassword}
                  onChange={(e) => setDevicePassword(e.target.value)}
                  placeholder="Windows, PIN, BIOS… (opcional)"
                  className="h-12 text-base font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. Queda en el expediente del ticket y en las impresiones del taller.
                </p>
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
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
                {ACCESSORY_CHECKBOX_LABELS.map((accessory) => (
                  <div key={accessory} className="flex items-center space-x-2">
                    <Checkbox
                      id={accessory}
                      checked={accessories.some((a) =>
                        accessoryMatchesCheckbox(a, accessory)
                      )}
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
              <div className="mt-6 space-y-3 border-t border-border pt-4">
                <Label>Otro accesorio o detalle</Label>
                <p className="text-xs text-muted-foreground">
                  Puede añadir varios accesorios o detalles.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={otherAccessoryInput}
                    onChange={(e) => setOtherAccessoryInput(e.target.value)}
                    placeholder="Ej. Disco externo, control…"
                    className="sm:flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddOtherAccessory()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0"
                    onClick={handleAddOtherAccessory}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir
                  </Button>
                </div>
                {accessories.filter(isStandardAccessoryStored).length <
                  accessories.length && (
                  <ul className="space-y-2 text-sm">
                    {accessories
                      .filter((a) => !isStandardAccessoryStored(a))
                      .map((item) => (
                        <li
                          key={item}
                          className="flex items-start justify-between gap-2 rounded-md bg-muted px-3 py-2"
                        >
                          <span>{item}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => removeAccessory(item)}
                            aria-label="Quitar"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                  </ul>
                )}
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
                  <p className="text-xs text-muted-foreground">
                    Por defecto es hoy; cámbiela si la entrega será otro día.
                  </p>
                  <Input
                    id="estimatedDelivery"
                    type="date"
                    value={estimatedDeliveryDate}
                    onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                    className="h-12"
                    min={getLocalDateInputValue()}
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
          {!savedTicket ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                onClick={() => handleSave(false)}
                size="lg"
                variant="outline"
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
                className="h-14 text-base bg-primary hover:bg-primary/90"
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
          ) : (
            <Card className="border-green-500 bg-green-50 dark:bg-green-950">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                    <Save className="h-6 w-6" />
                    <span className="text-lg font-semibold">Ticket {savedTicket.id} guardado</span>
                  </div>
                  
                  {/* Ticket Cliente - Impresora Normal */}
                  <div className="p-4 bg-background rounded-lg border-2 border-primary">
                    <div className="text-center mb-3">
                      <h3 className="font-semibold text-foreground">Para el Cliente</h3>
                      <p className="text-sm text-muted-foreground">Impresora normal - Media carta</p>
                    </div>
                    <Button
                      onClick={() => setShowPrintDialog(true)}
                      size="lg"
                      className="w-full h-14 text-base bg-primary hover:bg-primary/90"
                    >
                      <FileText className="mr-2 h-5 w-5" />
                      Imprimir Orden de Trabajo
                    </Button>
                  </div>

                  {/* Uso Interno - POS y Etiquetas */}
                  <div className="p-4 bg-background rounded-lg border">
                    <div className="text-center mb-3">
                      <h3 className="font-semibold text-foreground">Uso Interno del Taller</h3>
                      <p className="text-sm text-muted-foreground">Impresora POS y etiquetas</p>
                    </div>
                    <Button
                      onClick={() => setShowInternalPrint(true)}
                      size="lg"
                      variant="secondary"
                      className="w-full h-14 text-base"
                    >
                      <Printer className="mr-2 h-5 w-5" />
                      Imprimir POS / Etiquetas
                    </Button>
                  </div>

                  {/* Nuevo Ticket */}
                  <Button
                    onClick={handleNewTicket}
                    size="lg"
                    variant="outline"
                    className="w-full h-12 text-base"
                  >
                    Crear Nuevo Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Print Dialogs */}
      {savedTicket && (
        <>
          <PrintCustomer 
            ticket={savedTicket} 
            open={showPrintDialog} 
            onOpenChange={setShowPrintDialog}
          />
          <PrintInternal 
            ticket={savedTicket} 
            open={showInternalPrint} 
            onOpenChange={setShowInternalPrint}
          />
        </>
      )}
    </DashboardLayout>
  )
}
