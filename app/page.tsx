"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ClipboardList, CheckCircle, Truck } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { store } from "@/lib/store"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    receivedToday: 0,
    active: 0,
    ready: 0,
    deliveredToday: 0,
    chartData: [] as { name: string; tickets: number }[],
  })

  useEffect(() => {
    const data = store.getStats()
    setStats(data)
  }, [])

  const statCards = [
    {
      title: "Equipos Recibidos Hoy",
      value: stats.receivedToday,
      icon: Package,
      color: "text-primary",
    },
    {
      title: "Tickets Activos",
      value: stats.active,
      icon: ClipboardList,
      color: "text-warning",
    },
    {
      title: "Listos para Entregar",
      value: stats.ready,
      icon: CheckCircle,
      color: "text-success",
    },
    {
      title: "Entregados Hoy",
      value: stats.deliveredToday,
      icon: Truck,
      color: "text-muted-foreground",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel de Control</h1>
          <p className="text-muted-foreground">Resumen del día</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tickets por Día</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="name"
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
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar
                    dataKey="tickets"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name="Tickets"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
