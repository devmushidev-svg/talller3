'use client'

import { useState, useEffect } from 'react'
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
import { Spinner } from '@/components/ui/spinner'
import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ConfiguracionPage() {
  const { data: settings, isLoading } = useSWR<Record<string, string>>('/api/settings', fetcher)
  
  const [shopName, setShopName] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [shopEmail, setShopEmail] = useState('')
  const [printerWidth, setPrinterWidth] = useState('80')
  const [printLogo, setPrintLogo] = useState(true)
  const [notifyReady, setNotifyReady] = useState(true)
  const [notifyDelivered, setNotifyDelivered] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setShopName(settings.shop_name || '')
      setShopPhone(settings.shop_phone || '')
      setShopAddress(settings.shop_address || '')
      setShopEmail(settings.shop_email || '')
      setPrinterWidth(settings.printer_width || '80')
      setPrintLogo(settings.print_logo === 'true')
      setNotifyReady(settings.notify_ready === 'true')
      setNotifyDelivered(settings.notify_delivered === 'true')
    }
  }, [settings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: shopName,
          shop_phone: shopPhone,
          shop_address: shopAddress,
          shop_email: shopEmail,
          printer_width: printerWidth,
          print_logo: printLogo.toString(),
          notify_ready: notifyReady.toString(),
          notify_delivered: notifyDelivered.toString()
        })
      })
      mutate('/api/settings')
      alert('Configuración guardada correctamente')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar la configuración')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner className="h-8 w-8" />
        </div>
      </DashboardLayout>
    )
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
        <Button onClick={handleSave} size="lg" className="w-full" disabled={isSaving}>
          {isSaving ? <Spinner className="w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          Guardar Configuración
        </Button>
      </div>
    </DashboardLayout>
  )
}
