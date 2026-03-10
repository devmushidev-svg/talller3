"use client"

import { useState, useRef } from "react"
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
import { Save, Printer, Loader2 } from "lucide-react"
import { TicketReceipt } from "@/components/ticket-receipt"
import { AccessoryLabels } from "@/components/accessory-labels"

export default function NuevoTicketPage() {
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [equipmentType, setEquipmentType] = useState<EquipmentType>("computadora")
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [serialNumber, setSerialNumber] = useState("")
  const [problemDescription, setProblemDescription] = useState("")
  const [accessories, setAccessories] = useState<string[]>([])
  const [savedTicket, setSavedTicket] = useState<Ticket | null>(null)
  const [showPrint, setShowPrint] = useState(false)
  const [saving, setSaving] = useState(false)

  const printRef = useRef<HTMLDivElement>(null)

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
    setSavedTicket(null)
    setShowPrint(false)
  }

  const handleSave = async (shouldPrint: boolean = false) => {
    if (!clientName || !clientPhone || !problemDescription) {
      alert("Por favor complete los campos obligatorios")
      return
    }

    setSaving(true)

    try {
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
        }),
      })

      if (!response.ok) throw new Error("Error al guardar")

      const ticket = await response.json()
      
      // Parse accessories back to array if it's a string
      const parsedTicket: Ticket = {
        ...ticket,
        accessories: typeof ticket.accessories === "string" 
          ? JSON.parse(ticket.accessories) 
          : ticket.accessories || [],
      }

      setSavedTicket(parsedTicket)

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
      alert("Error al guardar el ticket")
      console.error(error)
    } finally {
      setSaving(false)
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
            <CardContent className="grid gap-4 sm:grid-cols-2">
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

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => handleSave(false)}
              size="lg"
              variant="secondary"
              className="h-14 flex-1 text-lg"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Save className="mr-2 h-5 w-5" />
              )}
              Guardar Ticket
            </Button>
            <Button
              onClick={() => handleSave(true)}
              size="lg"
              className="h-14 flex-1 text-lg"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Printer className="mr-2 h-5 w-5" />
              )}
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
