'use client'

import React from 'react'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import {
  Plus,
  Layers,
  Play,
  Link as LinkIcon,
  ArrowRight,
  Trash2,
  Pencil,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoType {
  id: string
  project_id: string
  title: string
  video_url: string
  duration_seconds: number | null
  created_at: string
  updated_at: string
}

interface SlotType {
  id: string
  project_id: string
  video_id: string
  title: string
  is_entry_point: boolean
  cta_button_text: string | null
  cta_button_url: string | null
  detail_button_text: string | null
  detail_button_url: string | null
  position_x: number | null
  position_y: number | null
  created_at: string
  updated_at: string
  video: VideoType
}

interface TransitionType {
  id: string
  from_slot_id: string
  to_slot_id: string
  created_at: string
}

interface SlotGraphEditorProps {
  videos: VideoType[]
  slots: SlotType[]
  transitions: TransitionType[]
  canEdit: boolean
  onSlotCreate: (slot: Partial<SlotType>) => Promise<SlotType | null>
  onSlotUpdate: (id: string, updates: Partial<SlotType>) => Promise<boolean>
  onSlotDelete: (id: string) => Promise<boolean>
  onTransitionCreate: (
    fromSlotId: string,
    toSlotId: string
  ) => Promise<TransitionType | null>
  onTransitionDelete: (id: string) => Promise<boolean>
}

export function SlotGraphEditor({
  videos,
  slots,
  transitions,
  canEdit,
  onSlotCreate,
  onSlotUpdate,
  onSlotDelete,
  onTransitionCreate,
  onTransitionDelete,
}: SlotGraphEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null)

  // Create slot dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createVideoId, setCreateVideoId] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Edit slot dialog
  const [editSlot, setEditSlot] = useState<SlotType | null>(null)
  const [editName, setEditName] = useState('')
  const [editCtaText, setEditCtaText] = useState('')
  const [editCtaUrl, setEditCtaUrl] = useState('')
  const [editDetailText, setEditDetailText] = useState('')
  const [editDetailUrl, setEditDetailUrl] = useState('')
  const [editIsEntry, setEditIsEntry] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Delete slot dialog
  const [deleteSlot, setDeleteSlot] = useState<SlotType | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Connection mode
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)

  // Dragging
  const [dragging, setDragging] = useState<{
    id: string
    startX: number
    startY: number
    offsetX: number
    offsetY: number
  } | null>(null)

  const handleCreateSlot = async () => {
    if (!createName.trim() || !createVideoId) return

    setIsCreating(true)

    const result = await onSlotCreate({
      title: createName.trim(),
      video_id: createVideoId,
      position_x: 100 + Math.random() * 200,
      position_y: 100 + Math.random() * 200,
    })

    setIsCreating(false)

    if (result) {
      setIsCreateOpen(false)
      setCreateName('')
      setCreateVideoId('')
    }
  }

  const handleEditSlot = async () => {
    if (!editSlot || !editName.trim()) return

    setIsSaving(true)

    const success = await onSlotUpdate(editSlot.id, {
      title: editName.trim(),
      cta_button_text: editCtaText.trim() || null,
      cta_button_url: editCtaUrl.trim() || null,
      detail_button_text: editDetailText.trim() || null,
      detail_button_url: editDetailUrl.trim() || null,
      is_entry_point: editIsEntry,
    })

    setIsSaving(false)

    if (success) {
      setEditSlot(null)
    }
  }

  const handleDeleteSlot = async () => {
    if (!deleteSlot) return

    setIsDeleting(true)
    await onSlotDelete(deleteSlot.id)
    setIsDeleting(false)
    setDeleteSlot(null)
  }

  const handleSlotClick = (slot: SlotType) => {
    if (connectingFrom) {
      if (connectingFrom !== slot.id) {
        onTransitionCreate(connectingFrom, slot.id)
      }
      setConnectingFrom(null)
    }
  }

  const handleMouseDown = (e: React.MouseEvent, slot: SlotType) => {
    if (!canEdit) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    setDragging({
      id: slot.id,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: slot.position_x || 0,
      offsetY: slot.position_y || 0,
    })
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging) return

      const deltaX = e.clientX - dragging.startX
      const deltaY = e.clientY - dragging.startY

      const newX = Math.max(0, dragging.offsetX + deltaX)
      const newY = Math.max(0, dragging.offsetY + deltaY)

      onSlotUpdate(dragging.id, {
        position_x: newX,
        position_y: newY,
      })
    },
    [dragging, onSlotUpdate]
  )

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  // Calculate SVG lines for transitions
  const transitionLines = transitions
    .map((t) => {
      const fromSlot = slots.find((s) => s.id === t.from_slot_id)
      const toSlot = slots.find((s) => s.id === t.to_slot_id)
      if (!fromSlot || !toSlot) return null

      return {
        id: t.id,
        x1: (fromSlot.position_x || 0) + 120,
        y1: (fromSlot.position_y || 0) + 50,
        x2: toSlot.position_x || 0,
        y2: (toSlot.position_y || 0) + 50,
      }
    })
    .filter(Boolean) as {
    id: string
    x1: number
    y1: number
    x2: number
    y2: number
  }[]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Slots</h1>
          <p className="text-muted-foreground">
            Create and connect video navigation nodes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connectingFrom && (
            <Badge variant="secondary" className="mr-2">
              Click a slot to connect
              <button className="ml-2" onClick={() => setConnectingFrom(null)}>
                Cancel
              </button>
            </Badge>
          )}
          {canEdit && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              disabled={videos.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Slot
            </Button>
          )}
        </div>
      </div>

      {videos.length === 0 ? (
        <Card className="flex-1 border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="rounded-full bg-muted p-4">
              <Play className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No videos available</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Upload some videos first before creating slots.
            </p>
          </CardContent>
        </Card>
      ) : slots.length === 0 ? (
        <Card className="flex-1 border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="rounded-full bg-muted p-4">
              <Layers className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No slots yet</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Create slots to define your video navigation flow.
            </p>
            {canEdit && (
              <Button className="mt-6" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first slot
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          ref={canvasRef}
          className="flex-1 relative bg-muted/30 rounded-lg border overflow-auto"
          style={{ minHeight: 400 }}
        >
          {/* Connection lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="currentColor"
                  className="text-primary"
                />
              </marker>
            </defs>
            {transitionLines.map((line) => (
              <g key={line.id}>
                <line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary/50"
                  markerEnd="url(#arrowhead)"
                />
                {canEdit && (
                  <circle
                    cx={(line.x1 + line.x2) / 2}
                    cy={(line.y1 + line.y2) / 2}
                    r="8"
                    className="fill-background stroke-destructive cursor-pointer pointer-events-auto hover:fill-destructive/10"
                    onClick={() => onTransitionDelete(line.id)}
                  />
                )}
              </g>
            ))}
          </svg>

          {/* Slot nodes */}
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={cn(
                'absolute w-60 cursor-move select-none',
                dragging?.id === slot.id && 'opacity-75'
              )}
              style={{
                left: slot.position_x || 0,
                top: slot.position_y || 0,
              }}
              onMouseDown={(e) => handleMouseDown(e, slot)}
              onClick={() => handleSlotClick(slot)}
            >
              <Card
                className={cn(
                  'border-2 transition-colors',
                  slot.is_entry_point
                    ? 'border-primary'
                    : 'border-border hover:border-primary/50',
                  connectingFrom &&
                    connectingFrom !== slot.id &&
                    'ring-2 ring-primary/30'
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {slot.is_entry_point && (
                        <Star className="h-4 w-4 text-primary fill-primary" />
                      )}
                      {slot.title}
                    </CardTitle>
                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            setConnectingFrom(slot.id)
                          }}
                        >
                          <LinkIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditSlot(slot)
                            setEditName(slot.title || '')
                            setEditCtaText(slot.cta_button_text || '')
                            setEditCtaUrl(slot.cta_button_url || '')
                            setEditDetailText(slot.detail_button_text || '')
                            setEditDetailUrl(slot.detail_button_url || '')
                            setEditIsEntry(slot.is_entry_point)
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteSlot(slot)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground truncate mb-2">
                    {slot.video.title}
                  </p>
                  {slot.detail_button_text && (
                    <Badge variant="outline" className="text-xs">
                      <ArrowRight className="h-3 w-3" />
                      <span className="ml-1">{slot.detail_button_text}</span>
                    </Badge>
                  )}
                  {slot.cta_button_text && (
                    <Badge variant="outline" className="text-xs mt-1">
                      <ArrowRight className="h-3 w-3" />
                      <span className="ml-1">{slot.cta_button_text}</span>
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Create Slot Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Slot</DialogTitle>
            <DialogDescription>
              Add a new video slot to your navigation flow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Slot Name</Label>
              <Input
                id="name"
                placeholder="Welcome Video"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video">Video</Label>
              <Select
                value={createVideoId}
                onValueChange={setCreateVideoId}
                disabled={isCreating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a video" />
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
            <Button
              onClick={handleCreateSlot}
              disabled={!createName.trim() || !createVideoId || isCreating}
            >
              {isCreating ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Slot Dialog */}
      <Dialog
        open={!!editSlot}
        onOpenChange={(open) => !open && setEditSlot(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Slot</DialogTitle>
            <DialogDescription>
              Update slot settings and button configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Slot Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Entry Point</Label>
                <p className="text-sm text-muted-foreground">
                  Set as the starting slot for the widget
                </p>
              </div>
              <Switch
                checked={editIsEntry}
                onCheckedChange={setEditIsEntry}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cta-text">CTA Button Text</Label>
              <Input
                id="edit-cta-text"
                placeholder="Learn More"
                value={editCtaText}
                onChange={(e) => setEditCtaText(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cta-url">CTA Button URL</Label>
              <Input
                id="edit-cta-url"
                placeholder="https://example.com"
                value={editCtaUrl}
                onChange={(e) => setEditCtaUrl(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-detail-text">Detail Button Text</Label>
              <Input
                id="edit-detail-text"
                placeholder="View Details"
                value={editDetailText}
                onChange={(e) => setEditDetailText(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-detail-url">Detail Button URL</Label>
              <Input
                id="edit-detail-url"
                placeholder="https://example.com/details"
                value={editDetailUrl}
                onChange={(e) => setEditDetailUrl(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditSlot(null)}
              disabled={isSaving}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSlot}
              disabled={!editName.trim() || isSaving}
            >
              {isSaving ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteSlot}
        onOpenChange={(open) => !open && setDeleteSlot(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteSlot?.title}&quot;?
              This will also remove all transitions connected to this slot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="bg-transparent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSlot}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
