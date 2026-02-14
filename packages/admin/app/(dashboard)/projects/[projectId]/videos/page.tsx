'use client'

import React from 'react'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Plus,
  Video as VideoIcon,
  MoreVertical,
  Pencil,
  Trash2,
  AlertCircle,
  Upload,
  Clock,
  FileVideo,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Video } from '@/lib/types'

export default function VideosPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Upload state
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Edit state
  const [editVideo, setEditVideo] = useState<Video | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Delete state
  const [deleteVideo, setDeleteVideo] = useState<Video | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadVideos = useCallback(async () => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    setUserRole(profile?.role || null)

    // Get videos
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load videos')
      return
    }

    setVideos(data || [])
    setIsLoading(false)
  }, [projectId, router])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  const canEdit = userRole === 'owner' || userRole === 'admin'

  const formatDuration = (totalSeconds: number) => {
    const seconds = Math.floor(totalSeconds)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a video file (MP4 or WebM)')
      return
    }

    // Check file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      setUploadError('File size must be less than 100MB')
      return
    }

    setUploadFile(file)
    setUploadError(null)

    // Auto-fill title if empty
    if (!uploadTitle) {
      const name = file.name.replace(/\.[^/.]+$/, '')
      setUploadTitle(name)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      setUploadError('Please provide a title and select a file')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    try {
      const supabase = createClient()

      // Get video duration
      const duration = await getVideoDuration(uploadFile)

      // Generate unique file path
      const ext = uploadFile.name.split('.').pop()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()
      if (!profile) {
        router.push('/login')
        return
      }
      const fileName = `${profile.organization_id}/${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, uploadFile, {
          cacheControl: '3600',
          upsert: false,
        })

      setUploadProgress(50)

      if (uploadError) {
        setUploadError(uploadError.message)
        setIsUploading(false)
        return
      }

      // Create video record
      const { error: insertError } = await supabase.from('videos').insert({
        project_id: projectId,
        title: uploadTitle.trim(),
        video_url: fileName,
        duration_seconds: duration,
      })

      setUploadProgress(100)

      if (insertError) {
        // Clean up uploaded file
        await supabase.storage.from('videos').remove([fileName])
        setUploadError(insertError.message)
        setIsUploading(false)
        return
      }

      toast.success('Video uploaded successfully')
      setIsUploadOpen(false)
      setUploadTitle('')
      setUploadFile(null)
      setUploadProgress(0)
      loadVideos()
    } catch (err) {
      setUploadError('Failed to upload video')
    } finally {
      setIsUploading(false)
    }
  }

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src)
        resolve(Math.round(video.duration))
      }
      video.onerror = () => {
        resolve(0)
      }
      video.src = URL.createObjectURL(file)
    })
  }

  const handleEdit = async () => {
    if (!editVideo || !editTitle.trim()) return

    setIsSaving(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('videos')
        .update({ title: editTitle.trim() })
        .eq('id', editVideo.id)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Video updated')
      setEditVideo(null)
      loadVideos()
    } catch (err) {
      toast.error('Failed to update video')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteVideo) return

    setIsDeleting(true)

    try {
      const supabase = createClient()

      // Delete from storage first
      if (deleteVideo.video_url) {
        await supabase.storage.from('videos').remove([deleteVideo.video_url])
      }

      // Delete video record
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', deleteVideo.id)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Video deleted')
      setDeleteVideo(null)
      loadVideos()
    } catch (err) {
      toast.error('Failed to delete video')
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Videos</h1>
          <p className="text-muted-foreground">Manage videos for your widget</p>
        </div>
        {canEdit && (
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Upload Video
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Video</DialogTitle>
                <DialogDescription>
                  Upload a video file (MP4 or WebM, max 100MB)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {uploadError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Video title"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Video File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file"
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                      className="cursor-pointer"
                    />
                  </div>
                  {uploadFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {uploadFile.name} (
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-center text-muted-foreground">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={isUploading}
                  className="bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!uploadFile || !uploadTitle.trim() || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {videos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Card key={video.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <FileVideo className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base line-clamp-1">
                        {video.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(video.duration_seconds ?? 0)}
                      </CardDescription>
                    </div>
                  </div>
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditVideo(video)
                            setEditTitle(video.title)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteVideo(video)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Added {new Date(video.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <VideoIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No videos yet</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Upload your first video to start creating interactive widget
              content.
            </p>
            {canEdit && (
              <Button className="mt-6" onClick={() => setIsUploadOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Upload your first video
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editVideo}
        onOpenChange={(open) => !open && setEditVideo(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Video</DialogTitle>
            <DialogDescription>Update the video title</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditVideo(null)}
              disabled={isSaving}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editTitle.trim() || isSaving}
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
        open={!!deleteVideo}
        onOpenChange={(open) => !open && setDeleteVideo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteVideo?.title}&quot;?
              This action cannot be undone. Any slots using this video will also
              be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="bg-transparent">
              Cancel
            </AlertDialogCancel>
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
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
