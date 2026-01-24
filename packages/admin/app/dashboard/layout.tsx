import React from "react"
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { getProfileWithOrg } from '@/lib/utils/get-profile'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfileWithOrg()

  return (
    <SidebarProvider>
      <DashboardSidebar profile={profile} />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
