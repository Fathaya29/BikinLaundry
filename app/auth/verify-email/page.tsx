'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BrandLockup } from '@/components/brand-lockup'
import PixelSnow from '@/components/pixel-snow'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const requestedEmail = new URLSearchParams(window.location.search).get('email')?.trim().toLowerCase() || ''
    setEmail(requestedEmail)
    const params = new URLSearchParams(window.location.search)
    const codeFromLink = params.get('code')
    const tokenHash = params.get('token_hash') || params.get('token')
    const tokenType = params.get('type') === 'signup' ? 'signup' : 'signup'
    const supabase = createClient()

    const verifyLink = async () => {
      if (codeFromLink) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(codeFromLink)
        if (exchangeError) throw exchangeError
        setVerified(true)
        window.history.replaceState({}, '', '/auth/verify-email')
        window.setTimeout(() => router.replace('/'), 900)
        return
      }
      if (tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tokenType })
        if (verifyError) throw verifyError
        setVerified(true)
        window.history.replaceState({}, '', '/auth/verify-email')
        window.setTimeout(() => router.replace('/'), 900)
      }
    }

    verifyLink().catch(() => setError('Tautan verifikasi tidak berlaku atau sudah kedaluwarsa.'))
    if (!requestedEmail && !codeFromLink && !tokenHash) setError('Alamat email untuk verifikasi tidak ditemukan.')
  }, [])

  const resend = async () => {
    if (!email) return
    setError('')
    setResending(true)
    const { error: resendError } = await createClient().auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}/auth/verify-email` } })
    setResending(false)
    if (resendError) setError(resendError.message || 'Kode verifikasi gagal dikirim ulang.')
  }

  return (
    <main className="relative grid min-h-[100svh] place-items-center overflow-hidden bg-slate-950 p-5 text-white">
      <PixelSnow className="z-0 opacity-60" color="#ffffff" flakeSize={0.01} minFlakeSize={1.25} pixelResolution={200} speed={1.25} density={0.22} direction={125} brightness={0.9} />
      <div className="pointer-events-none absolute inset-0 z-0 bg-slate-950/35" />
      <div className="absolute left-5 top-6 z-10 sm:left-10 sm:top-8"><BrandLockup /></div>
      <Card className="relative z-10 mt-16 w-full max-w-md rounded-2xl bg-white text-slate-950 shadow-2xl shadow-cyan-950/30">
        <div className="h-1.5 rounded-t-2xl bg-gradient-to-r from-cyan-400 to-blue-500" />
        {verified ? <CardContent className="flex flex-col items-center gap-4 p-8 text-center"><div className="grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="size-8" /></div><CardTitle>Email berhasil diverifikasi</CardTitle><CardDescription>Anda akan diarahkan ke ruang kerja.</CardDescription></CardContent> : <><CardHeader className="gap-3 p-6 pb-4 sm:p-7 sm:pb-5"><div className="grid size-11 place-items-center rounded-xl bg-slate-950 text-cyan-300"><MailCheck /></div><CardTitle className="text-2xl">Cek email Anda</CardTitle><CardDescription>Kami mengirim tautan verifikasi ke <span className="font-medium text-slate-950">{email || 'email Anda'}</span>. Buka Gmail, lalu klik tombol verifikasi untuk mengaktifkan akun.</CardDescription></CardHeader><CardContent className="p-6 pt-1 sm:p-7 sm:pt-2">{error && <p role="alert" className="mb-4 text-sm leading-5 text-destructive">{error}</p>}<div className="flex flex-col gap-3"><Button type="button" className="h-11 w-full" onClick={resend} disabled={resending || !email}>{resending ? 'Mengirim ulang...' : 'Kirim ulang tautan'}</Button><Button type="button" variant="ghost" onClick={() => router.replace('/login')}>Kembali ke login</Button></div></CardContent></>}
      </Card>
    </main>
  )
}
