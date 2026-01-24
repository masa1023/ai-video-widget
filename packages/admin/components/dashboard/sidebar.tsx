"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  TreeDeciduous,
  LayoutDashboard,
  Video,
  Layers,
  Target,
  BarChart3,
  Settings,
  Users,
  Plus,
  ChevronDown,
  LogOut,
  FolderOpen,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth/actions"
import { cn } from "@/lib/utils"

interface DashboardSidebarProps {
  user: {
    id: string
    email: string
    displayName: string
    role: string
  }
  organization: {
    id: string
    name: string
  }
  projects: {
    id: string
    name: string
  }[]
}

export function DashboardSidebar({
  user,
  organization,
  projects,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Extract current project ID from path
  const projectMatch = pathname.match(/\/projects\/([^/]+)/)
  const currentProjectId = projectMatch ? projectMatch[1] : null

  // Project navigation items
  const projectNavItems = [
    {
      title: "Overview",
      href: (id: string) => `/projects/${id}`,
      icon: LayoutDashboard,
    },
    {
      title: "Videos",
      href: (id: string) => `/projects/${id}/videos`,
      icon: Video,
    },
    {
      title: "Slots",
      href: (id: string) => `/projects/${id}/slots`,
      icon: Layers,
    },
    {
      title: "Conversions",
      href: (id: string) => `/projects/${id}/conversions`,
      icon: Target,
    },
    {
      title: "Analytics",
      href: (id: string) => `/projects/${id}/analytics`,
      icon: BarChart3,
    },
    {
      title: "Settings",
      href: (id: string) => `/projects/${id}/settings`,
      icon: Settings,
    },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  const isOwner = user.role === "owner"

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-2 py-1.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <TreeDeciduous className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Bonsai Video</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Projects Section */}
        <SidebarGroup>
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            {(isOwner || user.role === "admin") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => router.push("/dashboard/projects/new")}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">New Project</span>
              </Button>
            )}
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.length === 0 ? (
                <SidebarMenuItem>
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No projects yet
                  </div>
                </SidebarMenuItem>
              ) : (
                projects.map((project) => (
                  <Collapsible
                    key={project.id}
                    defaultOpen={currentProjectId === project.id}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={currentProjectId === project.id}
                          tooltip={project.name}
                        >
                          <FolderOpen className="h-4 w-4" />
                          <span className="flex-1 truncate">{project.name}</span>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenu className="ml-4 mt-1 border-l border-sidebar-border pl-2">
                          {projectNavItems.map((item) => {
                            const href = item.href(project.id)
                            const isActive = pathname === href
                            return (
                              <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                  asChild
                                  isActive={isActive}
                                  size="sm"
                                >
                                  <Link href={href}>
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.title}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            )
                          })}
                        </SidebarMenu>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Settings Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/settings"}
                >
                  <Link href="/dashboard/settings">
                    <Settings className="h-4 w-4" />
                    <span>Account</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isOwner && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/dashboard/settings/members"}
                  >
                    <Link href="/dashboard/settings/members">
                      <Users className="h-4 w-4" />
                      <span>Members</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="truncate font-medium">
                      {user.displayName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {organization.name}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-(--radix-dropdown-menu-trigger-width)"
              >
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
