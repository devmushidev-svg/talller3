/**
 * Comprobacion minima del filtro de sugerencias.
 *
 * Node 22+ ejecuta TypeScript directamente:
 *   node --test app/nuevo-ticket/problemas.test.ts
 *
 * Existe por una razon concreta: la primera version devolvia una lista vacia
 * cuando lo escrito no coincidia con nada, y eso dejaba sin sugerencias a
 * quien escribia texto libre o cambiaba de tipo de equipo con algo ya escrito.
 * El caso "sin coincidencias" es el que hay que proteger.
 */
import { strict as assert } from 'node:assert'
import test from 'node:test'
import { sugerirProblemas, PROBLEMAS_COMUNES } from './problemas.ts'

const titulos = (r: readonly { titulo: string }[]) => r.map((p) => p.titulo)

test('con el campo vacio ofrece las del equipo mas las generales', () => {
  const r = titulos(sugerirProblemas('', 'impresora'))
  assert.ok(r.includes('Mantenimiento y revisión'), 'falta la general')
  assert.ok(r.includes('Error de almohadillas'), 'falta la de impresora')
  assert.ok(!r.includes('Activar Office'), 'no debe ofrecer las de computadora')
})

test('filtra por lo que se escribe', () => {
  assert.deepEqual(titulos(sugerirProblemas('disco', 'computadora')), [
    'Cambio de disco',
  ])
})

test('encuentra por alias y sin tildes', () => {
  assert.ok(
    titulos(sugerirProblemas('atasco', 'impresora')).includes('Traba el papel')
  )
  assert.ok(
    titulos(sugerirProblemas('revision', 'computadora')).includes(
      'Mantenimiento y revisión'
    )
  )
})

test('sin coincidencias NO devuelve vacio: cae en el menu del equipo', () => {
  const r = sugerirProblemas('xyz123 no existe', 'impresora')
  assert.ok(r.length > 0, 'la fila de sugerencias quedaria en blanco')
  assert.ok(titulos(r).includes('Error de almohadillas'))
})

test('cambiar de equipo con texto de otro equipo sigue ofreciendo opciones', () => {
  // El caso real: se escribio un problema de computadora y luego se cambio a
  // impresora. Antes la fila quedaba vacia.
  const r = sugerirProblemas('Cambio de disco duro.', 'impresora')
  assert.ok(r.length > 0)
  assert.ok(!titulos(r).includes('Cambio de disco'))
})

test('toda plantilla que pide un dato termina en ": " para dejar el cursor', () => {
  for (const p of PROBLEMAS_COMUNES) {
    if (p.titulo.includes('especificar')) {
      assert.ok(
        p.plantilla.endsWith(': '),
        `${p.id} deberia terminar en ": " para poder completarla`
      )
    }
  }
})
