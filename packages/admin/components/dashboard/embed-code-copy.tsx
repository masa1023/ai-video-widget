'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface EmbedCodeCopyProps {
  code: string
}

export function EmbedCodeCopy({ code }: EmbedCodeCopyProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 rounded-md bg-muted px-4 py-3 font-mono text-sm break-all">
        {code}
      </code>
      <Button
        variant="outline"
        size="icon"
        onClick={handleCopy}
        className="shrink-0 bg-transparent"
      >
        {copied ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        <span className="sr-only">Copy embed code</span>
      </Button>
    </div>
  )
}
