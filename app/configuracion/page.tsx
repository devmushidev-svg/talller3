"use client"

import { useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Store, Printer, Bell, Save } from "lucide-react"

export default function ConfiguracionPage() {
  const [shopName, setShopName] = useState("Taller de Reparación")
  const [shopPhone, setShopPhone] = useState("")
  const [shopAddress, setShopAddress] = useState("")
  const [shopEmail, setShopEmail] = useState("")
  const [printerWidth, setPrinterWidth] = useState("80")
  const [printLogo, setPrintLogo] = useState(true)
  const [notifyReady, setNotifyReady] = useState(true)
  const [notifyDelivered, setNotifyDelivered] = useState(true)

  const handleSave = () => {
    // In a real app, this would save to the database
    // For the preview, settings are stored in memory
    alert("Configuración guardada correctamente")
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
            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="shopEmail">Correo Electrónico</Label>
                <Input
                  id="shopEmail"
                  value={shopEmail}
                  onChange={(e) => setShopEmail(e.target.value)}
                  placeholder="taller@email.com"
                  type="email"
                />
              </div>
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
                  <SelectItem value="58">58mm</SelectItem>
                  <SelectItem value="80">80mm</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Seleccione el ancho de papel de su impresora térmica POS
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="printLogo">Imprimir logo en tickets</Label>
                <p className="text-sm text-muted-foreground">
                  Mostrar el nombre del taller en la parte superior
                </p>
              </div>
              <Switch
                id="printLogo"
                checked={printLogo}
                onCheckedChange={setPrintLogo}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Notificaciones</CardTitle>
                <CardDescription>Alertas del sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifyReady">Alerta de equipos listos</Label>
                <p className="text-sm text-muted-foreground">
                  Mostrar alerta cuando hay equipos listos para entregar
                </p>
              </div>
              <Switch
                id="notifyReady"
                checked={notifyReady}
                onCheckedChange={setNotifyReady}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifyDelivered">Confirmación de entrega</Label>
                <p className="text-sm text-muted-foreground">
                  Pedir confirmación al marcar como entregado
                </p>
              </div>
              <Switch
                id="notifyDelivered"
                checked={notifyDelivered}
                onCheckedChange={setNotifyDelivered}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} size="lg" className="w-full">
          <Save className="mr-2 h-5 w-5" />
          Guardar Configuración
        </Button>
      </div>
    </DashboardLayout>
  )
}
