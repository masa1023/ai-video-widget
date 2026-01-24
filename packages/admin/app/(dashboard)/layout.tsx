import React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile with organization
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      *,
      organizations (
        id,
        name,
        status
      )
    `
    )
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  // Check organization status
  const organization = profile.organizations as {
    id: string
    name: string
    status: string
  } | null
  if (!organization || organization.status !== "active") {
    redirect("/login")
  }

  // Get projects for sidebar
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false })

  return (
    <SidebarProvider>
      <DashboardSidebar
        user={{
          id: user.id,
          email: user.email || "",
          displayName: profile.display_name || user.email?.split("@")[0] || "",
          role: profile.role,
        }}
        organization={{
          id: organization.id,
          name: organization.name,
        }}
        projects={projects || []}
      />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
