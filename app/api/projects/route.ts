import { createSeed, id, jsonData, jsonError, now, readJson, serializeProject, validateCreateProject, projectProgress, projectPhase, type TimelineStage, type TimelineStatus } from '@/lib/domain'
import { requireUser } from '@/lib/supabase/server'
import { appendOutletSnapshotToSheet } from '@/lib/sheets'

export async function GET() {
  try {
    const { supabase, user } = await requireUser()
    const { data, error } = await supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (error) throw error
    const projectIds = (data || []).map((row) => row.id)
    const { data: taskRows, error: taskError } = projectIds.length ? await supabase.from('timeline_tasks').select('*').in('project_id', projectIds).order('created_at', { ascending: true }) : { data: [], error: null }
    if (taskError) throw taskError
    const tasksByProject = new Map<string, Record<string, unknown>[]>(); for (const task of taskRows || []) { const current = tasksByProject.get(task.project_id) || []; current.push(task as Record<string, unknown>); tasksByProject.set(task.project_id, current) }
    return jsonData((data || []).map((row) => { const persistedTasks = tasksByProject.get(row.id) || []; const timeline = persistedTasks.length ? persistedTasks.map((task, index) => { const order = Number(task.order || index + 1); return { id: task.id as string, title: task.title as string, detail: (task.notes || '') as string, status: task.status as TimelineStatus, stage: (task.stage || (order <= 7 ? 'planning' : order <= 14 ? 'execution' : order === 15 ? 'loading' : 'final')) as TimelineStage, order, updatedAt: task.updated_at as string } }) : (row.sections?.timeline || []).map((task: Record<string, unknown>, index: number) => ({ ...task, stage: task.stage || (index < 7 ? 'planning' : index < 14 ? 'execution' : index === 14 ? 'loading' : 'final') })); return serializeProject({ id: row.id, name: row.name, location: row.location, locationData: row.location_data || undefined, sections: row.sections || {}, phase: row.status, progress: 0, owner: row.owner || {}, files: [], timeline, createdAt: row.created_at, updatedAt: row.updated_at }) }))
  } catch (error) { return jsonError(error instanceof Error ? error.message : 'Gagal memuat proyek.', 401) }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser()
    const rawInput = await readJson(request)
    const input = validateCreateProject(rawInput)
    input.packageName = typeof rawInput.packageName === 'string' && rawInput.packageName.trim().length >= 2 ? rawInput.packageName.trim() : undefined
    input.estimatedCompletionDate = typeof rawInput.estimatedCompletionDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawInput.estimatedCompletionDate) ? rawInput.estimatedCompletionDate : undefined
    const accountEmail = user.email?.trim().toLowerCase() || input.owner.email
    const accountName = accountEmail.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
    const owner = { ...input.owner, name: input.owner.name || accountName, email: input.owner.email || accountEmail }
    const createdAt = now(); const timeline = (input.timeline?.length ? input.timeline : createSeed().projects[0].timeline.map((task) => ({ title: task.title, detail: task.detail, status: 'Akan dikerjakan' as const, order: task.order }))).map((task, index) => { const order = task.order || index + 1; return { id: id('task'), title: task.title, detail: task.detail || '', status: task.status || 'Akan dikerjakan' as const, stage: order <= 7 ? 'planning' as const : order <= 14 ? 'execution' as const : order === 15 ? 'loading' as const : 'final' as const, order, updatedAt: createdAt } }); const project = { id: id('project'), name: input.name, location: input.location, locationData: input.locationData, phase: projectPhase(timeline), progress: projectProgress(timeline), owner, files: (input.files || []).map((file) => ({ ...file, id: id('file'), createdAt, storage: 'manual' as const })), timeline, createdAt, updatedAt: createdAt }
    const { data: saved, error } = await supabase.from('projects').insert({ user_id: user.id, name: project.name, location: project.location, location_data: project.locationData || {}, status: project.phase, package_name: input.packageName, owner: { ...project.owner, packageName: input.packageName }, sections: { timeline, estimatedCompletionDate: input.estimatedCompletionDate } }).select().single()
    if (error) throw error
    if (timeline.length) { const { error: timelineError } = await supabase.from('timeline_tasks').insert(timeline.map((task) => ({ project_id: saved.id, task_key: task.id, title: task.title, status: task.status, stage: task.order <= 7 ? 'planning' : task.order <= 14 ? 'execution' : task.order === 15 ? 'loading' : 'final', notes: task.detail }))); if (timelineError) throw timelineError }
    await supabase.from('activity_logs').insert({ project_id: saved.id, user_id: user.id, action: 'project.created', metadata: { fileCount: project.files.length, taskCount: timeline.length } })
    try { await appendOutletSnapshotToSheet({ ...saved, owner: { ...project.owner, packageName: input.packageName } }, timeline) } catch (sheetError) { console.error('Google Sheets sync failed:', sheetError) }
    return jsonData({ ...project, id: saved.id }, 201)
  } catch (error) { const message = error instanceof Error ? error.message : 'Gagal membuat proyek.'; return jsonError(message, message === 'Sesi login tidak ditemukan.' ? 401 : 400) }
}
