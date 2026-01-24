"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus,
  Target,
  MoreVertical,
  Pencil,
  Trash2,
  AlertCircle,
  Eye,
  MousePointer,
} from "lucide-react"
import { toast } from "sonner"

type ConversionType = "click" | "video_view"

interface ConversionRuleType {
  id: string
  project_id: string
  name: string
  conversion_type: ConversionType
  target_slot_id: string | null
  target_url_pattern: string | null
  created_at: string
  updated_at: string
}

interface SlotType {
  id: string
  project_id: string
  video_id: string
  name: string
  is_entry_point: boolean
  button_type: "cta" | "detail" | "transition"
  button_label: string
  button_url: string | null
  position_x: number
  position_y: number
  created_at: string
  updated_at: string
}

export default function ConversionsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [rules, setRules] = useState<ConversionRuleType[]>([])
  const [slots, setSlots] = useState<SlotType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Create state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createType, setCreateType] = useState<ConversionType>("click")
  const [createSlotId, setCreateSlotId] = useState<string>("")
  const [createUrlPattern, setCreateUrlPattern] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Edit state
  const [editRule, setEditRule] = useState<ConversionRuleType | null>(null)
  const [editName, setEditName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Delete state
  const [deleteRule, setDeleteRule] = useState<ConversionRuleType | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = useCallback(async () => {
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

    // Get conversion rules
    const { data: rulesData } = await supabase
      .from("conversion_rules")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })

    setRules(rulesData || [])

    // Get slots for dropdown
    const { data: slotsData } = await supabase
      .from("slots")
      .select("*")
      .eq("project_id", projectId)
      .order("name")

    setSlots(slotsData || [])

    setIsLoading(false)
  }, [projectId, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const canEdit = userRole === "owner" || userRole === "admin"

  const getSlotName = (slotId: string | null) => {
    if (!slotId) return null
    const slot = slots.find((s) => s.id === slotId)
    return slot?.name || "Unknown Slot"
  }

  const handleCreate = async () => {
    setCreateError(null)

    if (!createName.trim()) {
      setCreateError("Name is required")
      return
    }

    if (createType === "video_view" && !createSlotId) {
      setCreateError("Please select a slot for video view tracking")
      return
    }

    if (createType === "click" && !createUrlPattern.trim() && !createSlotId) {
      setCreateError("Please specify a URL pattern or select a slot")
      return
    }

    setIsCreating(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("conversion_rules")
        .insert({
          project_id: projectId,
          name: createName.trim(),
          conversion_type: createType,
          target_slot_id: createSlotId || null,
          target_url_pattern: createUrlPattern.trim() || null,
        })
        .select()
        .single()

      if (error) {
        setCreateError(error.message)
        return
      }

      setRules([data, ...rules])
      setIsCreateOpen(false)
      setCreateName("")
      setCreateType("click")
      setCreateSlotId("")
      setCreateUrlPattern("")
      toast.success("Conversion rule created")
    } catch (err) {
      setCreateError("An unexpected error occurred")
    } finally {
      setIsCreating(false)
    }
  }

  const handleEdit = async () => {
    if (!editRule || !editName.trim()) return

    setIsSaving(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("conversion_rules")
        .update({ name: editName.trim() })
        .eq("id", editRule.id)

      if (error) {
        toast.error(error.message)
        return
      }

      setRules(
        rules.map((r) =>
          r.id === editRule.id ? { ...r, name: editName.trim() } : r
        )
      )
      setEditRule(null)
      toast.success("Rule updated")
    } catch (err) {
      toast.error("Failed to update rule")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteRule) return

    setIsDeleting(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("conversion_rules")
        .delete()
        .eq("id", deleteRule.id)

      if (error) {
        toast.error(error.message)
        return
      }

      setRules(rules.filter((r) => r.id !== deleteRule.id))
      setDeleteRule(null)
      toast.success("Rule deleted")
    } catch (err) {
      toast.error("Failed to delete rule")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conversions</h1>
          <p className="text-muted-foreground">
            Define conversion rules to track goal completions
          </p>
        </div>
        {canEdit && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Conversion Rule</DialogTitle>
                <DialogDescription>
                  Define a new conversion tracking rule
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {createError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{createError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Sign Up Click"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conversion Type</Label>
                  <Select
                    value={createType}
                    onValueChange={(v) => setCreateType(v as ConversionType)}
                    disabled={isCreating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="click">Button Click</SelectItem>
                      <SelectItem value="video_view">Video View (80%+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Slot (optional)</Label>
                  <Select
                    value={createSlotId}
                    onValueChange={setCreateSlotId}
                    disabled={isCreating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any slot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Any slot</SelectItem>
                      {slots.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {slot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {createType === "click" && (
                  <div className="space-y-2">
                    <Label htmlFor="pattern">URL Pattern (optional)</Label>
                    <Input
                      id="pattern"
                      placeholder="e.g., /signup or https://example.com/buy"
                      value={createUrlPattern}
                      onChange={(e) => setCreateUrlPattern(e.target.value)}
                      disabled={isCreating}
                    />
                    <p className="text-xs text-muted-foreground">
                      Track clicks that navigate to URLs matching this pattern
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isCreating}
                  className="bg-transparent"
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {rules.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Created</TableHead>
                {canEdit && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {rule.conversion_type === "click" ? (
                        <>
                          <MousePointer className="mr-1 h-3 w-3" />
                          Click
                        </>
                      ) : (
                        <>
                          <Eye className="mr-1 h-3 w-3" />
                          Video View
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {rule.target_slot_id
                      ? getSlotName(rule.target_slot_id)
                      : rule.target_url_pattern || "Any"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(rule.created_at).toLocaleDateString()}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditRule(rule)
                              setEditName(rule.name)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteRule(rule)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No conversion rules</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Create conversion rules to track important user actions like
              button clicks and video completions.
            </p>
            {canEdit && (
              <Button className="mt-6" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first rule
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editRule}
        onOpenChange={(open) => !open && setEditRule(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Rule</DialogTitle>
            <DialogDescription>Update the rule name</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditRule(null)}
              disabled={isSaving}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!editName.trim() || isSaving}>
              {isSaving ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteRule}
        onOpenChange={(open) => !open && setDeleteRule(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteRule?.name}&quot;?
              Historical conversion data will still be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="bg-transparent">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
