import { jsonData, jsonError } from '@/lib/domain'
import { requireUser } from '@/lib/supabase/server'

export async function GET() {
	try {
		const { supabase, user } = await requireUser()
			const { data, error } = await supabase.from('activity_logs').select('*').or(`user_id.eq.${user.id},action.eq.project.deleted`).order('created_at', { ascending: false }).limit(100)
		if (error) throw error
		const projectIds = Array.from(new Set((data || []).map((item) => item.project_id).filter(Boolean)))
		const { data: projects, error: projectsError } = projectIds.length
			? await supabase.from('projects').select('id,name').in('id', projectIds)
			: { data: [], error: null }
		if (projectsError) throw projectsError
		const projectNames = new Map((projects || []).map((project) => [project.id, project.name]))
		return jsonData((data || []).map((item) => ({ ...item, project_name: item.project_id ? projectNames.get(item.project_id) || 'Project' : undefined })))
	} catch (error) {
		return jsonError(error instanceof Error ? error.message : 'Gagal memuat aktivitas.', 401)
	}
}
