'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandLockup } from '@/components/brand-lockup'
import PixelSnow from '@/components/pixel-snow'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [sessionValid, setSessionValid] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const tokenHash = params.get('token_hash') || params.get('token')
    const tokenType = params.get('type') === 'reset_password' ? 'recovery' : params.get('type') || 'recovery'

    const verifyResetSession = async () => {
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) throw exchangeError
        window.history.replaceState({}, '', '/auth/reset-password')
      } else if (tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tokenType as 'recovery' })
        if (verifyError) throw verifyError
        window.history.replaceState({}, '', '/auth/reset-password')
      }

      const { data, error: sessionError } = await supabase.auth.getUser()
      setSessionValid(Boolean(data.user) && !sessionError)
      if (sessionError || !data.user) setError('Tautan reset password tidak berlaku atau sudah kedaluwarsa.')
      setCheckingSession(false)
    }

    verifyResetSession().catch(() => {
      setError('Tautan reset password tidak dapat diverifikasi. Minta tautan baru dari halaman login.')
      setCheckingSession(false)
    })
  }, [])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== confirmation) {
      setError('Konfirmasi password tidak sama.')
      return
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }
    if (!sessionValid) {
      setError('Sesi reset password tidak ditemukan. Minta tautan baru dari halaman login.')
      return
    }
    setSaving(true)
    const { error: updateError } = await createClient().auth.updateUser({ password })
    setSaving(false)
    if (updateError) {
      setError(updateError.message || 'Gagal memperbarui password.')
      return
    }
    router.replace('/login?reset=success')
  }

  return (
    <main className="relative grid min-h-[100svh] place-items-center overflow-hidden bg-slate-950 p-5 text-white">
      <PixelSnow className="z-0 opacity-60" color="#ffffff" flakeSize={0.01} minFlakeSize={1.25} pixelResolution={200} speed={1.25} density={0.22} direction={125} brightness={0.9} />
      <div className="pointer-events-none absolute inset-0 z-0 bg-slate-950/35" />
      <div className="absolute left-5 top-6 sm:left-10 sm:top-8"><BrandLockup /></div>
      <Card className="relative z-10 mt-16 w-full max-w-md bg-white shadow-2xl shadow-cyan-950/30">
        <div className="h-1.5 rounded-t-xl bg-gradient-to-r from-cyan-400 to-blue-500" />
        <CardHeader className="p-6 pb-4 sm:p-7 sm:pb-5">
          <CardTitle className="text-2xl">Atur password baru</CardTitle>
          <CardDescription>Gunakan password minimal 8 karakter untuk akun Anda.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-1 sm:p-7 sm:pt-2">
          {checkingSession ? <p className="text-sm text-muted-foreground">Memeriksa tautan reset...</p> : !sessionValid ? <div className="flex flex-col gap-4"><p role="alert" className="text-sm leading-5 text-destructive">{error}</p><Button type="button" variant="outline" onClick={() => router.replace('/login')}>Kembali ke login</Button></div> : <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2"><Label htmlFor="password">Password baru</Label><Input className="h-11" id="password" type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} autoComplete="new-password" /></div>
            <div className="flex flex-col gap-2"><Label htmlFor="confirmation">Konfirmasi password</Label><Input className="h-11" id="confirmation" type="password" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setError('') }} autoComplete="new-password" /></div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan password'}</Button>
          </form>}
        </CardContent>
      </Card>
    </main>
  )
}
