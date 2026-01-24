import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, TreeDeciduous } from 'lucide-react'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <TreeDeciduous className="h-10 w-10 text-primary" />
          <span className="text-3xl font-bold text-foreground">Bonsai Video</span>
        </div>
        
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-center">Authentication Error</CardTitle>
            <CardDescription className="text-center">
              {message || 'An error occurred during authentication. Please try again.'}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2">
            <Link href="/auth/login" className="w-full">
              <Button className="w-full">
                Back to login
              </Button>
            </Link>
            <Link href="/auth/sign-up" className="w-full">
              <Button variant="outline" className="w-full bg-transparent">
                Create new account
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
