"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
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
import {
  Save,
  Printer,
  Loader2,
  Calendar,
  DollarSign,
  FileText,
  Plus,
  X,
  PlusCircle,
  User,
  Cpu,
  Package,
  Keyboard,
  CheckCircle2,
} from "lucide-react"
import { PhotoUpload } from "@/components/photo-upload"
import { getLocalDateInputValue, getTomorrowDateInputValue } from "@/lib/date-utils"
import { CustomerHistory } from "@/components/customer-history"
import { CustomerTicket, type CustomerTicketHandle } from "@/components/customer-ticket"
import { AccessoryLabels, type AccessoryLabelsHandle } from "@/components/accessory-labels"

export default function NuevoTicketPage() {
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [receivedBy, setReceivedBy] = useState("Mario")
  const [equipmentType, setEquipmentType] = useState<EquipmentType>("computadora")
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [devicePassword, setDevicePassword] = useState("")
  const [problemDescription, setProblemDescription] = useState("")
  const [accessories, setAccessories] = useState<string[]>([])
  const [otherAccessoryInput, setOtherAccessoryInput] = useState("")

  // New fields — entrega estimada: siguiente día por defecto
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(
    () => getTomorrowDateInputValue()
  )
  const [diagnosisCost, setDiagnosisCost] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [tempTicketId] = useState(() => `TKT-${Date.now()}`)

  const [savedTicket, setSavedTicket] = useState<Ticket | null>(null)
  const [printSettings, setPrintSettings] = useState(() => ({
    id: "default",
    shop_name: "MULTIPLANET",
    shop_phone: "",
    shop_address: "",
    printer_width: "80mm",
  }))
  const customerTicketRef = useRef<CustomerTicketHandle>(null)
  const accessoryLabelsRef = useRef<AccessoryLabelsHandle>(null)
  const [saving, setSaving] = useState(false)
  const [customerExists, setCustomerExists] = useState(false)
  const [equipmentSelectOpen, setEquipmentSelectOpen] = useState(false)

  /** Navegación rápida: ↑ ↓ y Enter hasta “Problema”; desde Accesorios el flujo sigue con el ratón. */
  const kbReceivedByRef = useRef<HTMLInputElement>(null)
  const kbClientNameRef = useRef<HTMLInputElement>(null)
  const kbClientPhoneRef = useRef<HTMLInputElement>(null)
  const kbEquipmentTriggerRef = useRef<HTMLButtonElement>(null)
  const kbBrandRef = useRef<HTMLInputElement>(null)
  const kbModelRef = useRef<HTMLInputElement>(null)
  const kbDevicePasswordRef = useRef<HTMLInputElement>(null)
  const kbProblemRef = useRef<HTMLTextAreaElement>(null)
  const accessoriesMouseSectionRef = useRef<HTMLDivElement>(null)

  const FIELD_CHAIN_LAST = 7

  const focusKbField = useCallback((index: number) => {
    const refs = [
      kbReceivedByRef,
      kbClientPhoneRef,
      kbClientNameRef,
      kbEquipmentTriggerRef,
      kbBrandRef,
      kbModelRef,
      kbDevicePasswordRef,
      kbProblemRef,
    ] as const
    const el = refs[index]?.current
    if (!el) return
    el.focus()
    if (el instanceof HTMLInputElement && el.type !== "date" && el.type !== "number") {
      try {
        el.select()
      } catch {
        /* no-op */
      }
    }
  }, [])

  const scrollToAccessoriesAndEndKeyboard = useCallback(
    (fromEl: HTMLElement) => {
      accessoriesMouseSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
      fromEl.blur()
      requestAnimationFrame(() => {
        document.getElementById("guardar-imprimir-ticket")?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        })
      })
    },
    []
  )

  const onTicketFieldChainKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const goNext = () => {
        e.preventDefault()
        if (index >= FIELD_CHAIN_LAST) {
          scrollToAccessoriesAndEndKeyboard(e.currentTarget as HTMLElement)
          return
        }
        focusKbField(index + 1)
      }
      const goPrev = () => {
        e.preventDefault()
        if (index <= 0) return
        focusKbField(index - 1)
      }

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        if (index === 3 && equipmentSelectOpen) return
        goNext()
        return
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        if (index === 3 && equipmentSelectOpen) return
        goPrev()
        return
      }
      if (e.key === "Enter") {
        if (e.target instanceof HTMLTextAreaElement && e.shiftKey) return
        if (index === 3 && e.target instanceof HTMLButtonElement) return
        goNext()
      }
    },
    [equipmentSelectOpen, focusKbField, scrollToAccessoriesAndEndKeyboard]
  )

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
    setReceivedBy("Mario")
    setEquipmentType("computadora")
    setBrand("")
    setModel("")
    setDevicePassword("")
    setProblemDescription("")
    setAccessories([])
    setOtherAccessoryInput("")
    setEstimatedDeliveryDate(getTomorrowDateInputValue())
    setDiagnosisCost("")
    setInternalNotes("")
    setPhotos([])
    setSavedTicket(null)
    setCustomerExists(false)
  }

  const handleSave = async (openPrintDialog: boolean = false) => {
    if (!clientName || !clientPhone || !problemDescription) {
      alert("Por favor complete los campos obligatorios: Teléfono, Nombre y Problema")
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
          received_by: receivedBy.trim() || "Mario",
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
        // Carga settings antes de imprimir
        fetch("/api/settings")
          .then((r) => r.json())
          .then((data) => { if (data && !data.error) setPrintSettings(data) })
          .catch(() => {})
        // 2 copias de la orden (cliente + taller) + etiquetas de accesorios.
        // ponytail: delays entre trabajos para que los iframes de impresión no colisionen.
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
        void (async () => {
          await sleep(900)
          customerTicketRef.current?.print()
          await sleep(700)
          customerTicketRef.current?.print()
          await sleep(700)
          accessoryLabelsRef.current?.print() // no-op si no hay accesorios
        })()
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
      <div className="mx-auto max-w-4xl space-y-8">
        <PageHeader
          icon={PlusCircle}
          title="Nuevo Ticket"
          description="Registro rápido de equipos en el taller."
        />

        {/* Ayuda de navegación por teclado */}
        {!savedTicket && (
          <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-gradient-brand-soft p-4 text-sm">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
              <Keyboard className="h-5 w-5" />
            </span>
            <p className="leading-relaxed text-muted-foreground">
              <kbd className="rounded border bg-card px-1.5 py-0.5 text-xs font-medium text-foreground">↑</kbd>{" "}
              <kbd className="rounded border bg-card px-1.5 py-0.5 text-xs font-medium text-foreground">↓</kbd>{" "}
              <kbd className="rounded border bg-card px-1.5 py-0.5 text-xs font-medium text-foreground">←</kbd>{" "}
              <kbd className="rounded border bg-card px-1.5 py-0.5 text-xs font-medium text-foreground">→</kbd>{" "}
              <kbd className="rounded border bg-card px-1.5 py-0.5 text-xs font-medium text-foreground">Enter</kbd>{" "}
              para moverse entre campos hasta <strong className="text-foreground">Problema</strong>.
              En <strong className="text-foreground">Accesorios</strong> use el ratón (y el botón
              imprimir). En el cuadro de texto:{" "}
              <kbd className="rounded border bg-card px-1.5 py-0.5 text-xs font-medium text-foreground">Shift</kbd>{" "}
              + <kbd className="rounded border bg-card px-1.5 py-0.5 text-xs font-medium text-foreground">Enter</kbd>{" "}
              para nueva línea.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2.5 text-lg">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-brand-soft text-primary">
                  <User className="h-5 w-5" />
                </span>
                Datos del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="receivedBy">Recibió en taller</Label>
                  <Input
                    ref={kbReceivedByRef}
                    id="receivedBy"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    placeholder="Nombre de quien recibe el equipo"
                    className="h-11 text-base"
                    autoFocus
                    onKeyDown={(e) => onTicketFieldChainKeyDown(e, 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Por defecto Mario; cámbielo si recibe otra persona.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Teléfono *</Label>
                  <Input
                    ref={kbClientPhoneRef}
                    id="clientPhone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="9999-9999"
                    className="h-12 text-lg"
                    type="tel"
                    onKeyDown={(e) => onTicketFieldChainKeyDown(e, 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nombre del Cliente *</Label>
                  <Input
                    ref={kbClientNameRef}
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nombre completo"
                    className="h-12 text-lg"
                    onKeyDown={(e) => onTicketFieldChainKeyDown(e, 2)}
                  />
                </div>
              </div>

              {/* Customer history button */}
              {customerExists && clientPhone && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-4 py-3">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                    Cliente existente
                  </span>
                  <CustomerHistory phone={clientPhone} name={clientName} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Equipment Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2.5 text-lg">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-brand-soft text-primary">
                  <Cpu className="h-5 w-5" />
                </span>
                Datos del Equipo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="equipmentType">Tipo de Equipo</Label>
                  <Select
                    value={equipmentType}
                    open={equipmentSelectOpen}
                    onOpenChange={setEquipmentSelectOpen}
                    onValueChange={(v) => setEquipmentType(v as EquipmentType)}
                  >
                    <SelectTrigger
                      ref={kbEquipmentTriggerRef}
                      className="h-12 text-base"
                      onKeyDown={(e) => onTicketFieldChainKeyDown(e, 3)}
                    >
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
                    ref={kbBrandRef}
                    id="brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="HP, Dell, Epson..."
                    className="h-12 text-base"
                    onKeyDown={(e) => onTicketFieldChainKeyDown(e, 4)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Input
                    ref={kbModelRef}
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Modelo"
                    className="h-12 text-base"
                    onKeyDown={(e) => onTicketFieldChainKeyDown(e, 5)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="devicePassword">Contraseña del equipo</Label>
                <Input
                  ref={kbDevicePasswordRef}
                  id="devicePassword"
                  type="text"
                  autoComplete="off"
                  value={devicePassword}
                  onChange={(e) => setDevicePassword(e.target.value)}
                  placeholder="Windows, PIN, BIOS… (opcional)"
                  className="h-12 text-base"
                  onKeyDown={(e) => onTicketFieldChainKeyDown(e, 6)}
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. Queda en el expediente del ticket y en las impresiones del taller.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="problemDescription">Problema Reportado *</Label>
                <Textarea
                  ref={kbProblemRef}
                  id="problemDescription"
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Describa el problema del equipo..."
                  className="min-h-24 text-base"
                  onKeyDown={(e) => onTicketFieldChainKeyDown(e, 7)}
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

          {/* Accessories — desde aquí el flujo es con ratón; fechas, notas e imprimir */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2.5 text-lg">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-brand-soft text-primary">
                  <Package className="h-5 w-5" />
                </span>
                Accesorios Recibidos
              </CardTitle>
              {!savedTicket && (
                <p className="pl-[2.875rem] text-sm font-normal text-muted-foreground">
                  Use el ratón para marcar accesorios y completar el resto del formulario; termine con{" "}
                  <strong className="text-foreground">Guardar e imprimir</strong>.
                </p>
              )}
            </CardHeader>
            <CardContent ref={accessoriesMouseSectionRef} id="accesorios-raton">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ACCESSORY_CHECKBOX_LABELS.map((accessory) => {
                  const checked = accessories.some((a) =>
                    accessoryMatchesCheckbox(a, accessory)
                  )
                  return (
                    <Label
                      key={accessory}
                      htmlFor={accessory}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                        checked
                          ? "border-primary/40 bg-primary/5 text-foreground"
                          : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <Checkbox
                        id={accessory}
                        checked={checked}
                        onCheckedChange={(c) =>
                          handleAccessoryChange(accessory, c as boolean)
                        }
                      />
                      {accessory}
                    </Label>
                  )
                })}
              </div>
              <div className="mt-6 space-y-3 border-t border-border/70 pt-5">
                <Label>Otro accesorio o detalle</Label>
                <p className="text-xs text-muted-foreground">
                  Puede añadir varios accesorios o detalles.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={otherAccessoryInput}
                    onChange={(e) => setOtherAccessoryInput(e.target.value)}
                    placeholder="Ej. Disco externo, control…"
                    className="h-11 sm:flex-1"
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
                    className="h-11 shrink-0"
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
                          className="flex items-start justify-between gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2"
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
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2.5 text-lg">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-brand-soft text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-2">
                <Label
                  htmlFor="estimatedDelivery"
                  className="order-1 flex items-center gap-2 text-sm font-medium leading-none sm:order-1"
                >
                  <Calendar className="h-4 w-4 shrink-0" />
                  Fecha Estimada de Entrega
                </Label>
                <Label
                  htmlFor="diagnosisCost"
                  className="order-3 flex items-center gap-2 text-sm font-medium leading-none sm:order-2"
                >
                  <DollarSign className="h-4 w-4 shrink-0" />
                  Costo de Diagnóstico (L.)
                </Label>
                <Input
                  id="estimatedDelivery"
                  type="date"
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  className="order-2 h-12 w-full sm:order-3"
                  min={getLocalDateInputValue()}
                />
                <Input
                  id="diagnosisCost"
                  type="number"
                  value={diagnosisCost}
                  onChange={(e) => setDiagnosisCost(e.target.value)}
                  placeholder="0.00"
                  className="order-4 h-12 w-full sm:order-4"
                  min="0"
                  step="0.01"
                />
                <p className="order-5 text-xs leading-snug text-muted-foreground sm:col-span-2">
                  Por defecto la fecha de entrega es el siguiente día; cámbiela si corresponde otra fecha.
                </p>
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
                id="guardar-imprimir-ticket"
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
                Guardar e imprimir todo
              </Button>
            </div>
          ) : (
            <Card className="animate-scale-in border-[var(--success)]/40 bg-[color-mix(in_oklch,var(--success)_8%,transparent)]">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color-mix(in_oklch,var(--success)_16%,transparent)] text-[var(--success)]">
                      <CheckCircle2 className="h-7 w-7" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-foreground">
                        Ticket N°{" "}
                        {savedTicket.ticket_seq != null ? savedTicket.ticket_seq : savedTicket.id}{" "}
                        guardado
                      </p>
                      <p className="text-sm text-muted-foreground">
                        El ticket quedó registrado correctamente.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleNewTicket}
                    size="lg"
                    variant="outline"
                    className="h-12 w-full text-base"
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Crear Nuevo Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {savedTicket && (
        <div className="pointer-events-none fixed left-[-10000px] top-0 w-[480px] opacity-0" aria-hidden>
          <CustomerTicket
            ref={customerTicketRef}
            ticket={savedTicket}
            settings={printSettings}
            hideTrigger
          />
          <AccessoryLabels ref={accessoryLabelsRef} ticket={savedTicket} hideTrigger />
        </div>
      )}
    </DashboardLayout>
  )
}
