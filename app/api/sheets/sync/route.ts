import { jsonData, jsonError } from '@/lib/domain'
import { appendOutletSnapshotToSheet } from '@/lib/sheets'
import { requireUser } from '@/lib/supabase/server'

export async function POST() {
  try {
    const { supabase } = await requireUser()
    const { data: projects, error: projectError } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    if (projectError) throw projectError
    let count = 0
    for (const project of projects || []) {
      const [{ data: tasks, error: taskError }, { data: files, error: fileError }] = await Promise.all([
        supabase.from('timeline_tasks').select('*').eq('project_id', project.id),
        supabase.from('file_metadata').select('*').eq('project_id', project.id),
      ])
      if (taskError || fileError) throw taskError || fileError
      await appendOutletSnapshotToSheet(project, tasks || [], files || [])
      count += 1
    }
    return jsonData({ success: true, count })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Gagal menyinkronkan ke Google Sheets.', 500)
  }
}
