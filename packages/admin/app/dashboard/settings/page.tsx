"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, RefreshCw, User, Building2, Key } from "lucide-react"
import { toast } from "sonner"
import type { Organization, Profile } from "@/lib/types/database"

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, orgRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("organizations").select("*").limit(1).single()
      ])

      if (profileRes.data) setProfile(profileRes.data)
      if (orgRes.data) setOrganization(orgRes.data)
      setLoading(false)
    }

    fetchData()
  }, [supabase])

  const copyWidgetKey = async () => {
    if (organization?.widget_key) {
      await navigator.clipboard.writeText(organization.widget_key)
      toast.success("Widget key copied to clipboard")
    }
  }

  const regenerateWidgetKey = async () => {
    if (!organization) return

    setRegenerating(true)
    const newKey = `bv_${crypto.randomUUID().replace(/-/g, "")}`

    const { error } = await supabase
      .from("organizations")
      .update({ widget_key: newKey })
      .eq("id", organization.id)

    if (error) {
      toast.error("Failed to regenerate widget key")
    } else {
      setOrganization({ ...organization, widget_key: newKey })
      toast.success("Widget key regenerated successfully")
    }
    setRegenerating(false)
  }

  const getEmbedCode = () => {
    if (!organization) return ""
    return `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-widget-key="${organization.widget_key}"></script>`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and organization settings</p>
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and organization settings</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>Your personal account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={profile?.display_name || ""} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile?.id ? "Linked to your account" : ""} readOnly />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label>Role</Label>
              <Badge variant="secondary" className="capitalize">
                {profile?.role || "member"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <CardTitle>Organization</CardTitle>
            </div>
            <CardDescription>Your organization details and billing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input value={organization?.name || ""} readOnly />
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <Label>Plan</Label>
                <div>
                  <Badge className="capitalize">{organization?.plan || "free"}</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <div>
                  <Badge variant={organization?.is_active ? "default" : "secondary"}>
                    {organization?.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-muted-foreground" />
              <CardTitle>Widget Integration</CardTitle>
            </div>
            <CardDescription>Use this key to embed your interactive videos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Widget Key</Label>
              <div className="flex gap-2">
                <Input 
                  value={organization?.widget_key || ""} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={copyWidgetKey}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={regenerateWidgetKey}
                  disabled={regenerating}
                >
                  <RefreshCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Keep this key secret. Regenerating will invalidate the old key.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Embed Code</Label>
              <div className="relative">
                <pre className="p-3 bg-muted rounded-lg text-xs font-mono overflow-x-auto">
                  {getEmbedCode()}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={async () => {
                    await navigator.clipboard.writeText(getEmbedCode())
                    toast.success("Embed code copied")
                  }}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
