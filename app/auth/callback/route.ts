import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash') || url.searchParams.get('token')
  const requestedTokenType = url.searchParams.get('type')
  const tokenType = requestedTokenType === 'reset_password' ? 'recovery' : requestedTokenType as 'signup' | 'invite' | 'recovery' | 'email' | 'email_change' | null
  const providerError = url.searchParams.get('error')
  const requestedNext = url.searchParams.get('next') || '/'
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/'

  if (providerError) {
    return NextResponse.redirect(new URL('/login?error=callback_failed', url.origin))
  }

  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL('/login?error=missing_code', url.origin))
  }

  const cookieStore = await cookies()
  const response = NextResponse.redirect(new URL(next, url.origin))
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: tokenType || 'recovery' })
  if (error) return NextResponse.redirect(new URL('/login?error=callback_failed', url.origin))
  return response
}
