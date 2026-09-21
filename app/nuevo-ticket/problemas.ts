import type { EquipmentType } from '@/lib/types'

/**
 * Problemas que se repiten en el mostrador.
 *
 * Reemplazan a las tarjetas de "Creación rápida": en vez de una grilla que hay
 * que leer entera antes de escribir, aparecen como sugerencias mientras se
 * escribe en Problema reportado, y solo las del equipo elegido.
 *
 * `plantilla` termina en ":" cuando falta un dato que solo sabe quien recibe
 * (que pieza, que programa). En ese caso el cursor queda al final para que lo
 * complete en vez de guardar un ticket a medias.
 */
export interface ProblemaComun {
  id: string
  /** Lo que se ve en la sugerencia */
  titulo: string
  /** Lo que se escribe en el campo */
  plantilla: string
  /** null = sirve para cualquier equipo */
  equipo: EquipmentType | null
  /** Palabras por las que tambien se encuentra, mas alla del titulo */
  alias?: readonly string[]
}

export const PROBLEMAS_COMUNES: readonly ProblemaComun[] = [
  // ── Para cualquier equipo ──────────────────────────────────────────
  {
    id: 'mantenimiento',
    titulo: 'Mantenimiento y revisión',
    plantilla: 'Mantenimiento y revisión general.',
    equipo: null,
    alias: ['limpieza', 'preventivo', 'chequeo'],
  },
  {
    id: 'no-enciende',
    titulo: 'No enciende',
    plantilla: 'No enciende. Revisar y diagnosticar.',
    equipo: null,
    alias: ['muerto', 'no prende', 'no arranca'],
  },

  // ── Computadora ────────────────────────────────────────────────────
  {
    id: 'cambio-disco',
    titulo: 'Cambio de disco',
    plantilla: 'Cambio de disco duro.',
    equipo: 'computadora',
    alias: ['hdd', 'ssd', 'disco duro'],
  },
  {
    id: 'cambio-pieza',
    titulo: 'Cambio de pieza (especificar cuál)',
    plantilla: 'Cambio de pieza: ',
    equipo: 'computadora',
    alias: ['repuesto', 'reemplazo', 'memoria', 'fuente'],
  },
  {
    id: 'activar-office',
    titulo: 'Activar Office',
    plantilla: 'Instalación y activación de Microsoft Office.',
    equipo: 'computadora',
    alias: ['licencia', 'word', 'excel', 'microsoft'],
  },

  // ── Impresora ──────────────────────────────────────────────────────
  {
    id: 'no-imprime-color',
    titulo: 'No imprime color',
    plantilla: 'No imprime color. Revisar cabezal y niveles de tinta.',
    equipo: 'impresora',
    alias: ['tinta', 'cabezal', 'colores'],
  },
  {
    id: 'traba-papel',
    titulo: 'Traba el papel',
    plantilla: 'Traba el papel al imprimir. Revisar arrastre y rodillos.',
    equipo: 'impresora',
    alias: ['atasco', 'atasca', 'rodillo', 'papel'],
  },
  {
    id: 'almohadillas',
    titulo: 'Error de almohadillas',
    plantilla: 'Error de almohadillas. Reset de contador y limpieza.',
    equipo: 'impresora',
    alias: ['contador', 'reset', 'pad'],
  },
  {
    id: 'no-imprime',
    titulo: 'No imprime',
    plantilla: 'No imprime. Revisar y realizar mantenimiento general.',
    equipo: 'impresora',
    alias: ['no responde', 'no saca'],
  },
]

/** Quita tildes y pasa a minuscula para que "diagnostico" encuentre "diagnóstico". */
function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

/**
 * Sugerencias para el equipo elegido, filtradas por lo que se lleva escrito.
 *
 * Son pocas y funcionan como menu, asi que NUNCA se devuelve una lista vacia:
 * si lo escrito no coincide con ninguna, se muestran todas las del equipo. Sin
 * eso, escribir texto libre (o cambiar de tipo de equipo con algo ya escrito)
 * dejaba la fila en blanco justo cuando mas hace falta el atajo.
 */
export function sugerirProblemas(
  escrito: string,
  equipo: EquipmentType
): readonly ProblemaComun[] {
  const delEquipo = PROBLEMAS_COMUNES.filter(
    (p) => p.equipo === null || p.equipo === equipo
  )

  const q = normalizar(escrito)
  if (!q) return delEquipo

  const coinciden = delEquipo.filter((p) => {
    const heno = normalizar([p.titulo, p.plantilla, ...(p.alias ?? [])].join(' '))
    return heno.includes(q)
  })

  return coinciden.length > 0 ? coinciden : delEquipo
}
