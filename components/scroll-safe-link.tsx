'use client'

import Link, { type LinkProps } from 'next/link'
import { forwardRef, useRef } from 'react'
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEvent as ReactMouseEvent,
  PointerEvent,
} from 'react'

type ScrollSafeLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    movementThreshold?: number
  }

interface PointerGesture {
  pointerId: number
  startX: number
  startY: number
  dragged: boolean
}

/**
 * Conserva la navegación normal de un enlace, pero ignora el clic sintético que
 * algunos navegadores táctiles emiten después de desplazar el dedo sobre él.
 */
export const ScrollSafeLink = forwardRef<HTMLAnchorElement, ScrollSafeLinkProps>(
  function ScrollSafeLink(
    {
      movementThreshold = 8,
      onClickCapture,
      onPointerCancel,
      onPointerDown,
      onPointerMove,
      ...props
    },
    ref,
  ) {
    const gestureRef = useRef<PointerGesture | null>(null)

    const handlePointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
      onPointerDown?.(event)
      if (event.defaultPrevented || !event.isPrimary || event.button !== 0) return

      gestureRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        dragged: false,
      }
    }

    const handlePointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
      onPointerMove?.(event)
      const gesture = gestureRef.current
      if (!gesture || gesture.pointerId !== event.pointerId || gesture.dragged) return

      const distanceX = Math.abs(event.clientX - gesture.startX)
      const distanceY = Math.abs(event.clientY - gesture.startY)
      if (distanceX > movementThreshold || distanceY > movementThreshold) {
        gesture.dragged = true
      }
    }

    const handlePointerCancel = (event: PointerEvent<HTMLAnchorElement>) => {
      const gesture = gestureRef.current
      if (gesture?.pointerId === event.pointerId) gesture.dragged = true
      onPointerCancel?.(event)
    }

    const handleClickCapture = (event: ReactMouseEvent<HTMLAnchorElement>) => {
      const wasDragged = gestureRef.current?.dragged === true
      gestureRef.current = null

      if (wasDragged) {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      onClickCapture?.(event)
    }

    return (
      <Link
        ref={ref}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerCancel={handlePointerCancel}
        onClickCapture={handleClickCapture}
        {...props}
      />
    )
  },
)

type ScrollSafeButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  movementThreshold?: number
}

/**
 * Lo mismo que ScrollSafeLink pero para un boton.
 *
 * Existe porque una tarjeta de ticket en el inicio ya no navega a otra
 * pantalla: abre una ventana con el resumen. Sin esta proteccion, desplazar
 * la lista con el dedo abriria la ventana del ticket que quedo debajo.
 */
export const ScrollSafeButton = forwardRef<HTMLButtonElement, ScrollSafeButtonProps>(
  function ScrollSafeButton(
    {
      movementThreshold = 8,
      onClickCapture,
      onPointerCancel,
      onPointerDown,
      onPointerMove,
      type = 'button',
      ...props
    },
    ref,
  ) {
    const gestureRef = useRef<PointerGesture | null>(null)

    return (
      <button
        ref={ref}
        type={type}
        onPointerDown={(event) => {
          onPointerDown?.(event)
          if (event.defaultPrevented || !event.isPrimary || event.button !== 0) return
          gestureRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            dragged: false,
          }
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event)
          const gesture = gestureRef.current
          if (!gesture || gesture.pointerId !== event.pointerId || gesture.dragged) return
          if (
            Math.abs(event.clientX - gesture.startX) > movementThreshold ||
            Math.abs(event.clientY - gesture.startY) > movementThreshold
          ) {
            gesture.dragged = true
          }
        }}
        onPointerCancel={(event) => {
          const gesture = gestureRef.current
          if (gesture?.pointerId === event.pointerId) gesture.dragged = true
          onPointerCancel?.(event)
        }}
        onClickCapture={(event) => {
          const wasDragged = gestureRef.current?.dragged === true
          gestureRef.current = null
          if (wasDragged) {
            event.preventDefault()
            event.stopPropagation()
            return
          }
          onClickCapture?.(event)
        }}
        {...props}
      />
    )
  },
)
