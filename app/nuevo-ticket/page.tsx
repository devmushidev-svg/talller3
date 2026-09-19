"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Loader2,
  Package,
  PlusCircle,
  Printer,
  Save,
  User,
} from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PhotoUpload } from "@/components/photo-upload"
import { CustomerHistory } from "@/components/customer-history"
import {
  CustomerTicket,
  type CustomerTicketHandle,
} from "@/components/customer-ticket"
import {
  AccessoryLabels,
  type AccessoryLabelsHandle,
} from "@/components/accessory-labels"
import {
  ACCESSORY_CHECKBOX_LABELS,
  EQUIPMENT_LABELS,
  EQUIPMENT_PICKER_TYPES,
  accessoryMatchesCheckbox,
  equipoPuedeTenerClave,
  isStandardAccessoryStored,
  type EquipmentType,
  type Ticket,
} from "@/lib/types"
import { getTomorrowDateInputValue } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { sugerirProblemas } from "./problemas"
import { toast } from "sonner"

/**
 * Alta de ticket en tres pasos.
 *
 * Antes era un formulario largo de una sola pantalla: quien recibe un equipo
 * en el mostrador tenia que leer todo para saber que faltaba. Ahora cada paso
 * hace una sola pregunta y el paso 1 no deja avanzar sin lo que de verdad hace
 * falta (telefono y nombre). Del paso 2 en adelante solo se pide lo que
 * identifica el equipo; el resto es opcional a proposito, porque un accesorio
 * sin marcar no debe frenar a alguien con un cliente esperando enfrente.
 */

const PASOS = [
  { n: 1, titulo: "Cliente", icon: User },
  { n: 2, titulo: "Equipo", icon: Package },
  { n: 3, titulo: "Accesorios y fotos", icon: Camera },
] as const

