'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Edit, Loader2, Target, Zap } from 'lucide-react'
import {
  getConversionRules,
  createConversionRule,
  updateConversionRule,
  deleteConversionRule,
  toggleConversionRule,
} from '@/lib/actions/conversions'
import { getSlots } from '@/lib/actions/slots'
import { getVideos } from '@/lib/actions/videos'
import { toast } from 'sonner'
import type { ConversionRule, Slot, Video } from '@/lib/types/database'

const eventTypeLabels: Record<string, string> = {
  slot_reached: 'Slot Reached',
  video_completed: 'Video Completed',
  cta_clicked: 'CTA Clicked',
}

export function ProjectConversions({ projectId }: { projectId: string }) {
  const [rules, setRules] = useState<ConversionRule[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ConversionRule | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    const [rulesData, slotsData, videosData] = await Promise.all([
      getConversionRules(projectId),
      getSlots(projectId),
      getVideos(projectId),
    ])
    setRules(rulesData)
    setSlots(slotsData)
    setVideos(videosData)
    setIsLoading(false)
  }, [projectId])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleCreate(formData: FormData) {
    setIsSubmitting(true)
    formData.append('projectId', projectId)
    const result = await createConversionRule(formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Conversion rule created successfully')
      setIsDialogOpen(false)
      loadData()
    }
    setIsSubmitting(false)
  }

  async function handleUpdate(formData: FormData) {
    if (!editingRule) return
    setIsSubmitting(true)
    formData.append('projectId', projectId)
    const result = await updateConversionRule(editingRule.id, formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Conversion rule updated successfully')
      setEditingRule(null)
      loadData()
    }
    setIsSubmitting(false)
  }

  async function handleDelete(rule: ConversionRule) {
    if (!confirm(`Are you sure you want to delete "${rule.name}"?`)) return
    const result = await deleteConversionRule(rule.id, projectId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Conversion rule deleted successfully')
      loadData()
    }
  }

  async function handleToggle(rule: ConversionRule) {
    const result = await toggleConversionRule(rule.id, !rule.is_active, projectId)
    if (result.error) {
      toast.error(result.error)
    } else {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Conversion Rules</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form action={handleCreate}>
              <DialogHeader>
                <DialogTitle>Add Conversion Rule</DialogTitle>
                <DialogDescription>
                  Define events that count as conversions for your analytics.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="e.g., Completed Demo Video" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select name="eventType" defaultValue="slot_reached">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slot_reached">Slot Reached</SelectItem>
                      <SelectItem value="video_completed">Video Completed</SelectItem>
                      <SelectItem value="cta_clicked">CTA Clicked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slotId">Target Slot (optional)</Label>
                  <Select name="slotId">
                    <SelectTrigger>
                      <SelectValue placeholder="Any slot" />
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
                  <Label htmlFor="videoId">Target Video (optional)</Label>
                  <Select name="videoId">
                    <SelectTrigger>
                      <SelectValue placeholder="Any video" />
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
                  <Label htmlFor="isActive">Active</Label>
                  <Switch id="isActive" name="isActive" value="true" defaultChecked />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Rule'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {rules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No conversion rules yet</p>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first conversion rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      rule.is_active ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Zap className={`h-5 w-5 ${rule.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium">{rule.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {eventTypeLabels[rule.event_type]}
                        {rule.condition.slot_id && (
                          <span> - Slot: {slots.find(s => s.id === rule.condition.slot_id)?.name}</span>
                        )}
                        {rule.condition.video_id && (
                          <span> - Video: {videos.find(v => v.id === rule.condition.video_id)?.title}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggle(rule)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingRule(rule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(rule)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
        <DialogContent>
          <form action={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Conversion Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingRule?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-eventType">Event Type</Label>
                <Select name="eventType" defaultValue={editingRule?.event_type}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slot_reached">Slot Reached</SelectItem>
                    <SelectItem value="video_completed">Video Completed</SelectItem>
                    <SelectItem value="cta_clicked">CTA Clicked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-slotId">Target Slot (optional)</Label>
                <Select name="slotId" defaultValue={editingRule?.condition.slot_id || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any slot" />
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
                <Label htmlFor="edit-videoId">Target Video (optional)</Label>
                <Select name="videoId" defaultValue={editingRule?.condition.video_id || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any video" />
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
                <Label htmlFor="edit-isActive">Active</Label>
                <Switch
                  id="edit-isActive"
                  name="isActive"
                  value="true"
                  defaultChecked={editingRule?.is_active}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingRule(null)}>
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
