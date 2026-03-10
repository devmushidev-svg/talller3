'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Store, Printer, Bell, Save } from 'lucide-react'

export default function ConfiguracionPage() {
  const [shopName, setShopName] = useState('TALLER DE REPARACIÓN')
  const [shopPhone, setShopPhone] = useState('555-000-0000')
  const [shopAddress, setShopAddress] = useState('Av. Principal #123, Col. Centro')
  const [printerWidth, setPrinterWidth] = useState('80mm')
  const [autoPrint, setAutoPrint] = useState(true)
  const [printLabels, setPrintLabels] = useState(true)
  const [lowStockAlert, setLowStockAlert] = useState(true)
  const [readyAlert, setReadyAlert] = useState(true)

  const handleSave = () => {
    // In production, this would save to a database
    alert('Configuración guardada correctamente')
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">Ajustes del sistema</p>
        </div>

        {/* Shop Info */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Datos del Taller</CardTitle>
                <CardDescription>Información que aparece en los tickets</CardDescription>
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
            <div className="grid sm:grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Printer Settings */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Printer className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Impresora</CardTitle>
                <CardDescription>Configuración de impresión térmica</CardDescription>
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

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoPrint">Imprimir automáticamente</Label>
                <p className="text-sm text-muted-foreground">
                  Abrir diálogo de impresión al guardar tickets
                </p>
              </div>
              <Switch
                id="autoPrint"
                checked={autoPrint}
                onCheckedChange={setAutoPrint}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="printLabels">Imprimir etiquetas de accesorios</Label>
                <p className="text-sm text-muted-foreground">
                  Generar etiquetas pequeñas para cada accesorio
                </p>
              </div>
              <Switch
                id="printLabels"
                checked={printLabels}
                onCheckedChange={setPrintLabels}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Bell className="w-5 h-5 text-primary" />
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
                <Label htmlFor="lowStockAlert">Alerta de stock bajo</Label>
                <p className="text-sm text-muted-foreground">
                  Mostrar alerta cuando las piezas tengan stock bajo
                </p>
              </div>
              <Switch
                id="lowStockAlert"
                checked={lowStockAlert}
                onCheckedChange={setLowStockAlert}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="readyAlert">Alerta de equipos listos</Label>
                <p className="text-sm text-muted-foreground">
                  Mostrar alerta cuando hay equipos listos para entregar
                </p>
              </div>
              <Switch
                id="readyAlert"
                checked={readyAlert}
                onCheckedChange={setReadyAlert}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} size="lg" className="w-full">
          <Save className="w-5 h-5 mr-2" />
          Guardar Configuración
        </Button>
      </div>
    </DashboardLayout>
  )
}
