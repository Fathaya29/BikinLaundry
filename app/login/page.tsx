'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowUpRight, CheckCircle2, ClipboardCheck, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PixelSnow from '@/components/pixel-snow'
import { BrandLockup } from '@/components/brand-lockup'

type SignupRole = 'project-manager' | 'laundry-biz'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [roleCode, setRoleCode] = useState('')
  const [confirmationRequired, setConfirmationRequired] = useState(false)
  const [confirmationKind, setConfirmationKind] = useState<'reset'>('reset')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const callbackError = params.get('error')
    if (callbackError === 'missing_code') setError('Tautan autentikasi tidak lengkap. Silakan coba lagi.')
    if (callbackError === 'callback_failed') setError('Tautan autentikasi sudah tidak berlaku. Silakan coba lagi.')
    if (callbackError === 'email_not_confirmed') setError('Email Anda belum diverifikasi. Buka tautan verifikasi di Gmail terlebih dahulu.')
    if (params.get('reset') === 'success') setError('Password berhasil diperbarui. Silakan masuk dengan password baru.')
  }, [])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('Masukkan alamat email yang valid.')
      return
    }
    if (mode === 'forgot') {
      setError('')
      setSending(true)
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      setSending(false)
      if (resetError) setError(resetError.message || 'Gagal mengirim email reset password.')
      else {
        setConfirmationRequired(true)
      }
      return
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }
    if (mode === 'signup' && password !== passwordConfirmation) {
      setError('Konfirmasi password tidak sama.')
      return
    }
    setError('')
    setSending(true)
    let signupRole: SignupRole | undefined
    if (mode === 'signup') {
      const roleResponse = await fetch('/api/auth/validate-role-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: roleCode }),
      })
      if (!roleResponse.ok) {
        setSending(false)
        setError('Kode akses tidak valid. Periksa kembali kode yang diberikan kepada Anda.')
        return
      }
      signupRole = (await roleResponse.json()).role as SignupRole
    }
    const supabase = createClient()
    const result = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      : await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/verify-email`, data: { role: signupRole } },
      })
    if (result.error) {
      setSending(false)
      const message = result.error.message.toLowerCase()
      setError(message.includes('invalid login credentials') ? 'Email atau password salah.' : result.error.message || 'Autentikasi gagal. Silakan coba lagi.')
      return
    }
    if (mode === 'signin' && (!result.data.user || !result.data.user.email_confirmed_at)) {
      await supabase.auth.signOut()
      setSending(false)
      setError('Email Anda belum diverifikasi. Buka tautan verifikasi di Gmail terlebih dahulu.')
      return
    }
    if (mode === 'signup') {
      if (!result.data.session) {
        setSending(false)
        setError('Signup belum menghasilkan sesi. Nonaktifkan Confirm email di Supabase untuk memakai kode akses tanpa Gmail.')
        return
      }
      setSending(false)
      window.location.assign('/')
      return
    }
    window.location.assign('/')
  }

  return (
    <main id="main-content" className="relative min-h-[100svh] overflow-hidden bg-slate-950 text-white">
      <PixelSnow className="z-0 opacity-60" color="#ffffff" flakeSize={0.01} minFlakeSize={1.25} pixelResolution={200} speed={1.25} density={0.22} direction={125} brightness={0.9} />
      <div className="pointer-events-none absolute inset-0 z-0 bg-slate-950/35" />
      <div className="mx-auto grid min-h-[100svh] max-w-7xl md:grid-cols-[1.05fr_0.95fr]">
        <section className="relative z-10 flex flex-col justify-start gap-8 overflow-hidden px-6 py-8 md:min-h-[100svh] md:justify-between md:px-10 lg:px-16 lg:py-12">
          <div className="absolute -left-24 top-24 size-96 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute bottom-[-10rem] right-[-5rem] size-[32rem] rounded-full bg-blue-500/15 blur-3xl" />
          <BrandLockup className="relative" />
          <div className="relative max-w-2xl py-0 sm:py-16 lg:py-24"><p className="mb-4 hidden items-center gap-2 text-sm font-medium text-cyan-300 sm:mb-6 md:flex"><span className="size-2 rounded-full bg-cyan-300 shadow-[0_0_14px_#67e8f9]" /><span>Selamat datang di ruang kerja tim</span></p><h1 className="hidden max-w-xl text-3xl font-semibold leading-tight tracking-tight text-white md:block md:text-6xl">Pantau semua progres outlet dengan <span className="text-cyan-300">lebih tenang.</span></h1><p className="mt-4 hidden max-w-lg text-base leading-6 text-slate-300 sm:mt-6 sm:block sm:leading-7">Simpan informasi project, cek perkembangan outlet, dan tetap terhubung dengan tim dalam satu tempat.</p><div className="mt-6 hidden flex-wrap gap-3 sm:mt-10 sm:flex"><div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"><ClipboardCheck className="text-cyan-300" />Progres lebih jelas</div><div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"><ShieldCheck className="text-cyan-300" />Data tetap aman</div></div></div>
          <p className="relative hidden text-xs tracking-wide text-slate-500 md:block">AKSES INTERNAL TIM BERANI LAUNDRY</p>
        </section>
        <section className="relative z-10 flex items-center justify-center px-4 py-6 sm:px-10 md:min-h-[100svh] md:px-10 md:py-10">
          <Card className="relative w-full max-w-md rounded-2xl border-white/10 bg-white text-slate-950 shadow-2xl shadow-cyan-950/30 md:rounded-xl">
            <div className="h-1.5 rounded-t-2xl bg-gradient-to-r from-cyan-400 to-blue-500 md:rounded-t-xl" />
            {confirmationRequired ? (
              <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
                <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="size-8" /></div>
                <div className="flex flex-col gap-2"><CardTitle className="text-xl">Tautan reset password sudah dikirim</CardTitle><CardDescription className="leading-relaxed">Cek email masuk atau folder spam, lalu ikuti tautannya untuk membuat password baru.</CardDescription></div>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <Button variant="ghost" onClick={() => { setConfirmationRequired(false); setConfirmationKind('reset'); setMode('signin'); setPassword(''); setError('') }}>Kembali masuk</Button>
              </CardContent>
            ) : (
              <>
                <CardHeader className="gap-3 p-6 pb-4 sm:p-7 sm:pb-5"><div className="grid size-11 place-items-center rounded-xl bg-slate-950 text-cyan-300"><LockKeyhole /></div><CardTitle className="text-2xl">{mode === 'signin' ? 'Selamat datang kembali' : mode === 'signup' ? 'Buat akun baru' : 'Atur ulang password'}</CardTitle><CardDescription>{mode === 'signin' ? 'Masuk untuk melanjutkan pekerjaan Anda.' : mode === 'signup' ? 'Buat akun untuk mulai mengelola project outlet.' : 'Kami akan mengirim tautan untuk mengatur password baru.'}</CardDescription></CardHeader>
                <CardContent className="p-6 pt-1 sm:p-7 sm:pt-2">
                  <form onSubmit={submit} className="flex flex-col gap-4 sm:gap-5">
                    <div className="flex flex-col gap-2"><Label htmlFor="email">Email</Label><Input className="h-11 md:h-8" id="email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} placeholder="nama@perusahaan.com" autoComplete="email" /></div>
                    {mode !== 'forgot' && <div className="flex flex-col gap-2"><Label htmlFor="password">Password</Label><Input className="h-11 md:h-8" id="password" type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} placeholder="Minimal 8 karakter" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} /></div>}
                    {mode === 'signup' && <><div className="flex flex-col gap-2"><Label htmlFor="password-confirmation">Konfirmasi password</Label><Input className="h-11 md:h-8" id="password-confirmation" type="password" value={passwordConfirmation} onChange={(event) => { setPasswordConfirmation(event.target.value); setError('') }} placeholder="Ulangi password" autoComplete="new-password" /></div><div className="flex flex-col gap-2"><Label htmlFor="role-code">Kode akses</Label><Input className="h-11 md:h-8" id="role-code" type="password" value={roleCode} onChange={(event) => { setRoleCode(event.target.value); setError('') }} placeholder="Masukkan kode akses" autoComplete="off" /></div></>}
                    {error && <p role="alert" className="text-sm leading-5 text-destructive">{error}</p>}
                    <Button type="submit" className="h-11 w-full" disabled={sending}>{sending ? 'Sebentar...' : mode === 'signin' ? 'Masuk' : mode === 'signup' ? 'Buat akun' : 'Kirim tautan reset'}<ArrowUpRight /></Button>
                  </form>
                  <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4">
                    {mode === 'signin' && <button type="button" className="w-full text-sm text-primary underline-offset-4 hover:underline" onClick={() => { setMode('forgot'); setError('') }}>Lupa password?</button>}
                    <button type="button" className="w-full text-sm text-primary underline-offset-4 hover:underline" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError('') }}>{mode === 'signup' ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Buat akun'}</button>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </section>
      </div>
    </main>
  )
}
