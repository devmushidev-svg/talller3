"use client"

import { ArrowDownUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { VISTAS, type Orden, type Vista } from "@/lib/vistas-ticket"

/**
 * Pestanas de vista y orden por fecha.
 *
 * Es el mismo control en el inicio y en la pantalla de tickets: si cada una
 * tuviera el suyo, terminarian ofreciendo listas distintas con los mismos
 * nombres.
 */
export function VistaTicketsTabs({
  vista,
  onVistaChange,
  orden,
  onOrdenChange,
  className,
}: {
  vista: Vista
  onVistaChange: (v: Vista) => void
  orden: Orden
  onOrdenChange: (o: Orden) => void
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div
        role="tablist"
        aria-label="Qué tickets ver"
        className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1"
      >
        {VISTAS.map((v) => {
          const activa = v.id === vista
          return (
            <button
              key={v.id}
              role="tab"
              type="button"
              aria-selected={activa}
              onClick={() => onVistaChange(v.id)}
              className={cn(
                "min-h-11 rounded-lg px-3 text-sm transition-colors",
                activa
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              {v.label}
            </button>
          )
        })}
      </div>

      <Button
        variant="outline"
        className="ml-auto shrink-0 gap-1.5"
        onClick={() => onOrdenChange(orden === "nuevos" ? "viejos" : "nuevos")}
        aria-label={
          orden === "nuevos"
            ? "Ordenado: primero los más nuevos. Cambiar a más viejos."
            : "Ordenado: primero los más viejos. Cambiar a más nuevos."
        }
      >
        <ArrowDownUp className="h-4 w-4" />
        {orden === "nuevos" ? "Más nuevos" : "Más viejos"}
      </Button>
    </div>
  )
}
