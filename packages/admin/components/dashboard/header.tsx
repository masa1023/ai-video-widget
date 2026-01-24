'use client'

import React from "react"

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

type DashboardBreadcrumbItem = {
  label: string
  href?: string
}

export function DashboardHeader({
  breadcrumbs,
  actions,
}: {
  breadcrumbs: DashboardBreadcrumbItem[]
  actions?: React.ReactNode
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          {breadcrumbs.map((item, index) => (
            <span key={item.label} className="contents">
              {index > 0 && <BreadcrumbSeparator />}
              {item.href ? (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
