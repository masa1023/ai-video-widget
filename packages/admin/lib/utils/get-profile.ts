"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Profile, Organization } from "@/lib/types/database"

export interface UserProfile {
  id: string
  organization_id: string
  display_name: string | null
  role: string
  email: string
}

export type ProfileWithOrg = Profile & {
  organizations: Organization
}

export async function getProfile(): Promise<UserProfile> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Try to get existing profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, display_name, role, email")
    .eq("id", user.id)
    .maybeSingle()

  if (profile) {
    return profile as UserProfile
  }

  // Profile doesn't exist - create organization and profile
  // This handles cases where the trigger didn't fire or user signed up before schema existed
  const { data: newOrg, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: user.email?.split("@")[0] || "My Organization",
    })
    .select("id")
    .single()

  if (orgError || !newOrg) {
    console.error("[v0] Failed to create organization:", orgError)
    throw new Error("Failed to create organization")
  }

  const { data: newProfile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      organization_id: newOrg.id,
      email: user.email || "",
      display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "User",
      role: "owner",
    })
    .select("id, organization_id, display_name, role, email")
    .single()

  if (profileError || !newProfile) {
    console.error("[v0] Failed to create profile:", profileError)
    throw new Error("Failed to create profile")
  }

  return newProfile as UserProfile
}

export async function getProfileWithOrg(): Promise<ProfileWithOrg> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Try to get existing profile with organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(*)")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.organizations) {
    return profile as ProfileWithOrg
  }

  // Profile doesn't exist - create organization and profile
  const { data: newOrg, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: user.email?.split("@")[0] || "My Organization",
    })
    .select("*")
    .single()

  if (orgError || !newOrg) {
    console.error("[v0] Failed to create organization:", orgError)
    throw new Error("Failed to create organization")
  }

  const { data: newProfile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      organization_id: newOrg.id,
      email: user.email || "",
      display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "User",
      role: "owner",
    })
    .select("*, organizations(*)")
    .single()

  if (profileError || !newProfile) {
    console.error("[v0] Failed to create profile:", profileError)
    throw new Error("Failed to create profile")
  }

  return newProfile as ProfileWithOrg
}
