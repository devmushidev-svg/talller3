/**
 * Las cuatro vistas de una lista de tickets, compartidas por el inicio y por
 * la pantalla de tickets.
 *
 * Reemplazan al panel de filtros desplegable: las preguntas que se hacen de
 * verdad en el mostrador son "que hay en taller", "que puedo entregar" y
 * "que se entrego". Viven aca para que las dos pantallas ordenen y filtren
 * igual; si divergen, el mismo ticket aparece en un lado y no en el otro.
 */
export type Vista = 'activos' | 'listos' | 'entregados' | 'todos'

export type Orden = 'nuevos' | 'viejos'

export const VISTAS: { id: Vista; label: string; soloActivos: boolean }[] = [
  { id: 'activos', label: 'En taller', soloActivos: true },
  { id: 'listos', label: 'Listos para entregar', soloActivos: true },
  { id: 'entregados', label: 'Entregados', soloActivos: false },
  { id: 'todos', label: 'Todos', soloActivos: false },
]

/** La API guarda 'delivered' en tickets viejos; cuenta como entregado. */
export function perteneceALaVista(estado: string, vista: Vista): boolean {
  const e = estado.toLowerCase()
  const entregado = e === 'entregado' || e === 'delivered'
  if (vista === 'entregados') return entregado
  if (vista === 'listos') return e === 'listo'
  if (vista === 'activos') return !entregado
  return true
}

export function soloActivos(vista: Vista): boolean {
  return VISTAS.find((v) => v.id === vista)?.soloActivos ?? true
}

/** Endpoint para una vista. Con busqueda pega contra /api/search. */
export function urlDeVista(vista: Vista, busqueda: string): string {
  if (busqueda) {
    const params = new URLSearchParams({ q: busqueda })
    if (soloActivos(vista)) params.set('scope', 'active')
    return `/api/search?${params}`
  }
  return soloActivos(vista) ? '/api/tickets?scope=active' : '/api/tickets'
}

export function ordenarPorFecha<T extends { created_at: string }>(
  lista: T[],
  orden: Orden
): T[] {
  return [...lista].sort((a, b) => {
    const ta = Date.parse(a.created_at) || 0
    const tb = Date.parse(b.created_at) || 0
    return orden === 'nuevos' ? tb - ta : ta - tb
  })
}
