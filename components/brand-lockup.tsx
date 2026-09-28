import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type BrandLockupProps = {
  className?: string
}

export function BrandLockup({ className }: BrandLockupProps) {
  return (
    <div className={cn('flex items-center gap-3', className)} aria-label="BikinLaundry by Berani Laundry">
      <div className="grid size-12 place-items-center rounded-xl bg-cyan-300 text-slate-950 shadow-[0_0_28px_rgba(103,232,249,0.2)] sm:size-10">
        <Sparkles aria-hidden="true" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-lg font-semibold tracking-tight sm:text-base">BikinLaundry</span>
        <span className="text-sm font-medium tracking-wide text-slate-400 sm:text-xs">by Berani Laundry</span>
      </div>
    </div>
  )
}
