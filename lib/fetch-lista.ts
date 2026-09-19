/**
 * GET de una lista que falla fuerte.
 *
 * Antes cada pantalla hacia `await res.json()` y lo trataba como arreglo.
 * Si el servidor devolvia un 500 o un `{ error }`, pasaban dos cosas malas:
 * o la pantalla reventaba con "x.filter is not a function", o mostraba
 * "No hay tickets" — que es una mentira, porque no es que no haya: es que
 * no se pudo preguntar.
 *
 * Aca se distingue una cosa de la otra y se deja que la pantalla muestre su
 * estado de error.
 */
export async function fetchLista<T>(url: string, init?: RequestInit): Promise<T[]> {
  let res: Response
  try {
    res = await fetch(url, init)
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa la conexión.')
  }

  if (!res.ok) {
    throw new Error(`El servidor respondió ${res.status}. Intenta de nuevo.`)
  }

  const cuerpo = await res.json().catch(() => null)

  if (!Array.isArray(cuerpo)) {
    const detalle =
      cuerpo && typeof cuerpo === 'object' && typeof cuerpo.error === 'string'
        ? cuerpo.error
        : 'El servidor devolvió algo que no es una lista.'
    throw new Error(detalle)
  }

  return cuerpo as T[]
}

export function mensajeDeError(e: unknown): string {
  return e instanceof Error ? e.message : 'Ocurrió un error inesperado.'
}
