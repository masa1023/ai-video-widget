'use client'

import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Video, Trash2, Edit, Loader2, PlayCircle } from 'lucide-react'
import { createVideo, deleteVideo, updateVideo, getVideos } from '@/lib/actions/videos'
import { toast } from 'sonner'
import type { Video as VideoType } from '@/lib/types/database'

export function ProjectVideos({ projectId }: { projectId: string }) {
  const [videos, setVideos] = useState<VideoType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVideo, setEditingVideo] = useState<VideoType | null>(null)

  useEffect(() => {
    loadVideos()
  }, [projectId])

  async function loadVideos() {
    setIsLoading(true)
    const data = await getVideos(projectId)
    setVideos(data)
    setIsLoading(false)
  }

  async function handleCreate(formData: FormData) {
    setIsCreating(true)
    formData.append('projectId', projectId)
    const result = await createVideo(formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Video added successfully')
      setIsDialogOpen(false)
      loadVideos()
    }
    setIsCreating(false)
  }

  async function handleUpdate(formData: FormData) {
    if (!editingVideo) return
    setIsCreating(true)
    const result = await updateVideo(editingVideo.id, formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Video updated successfully')
      setEditingVideo(null)
      loadVideos()
    }
    setIsCreating(false)
  }

  async function handleDelete(video: VideoType) {
    if (!confirm(`Are you sure you want to delete "${video.title}"?`)) return
    const result = await deleteVideo(video.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Video deleted successfully')
      loadVideos()
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
        <h3 className="text-lg font-medium">Videos</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form action={handleCreate}>
              <DialogHeader>
                <DialogTitle>Add Video</DialogTitle>
                <DialogDescription>
                  Upload a video file or add a video reference to your project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Video File</Label>
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept="video/*"
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: MP4, WebM, MOV
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Add Video'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {videos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No videos in this project yet</p>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first video
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Card key={video.id} className="group overflow-hidden">
              <div className="aspect-video bg-muted relative flex items-center justify-center">
                {video.thumbnail_path ? (
                  <img
                    src={video.thumbnail_path || "/placeholder.svg"}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PlayCircle className="h-12 w-12 text-muted-foreground/50" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setEditingVideo(video)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(video)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <h4 className="font-medium truncate">{video.title}</h4>
                {video.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {video.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    video.status === 'ready'
                      ? 'bg-green-100 text-green-800'
                      : video.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {video.status}
                  </span>
                  {video.duration_sec && (
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(video.duration_sec)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingVideo} onOpenChange={() => setEditingVideo(null)}>
        <DialogContent>
          <form action={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Video</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  name="title"
                  defaultValue={editingVideo?.title}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={editingVideo?.description || ''}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingVideo(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
