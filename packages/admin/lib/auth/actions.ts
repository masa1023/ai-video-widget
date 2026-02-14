'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type AuthActionResult = {
  error?: string
  success?: boolean
  message?: string
}

export async function signUp(formData: FormData): Promise<AuthActionResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const organizationName = formData.get('organizationName') as string
  const displayName = formData.get('displayName') as string

  if (!email || !password || !organizationName) {
    return { error: 'Email, password, and organization name are required' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        display_name: displayName || email.split('@')[0],
        organization_name: organizationName,
      },
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user' }
  }

  // Create organization and profile using service role or trigger
  // Note: This is handled by database trigger for RLS compliance
  // The trigger creates org + profile when user confirms email

  return {
    success: true,
    message: 'Please check your email to confirm your account',
  }
}

export async function signIn(formData: FormData): Promise<AuthActionResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.user) {
    return { error: 'Failed to sign in' }
  }

  // Check if user has a profile with an active organization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, organizations!inner(status)')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    // User exists but no profile yet - might be waiting for email confirmation
    await supabase.auth.signOut()
    return { error: 'Please complete your account setup first' }
  }

  const org = profile.organizations as unknown as { status: string }
  if (org.status !== 'active') {
    await supabase.auth.signOut()
    return { error: 'Your organization is not active. Please contact support.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resetPassword(
  formData: FormData
): Promise<AuthActionResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return {
    success: true,
    message: 'Check your email for the password reset link',
  }
}

export async function updatePassword(
  formData: FormData
): Promise<AuthActionResult> {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return { error: 'Both password fields are required' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getCurrentProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      `
      *,
      organizations (
        id,
        name,
        status
      )
    `
    )
    .eq('id', user.id)
    .single()

  return profile
}
