import { jsonData, jsonError, now, readJson, projectProgress, stageProgress } from '@/lib/domain'
import { requireUser } from '@/lib/supabase/server'
import { appendOutletSnapshotToSheet } from '@/lib/sheets'

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { supabase, user } = await requireUser()
    const { projectId } = await context.params
    const { data: project, error } = await supabase.from('projects').select('*').eq('id', projectId).eq('user_id', user.id).single()
    if (error || !project) return jsonError('Proyek tidak ditemukan.', 404)
    const [{ data: tasks, error: tasksError }, { data: files, error: filesError }] = await Promise.all([
      supabase.from('timeline_tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
      supabase.from('file_metadata').select('id,file_name,mime_type,size_bytes,category,storage_path,created_at,timeline_task_id,metadata').eq('project_id', projectId).order('created_at', { ascending: false }),
    ])
    if (tasksError || filesError) throw tasksError || filesError
    const assignments = Array.isArray(project.sections?.vendorAssignments) ? project.sections.vendorAssignments : []
    const filePaths = (files || []).filter((file) => file.storage_path).map((file) => file.storage_path as string)
    const { data: signedUrls } = filePaths.length ? await supabase.storage.from('project-files').createSignedUrls(filePaths, 3600) : { data: [] }
    const signedUrlByPath = new Map((signedUrls || []).map((item) => [item.path, item.signedUrl]))
    return jsonData({
      id: project.id,
      name: project.name,
      location: project.location,
      locationData: project.location_data || {},
      phase: project.sections?.softOpening ? 'Selesai' : project.status,
      progress: project.sections?.softOpening || project.status === 'Selesai' ? 100 : projectProgress((tasks || []).map((task, index) => ({ id: task.id, title: task.title, detail: task.notes || '', status: task.status, stage: task.stage || (Number(task.order || index + 1) <= 7 ? 'planning' : 'execution'), order: Number(task.order || index + 1), updatedAt: task.updated_at }))),
      preparationProgress: 0,
      planningProgress: stageProgress((tasks || []).map((task, index) => ({ id: task.id, title: task.title, detail: task.notes || '', status: task.status, stage: task.stage || (Number(task.order || index + 1) <= 7 ? 'planning' : 'execution'), order: Number(task.order || index + 1), updatedAt: task.updated_at })), 'planning'),
      executionProgress: stageProgress((tasks || []).map((task, index) => ({ id: task.id, title: task.title, detail: task.notes || '', status: task.status, stage: task.stage || (Number(task.order || index + 1) <= 7 ? 'planning' : 'execution'), order: Number(task.order || index + 1), updatedAt: task.updated_at })), 'execution'),
      planningUnlocked: false,
      owner: project.owner || {},
      sections: project.sections || {},
      assignments: assignments || [],
      timeline: (tasks || []).map((task, index) => { const order = Number(task.order || index + 1); const executionTitles = ['Renovasi', 'Pembuatan Furniture', 'Pembuatan Neon Sign']; const stage = executionTitles.includes(task.title) ? 'execution' : task.stage || (order <= 7 ? 'planning' : order <= 14 ? 'execution' : order === 15 ? 'loading' : 'final'); return { id: task.id, title: task.title, detail: task.notes || '', status: task.status, stage, order, updatedAt: task.updated_at } }),
      files: (files || []).map((file) => ({ id: file.id, name: file.file_name, type: file.mime_type || 'application/octet-stream', size: Number(file.size_bytes || 0), kind: file.category, storage: 'supabase', storageKey: file.storage_path, thumbnailUrl: file.storage_path ? signedUrlByPath.get(file.storage_path) : undefined, createdAt: file.created_at, timelineTaskId: file.timeline_task_id || undefined, metadata: file.metadata || {} })),
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    })
  } catch (error) { const message = error instanceof Error ? error.message : 'Gagal memuat detail proyek.'; return jsonError(message, message === 'Sesi login tidak ditemukan.' ? 401 : 500) }
}

export async function PATCH(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params
    const { supabase, user } = await requireUser()
    const input = await readJson(request)
    const { data: project, error: projectError } = await supabase.from('projects').select('*').eq('id', projectId).eq('user_id', user.id).single()
    if (projectError || !project) return jsonError('Proyek tidak ditemukan.', 404)
    if (project.sections?.softOpening || project.status === 'Selesai') return jsonError('Proyek yang sudah selesai tidak dapat diedit.', 409)
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (input.owner && typeof input.owner === 'object') patch.owner = { ...(project.owner || {}), ...(input.owner as object) }
    if (input.locationData && typeof input.locationData === 'object') patch.location_data = { ...(project.location_data || {}), ...(input.locationData as object) }
    if (input.sections && typeof input.sections === 'object') {
      patch.sections = { ...(project.sections || {}), ...(input.sections as object) }
      if ((input.sections as Record<string, unknown>).softOpening === true) patch.status = 'Selesai'
    }
    const { data: updated, error } = await supabase.from('projects').update(patch).eq('id', projectId).eq('user_id', user.id).select().single()
    if (error) throw error
    await supabase.from('activity_logs').insert({ project_id: projectId, user_id: user.id, action: 'project.updated', metadata: { fields: Object.keys(patch) } })
    try {
      const { data: tasks } = await supabase.from('timeline_tasks').select('*').eq('project_id', projectId)
      const { data: files } = await supabase.from('file_metadata').select('*').eq('project_id', projectId)
      await appendOutletSnapshotToSheet(updated, tasks || [], files || [])
    } catch (sheetError) { console.error('Google Sheets sync failed:', sheetError) }
    return jsonData(updated)
  } catch (error) { return jsonError(error instanceof Error ? error.message : 'Gagal menyimpan detail proyek.') }
}

export async function DELETE(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params
    const { supabase, user } = await requireUser()
    const { data: project } = await supabase.from('projects').select('id,name').eq('id', projectId).single()
    if (!project) return jsonError('Proyek tidak ditemukan.', 404)
    const { error: auditError } = await supabase.from('activity_logs').insert({
      project_id: null,
      user_id: user.id,
      action: 'project.deleted',
      metadata: { projectId: project.id, projectName: project.name, deletedBy: user.email || 'Pengguna terverifikasi' },
    })
    if (auditError) throw auditError
    const { error } = await supabase.from('projects').delete().eq('id', projectId)
    if (error) throw error
    return jsonData({ ok: true })
  } catch (error) { return jsonError(error instanceof Error ? error.message : 'Gagal menghapus proyek.', 400) }
}
