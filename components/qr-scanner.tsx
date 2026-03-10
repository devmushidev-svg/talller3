'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { QrCode, Camera, X, Loader2 } from 'lucide-react'

interface QRScannerProps {
  onScan: (ticketId: string) => void
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [open, setOpen] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startScanning = async () => {
    setError(null)
    setScanning(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        
        // Start scanning loop
        requestAnimationFrame(scanFrame)
      }
    } catch (err) {
      console.error('Camera error:', err)
      setError('No se pudo acceder a la cámara')
      setScanning(false)
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setScanning(false)
  }

  const scanFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanFrame)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    try {
      // Use BarcodeDetector if available (modern browsers)
      if ('BarcodeDetector' in window) {
        // @ts-expect-error - BarcodeDetector is not in TypeScript types yet
        const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] })
        const barcodes = await barcodeDetector.detect(canvas)
        
        if (barcodes.length > 0) {
          const ticketId = barcodes[0].rawValue
          if (ticketId && ticketId.startsWith('TKT-')) {
            stopScanning()
            setOpen(false)
            onScan(ticketId)
            return
          }
        }
      }
    } catch (err) {
      // BarcodeDetector not available or error, continue scanning
    }

    if (scanning) {
      requestAnimationFrame(scanFrame)
    }
  }

  useEffect(() => {
    if (open) {
      startScanning()
    } else {
      stopScanning()
    }
    
    return () => stopScanning()
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="h-4 w-4 mr-2" />
          Escanear QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear Código QR del Ticket</DialogTitle>
        </DialogHeader>
        
        <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-primary rounded-lg">
              <div className="absolute inset-0 flex items-center justify-center">
                {scanning && (
                  <div className="animate-pulse text-primary-foreground bg-primary/50 px-3 py-1 rounded text-sm">
                    Escaneando...
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center text-white p-4">
                <p className="mb-4">{error}</p>
                <Button variant="secondary" onClick={startScanning}>
                  Reintentar
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Apunta la cámara al código QR del ticket
        </p>
      </DialogContent>
    </Dialog>
  )
}
