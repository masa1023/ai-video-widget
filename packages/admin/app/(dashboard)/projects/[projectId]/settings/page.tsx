"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Plus, X, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function ProjectSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string

  const [project, setProject] = useState<{
    id: string
    name: string
    allowed_origins: string[]
  } | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [origins, setOrigins] = useState<string[]>([""])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadProject()
  }, [projectId])

  async function loadProject() {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }

    // Get user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    setUserRole(profile?.role || null)

    // Get project
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()

    if (projectError || !projectData) {
      router.push("/dashboard")
      return
    }

    setProject(projectData)
    setName(projectData.name)
    setOrigins(
      projectData.allowed_origins?.length > 0
        ? projectData.allowed_origins
        : [""]
    )
    setIsLoading(false)
  }

  const addOrigin = () => {
    setOrigins([...origins, ""])
  }

  const removeOrigin = (index: number) => {
    setOrigins(origins.filter((_, i) => i !== index))
  }

  const updateOrigin = (index: number, value: string) => {
    const newOrigins = [...origins]
    newOrigins[index] = value
    setOrigins(newOrigins)
  }

  async function handleSave() {
    setError(null)

    if (!name.trim()) {
      setError("Project name is required")
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

    setIsSaving(true)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from("projects")
        .update({
          name: name.trim(),
          allowed_origins: validOrigins,
        })
        .eq("id", projectId)

      if (updateError) {
        setError(updateError.message)
        setIsSaving(false)
        return
      }

      toast.success("Project settings saved")
      router.refresh()
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)

    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId)

      if (deleteError) {
        toast.error(deleteError.message)
        setIsDeleting(false)
        return
      }

      toast.success("Project deleted")
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      toast.error("Failed to delete project")
      setIsDeleting(false)
    }
  }

  const canEdit = userRole === "owner" || userRole === "admin"
  const canDelete = userRole === "owner"

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Project Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Update your project name and allowed origins
          </CardDescription>
        </CardHeader>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit || isSaving}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Allowed Origins</Label>
                <p className="text-sm text-muted-foreground">
                  URLs where the widget can be embedded
                </p>
              </div>
              {canEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOrigin}
                  disabled={isSaving}
                  className="bg-transparent"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {origins.map((origin, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="https://example.com"
                    value={origin}
                    onChange={(e) => updateOrigin(index, e.target.value)}
                    disabled={!canEdit || isSaving}
                  />
                  {canEdit && origins.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOrigin(index)}
                      disabled={isSaving}
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
        {canEdit && (
          <CardFooter>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      {canDelete && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete this project and all its data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the project &quot;{project?.name}&quot; and all associated
                    videos, slots, and analytics data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Project"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
