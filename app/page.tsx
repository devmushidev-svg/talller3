'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTodayStats, getTicketsPerDay } from '@/lib/store'
import { Package, ClipboardList, CheckCircle, Truck } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useEffect, useState } from 'react'

interface Stats {
  receivedToday: number
  activeTickets: number
  readyToDeliver: number
  deliveredToday: number
}

interface DayData {
  date: string
  count: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ receivedToday: 0, activeTickets: 0, readyToDeliver: 0, deliveredToday: 0 })
  const [chartData, setChartData] = useState<DayData[]>([])

  useEffect(() => {
    setStats(getTodayStats())
    setChartData(getTicketsPerDay(7))
  }, [])

  const statCards = [
    {
      title: 'Equipos Recibidos Hoy',
      value: stats.receivedToday,
      icon: Package,
      color: 'text-chart-1'
    },
    {
      title: 'Tickets Activos',
      value: stats.activeTickets,
      icon: ClipboardList,
      color: 'text-chart-2'
    },
    {
      title: 'Listos para Entregar',
      value: stats.readyToDeliver,
      icon: CheckCircle,
      color: 'text-success'
    },
    {
      title: 'Equipos Entregados',
      value: stats.deliveredToday,
      icon: Truck,
      color: 'text-muted-foreground'
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel de Control</h1>
          <p className="text-muted-foreground">Resumen del día</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tickets por Día</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                    name="Tickets"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
