"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Part, PART_CATEGORIES } from "@/lib/types"
import { Search, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { store } from "@/lib/store"

interface PartFormData {
  name: string
  category: string
  sku: string
  quantity: number
  min_stock: number
  cost_price: number
  sell_price: number
  supplier: string
  location: string
}

const emptyPart: PartFormData = {
  name: "",
  category: "",
  sku: "",
  quantity: 0,
  min_stock: 5,
  cost_price: 0,
  sell_price: 0,
  supplier: "",
  location: "",
}

export default function InventarioPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [parts, setParts] = useState<Part[]>([])
  const [lowStockParts, setLowStockParts] = useState<Part[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<Part | null>(null)
  const [formData, setFormData] = useState<PartFormData>(emptyPart)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadParts = () => {
    let filtered = store.searchParts(searchTerm)
    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter)
    }
    setParts(filtered)
    setLowStockParts(store.getLowStockParts())
  }

  useEffect(() => {
    loadParts()
  }, [searchTerm, categoryFilter])

  const handleOpenDialog = (part?: Part) => {
    if (part) {
      setEditingPart(part)
      setFormData({
        name: part.name,
        category: part.category,
        sku: part.sku || "",
        quantity: part.quantity,
        min_stock: part.min_stock,
        cost_price: part.cost_price,
        sell_price: part.sell_price,
        supplier: part.supplier || "",
        location: part.location || "",
      })
    } else {
      setEditingPart(null)
      setFormData(emptyPart)
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.category) {
      alert("Por favor complete los campos obligatorios")
      return
    }

    if (editingPart) {
      store.updatePart(editingPart.id, formData)
    } else {
      store.createPart(formData)
    }

    setIsDialogOpen(false)
    loadParts()
  }

  const handleDelete = () => {
    if (deleteId) {
      store.deletePart(deleteId)
      setDeleteId(null)
      loadParts()
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Inventario de Piezas
            </h1>
            <p className="text-muted-foreground">
              {parts.length} piezas registradas
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar piezas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {PART_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Pieza
            </Button>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockParts.length > 0 && (
          <Card className="border-warning bg-warning/10">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium text-warning-foreground">Stock Bajo</p>
                <p className="text-sm text-muted-foreground">
                  {lowStockParts.map((p) => p.name).join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card className="border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                    <TableHead className="hidden md:table-cell">SKU</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="hidden text-center lg:table-cell">
                      Mín.
                    </TableHead>
                    <TableHead className="text-right">Precio Venta</TableHead>
                    <TableHead className="hidden xl:table-cell">Proveedor</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No se encontraron piezas
                      </TableCell>
                    </TableRow>
                  ) : (
                    parts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{part.name}</p>
                            <p className="text-sm text-muted-foreground sm:hidden">
                              {part.category}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {part.category}
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                          {part.sku || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              part.quantity <= part.min_stock
                                ? "destructive"
                                : "secondary"
                            }
                            className="font-mono"
                          >
                            {part.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-center text-muted-foreground lg:table-cell">
                          {part.min_stock}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(part.sell_price)}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground xl:table-cell">
                          {part.supplier || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(part)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(part.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nombre de la pieza"
                />
              </div>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder="Código SKU"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Estante A1..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock">Stock Mínimo</Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  value={formData.min_stock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_stock: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost_price">Precio Costo (MXN)</Label>
                <Input
                  id="cost_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cost_price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sell_price">Precio Venta (MXN)</Label>
                <Input
                  id="sell_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sell_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sell_price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Proveedor</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) =>
                  setFormData({ ...formData, supplier: e.target.value })
                }
                placeholder="Nombre del proveedor"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
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
