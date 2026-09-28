import { jsonData, jsonError } from '@/lib/domain'
import { requireUser } from '@/lib/supabase/server'

export async function DELETE(_request: Request, context: { params: Promise<{ vendorId: string }> }) {
  try {
    const { vendorId } = await context.params
    const { supabase, user } = await requireUser()
    const { error } = await supabase.from('vendors').delete().eq('id', vendorId).eq('user_id', user.id)
    if (error) throw error
    return jsonData({ ok: true })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Gagal menghapus vendor.', 400)
  }
}