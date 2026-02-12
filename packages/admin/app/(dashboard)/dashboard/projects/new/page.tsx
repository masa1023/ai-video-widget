'use client'

import React from 'react'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [origins, setOrigins] = useState<string[]>([''])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const addOrigin = () => {
    setOrigins([...origins, ''])
  }

  const removeOrigin = (index: number) => {
    setOrigins(origins.filter((_, i) => i !== index))
  }

  const updateOrigin = (index: number, value: string) => {
    const newOrigins = [...origins]
    newOrigins[index] = value
    setOrigins(newOrigins)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Project name is required')
      return
    }

    // Filter out empty origins and validate URLs
    const validOrigins = origins
      .map((o) => o.trim())
      .filter((o) => o.length > 0)

    for (const origin of validOrigins) {
      try {
        new URL(origin)
      } catch {
        setError(`Invalid URL: ${origin}`)
        return
      }
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Get user's organization
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in')
        setIsLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        setError('Profile not found')
        setIsLoading(false)
        return
      }

      // Create project
      const { data: project, error: createError } = await supabase
        .from('projects')
        .insert({
          organization_id: profile.organization_id,
          name: name.trim(),
          allowed_origins: validOrigins,
        })
        .select()
        .single()

      if (createError) {
        setError(createError.message)
        setIsLoading(false)
        return
      }

      toast.success('Project created successfully')
      router.push(`/projects/${project.id}`)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>
            Set up a new video widget project for your website
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="My Website Widget"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allowed Origins</Label>
                  <p className="text-sm text-muted-foreground">
                    URLs where the widget can be embedded (e.g.,
                    https://example.com)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOrigin}
                  disabled={isLoading}
                  className="bg-transparent"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {origins.map((origin, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="https://example.com"
                      value={origin}
                      onChange={(e) => updateOrigin(index, e.target.value)}
                      disabled={isLoading}
                    />
                    {origins.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOrigin(index)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove origin</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
