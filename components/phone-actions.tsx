"use client"

import { useState } from "react"
import { Copy, Check, ChevronDown, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { whatsappUrl, type WhatsAppTemplate } from "@/lib/whatsapp"

/** Logo oficial de WhatsApp (lucide ya no incluye iconos de marca). */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
    </svg>
  )
}

const WA_GREEN = "border-[var(--success)]/40 text-[var(--success)] hover:bg-[color-mix(in_oklch,var(--success)_12%,transparent)] hover:text-[var(--success)]"

interface PhoneActionsProps {
  phone: string
  /** Mensaje único prellenado (si no se pasan plantillas). */
  message?: string
  /** Plantillas por situación: el botón de WhatsApp abre un menú para elegir. */
  templates?: WhatsAppTemplate[]
  /** Mostrar texto junto a los iconos. Por defecto solo iconos. */
  showLabels?: boolean
  size?: "sm" | "default"
  className?: string
}

export function PhoneActions({
  phone,
  message,
  templates,
  showLabels = false,
  size = "default",
  className,
}: PhoneActionsProps) {
  const [copied, setCopied] = useState(false)

  const openWhatsApp = (text?: string) => {
    const url = whatsappUrl(phone, text)
    if (url) window.open(url, "_blank", "noopener,noreferrer")
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(phone)
    } catch {
      // Fallback para navegadores sin API de portapapeles
      const ta = document.createElement("textarea")
      ta.value = phone
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand("copy")
      } catch {
        /* no-op */
      }
      document.body.removeChild(ta)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
  const btnSize = showLabels ? (size === "sm" ? "sm" : "default") : size === "sm" ? "icon-sm" : "icon"
  const hasTemplates = !!templates && templates.length > 0
  const disabled = !whatsappUrl(phone)

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {/* WhatsApp: menú de plantillas o envío directo */}
      {hasTemplates ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size={showLabels ? (size === "sm" ? "sm" : "default") : size === "sm" ? "sm" : "default"}
              variant="outline"
              disabled={disabled}
              title="Enviar WhatsApp"
              aria-label="Enviar WhatsApp"
              className={cn(WA_GREEN, !showLabels && "px-2.5")}
              onClick={(e) => e.stopPropagation()}
            >
              <WhatsAppIcon className={iconSize} />
              {showLabels && <span>WhatsApp</span>}
              <ChevronDown className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Mensaje para el cliente</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {templates!.map((tpl) => (
              <DropdownMenuItem
                key={tpl.id}
                className="flex-col items-start gap-0.5 whitespace-normal py-2"
                onSelect={() => openWhatsApp(tpl.text)}
              >
                <span className="font-medium">{tpl.label}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {tpl.text}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => openWhatsApp(message)}>
              <MessageSquarePlus className="h-4 w-4" />
              Abrir chat (escribir libre)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          type="button"
          size={btnSize}
          variant="outline"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            openWhatsApp(message)
          }}
          disabled={disabled}
          title="Enviar WhatsApp"
          aria-label="Enviar WhatsApp"
          className={WA_GREEN}
        >
          <WhatsAppIcon className={iconSize} />
          {showLabels && <span>WhatsApp</span>}
        </Button>
      )}

      {/* Copiar número */}
      <Button
        type="button"
        size={btnSize}
        variant="outline"
        onClick={handleCopy}
        title="Copiar número"
        aria-label="Copiar número"
        className={cn(copied && "border-[var(--success)]/40 text-[var(--success)]")}
      >
        {copied ? <Check className={iconSize} /> : <Copy className={iconSize} />}
        {showLabels && <span>{copied ? "Copiado" : "Copiar"}</span>}
      </Button>
    </div>
  )
}