export default function NuevoTicketPage() {
  const [paso, setPaso] = useState(1)

  // Paso 1 — cliente
  const [receivedBy, setReceivedBy] = useState("Mario")
  const [clientPhone, setClientPhone] = useState("")
  const [clientName, setClientName] = useState("")
  const [customerExists, setCustomerExists] = useState(false)

  // Paso 2 — equipo
  const [equipmentType, setEquipmentType] = useState<EquipmentType>("computadora")
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [devicePassword, setDevicePassword] = useState("")
  const [problemDescription, setProblemDescription] = useState("")
  const [confirmarSinClave, setConfirmarSinClave] = useState(false)

  // Paso 3 — accesorios, fotos y entrega
  const [accessories, setAccessories] = useState<string[]>([])
  const [otherAccessoryInput, setOtherAccessoryInput] = useState("")
  const [quiereFoto, setQuiereFoto] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(
    () => getTomorrowDateInputValue()
  )
  const [diagnosisCost, setDiagnosisCost] = useState("")

  // Modelos que ya pasaron por el taller, para no tipear "Pavilion 15" entero
  const [modelosVistos, setModelosVistos] = useState<
    { model: string; brand: string | null }[]
  >([])

  const [tempTicketId, setTempTicketId] = useState(() => `TKT-${Date.now()}`)
  const [saving, setSaving] = useState(false)
  const [savedTicket, setSavedTicket] = useState<Ticket | null>(null)
  /** Tickets ya creados en esta misma visita del cliente. */
  const [ticketsDelCliente, setTicketsDelCliente] = useState<Ticket[]>([])
  const [printSettings, setPrintSettings] = useState(() => ({
    id: "default",
    shop_name: "MULTIPLANET",
    shop_phone: "",
    shop_address: "",
    printer_width: "80mm",
  }))

  const customerTicketRef = useRef<CustomerTicketHandle>(null)
  const accessoryLabelsRef = useRef<AccessoryLabelsHandle>(null)
  const problemaRef = useRef<HTMLTextAreaElement>(null)
  const customerLookupRequestRef = useRef(0)
  const autoFilledCustomerNameRef = useRef<string | null>(null)

  // ── Busca el cliente por telefono y autocompleta el nombre ──────────
  useEffect(() => {
    const phone = clientPhone.replace(/\D/g, "")
    const requestId = ++customerLookupRequestRef.current
    setCustomerExists(false)

    if (phone.length < 8) {
      setClientName((actual) => {
        if (autoFilledCustomerNameRef.current === actual) {
          autoFilledCustomerNameRef.current = null
          return ""
        }
        return actual
      })
      return
    }

    const controller = new AbortController()
    const debounce = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/customers?phone=${encodeURIComponent(phone)}`,
          { signal: controller.signal, cache: "no-store" }
        )
        if (!response.ok) return
        const customers = await response.json()
        if (controller.signal.aborted || requestId !== customerLookupRequestRef.current) {
          return
        }
        const primero = Array.isArray(customers) ? customers[0] : undefined
        setCustomerExists(Boolean(primero))
        setClientName((actual) => {
          const previo = autoFilledCustomerNameRef.current
          if (primero?.name && (!actual || actual === previo)) {
            autoFilledCustomerNameRef.current = primero.name
            return primero.name
          }
          if (!primero?.name && previo === actual) {
            autoFilledCustomerNameRef.current = null
            return ""
          }
          return actual
        })
      } catch {
        /* abortado o sin red: el campo queda como esta */
      }
    }, 350)

    return () => {
      controller.abort()
      window.clearTimeout(debounce)
    }
  }, [clientPhone])

  // ── Modelos ya vistos para este tipo/marca ──────────────────────────
  useEffect(() => {
    if (paso !== 2) return
    const controller = new AbortController()
    const debounce = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          equipmentType: equipmentType,
          limit: "6",
        })
        if (brand.trim()) params.set("brand", brand.trim())
        if (model.trim()) params.set("q", model.trim())
        const res = await fetch(`/api/tickets/suggestions?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        })
        if (!res.ok) return
        const data = await res.json()
        setModelosVistos(Array.isArray(data?.models) ? data.models : [])
      } catch {
        // Sin red o abortado: se escribe a mano, que es lo que se hacia antes.
        setModelosVistos([])
      }
    }, 300)
    return () => {
      controller.abort()
      window.clearTimeout(debounce)
    }
  }, [paso, equipmentType, brand, model])

  // ── Validacion por paso ─────────────────────────────────────────────
  const telefonoOk = clientPhone.replace(/\D/g, "").length >= 8
  const nombreOk = clientName.trim().length >= 2
  const paso1Ok = telefonoOk && nombreOk
  const paso2Ok = brand.trim().length > 0 && model.trim().length > 0

  const handleAccessoryChange = (etiqueta: string, marcado: boolean) => {
    setAccessories((prev) => {
      if (marcado) {
        if (prev.some((a) => accessoryMatchesCheckbox(a, etiqueta))) return prev
        return [...prev, etiqueta]
      }
      return prev.filter((a) => !accessoryMatchesCheckbox(a, etiqueta))
    })
  }

  const addOtherAccessory = () => {
    const valor = otherAccessoryInput.trim()
    if (!valor) return
    setAccessories((prev) => (prev.includes(valor) ? prev : [...prev, valor]))
    setOtherAccessoryInput("")
  }

  /** Inserta la plantilla. Si termina en ":" deja el cursor al final para completar. */
  const aplicarSugerencia = useCallback((plantilla: string) => {
    setProblemDescription(plantilla)
    requestAnimationFrame(() => {
      const el = problemaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(plantilla.length, plantilla.length)
    })
  }, [])

  const sugerencias = sugerirProblemas(problemDescription, equipmentType)
  const yaEsExacto = sugerencias.some((s) => s.plantilla === problemDescription)

  const pideClave = equipoPuedeTenerClave(equipmentType)

  const irAlPaso3 = () => {
    if (!paso2Ok) return
    // Solo se confirma en equipos que PUEDEN tener clave. En una impresora la
    // pregunta no tiene sentido. Y en los que si: una clave en blanco puede
    // significar "no tiene" o "me olvide de pedirla", y la segunda se descubre
    // con el cliente ya afuera.
    if (pideClave && !devicePassword.trim()) {
      setConfirmarSinClave(true)
      return
    }
    setPaso(3)
  }

  /** Deja solo los datos del equipo en blanco; el cliente se conserva. */
  const limpiarEquipo = () => {
    setTempTicketId(`TKT-${Date.now()}`)
    setEquipmentType("computadora")
    setBrand("")
    setModel("")
    setDevicePassword("")
    setProblemDescription("")
    setAccessories([])
    setOtherAccessoryInput("")
    setQuiereFoto(false)
    setPhotos([])
    setEstimatedDeliveryDate(getTomorrowDateInputValue())
    setDiagnosisCost("")
    setSavedTicket(null)
  }

  const resetForm = () => {
    limpiarEquipo()
    setPaso(1)
    setClientPhone("")
    setClientName("")
    setCustomerExists(false)
    setTicketsDelCliente([])
    autoFilledCustomerNameRef.current = null
  }

  /** Mismo cliente, otro equipo: vuelve al paso 2 con el cliente puesto. */
  const otroEquipoDelMismoCliente = () => {
    limpiarEquipo()
    setPaso(2)
  }

  const handleSave = async (abrirImpresion: boolean) => {
    if (!paso1Ok || !paso2Ok) {
      toast.error("Faltan datos del cliente o del equipo")
      setPaso(!paso1Ok ? 1 : 2)
      return
    }

    setSaving(true)
    try {
      const customerRes = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clientName, phone: clientPhone }),
      })
      if (!customerRes.ok) {
        const err = await customerRes.json().catch(() => ({}))
        throw new Error(
          typeof err.error === "string" ? err.error : "Error al guardar el cliente"
        )
      }

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
          problem_description: problemDescription.trim() || "Sin descripción",
          accessories,
          estimated_delivery_date: estimatedDeliveryDate || null,
          diagnosis_cost: parseFloat(diagnosisCost) || 0,
          internal_notes: null,
          photos,
        }),
      })
      if (!response.ok) throw new Error("Error al guardar")

      const ticket = await response.json()
      const parsed: Ticket = {
        ...ticket,
        accessories:
          typeof ticket.accessories === "string"
            ? JSON.parse(ticket.accessories)
            : ticket.accessories || [],
        photos:
          typeof ticket.photos === "string"
            ? JSON.parse(ticket.photos)
            : ticket.photos || [],
      }
      setSavedTicket(parsed)
      setTicketsDelCliente((prev) => [...prev, parsed])

      if (abrirImpresion) {
        fetch("/api/settings")
          .then((r) => r.json())
          .then((d) => {
            if (d && !d.error) setPrintSettings(d)
          })
          .catch(() => {})
        // ponytail: esperas entre trabajos para que los iframes de impresion
        // no colisionen. Dos copias de la orden + etiquetas de accesorios.
        const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))
        void (async () => {
          await dormir(900)
          customerTicketRef.current?.print()
          await dormir(700)
          customerTicketRef.current?.print()
          await dormir(700)
          accessoryLabelsRef.current?.print()
        })()
      } else {
        toast.success(`Ticket ${ticket.id} creado correctamente`)
      }
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error ? error.message : "Error al guardar el ticket"
      )
    } finally {
      setSaving(false)
    }
  }

  // ── Pantalla de exito ───────────────────────────────────────────────
  if (savedTicket) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-lg">
          <Card className="animate-scale-in">
            <CardContent className="flex flex-col items-center gap-5 px-6 py-10 text-center">
              <span
                className="estado-tinte flex size-14 items-center justify-center rounded-2xl"
                style={
                  {
                    "--st": "var(--success)",
                    color: "var(--success-fg)",
                  } as React.CSSProperties
                }
              >
                <CheckCircle2 className="size-7" />
              </span>
              <div className="space-y-1">
                <p className="text-lg font-semibold">
                  Ticket N°{" "}
                  {savedTicket.ticket_seq != null
                    ? savedTicket.ticket_seq
                    : savedTicket.id}{" "}
                  guardado
                </p>
                <p className="text-sm text-muted-foreground">
                  {savedTicket.client_name} ·{" "}
                  {EQUIPMENT_LABELS[savedTicket.equipment_type]} {savedTicket.brand}{" "}
                  {savedTicket.model}
                </p>
              </div>

              {/* Si el cliente trajo mas de un equipo, cada uno tiene su
                  ticket y aca se ven todos los de esta visita. */}
              {ticketsDelCliente.length > 1 && (
                <ul className="w-full space-y-1 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-left text-sm">
                  <li className="pb-1 font-medium">
                    {ticketsDelCliente.length} equipos de {savedTicket.client_name}
                  </li>
                  {ticketsDelCliente.map((t) => (
                    <li key={t.id} className="text-muted-foreground">
                      <span className="tabular">
                        N° {t.ticket_seq ?? t.id}
                      </span>{" "}
                      · {EQUIPMENT_LABELS[t.equipment_type]} {t.brand} {t.model}
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid w-full gap-2 sm:grid-cols-2">
                <Button
                  onClick={otroEquipoDelMismoCliente}
                  size="lg"
                  variant="outline"
                >
                  <Package className="mr-2 size-5" />
                  Otro equipo de {savedTicket.client_name.split(" ")[0]}
                </Button>
                <Button onClick={resetForm} size="lg">
                  <PlusCircle className="mr-2 size-5" />
                  Otro cliente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          className="pointer-events-none fixed left-[-10000px] top-0 w-[480px] opacity-0"
          aria-hidden
        >
          <CustomerTicket
            ref={customerTicketRef}
            ticket={savedTicket}
            settings={printSettings}
            hideTrigger
          />
          <AccessoryLabels ref={accessoryLabelsRef} ticket={savedTicket} hideTrigger />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Nuevo ticket"
          description={
            paso > 1 && clientName
              ? `${clientName} · Paso ${paso} de 3 · ${PASOS[paso - 1].titulo}`
              : `Paso ${paso} de 3 · ${PASOS[paso - 1].titulo}`
          }
        />

        {/* Segundo equipo en adelante: se recuerda lo que ya se recibio */}
        {ticketsDelCliente.length > 0 && paso > 1 && (
          <p className="text-sm text-muted-foreground">
            Equipo {ticketsDelCliente.length + 1} de esta visita. Ya se recibió{" "}
            {ticketsDelCliente
              .map((t) => `${EQUIPMENT_LABELS[t.equipment_type]} ${t.brand}`.trim())
              .join(", ")}
            .
          </p>
        )}

        {/* ── Indicador de pasos ─────────────────────────── */}
        <ol className="flex items-center gap-2" aria-label="Progreso">
          {PASOS.map((p) => {
            const hecho = p.n < paso
            const actual = p.n === paso
            return (
              <li key={p.n} className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => p.n < paso && setPaso(p.n)}
                  disabled={p.n >= paso}
                  aria-current={actual ? "step" : undefined}
                  className={cn(
                    "flex min-h-11 flex-1 items-center gap-2 rounded-lg px-3 text-sm transition-colors",
                    actual && "bg-accent font-medium text-accent-foreground",
                    hecho && "text-foreground hover:bg-accent/60",
                    !actual && !hecho && "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums",
                      actual && "border-primary bg-primary text-primary-foreground",
                      hecho && "border-input",
                      !actual && !hecho && "border-border"
                    )}
                  >
                    {hecho ? <CheckCircle2 className="size-3.5" /> : p.n}
                  </span>
                  <span className="truncate">{p.titulo}</span>
                </button>
              </li>
            )
          })}
        </ol>

        {/* ══ PASO 1 — CLIENTE ═══════════════════════════════ */}
        {paso === 1 && (
          <Card>
            <CardContent className="pt-6">
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (paso1Ok) setPaso(2)
                }}
              onKeyDown={(e) => {
                  // Enter avanza desde cualquier campo de una linea. No se
                  // confia en el envio implicito del navegador, que no se
                  // disparo de forma fiable aca. En el textarea Enter sigue
                  // siendo salto de linea.
                  if (e.key !== "Enter") return
                  if (e.target instanceof HTMLTextAreaElement) return
                  e.preventDefault()
                  e.currentTarget.requestSubmit()
                }}
              >
              <div className="space-y-2">
                <Label htmlFor="recibio">Recibió en taller</Label>
                <Input
                  id="recibio"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  type="tel"
                  inputMode="tel"
                  autoFocus
                  placeholder="9999-9999"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  aria-invalid={clientPhone.length > 0 && !telefonoOk}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del cliente *</Label>
                <Input
                  id="nombre"
                  placeholder="Nombre completo"
                  value={clientName}
                  onChange={(e) => {
                    autoFilledCustomerNameRef.current = null
                    setClientName(e.target.value)
                  }}
                  aria-invalid={clientName.length > 0 && !nombreOk}
                />
              </div>

              {customerExists && clientPhone && (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2
                      className="size-4"
                      style={{ color: "var(--success)" }}
                    />
                    Cliente existente
                  </span>
                  <CustomerHistory phone={clientPhone} name={clientName} />
                </div>
              )}

              <div className="flex justify-end pt-1">
                <Button type="submit" size="lg" disabled={!paso1Ok}>
                  Siguiente
                  <ArrowRight className="ml-2 size-5" />
                </Button>
              </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ══ PASO 2 — EQUIPO ════════════════════════════════ */}
        {paso === 2 && (
          <Card>
            <CardContent className="pt-6">
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault()
                  irAlPaso3()
                }}
              onKeyDown={(e) => {
                  // Enter avanza desde cualquier campo de una linea. No se
                  // confia en el envio implicito del navegador, que no se
                  // disparo de forma fiable aca. En el textarea Enter sigue
                  // siendo salto de linea.
                  if (e.key !== "Enter") return
                  if (e.target instanceof HTMLTextAreaElement) return
                  e.preventDefault()
                  e.currentTarget.requestSubmit()
                }}
              >
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de equipo</Label>
                <Select
                  value={equipmentType}
                  onValueChange={(v) => {
                    const tipo = v as EquipmentType
                    setEquipmentType(tipo)
                    // Si el equipo nuevo no puede tener clave, se descarta la
                    // que hubiera quedado escrita: guardar la contrasena de una
                    // computadora en el ticket de una impresora es peor que
                    // perderla.
                    if (!equipoPuedeTenerClave(tipo)) setDevicePassword("")
                  }}
                >
                  <SelectTrigger id="tipo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_PICKER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {EQUIPMENT_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="marca">Marca *</Label>
                  <Input
                    id="marca"
                    autoFocus
                    placeholder="HP, Epson, Dell…"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo *</Label>
                  <Input
                    id="modelo"
                    placeholder="L3250, Pavilion 15…"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
              </div>

              {pideClave && (
                <div className="space-y-2">
                  <Label htmlFor="clave">Contraseña del equipo</Label>
                  <Input
                    id="clave"
                    value={devicePassword}
                    onChange={(e) => setDevicePassword(e.target.value)}
                    placeholder="Déjelo vacío si no tiene"
                  />
                </div>
              )}

              {modelosVistos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {modelosVistos.map((m) => (
                    <Button
                      key={`${m.brand}|${m.model}`}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (m.brand) setBrand(m.brand)
                        setModel(m.model)
                      }}
                    >
                      {m.brand ? `${m.brand} ${m.model}` : m.model}
                    </Button>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="problema">Problema reportado</Label>
                <Textarea
                  id="problema"
                  ref={problemaRef}
                  rows={3}
                  placeholder="Describa el problema del equipo…"
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                />

                {/* Sugerencias: se filtran con lo que se escribe */}
                {sugerencias.length > 0 && !yaEsExacto && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {sugerencias.map((s) => (
                      <Button
                        key={s.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => aplicarSugerencia(s.plantilla)}
                      >
                        {s.titulo}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setPaso(1)}
                >
                  <ArrowLeft className="mr-2 size-5" />
                  Atrás
                </Button>
                <Button type="submit" size="lg" disabled={!paso2Ok}>
                  Siguiente
                  <ArrowRight className="ml-2 size-5" />
                </Button>
              </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ══ PASO 3 — ACCESORIOS Y FOTOS ════════════════════ */}
        {paso === 3 && (
          <>
            <Card>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-3">
                  <Label>Accesorios recibidos</Label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {ACCESSORY_CHECKBOX_LABELS.map((acc) => {
                      const marcado = accessories.some((a) =>
                        accessoryMatchesCheckbox(a, acc)
                      )
                      return (
                        <Label
                          key={acc}
                          htmlFor={`acc-${acc}`}
                          className={cn(
                            "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-sm transition-colors",
                            marcado
                              ? "border-input bg-accent text-foreground"
                              : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                          )}
                        >
                          <Checkbox
                            id={`acc-${acc}`}
                            checked={marcado}
                            onCheckedChange={(c) =>
                              handleAccessoryChange(acc, c as boolean)
                            }
                          />
                          {acc}
                        </Label>
                      )
                    })}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Otro accesorio"
                      value={otherAccessoryInput}
                      onChange={(e) => setOtherAccessoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addOtherAccessory()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addOtherAccessory}
                      disabled={!otherAccessoryInput.trim()}
                    >
                      Añadir
                    </Button>
                  </div>

                  {accessories.filter((a) => !isStandardAccessoryStored(a)).length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                      {accessories
                        .filter((a) => !isStandardAccessoryStored(a))
                        .map((item) => (
                          <li key={item}>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setAccessories((prev) =>
                                  prev.filter((a) => a !== item)
                                )
                              }
                              aria-label={`Quitar ${item}`}
                            >
                              {item} ✕
                            </Button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-3 border-t border-border pt-5">
                  <Label
                    htmlFor="quiere-foto"
                    className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm"
                  >
                    <Checkbox
                      id="quiere-foto"
                      checked={quiereFoto}
                      onCheckedChange={(c) => setQuiereFoto(c as boolean)}
                    />
                    Tomar fotos del equipo
                  </Label>

                  {quiereFoto && (
                    <PhotoUpload
                      ticketId={tempTicketId}
                      photos={photos}
                      onPhotosChange={setPhotos}
                      maxPhotos={5}
                    />
                  )}
                </div>

                <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="entrega">Entrega estimada</Label>
                    <Input
                      id="entrega"
                      type="date"
                      value={estimatedDeliveryDate}
                      onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="costo">Costo de diagnóstico (L.)</Label>
                    <Input
                      id="costo"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={diagnosisCost}
                      onChange={(e) => setDiagnosisCost(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumen: lo ultimo que se ve antes de entregarle el papel al cliente */}
            <Card>
              <CardContent className="space-y-1 py-4 text-sm">
                <p className="font-medium">
                  {clientName}{" "}
                  <span className="text-muted-foreground">· {clientPhone}</span>
                </p>
                <p className="text-muted-foreground">
                  {EQUIPMENT_LABELS[equipmentType]} {brand} {model}
                  {pideClave &&
                    (devicePassword.trim() ? " · con contraseña" : " · sin contraseña")}
                </p>
                <p className="text-muted-foreground">
                  {accessories.length > 0
                    ? accessories.join(", ")
                    : "Sin accesorios"}
                  {photos.length > 0 && ` · ${photos.length} foto${photos.length > 1 ? "s" : ""}`}
                </p>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPaso(2)}
                className="sm:mr-auto"
              >
                <ArrowLeft className="mr-2 size-5" />
                Atrás
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleSave(false)}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="mr-2 size-5 animate-spin" />
                ) : (
                  <Save className="mr-2 size-5" />
                )}
                Solo guardar
              </Button>
              <Button
                id="guardar-imprimir-ticket"
                size="lg"
                onClick={() => handleSave(true)}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="mr-2 size-5 animate-spin" />
                ) : (
                  <Printer className="mr-2 size-5" />
                )}
                Guardar e imprimir
              </Button>
            </div>
          </>
        )}
      </div>

      <AlertDialog open={confirmarSinClave} onOpenChange={setConfirmarSinClave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿El equipo no tiene contraseña?</AlertDialogTitle>
            <AlertDialogDescription>
              Dejó la contraseña en blanco. Si el equipo sí tiene y no se la
              pide ahora, el cliente ya se habrá ido cuando haga falta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver a pedirla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmarSinClave(false)
                setPaso(3)
              }}
            >
              No tiene, continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
