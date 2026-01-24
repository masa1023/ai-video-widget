'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Edit, Loader2, GitBranch, Play, ArrowRight } from 'lucide-react'
import {
  createSlot,
  deleteSlot,
  updateSlot,
  getSlotsWithTransitions,
  createTransition,
  deleteTransition,
} from '@/lib/actions/slots'
import { getVideos } from '@/lib/actions/videos'
import { toast } from 'sonner'
import type { Slot, SlotTransition, Video } from '@/lib/types/database'
import { SlotGraph } from './slot-graph'

type SlotWithVideo = Slot & { videos: Video | null }

export function ProjectSlots({ projectId }: { projectId: string }) {
  const [slots, setSlots] = useState<SlotWithVideo[]>([])
  const [transitions, setTransitions] = useState<SlotTransition[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false)
  const [isTransitionDialogOpen, setIsTransitionDialogOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<SlotWithVideo | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    const [slotsData, videosData] = await Promise.all([
      getSlotsWithTransitions(projectId),
      getVideos(projectId),
    ])
    setSlots(slotsData.slots as SlotWithVideo[])
    setTransitions(slotsData.transitions)
    setVideos(videosData)
    setIsLoading(false)
  }, [projectId])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleCreateSlot(formData: FormData) {
    setIsSubmitting(true)
    formData.append('projectId', projectId)
    const result = await createSlot(formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Slot created successfully')
      setIsSlotDialogOpen(false)
      loadData()
    }
    setIsSubmitting(false)
  }

  async function handleUpdateSlot(formData: FormData) {
    if (!editingSlot) return
    setIsSubmitting(true)
    formData.append('projectId', projectId)
    const result = await updateSlot(editingSlot.id, formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Slot updated successfully')
      setEditingSlot(null)
      loadData()
    }
    setIsSubmitting(false)
  }

  async function handleDeleteSlot(slot: Slot) {
    if (!confirm(`Are you sure you want to delete "${slot.name}"? This will also delete all transitions.`)) return
    const result = await deleteSlot(slot.id, projectId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Slot deleted successfully')
      loadData()
    }
  }

  async function handleCreateTransition(formData: FormData) {
    setIsSubmitting(true)
    const result = await createTransition(formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Transition created successfully')
      setIsTransitionDialogOpen(false)
      loadData()
    }
    setIsSubmitting(false)
  }

  async function handleDeleteTransition(id: string) {
    if (!confirm('Are you sure you want to delete this transition?')) return
    const result = await deleteTransition(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Transition deleted successfully')
      loadData()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Slots & Transitions</h3>
        <div className="flex gap-2">
          <Dialog open={isTransitionDialogOpen} onOpenChange={setIsTransitionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={slots.length < 2}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Add Transition
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form action={handleCreateTransition}>
                <DialogHeader>
                  <DialogTitle>Add Transition</DialogTitle>
                  <DialogDescription>
                    Create a transition between two slots.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromSlotId">From Slot</Label>
                    <Select name="fromSlotId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {slots.map((slot) => (
                          <SelectItem key={slot.id} value={slot.id}>
                            {slot.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toSlotId">To Slot</Label>
                    <Select name="toSlotId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {slots.map((slot) => (
                          <SelectItem key={slot.id} value={slot.id}>
                            {slot.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="triggerType">Trigger Type</Label>
                    <Select name="triggerType" defaultValue="auto">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto (on video end)</SelectItem>
                        <SelectItem value="time">Time-based</SelectItem>
                        <SelectItem value="click">Click</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeSec">Time (seconds)</Label>
                    <Input
                      id="timeSec"
                      name="timeSec"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 10.5"
                    />
                    <p className="text-xs text-muted-foreground">
                      Only used for time-based triggers
                    </p>
                  </div>
                  <input type="hidden" name="priority" value="0" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsTransitionDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Transition'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Slot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form action={handleCreateSlot}>
                <DialogHeader>
                  <DialogTitle>Add Slot</DialogTitle>
                  <DialogDescription>
                    Create a new slot for your interactive video flow.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videoId">Video</Label>
                    <Select name="videoId">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a video (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {videos.map((video) => (
                          <SelectItem key={video.id} value={video.id}>
                            {video.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="isEntryPoint">Entry Point</Label>
                      <p className="text-xs text-muted-foreground">
                        Set as the starting slot for this project
                      </p>
                    </div>
                    <Switch id="isEntryPoint" name="isEntryPoint" value="true" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsSlotDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Slot'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {slots.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No slots in this project yet</p>
            <Button variant="outline" onClick={() => setIsSlotDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first slot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Flow Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <SlotGraph
                slots={slots}
                transitions={transitions}
                onDeleteTransition={handleDeleteTransition}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot) => (
              <Card key={slot.id} className={slot.is_entry_point ? 'border-primary' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {slot.is_entry_point && (
                        <Play className="h-4 w-4 text-primary" />
                      )}
                      <h4 className="font-medium">{slot.name}</h4>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingSlot(slot)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteSlot(slot)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {slot.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {slot.description}
                    </p>
                  )}
                  {slot.videos && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Video:</span>
                      <span className="font-medium truncate">{slot.videos.title}</span>
                    </div>
                  )}
                  {slot.is_entry_point && (
                    <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      Entry Point
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={!!editingSlot} onOpenChange={() => setEditingSlot(null)}>
        <DialogContent>
          <form action={handleUpdateSlot}>
            <DialogHeader>
              <DialogTitle>Edit Slot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingSlot?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={editingSlot?.description || ''}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-videoId">Video</Label>
                <Select name="videoId" defaultValue={editingSlot?.video_id || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a video (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {videos.map((video) => (
                      <SelectItem key={video.id} value={video.id}>
                        {video.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-isEntryPoint">Entry Point</Label>
                  <p className="text-xs text-muted-foreground">
                    Set as the starting slot for this project
                  </p>
                </div>
                <Switch
                  id="edit-isEntryPoint"
                  name="isEntryPoint"
                  value="true"
                  defaultChecked={editingSlot?.is_entry_point}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingSlot(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
