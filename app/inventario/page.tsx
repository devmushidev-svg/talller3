'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getParts, createPart, updatePart, deletePart, getLowStockParts } from '@/lib/store'
import { Part } from '@/lib/types'
import { Search, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'

const emptyPart: Omit<Part, 'id'> = {
  name: '',
  category: '',
  compatibleWith: '',
  stock: 0,
  minStock: 5,
  price: 0,
  supplier: ''
}

export default function InventarioPage() {
  const [parts, setParts] = useState<Part[]>([])
  const [lowStockParts, setLowStockParts] = useState<Part[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<Part | null>(null)
  const [formData, setFormData] = useState<Omit<Part, 'id'>>(emptyPart)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadParts = () => {
    setParts(getParts())
    setLowStockParts(getLowStockParts())
  }

  useEffect(() => {
    loadParts()
  }, [])

  const filteredParts = parts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.compatibleWith.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenDialog = (part?: Part) => {
    if (part) {
      setEditingPart(part)
      setFormData({
        name: part.name,
        category: part.category,
        compatibleWith: part.compatibleWith,
        stock: part.stock,
        minStock: part.minStock,
        price: part.price,
        supplier: part.supplier
      })
    } else {
      setEditingPart(null)
      setFormData(emptyPart)
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.category) {
      alert('Por favor complete los campos obligatorios')
      return
    }

    if (editingPart) {
      updatePart(editingPart.id, formData)
    } else {
      createPart(formData)
    }

    setIsDialogOpen(false)
    loadParts()
  }

  const handleDelete = () => {
    if (deleteId) {
      deletePart(deleteId)
      setDeleteId(null)
      loadParts()
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventario de Piezas</h1>
            <p className="text-muted-foreground">{parts.length} piezas registradas</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar piezas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
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
                  {lowStockParts.map(p => p.name).join(', ')}
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
                    <TableHead className="hidden md:table-cell">Compatible con</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">Stock Mín.</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="hidden xl:table-cell">Proveedor</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No se encontraron piezas
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{part.name}</p>
                            <p className="text-sm text-muted-foreground sm:hidden">{part.category}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{part.category}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {part.compatibleWith}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={part.stock <= part.minStock ? "destructive" : "secondary"}
                            className="font-mono"
                          >
                            {part.stock}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center text-muted-foreground">
                          {part.minStock}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(part.price)}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-muted-foreground">
                          {part.supplier}
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
              {editingPart ? 'Editar Pieza' : 'Agregar Pieza'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre de la pieza"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Cables, Cartuchos..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compatibleWith">Compatible con</Label>
              <Input
                id="compatibleWith"
                value={formData.compatibleWith}
                onChange={(e) => setFormData({ ...formData, compatibleWith: e.target.value })}
                placeholder="Modelos compatibles"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Stock Mínimo</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Precio (MXN)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Proveedor</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Nombre del proveedor"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingPart ? 'Guardar Cambios' : 'Agregar Pieza'}
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
              Esta acción no se puede deshacer. La pieza será eliminada permanentemente del inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
