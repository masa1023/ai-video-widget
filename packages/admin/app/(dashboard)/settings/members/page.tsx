"use client"

import React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { toast } from "sonner"
import { Loader2, UserPlus, Users, Shield, Trash2, Crown } from "lucide-react"
import { redirect } from "next/navigation"

interface Member {
  id: string
  display_name: string | null
  email: string
  role: "owner" | "admin" | "viewer"
  created_at: string
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [currentUser, setCurrentUser] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "viewer">("viewer")
  const [inviting, setInviting] = useState(false)
  const [deleteMember, setDeleteMember] = useState<Member | null>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current user's profile
      const { data: currentProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) throw profileError

      // Only owners can access this page
      if (currentProfile.role !== "owner") {
        redirect("/dashboard")
      }

      setCurrentUser({ ...currentProfile, email: user.email || "" })

      // Get all members in the organization
      const { data: membersData, error: membersError } = await supabase
        .from("profiles")
        .select("*")
        .eq("organization_id", currentProfile.organization_id)
        .order("created_at", { ascending: true })

      if (membersError) throw membersError

      // Get emails for all members
      const membersWithEmails = membersData.map((member) => ({
        ...member,
        email: member.id === user.id ? user.email || "" : "---",
      }))

      setMembers(membersWithEmails)
    } catch (error) {
      console.error("Error fetching members:", error)
      toast.error("Failed to load members")
    } finally {
      setLoading(false)
    }
  }

  async function handleInviteMember(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUser || !inviteEmail.trim()) return

    setInviting(true)
    try {
      // In a real implementation, you would:
      // 1. Create an invitation record
      // 2. Send an email with a signup link containing the org_id and role
      // For now, we'll show a toast with instructions
      
      toast.success(
        `Invitation feature: In production, an email would be sent to ${inviteEmail} with a signup link that includes the organization ID and ${inviteRole} role.`
      )
      setInviteDialogOpen(false)
      setInviteEmail("")
      setInviteRole("viewer")
    } catch (error) {
      console.error("Error inviting member:", error)
      toast.error("Failed to send invitation")
    } finally {
      setInviting(false)
    }
  }

  async function handleUpdateRole(memberId: string, newRole: "admin" | "viewer") {
    if (!currentUser || memberId === currentUser.id) return

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", memberId)

      if (error) throw error

      setMembers(members.map((m) =>
        m.id === memberId ? { ...m, role: newRole } : m
      ))
      toast.success("Role updated successfully")
    } catch (error) {
      console.error("Error updating role:", error)
      toast.error("Failed to update role")
    }
  }

  async function handleDeleteMember() {
    if (!deleteMember || !currentUser) return

    setDeleting(true)
    try {
      // Remove member from organization by deleting their profile
      // This will cascade delete their auth user due to our trigger
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", deleteMember.id)

      if (error) throw error

      setMembers(members.filter((m) => m.id !== deleteMember.id))
      toast.success("Member removed successfully")
    } catch (error) {
      console.error("Error removing member:", error)
      toast.error("Failed to remove member")
    } finally {
      setDeleting(false)
      setDeleteMember(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-500" />
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <Users className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!currentUser || currentUser.role !== "owner") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">Manage your organization members and their roles</p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleInviteMember}>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organization
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(v: "admin" | "viewer") => setInviteRole(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          <span>Admin - Can edit videos, slots, and conversions</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>Viewer - Can only view analytics</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviting}>
                  {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? "s" : ""} in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        {member.display_name?.[0]?.toUpperCase() || member.email[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium">{member.display_name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      {member.id === currentUser.id && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          You
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(member.role)}
                      <span className="capitalize">{member.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(member.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {member.id !== currentUser.id && member.role !== "owner" && (
                      <div className="flex items-center justify-end gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(v: "admin" | "viewer") => handleUpdateRole(member.id, v)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteMember(member)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteMember} onOpenChange={() => setDeleteMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deleteMember?.display_name || deleteMember?.email} from your organization?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
