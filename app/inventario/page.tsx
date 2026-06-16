"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Part,
  PartCondition,
  PART_CATEGORIES,
  PART_CONDITION_LABELS,
  PART_CONDITION_COLORS,
} from "@/lib/types"
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Package,
  Boxes,
  Tag,
  Layers,
  Ruler,
} from "lucide-react"

interface PartFormData {
  name: string
  model: string
  size: string
  category: string
  condition: PartCondition
  notes: string
  quantity: number
}

const emptyPart: PartFormData = {
  name: "",
  model: "",
  size: "",
  category: "",
  condition: "bueno",
  notes: "",
  quantity: 1,
}

/** Color por condición (variable CSS, se adapta a claro/oscuro) — barra de acento e icono */
const CONDITION_VAR: Record<PartCondition, string> = {
  bueno: "var(--success)",
  medio: "var(--warning)",
  malo: "var(--destructive)",
}

export default function InventarioPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [conditionFilter, setConditionFilter] = useState("all")
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<Part | null>(null)
  const [formData, setFormData] = useState<PartFormData>(emptyPart)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchParts = async () => {
    try {
      const response = await fetch("/api/parts")
      const data = await response.json()
      setParts(data)
    } catch (error) {
      console.error("Error fetching parts:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParts()
  }, [])

  const filteredParts = parts.filter((part) => {
    const matchesSearch =
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.model && part.model.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === "all" || part.category === categoryFilter
    const matchesCondition = conditionFilter === "all" || part.condition === conditionFilter
    return matchesSearch && matchesCategory && matchesCondition
  })

  const totalUnits = parts.reduce((sum, p) => sum + (p.quantity || 0), 0)
  const categoriesInUse = new Set(parts.map((p) => p.category)).size

  const handleOpenDialog = (part?: Part) => {
    if (part) {
      setEditingPart(part)
      setFormData({
        name: part.name,
        model: part.model || "",
        size: part.size || "",
        category: part.category,
        condition: part.condition || "bueno",
        notes: part.notes || "",
        quantity: part.quantity,
      })
    } else {
      setEditingPart(null)
      setFormData(emptyPart)
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.category) {
      alert("Por favor complete los campos obligatorios")
      return
    }

    setSaving(true)

    try {
      if (editingPart) {
        await fetch(`/api/parts/${editingPart.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
      } else {
        await fetch("/api/parts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
      }

      setIsDialogOpen(false)
      fetchParts()
    } catch (error) {
      console.error("Error saving part:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await fetch(`/api/parts/${deleteId}`, { method: "DELETE" })
        setDeleteId(null)
        fetchParts()
      } catch (error) {
        console.error("Error deleting part:", error)
      }
    }
  }

  const statCards = [
    {
      title: "Piezas distintas",
      value: parts.length,
      icon: Package,
      tint: "var(--chart-1)",
    },
    {
      title: "Unidades en stock",
      value: totalUnits,
      icon: Boxes,
      tint: "var(--chart-2)",
    },
    {
      title: "Categorías activas",
      value: categoriesInUse,
      icon: Layers,
      tint: "var(--warning)",
    },
    {
      title: "Resultados visibles",
      value: filteredParts.length,
      icon: Tag,
      tint: "var(--success)",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          icon={Package}
          title="Inventario de Piezas"
          description={`${parts.length} pieza${parts.length !== 1 ? "s" : ""} almacenada${parts.length !== 1 ? "s" : ""} en el taller.`}
          action={
            <Button onClick={() => handleOpenDialog()} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Agregar pieza
            </Button>
          }
        />

        {/* ── Métricas ───────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 stagger">
          {statCards.map((c) => (
            <div
              key={c.title}
              className="hover-lift relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 sm:p-5"
            >
              <div
                className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-[0.12]"
                style={{ background: c.tint }}
                aria-hidden
              />
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${c.tint} 15%, transparent)`,
                    color: c.tint,
                  }}
                >
                  <c.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  {loading ? (
                    <div className="h-7 w-10 rounded-md shimmer" />
                  ) : (
                    <p className="text-2xl font-bold leading-none tabular-nums">
                      {c.value}
                    </p>
                  )}
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {c.title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filtros ───────────────────────────── */}
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {PART_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={conditionFilter} onValueChange={setConditionFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="bueno">Bueno</SelectItem>
                  <SelectItem value="medio">Regular</SelectItem>
                  <SelectItem value="malo">Malo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Listado de piezas ───────────────────── */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-2xl border border-border/70 bg-card p-5"
              >
                <div className="h-5 w-28 rounded shimmer" />
                <div className="mt-4 h-6 w-40 rounded shimmer" />
                <div className="mt-3 h-4 w-full rounded shimmer" />
                <div className="mt-2 h-4 w-2/3 rounded shimmer" />
              </div>
            ))}
          </div>
        ) : filteredParts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand-soft">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium">No se encontraron piezas</p>
              <p className="text-sm text-muted-foreground">
                {parts.length === 0
                  ? "Empieza agregando tu primera pieza al inventario."
                  : "Prueba ajustando la búsqueda o los filtros."}
              </p>
            </div>
            {parts.length === 0 && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar primera pieza
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger">
            {filteredParts.map((part) => {
              const condition = (part.condition as PartCondition) || "bueno"
              const color = CONDITION_VAR[condition] || CONDITION_VAR.bueno
              return (
                <article
                  key={part.id}
                  className="hover-lift group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card"
                >
                  {/* Barra de acento por condición */}
                  <span
                    className="absolute inset-y-0 left-0 w-1.5"
                    style={{ background: color }}
                    aria-hidden
                  />

                  <div className="flex flex-1 flex-col gap-3 p-5 pl-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`,
                            color,
                          }}
                        >
                          <Package className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold leading-tight">
                            {part.name}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Tag className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{part.category}</span>
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`${
                          PART_CONDITION_COLORS[condition] || PART_CONDITION_COLORS.bueno
                        } shrink-0`}
                      >
                        {PART_CONDITION_LABELS[condition] || "Bueno"}
                      </Badge>
                    </div>

                    {(part.model || part.size) && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {part.model && (
                          <span className="flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{part.model}</span>
                          </span>
                        )}
                        {part.size && (
                          <span className="flex items-center gap-1.5">
                            <Ruler className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{part.size}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {part.notes && (
                      <p className="line-clamp-2 text-sm leading-snug text-foreground/80">
                        {part.notes}
                      </p>
                    )}

                    <div className="mt-auto flex items-center gap-2 pt-1">
                      <Boxes className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">En stock:</span>
                      <Badge variant="secondary" className="font-mono tabular-nums">
                        {part.quantity}
                      </Badge>
                    </div>
                  </div>

                  {/* Pie: acciones */}
                  <div className="flex items-center justify-end gap-1 border-t border-border/70 bg-muted/30 px-5 py-2.5 pl-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(part)}
                    >
                      <Pencil className="mr-1.5 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(part.id)}
                      aria-label="Eliminar pieza"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPart ? "Editar Pieza" : "Agregar Pieza"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Pantalla LCD"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  placeholder="Ej: LP156WH4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Tamaño</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                  placeholder="Ej: 15.6 pulgadas"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {PART_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Estado *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(v) => setFormData({ ...formData, condition: v as PartCondition })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bueno">Bueno</SelectItem>
                    <SelectItem value="medio">Regular</SelectItem>
                    <SelectItem value="malo">Malo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Notas adicionales sobre la pieza..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPart ? "Guardar Cambios" : "Agregar Pieza"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pieza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La pieza será eliminada
              permanentemente del inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
