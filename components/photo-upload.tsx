'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, X, Upload, Loader2, Image as ImageIcon } from 'lucide-react'

interface PhotoUploadProps {
  ticketId: string
  photos: string[]
  onPhotosChange: (photos: string[]) => void
  maxPhotos?: number
}

export function PhotoUpload({ 
  ticketId, 
  photos, 
  onPhotosChange, 
  maxPhotos = 5 
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const remainingSlots = maxPhotos - photos.length
    if (remainingSlots <= 0) {
      setError(`Máximo ${maxPhotos} fotos permitidas`)
      return
    }

    setUploading(true)
    setError(null)

    const filesToUpload = Array.from(files).slice(0, remainingSlots)
    const newPhotos: string[] = []

    for (const file of filesToUpload) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten imágenes')
        continue
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Las imágenes deben ser menores a 5MB')
        continue
      }

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('ticketId', ticketId)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Error al subir')
        }

        const data = await response.json()
        newPhotos.push(data.url)
      } catch (err) {
        console.error('Upload error:', err)
        setError('Error al subir la imagen')
      }
    }

    if (newPhotos.length > 0) {
      onPhotosChange([...photos, ...newPhotos])
    }
    
    setUploading(false)
    
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const handleDelete = async (photoUrl: string) => {
    try {
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: photoUrl }),
      })
      
      onPhotosChange(photos.filter(p => p !== photoUrl))
    } catch (err) {
      console.error('Delete error:', err)
      setError('Error al eliminar la imagen')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          Fotos del Equipo ({photos.length}/{maxPhotos})
        </span>
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square group">
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => handleDelete(photo)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Buttons */}
      {photos.length < maxPhotos && (
        <div className="flex gap-2">
          {/* Camera button (mobile) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 sm:flex-none"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            Cámara
          </Button>

          {/* File upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 sm:flex-none"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Subir
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
