import { jsonData, jsonError, projectProgress } from '@/lib/domain'
import { requireUser } from '@/lib/supabase/server'

export async function GET() {
  try {
    const { supabase } = await requireUser()
    const { data: projects, error: projectError } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    if (projectError) throw projectError
    const projectIds = (projects || []).map((project) => project.id)
    const [{ data: tasks, error: taskError }, { data: files, error: fileError }] = await Promise.all([
      projectIds.length ? supabase.from('timeline_tasks').select('project_id,title,status,notes,updated_at').in('project_id', projectIds) : Promise.resolve({ data: [], error: null }),
      projectIds.length ? supabase.from('file_metadata').select('project_id,file_name,mime_type,created_at').in('project_id', projectIds).order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
    ])
    if (taskError || fileError) throw taskError || fileError
    const tasksByProject = new Map<string, typeof tasks>()
    for (const task of tasks || []) tasksByProject.set(task.project_id, [...(tasksByProject.get(task.project_id) || []), task])
    const filesByProject = new Map<string, typeof files>()
    for (const file of files || []) filesByProject.set(file.project_id, [...(filesByProject.get(file.project_id) || []), file])
    return jsonData((projects || []).map((project) => {
      const projectTasks = tasksByProject.get(project.id) || []
      const timeline = projectTasks.map((task, index) => ({ id: `${project.id}-${index}`, title: task.title, detail: task.notes || '', status: task.status, stage: 'execution' as const, order: index + 1, updatedAt: task.updated_at }))
      return {
        id: project.id,
        outlet: project.name,
        owner: project.owner?.name || '',
        email: project.owner?.email || '',
        location: project.location,
        status: project.sections?.softOpening ? 'Selesai' : project.status,
        progress: project.sections?.softOpening || project.status === 'Selesai' ? 100 : projectProgress(timeline),
        estimatedCompletionDate: project.sections?.estimatedCompletionDate || '',
        verifiedItems: Object.entries(project.sections?.verifiedItems || {}).filter(([, verified]) => verified).map(([item]) => item).join(', '),
        issues: Object.entries(project.sections?.issues || {}).map(([item, note]) => `${item}: ${note}`).join(' | '),
        documents: (filesByProject.get(project.id) || []).map((file) => file.file_name).join(', '),
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      }
    }))
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Gagal memuat Data Sheets.', 401)
  }
}
