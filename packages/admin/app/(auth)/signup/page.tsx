'use client'

import React from 'react'

import { useState } from 'react'
import Link from 'next/link'
import { signUp, type AuthActionResult } from '@/lib/auth/actions'
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
import { AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function SignupPage() {
  const [organizationName, setOrganizationName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const passwordValid = password.length >= 6
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!passwordValid) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.set('email', email)
      formData.set('password', password)
      formData.set('organizationName', organizationName)
      formData.set('displayName', displayName)

      const result: AuthActionResult = await signUp(formData)

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Check your email
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {"We've sent a confirmation link to "}
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>
            Click the link in your email to verify your account and complete the
            setup.
          </p>
          <p className="mt-4">
            {"Didn't receive the email? Check your spam folder or "}
            <button
              onClick={() => {
                setIsSuccess(false)
                setIsLoading(false)
              }}
              className="text-primary hover:underline"
            >
              try again
            </button>
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full bg-transparent">
              Back to login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-foreground">
          Create an account
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Set up your organization to get started
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization Name</Label>
            <Input
              id="organizationName"
              type="text"
              placeholder="Your company or team name"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="organization"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Your Name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {password.length > 0 && !passwordValid && (
              <p className="mt-1 text-xs text-muted-foreground">
                At least 6 characters
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
            {confirmPassword.length > 0 && (
              <p
                className={`text-xs ${passwordsMatch ? 'text-primary' : 'text-destructive'}`}
              >
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !passwordValid || !passwordsMatch}
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
