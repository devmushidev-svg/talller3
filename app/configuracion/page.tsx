"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Settings,
  Store,
  Printer,
  Save,
  Loader2,
  Phone,
  MapPin,
} from "lucide-react"

export default function ConfiguracionPage() {
  const [shopName, setShopName] = useState("Mi Taller")
  const [shopPhone, setShopPhone] = useState("")
  const [shopAddress, setShopAddress] = useState("")
  const [printerWidth, setPrinterWidth] = useState("80mm")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings")
        const data = await response.json()
        setShopName(data.shop_name || "Mi Taller")
        setShopPhone(data.shop_phone || "")
        setShopAddress(data.shop_address || "")
        setPrinterWidth(data.printer_width || "80mm")
      } catch (error) {
        console.error("Error fetching settings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_name: shopName,
          shop_phone: shopPhone,
          shop_address: shopAddress,
          printer_width: printerWidth,
        }),
      })
      alert("Configuración guardada correctamente")
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Error al guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl space-y-8">
          <PageHeader
            icon={Settings}
            title="Configuración"
            description="Ajustes del taller y la impresión."
          />
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/70 bg-card p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-xl shimmer" />
                  <div className="space-y-2">
                    <div className="h-5 w-40 rounded shimmer" />
                    <div className="h-4 w-56 rounded shimmer" />
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="h-10 w-full rounded-md shimmer" />
                  <div className="h-10 w-full rounded-md shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-8">
        <PageHeader
          icon={Settings}
          title="Configuración"
          description="Ajustes del taller y la impresión."
          action={
            <Button onClick={handleSave} size="lg" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Save className="mr-2 h-5 w-5" />
              )}
              Guardar
            </Button>
          }
        />

        <div className="space-y-6 stagger">
          {/* ── Datos del taller ───────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor:
                      "color-mix(in oklch, var(--chart-1) 15%, transparent)",
                    color: "var(--chart-1)",
                  }}
                >
                  <Store className="h-5 w-5" />
                </span>
                <div className="space-y-0.5">
                  <CardTitle className="text-lg">Datos del Taller</CardTitle>
                  <CardDescription>
                    Información que aparece en los tickets
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="shopName">Nombre del Taller</Label>
                <Input
                  id="shopName"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Nombre del taller"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="shopPhone"
                    className="flex items-center gap-1.5"
                  >
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Teléfono
                  </Label>
                  <Input
                    id="shopPhone"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    placeholder="555-000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="shopAddress"
                    className="flex items-center gap-1.5"
                  >
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Dirección
                  </Label>
                  <Input
                    id="shopAddress"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    placeholder="Dirección del taller"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Impresora ──────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor:
                      "color-mix(in oklch, var(--chart-2) 15%, transparent)",
                    color: "var(--chart-2)",
                  }}
                >
                  <Printer className="h-5 w-5" />
                </span>
                <div className="space-y-0.5">
                  <CardTitle className="text-lg">Impresora</CardTitle>
                  <CardDescription>
                    Configuración de impresión térmica
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="printerWidth">Ancho de Papel</Label>
                <Select value={printerWidth} onValueChange={setPrinterWidth}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm</SelectItem>
                    <SelectItem value="80mm">80mm</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Seleccione el ancho de papel de su impresora térmica POS
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guardar (acción principal, ancho completo) */}
        <Button
          onClick={handleSave}
          size="lg"
          className="w-full"
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Save className="mr-2 h-5 w-5" />
          )}
          Guardar Configuración
        </Button>
      </div>
    </DashboardLayout>
  )
}
