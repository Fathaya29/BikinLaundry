import { jsonData, jsonError } from '@/lib/domain'
import { requireUser } from '@/lib/supabase/server'

export async function GET(_request: Request, context: { params: Promise<{ fileId: string }> }) {
  try {
    const { fileId } = await context.params
    const { supabase, user } = await requireUser()
    const { data: file, error: fileError } = await supabase
      .from('file_metadata')
      .select('project_id, storage_path, mime_type')
      .eq('id', fileId)
      .single()
    if (fileError || !file?.storage_path) return jsonError('Dokumentasi tidak ditemukan.', 404)
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', file.project_id)
      .eq('user_id', user.id)
      .single()
    if (!project) return jsonError('Dokumentasi tidak ditemukan.', 404)

    const { data, error } = await supabase.storage.from('project-files').createSignedUrl(file.storage_path, 300)
    if (error || !data?.signedUrl) throw error || new Error('URL dokumentasi tidak dapat dibuat.')
    return Response.redirect(data.signedUrl, 302)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal membuka dokumentasi.'
    return jsonError(message, message === 'Sesi login tidak ditemukan.' ? 401 : 500)
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ fileId: string }> }) {
  try {
    const { fileId } = await context.params
    const { supabase, user } = await requireUser()
    const { data: file, error: fileError } = await supabase
      .from('file_metadata')
      .select('id, project_id, storage_path, file_name')
      .eq('id', fileId)
      .single()
    if (fileError || !file) return jsonError('Dokumentasi tidak ditemukan.', 404)

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', file.project_id)
      .single()
    if (!project) return jsonError('Dokumentasi tidak ditemukan.', 404)

    const { data: deleted, error } = await supabase.from('file_metadata').delete().eq('id', fileId).select('id').maybeSingle()
    if (error) throw error
    if (!deleted) throw new Error('Dokumentasi tidak terhapus. Periksa policy DELETE pada tabel file_metadata.')
    if (file.storage_path) await supabase.storage.from('project-files').remove([file.storage_path])
    await supabase.from('activity_logs').insert({ project_id: file.project_id, user_id: user.id, action: 'file.deleted', metadata: { fileName: file.file_name } })
    return jsonData({ ok: true })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Gagal menghapus dokumentasi.', 400)
  }
}
