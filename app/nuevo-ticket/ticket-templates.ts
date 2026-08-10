import type { EquipmentType } from "@/lib/types"

export interface TicketQuickTemplate {
  id: string
  title: string
  detail: string
  equipmentType: EquipmentType
  accessories: readonly string[]
  problemDescription: string
}

/**
 * Atajos para los ingresos que más se repiten en el taller.
 * Solo completan el formulario: guardar e imprimir sigue siendo una acción aparte.
 */
export const TICKET_QUICK_TEMPLATES: readonly TicketQuickTemplate[] = [
  {
    id: "printer-maintenance",
    title: "Impresora · Mantenimiento",
    detail: "Cable de poder + cable USB",
    equipmentType: "impresora",
    accessories: ["Cable de poder", "Cable USB"],
    problemDescription: "Mantenimiento preventivo y limpieza general.",
  },
  {
    id: "printer-not-printing",
    title: "Impresora · No imprime",
    detail: "Cable de poder + cable USB",
    equipmentType: "impresora",
    accessories: ["Cable de poder", "Cable USB"],
    problemDescription: "No imprime. Revisar y realizar mantenimiento general.",
  },
  {
    id: "computer-format",
    title: "Computadora · Formateo",
    detail: "Con cable de poder",
    equipmentType: "computadora",
    accessories: ["Cable de poder"],
    problemDescription: "Formateo, instalación del sistema y mantenimiento general.",
  },
  {
    id: "computer-no-power",
    title: "Computadora · No enciende",
    detail: "Con cable de poder",
    equipmentType: "computadora",
    accessories: ["Cable de poder"],
    problemDescription: "No enciende. Revisar y diagnosticar.",
  },
  {
    id: "laptop-format-case",
    title: "Laptop · Formateo",
    detail: "Cargador + funda",
    equipmentType: "laptop",
    accessories: ["Cargador", "Funda"],
    problemDescription: "Formateo, instalación del sistema y mantenimiento general.",
  },
  {
    id: "laptop-format-charger",
    title: "Laptop · Formateo",
    detail: "Solo cargador",
    equipmentType: "laptop",
    accessories: ["Cargador"],
    problemDescription: "Formateo, instalación del sistema y mantenimiento general.",
  },
  {
    id: "laptop-format-no-accessories",
    title: "Laptop · Formateo",
    detail: "Sin accesorios",
    equipmentType: "laptop",
    accessories: [],
    problemDescription: "Formateo, instalación del sistema y mantenimiento general.",
  },
  {
    id: "office-activation",
    title: "Computadora · Activar Office",
    detail: "Sin accesorios",
    equipmentType: "computadora",
    accessories: [],
    problemDescription: "Instalación y activación de Microsoft Office.",
  },
]
