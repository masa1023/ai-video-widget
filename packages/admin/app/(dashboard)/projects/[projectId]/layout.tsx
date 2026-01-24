import React from "react"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Verify project access
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, organization_id")
    .eq("id", projectId)
    .single()

  if (error || !project) {
    notFound()
  }

  return <>{children}</>
}
