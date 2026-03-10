"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
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
import { Store, Printer, Save, Loader2 } from "lucide-react"

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
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">Ajustes del sistema</p>
        </div>

        {/* Shop Info */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Datos del Taller</CardTitle>
                <CardDescription>
                  Información que aparece en los tickets
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shopName">Nombre del Taller</Label>
              <Input
                id="shopName"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Nombre del taller"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopPhone">Teléfono</Label>
              <Input
                id="shopPhone"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                placeholder="555-000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopAddress">Dirección</Label>
              <Input
                id="shopAddress"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="Dirección del taller"
              />
            </div>
          </CardContent>
        </Card>

        {/* Printer Settings */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Printer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Impresora</CardTitle>
                <CardDescription>
                  Configuración de impresión térmica
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="printerWidth">Ancho de Papel</Label>
              <Select value={printerWidth} onValueChange={setPrinterWidth}>
                <SelectTrigger className="w-48">
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

        {/* Save Button */}
        <Button onClick={handleSave} size="lg" className="w-full" disabled={saving}>
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
