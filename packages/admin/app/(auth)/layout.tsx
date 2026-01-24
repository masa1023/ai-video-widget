import React from "react"
import { TreeDeciduous } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="flex items-center gap-2">
          <TreeDeciduous className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">Bonsai Video</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        {children}
      </main>
      <footer className="flex h-14 items-center justify-center border-t border-border px-6">
        <p className="text-sm text-muted-foreground">
          Bonsai Video - Interactive Video Widget Platform
        </p>
      </footer>
    </div>
  )
}
