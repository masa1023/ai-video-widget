'use client'

import { usePathname } from 'next/navigation'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export function DashboardHeader() {
  const pathname = usePathname()
  const breadcrumbs = generateBreadcrumbs(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-6">
      <SidebarTrigger className="-ml-2" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={crumb.href}>
              {index < breadcrumbs.length - 1 ? (
                <>
                  <BreadcrumbLink href={crumb.href}>
                    {crumb.label}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: { label: string; href: string }[] = []

  // Dashboard root
  breadcrumbs.push({ label: 'Dashboard', href: '/dashboard' })

  if (segments[0] === 'dashboard' && segments.length > 1) {
    if (segments[1] === 'projects' && segments[2]) {
      // We're in a project context
      breadcrumbs.push({
        label: 'Project',
        href: `/projects/${segments[2]}`,
      })

      // Add sub-page if exists
      if (segments[3]) {
        const pageTitles: Record<string, string> = {
          videos: 'Videos',
          slots: 'Slots',
          conversions: 'Conversions',
          analytics: 'Analytics',
          settings: 'Settings',
        }
        breadcrumbs.push({
          label: pageTitles[segments[3]] || segments[3],
          href: `/projects/${segments[2]}/${segments[3]}`,
        })
      }
    } else if (segments[1] === 'settings') {
      breadcrumbs.push({
        label: 'Settings',
        href: '/dashboard/settings',
      })
      if (segments[2] === 'members') {
        breadcrumbs.push({
          label: 'Members',
          href: '/dashboard/settings/members',
        })
      }
    }
  } else if (segments[0] === 'projects' && segments[1]) {
    // Direct project access
    breadcrumbs.push({
      label: 'Project',
      href: `/projects/${segments[1]}`,
    })

    if (segments[2]) {
      const pageTitles: Record<string, string> = {
        videos: 'Videos',
        slots: 'Slots',
        conversions: 'Conversions',
        analytics: 'Analytics',
        settings: 'Settings',
      }
      breadcrumbs.push({
        label: pageTitles[segments[2]] || segments[2],
        href: `/projects/${segments[1]}/${segments[2]}`,
      })
    }
  }

  return breadcrumbs
}
