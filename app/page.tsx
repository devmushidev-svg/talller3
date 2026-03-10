"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Package, 
  ClipboardList, 
  CheckCircle, 
  Truck, 
  Loader2,
  DollarSign,
  Clock,
  TrendingUp,
  AlertCircle,
  Monitor,
  Printer,
  Smartphone
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { EQUIPMENT_LABELS } from "@/lib/types"

interface Stats {
  receivedToday: number
  activeTickets: number
  readyForPickup: number
  deliveredToday: number
  weekTickets: number
  weekRevenue: number
  monthTickets: number
  monthRevenue: number
  monthDelivered: number
  avgRepairDays: number
  statusBreakdown: Record<string, number>
  equipmentBreakdown: Record<string, number>
  ticketsPerDay: { date: string; recibidos: number; entregados: number }[]
  pendingPayments: number
}

const statusColors: Record<string, string> = {
  recibido: "#3b82f6",
  en_diagnostico: "#f59e0b",
  en_reparacion: "#f97316",
  listo: "#22c55e",
  entregado: "#6b7280",
}

const statusLabels: Record<string, string> = {
  recibido: "Recibido",
  en_diagnostico: "Diagnóstico",
  en_reparacion: "Reparación",
  listo: "Listo",
  entregado: "Entregado",
}

const equipmentIcons: Record<string, typeof Monitor> = {
  computadora: Monitor,
  laptop: Monitor,
  impresora: Printer,
  celular: Smartphone,
  tablet: Smartphone,
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  const todayCards = [
    {
      title: "Recibidos Hoy",
      value: stats?.receivedToday ?? 0,
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Activos",
      value: stats?.activeTickets ?? 0,
      icon: ClipboardList,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Listos",
      value: stats?.readyForPickup ?? 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Entregados Hoy",
      value: stats?.deliveredToday ?? 0,
      icon: Truck,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ]

  const statusData = Object.entries(stats?.statusBreakdown || {})
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({
      name: statusLabels[name] || name,
      value,
      color: statusColors[name] || "#6b7280"
    }))

  const equipmentData = Object.entries(stats?.equipmentBreakdown || {})
    .map(([name, value]) => ({
      name: EQUIPMENT_LABELS[name as keyof typeof EQUIPMENT_LABELS] || name,
      value,
    }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel de Control</h1>
          <p className="text-muted-foreground">Resumen del taller</p>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {todayCards.map((stat) => (
            <Card key={stat.title} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weekly & Monthly Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Esta Semana</span>
              </div>
              <p className="text-2xl font-bold">{stats?.weekTickets ?? 0}</p>
              <p className="text-xs text-muted-foreground">tickets recibidos</p>
              <p className="text-lg font-semibold text-green-600 mt-1">
                ${(stats?.weekRevenue ?? 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Este Mes</span>
              </div>
              <p className="text-2xl font-bold">{stats?.monthDelivered ?? 0}</p>
              <p className="text-xs text-muted-foreground">entregados</p>
              <p className="text-lg font-semibold text-green-600 mt-1">
                ${(stats?.monthRevenue ?? 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium">Tiempo Promedio</span>
              </div>
              <p className="text-2xl font-bold">{stats?.avgRepairDays ?? 0}</p>
              <p className="text-xs text-muted-foreground">días de reparación</p>
            </CardContent>
          </Card>
          
          <Card className={`border-border ${(stats?.pendingPayments ?? 0) > 0 ? 'border-amber-300 bg-amber-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className={`h-4 w-4 ${(stats?.pendingPayments ?? 0) > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">Por Cobrar</span>
              </div>
              <p className="text-2xl font-bold">${(stats?.pendingPayments ?? 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">pagos pendientes</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Bar Chart - Tickets per day */}
          <Card className="border-border lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Actividad Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.ticketsPerDay ?? []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="recibidos"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      name="Recibidos"
                    />
                    <Bar
                      dataKey="entregados"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                      name="Entregados"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Pie Chart */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Estado de Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${value}`}
                        labelLine={false}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Sin datos
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {statusData.map((entry, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <span 
                      className="w-2 h-2 rounded-full mr-1" 
                      style={{ backgroundColor: entry.color }}
                    />
                    {entry.name}: {entry.value}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Equipment Breakdown */}
        {equipmentData.length > 0 && (
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Equipos Activos por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {equipmentData.map((item, index) => {
                  const IconComponent = equipmentIcons[Object.keys(EQUIPMENT_LABELS).find(
                    key => EQUIPMENT_LABELS[key as keyof typeof EQUIPMENT_LABELS] === item.name
                  ) || ''] || Monitor
                  
                  return (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <IconComponent className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-lg font-bold">{item.value}</p>
                        <p className="text-xs text-muted-foreground">{item.name}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
