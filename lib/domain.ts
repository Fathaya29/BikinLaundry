export const vendorCategories = ['Renovasi', 'Advertisements', 'Furniture'] as const
export type VendorCategory = string
export type ProjectStatus = 'Persiapan' | 'Perencanaan' | 'Survey Lokasi' | 'Perizinan' | 'Proses Gambar' | 'Kickoff Vendor' | 'Vendor Renovasi' | 'Vendor Advertisements' | 'Vendor Furniture' | 'Selesai'
export type TimelineStatus = 'Akan dikerjakan' | 'In Progress' | 'Selesai dikerjakan' | 'Tidak diperlukan'

export const packageNames = ['Gold', 'Platinum', 'Diamond'] as const
export type PackageName = (typeof packageNames)[number]
export const packageTemplates: Record<PackageName, string[]> = {
  Gold: ['2 Set Mesin Cuci', '1 Boiler 35Lt', '1 Meja Kasir', '3 CCTV Bardi', '1 POS Kasir'],
  Platinum: ['3 Set Mesin Cuci', '1 Boiler 35Lt', '1 Meja Kasir', '1 CCTV Bardi', '1 POS Kasir'],
  Diamond: ['4 Set Mesin Cuci', '1 Boiler 35Lt', '1 Meja Kasir', '1 CCTV Bardi', '1 POS Kasir'],
}

export type Owner = { name: string; phone: string; email: string; ktpNumber?: string; address?: string; photo?: FileRecord; packageName?: string }
export type LocationData = { address: string; mapsUrl?: string; city?: string; province?: string; postalCode?: string; latitude?: number; longitude?: number; notes?: string }
export type ProjectSections = { unlockedStages?: string[]; softOpening?: boolean; verifiedItems?: Record<string, boolean>; customItems?: Array<{ sku: string; name: string }>; issues?: Record<string, string>; estimatedCompletionDate?: string; purchasePackage?: { vendor?: string; packageName?: string; date?: string; amount?: string; paymentMethod?: string; notes?: string }; setupFee?: { date?: string; amount?: string; paymentMethod?: string; notes?: string }; leaseAgreement?: { landlord?: string; startDate?: string; endDate?: string; monthlyRent?: string; notes?: string }; kickoff?: { date?: string; attendees?: string; agenda?: string; notes?: string } }
export type FileKind = 'owner-photo' | 'purchase-proof' | 'setup-fee-proof' | 'lease-agreement' | 'location-document' | 'kickoff-mom' | 'timeline-document' | 'timeline-photo' | 'legal-document'
export type FileRecord = { id: string; name: string; type: string; size: number; kind: FileKind; storage: 'manual'; thumbnailUrl?: string; storageKey?: string; caption?: string; uploadedBy?: string; timelineTaskId?: string; metadata?: Record<string, string>; createdAt: string }
export type TimelineStage = 'planning' | 'execution' | 'loading' | 'final'
export type TimelineTask = { id: string; title: string; detail: string; status: TimelineStatus; stage: TimelineStage; order: number; updatedAt: string }
export type Vendor = { id: string; name: string; category: VendorCategory; contact: string; phone: string; createdAt: string; updatedAt: string }
export type VendorAssignment = { id: string; projectId: string; category: VendorCategory; vendorId: string; assignedAt: string }
export type Activity = { id: string; projectId?: string; action: string; detail: string; createdAt: string; createdBy: string }
export type Project = { id: string; name: string; location: string; locationData?: LocationData; sections?: ProjectSections; phase: ProjectStatus; progress: number; preparationProgress?: number; planningProgress?: number; executionProgress?: number; planningUnlocked?: boolean; owner: Owner; files: FileRecord[]; timeline: TimelineTask[]; createdAt: string; updatedAt: string }
export type DashboardSummary = { totalActive: number; waitingUpdate: number; completedThisMonth: number }
export type StoreSnapshot = { projects: Project[]; vendors: Vendor[]; assignments: VendorAssignment[]; activities: Activity[] }

export type CreateProjectInput = { name: string; location: string; locationData?: LocationData; owner: Owner; packageName?: string; estimatedCompletionDate?: string; files?: Omit<FileRecord, 'id' | 'createdAt'>[]; timeline?: Array<Pick<TimelineTask, 'title' | 'detail' | 'status' | 'order'> | { title: string; detail?: string; status?: TimelineStatus; order?: number }> }
export type CreateVendorInput = { name: string; category: VendorCategory; contact?: string; contactName?: string; phone?: string; email?: string; notes?: string }
export type RegisterFileInput = { projectId: string; name: string; type: string; size: number; kind: FileKind; thumbnailUrl?: string; storageKey?: string; caption?: string; uploadedBy?: string; timelineTaskId?: string; metadata?: Record<string, string> }

const preparationKinds: FileKind[] = ['owner-photo', 'purchase-proof', 'setup-fee-proof', 'lease-agreement', 'location-document', 'kickoff-mom']
export function preparationProgress(project: Pick<Project, 'owner' | 'locationData' | 'sections' | 'files'>) {
  const checks = [Boolean(project.owner.name), Boolean(project.owner.phone || project.owner.email || project.files.some((file) => file.kind === 'owner-photo')), Boolean(project.files.some((file) => file.kind === 'purchase-proof' || file.kind === 'setup-fee-proof')), Boolean(project.files.some((file) => file.kind === 'lease-agreement')), Boolean(project.locationData?.address), Boolean(project.files.some((file) => file.kind === 'kickoff-mom'))]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}
export function projectProgress(timeline: TimelineTask[]) {
  if (!timeline.length) return 0
  return Math.round((timeline.filter((task) => task.status === 'Selesai dikerjakan' || task.status === 'Tidak diperlukan').length / timeline.length) * 100)
}

export function stageProgress(timeline: TimelineTask[], stage: TimelineStage) {
  return projectProgress(timeline.filter((task) => task.stage === stage))
}

export function projectPhase(timeline: TimelineTask[]): ProjectStatus {
  const active = timeline.find((task) => task.status === 'In Progress' || task.status === 'Akan dikerjakan')
  return active ? (active.title as ProjectStatus) : timeline.every((task) => task.status === 'Selesai dikerjakan' || task.status === 'Tidak diperlukan') ? 'Selesai' : (timeline.find((task) => task.status === 'Akan dikerjakan')?.title as ProjectStatus) || 'Survey Lokasi'
}

export function isVendorCategory(value: unknown): value is VendorCategory {
  return typeof value === 'string' && value.trim().length > 0
}

export function isTimelineStatus(value: unknown): value is TimelineStatus {
  return value === 'Akan dikerjakan' || value === 'In Progress' || value === 'Selesai dikerjakan' || value === 'Tidak diperlukan'
}

export function now() { return new Date().toISOString() }
export function id(prefix: string) { return `${prefix}_${crypto.randomUUID()}` }

export function errorMessage(error: unknown) { return error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak terduga.' }

export function validateText(value: unknown, label: string) {
  if (typeof value !== 'string' || value.trim().length < 2) throw new Error(`${label} wajib diisi.`)
  return value.trim()
}

export function validateEmail(value: unknown) {
  if (typeof value !== 'string' || !/^\S+@\S+\.\S+$/.test(value)) throw new Error('Email owner tidak valid.')
  return value.trim()
}

export function validatePositiveNumber(value: unknown, label: string) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error(`${label} tidak valid.`)
  return value
}

export const defaultTimeline = (createdAt = now()): TimelineTask[] => [
  { id: id('task'), title: 'Survey Lokasi', detail: 'Survey lokasi dan validasi area outlet', status: 'Akan dikerjakan' as TimelineStatus, order: 1, updatedAt: createdAt },
  { id: id('task'), title: 'Perizinan', detail: 'Pengurusan dokumen perizinan outlet', status: 'Akan dikerjakan' as TimelineStatus, order: 2, updatedAt: createdAt },
  { id: id('task'), title: 'Proses Gambar', detail: 'Pembuatan desain dan gambar kerja', status: 'Akan dikerjakan' as TimelineStatus, order: 3, updatedAt: createdAt },
  { id: id('task'), title: 'Kickoff Meeting Bersama Vendor', detail: 'Koordinasi awal dengan vendor terpilih', status: 'Akan dikerjakan' as TimelineStatus, order: 4, updatedAt: createdAt },
  { id: id('task'), title: 'Vendor Renovasi', detail: 'Pemilihan vendor renovasi outlet', status: 'Akan dikerjakan' as TimelineStatus, order: 5, updatedAt: createdAt },
  { id: id('task'), title: 'Vendor Advertisements', detail: 'Pemilihan vendor untuk advertising', status: 'Akan dikerjakan' as TimelineStatus, order: 6, updatedAt: createdAt },
  { id: id('task'), title: 'Vendor Furniture', detail: 'Pemilihan vendor untuk furniture', status: 'Akan dikerjakan' as TimelineStatus, order: 7, updatedAt: createdAt },
  { id: id('task'), title: 'Renovasi', detail: 'Persiapan area kerja, pekerjaan sipil, utilitas, dan finishing outlet', status: 'Akan dikerjakan' as TimelineStatus, order: 8, updatedAt: createdAt },
  { id: id('task'), title: 'Pembuatan Furniture', detail: 'Finalisasi ukuran, produksi, quality check, dan pemasangan furniture', status: 'Akan dikerjakan' as TimelineStatus, order: 9, updatedAt: createdAt },
  { id: id('task'), title: 'Pembuatan Neon Sign', detail: 'Finalisasi desain, produksi, uji lampu, dan pemasangan neon sign', status: 'Akan dikerjakan' as TimelineStatus, order: 10, updatedAt: createdAt },
  { id: id('task'), title: 'Pengiriman Mesin', detail: 'Penjadwalan armada, pengecekan packing, pengiriman, dan serah terima mesin', status: 'Akan dikerjakan' as TimelineStatus, order: 11, updatedAt: createdAt },
  { id: id('task'), title: 'Fulfillment', detail: 'Picking, packing, pengecekan jumlah, dan pemenuhan perlengkapan outlet', status: 'Akan dikerjakan' as TimelineStatus, order: 12, updatedAt: createdAt },
  { id: id('task'), title: 'Instalasi', detail: 'Penempatan mesin, pemasangan utilitas, commissioning, dan uji fungsi', status: 'Akan dikerjakan' as TimelineStatus, order: 13, updatedAt: createdAt },
  { id: id('task'), title: 'Final Check', detail: 'Pemeriksaan akhir kesiapan outlet', status: 'Akan dikerjakan' as TimelineStatus, order: 14, updatedAt: createdAt },
  { id: id('task'), title: 'Loading & Setup Barang', detail: 'Checklist dan setup barang di lokasi', status: 'Akan dikerjakan' as TimelineStatus, order: 15, updatedAt: createdAt },
  { id: id('task'), title: 'Final / Siap Operasi', detail: 'Verifikasi akhir dan Grand Opening', status: 'Akan dikerjakan' as TimelineStatus, order: 16, updatedAt: createdAt },
].map((task) => ({ ...task, stage: task.order <= 7 ? 'planning' as const : task.order <= 14 ? 'execution' as const : task.order === 15 ? 'loading' as const : 'final' as const }))

export function serializeProject(project: Project): Project {
  const prep = preparationProgress(project)
  const planningUnlocked = prep === 100
  const completed = project.sections?.softOpening === true || project.phase === 'Selesai'
  return { ...project, preparationProgress: prep, planningProgress: stageProgress(project.timeline, 'planning'), executionProgress: stageProgress(project.timeline, 'execution'), planningUnlocked, progress: completed ? 100 : projectProgress(project.timeline), phase: completed ? 'Selesai' : planningUnlocked ? projectPhase(project.timeline) : 'Persiapan' }
}

export function createSeed(): StoreSnapshot {
  const createdAt = '2024-05-12T08:00:00.000Z'
  const makeProject = (idValue: string, name: string, location: string, statuses: TimelineStatus[]): Project => {
    const timeline = defaultTimeline(createdAt).map((task, index) => ({ ...task, status: statuses[index] || 'Akan dikerjakan' }))
    return { id: idValue, name, location, phase: projectPhase(timeline), progress: projectProgress(timeline), owner: { name: 'Fathaya Ardhani', phone: '+62 812 1111 2222', email: 'fathaya@example.com' }, files: [], timeline, createdAt, updatedAt: createdAt }
  }
  return {
    projects: [makeProject('project_bintaro', 'Kopi Kenangan - Bintaro', 'Bintaro Xchange, Tangerang Selatan', ['Selesai dikerjakan', 'In Progress', 'Akan dikerjakan', 'Akan dikerjakan']), makeProject('project_tebet', 'Kopi Kenangan - Tebet', 'Jl. Tebet Raya No. 12, Jakarta Selatan', ['Selesai dikerjakan', 'Selesai dikerjakan', 'In Progress', 'Akan dikerjakan']), makeProject('project_surabaya', 'Kopi Kenangan - Surabaya', 'Pakuwon Mall, Surabaya', ['Selesai dikerjakan', 'Akan dikerjakan', 'Akan dikerjakan', 'Akan dikerjakan'])],
    vendors: [
      ['vendor_1', 'PT. Bangun Ruang Bersama', 'Renovasi', 'Dimas Pratama', '+62 812 3456 7890'], ['vendor_2', 'Signage Kreatif Indonesia', 'Advertisements', 'Sarah Anjani', '+62 821 9087 6543'], ['vendor_3', 'FurniSpace Studio', 'Furniture', 'Raka Wijaya', '+62 813 7788 1200'], ['vendor_4', 'RenoPro Nusantara', 'Renovasi', 'Bima Santoso', '+62 852 1002 3344'],
    ].map(([idValue, name, category, contact, phone]) => ({ id: idValue, name, category: category as VendorCategory, contact, phone, createdAt, updatedAt: createdAt })),
    assignments: [], activities: []
  }
}

let memoryStore = createSeed()
export const store = {
  snapshot() { return memoryStore },
  reset() { memoryStore = createSeed(); return memoryStore },
  update(mutator: (snapshot: StoreSnapshot) => void) { mutator(memoryStore); return memoryStore },
}

export function findProject(projectId: string) { return store.snapshot().projects.find((project) => project.id === projectId) }
export function findVendor(vendorId: string) { return store.snapshot().vendors.find((vendor) => vendor.id === vendorId) }
export function addActivity(action: string, detail: string, projectId?: string) { store.snapshot().activities.unshift({ id: id('activity'), projectId, action, detail, createdAt: now(), createdBy: 'Fathaya Ardhani' }) }
export function touchProject(project: Project) { project.updatedAt = now(); const serialized = serializeProject(project); project.progress = serialized.progress; project.phase = serialized.phase; project.preparationProgress = serialized.preparationProgress; project.planningUnlocked = serialized.planningUnlocked }

export function jsonError(message: string, status = 400) { return Response.json({ error: message }, { status }) }
export function jsonData<T>(data: T, status = 200) { return Response.json(data, { status }) }

export async function readJson(request: Request) { try { return await request.json() as Record<string, unknown> } catch { throw new Error('Body request tidak valid.') } }

export function ensureProject(projectId: string) { const project = findProject(projectId); if (!project) throw new Error('Proyek tidak ditemukan.'); return project }
export function ensureVendor(vendorId: string) { const vendor = findVendor(vendorId); if (!vendor) throw new Error('Vendor tidak ditemukan.'); return vendor }

export function summary(): DashboardSummary { const projects = store.snapshot().projects; return { totalActive: projects.filter((p) => p.phase !== 'Selesai').length, waitingUpdate: projects.filter((p) => p.timeline.some((task) => task.status === 'Akan dikerjakan')).length, completedThisMonth: projects.filter((p) => p.phase === 'Selesai').length } }

export function validateCreateProject(input: Record<string, unknown>): CreateProjectInput { const rawLocation = input.locationData && typeof input.locationData === 'object' ? input.locationData as Record<string, unknown> : undefined; const locationData = rawLocation ? { address: validateText(rawLocation.address || input.location, 'Alamat lokasi'), mapsUrl: typeof rawLocation.mapsUrl === 'string' ? rawLocation.mapsUrl.trim() : undefined, city: typeof rawLocation.city === 'string' ? rawLocation.city.trim() : undefined, province: typeof rawLocation.province === 'string' ? rawLocation.province.trim() : undefined, postalCode: typeof rawLocation.postalCode === 'string' ? rawLocation.postalCode.trim() : undefined, latitude: rawLocation.latitude === undefined ? undefined : validatePositiveNumber(rawLocation.latitude, 'Latitude'), longitude: rawLocation.longitude === undefined ? undefined : validatePositiveNumber(rawLocation.longitude, 'Longitude'), notes: typeof rawLocation.notes === 'string' ? rawLocation.notes.trim() : undefined } : undefined; const ownerRaw = input.owner as Record<string, unknown> | undefined; const timeline = Array.isArray(input.timeline) ? input.timeline.map((item, index) => { const row = item as Record<string, unknown>; return { title: validateText(row.title, 'Nama tahap timeline'), detail: typeof row.detail === 'string' ? row.detail.trim() : '', status: isTimelineStatus(row.status) ? row.status : 'Akan dikerjakan', order: typeof row.order === 'number' ? row.order : index + 1 } }) : undefined; const files = Array.isArray(input.files) ? input.files.map((item) => validateFile({ ...(item as Record<string, unknown>), projectId: 'pending' })).map(({ projectId: _projectId, ...file }) => ({ ...file, storage: 'manual' as const })) : undefined; const packageName = packageNames.includes(input.packageName as PackageName) ? input.packageName as PackageName : undefined; return { name: validateText(input.name, 'Nama outlet'), location: validateText(input.location, 'Lokasi'), locationData, packageName, owner: { name: validateText(ownerRaw?.name ?? input.ownerName, 'Nama owner'), packageName, phone: typeof ownerRaw?.phone === 'string' ? ownerRaw.phone.trim() : '', email: typeof ownerRaw?.email === 'string' && ownerRaw.email.trim() ? validateEmail(ownerRaw.email) : '' }, timeline, files } }
export function validateCreateVendor(input: Record<string, unknown>): CreateVendorInput { return { name: validateText(input.name, 'Nama vendor'), category: validateText(input.category, 'Kategori vendor'), contact: typeof input.contact === 'string' ? input.contact.trim() : undefined, contactName: typeof input.contactName === 'string' ? input.contactName.trim() : undefined, phone: typeof input.phone === 'string' ? input.phone.trim() : undefined, email: typeof input.email === 'string' ? input.email.trim() : undefined, notes: typeof input.notes === 'string' ? input.notes.trim() : undefined } }
const fileKinds: FileKind[] = ['owner-photo', 'purchase-proof', 'setup-fee-proof', 'lease-agreement', 'location-document', 'kickoff-mom', 'timeline-document', 'timeline-photo', 'legal-document']
export function validateFile(input: Record<string, unknown>): RegisterFileInput { if (typeof input.kind !== 'string' || !fileKinds.includes(input.kind as FileKind)) throw new Error('Jenis file tidak valid.'); const metadata = input.metadata && typeof input.metadata === 'object' ? Object.fromEntries(Object.entries(input.metadata).filter(([key, value]) => typeof key === 'string' && typeof value === 'string')) : undefined; return { projectId: validateText(input.projectId, 'Project ID'), name: validateText(input.name, 'Nama file'), type: validateText(input.type, 'Tipe file'), size: validatePositiveNumber(input.size, 'Ukuran file'), kind: input.kind as FileKind, thumbnailUrl: typeof input.thumbnailUrl === 'string' ? input.thumbnailUrl : undefined, storageKey: typeof input.storageKey === 'string' ? input.storageKey : undefined, caption: typeof input.caption === 'string' ? input.caption : undefined, uploadedBy: typeof input.uploadedBy === 'string' ? input.uploadedBy : undefined, timelineTaskId: typeof input.timelineTaskId === 'string' ? input.timelineTaskId : undefined, metadata } }

export type ApiError = { error: string }
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> { const headers = new Headers(options?.headers); if (!(options?.body instanceof FormData)) headers.set('Content-Type', 'application/json'); const response = await fetch(url, { ...options, headers }); const body = await response.json() as T | ApiError; if (!response.ok) throw new Error((body as ApiError).error || 'Request gagal.'); return body as T }
export const apiJson = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) })

export type ProjectWithAssignments = Project & { assignments: (VendorAssignment & { vendor?: Vendor })[] }
export function projectDetails(projectId: string): ProjectWithAssignments { const project = serializeProject(ensureProject(projectId)); const assignments = store.snapshot().assignments.filter((assignment) => assignment.projectId === projectId).map((assignment) => ({ ...assignment, vendor: findVendor(assignment.vendorId) })); return { ...project, assignments } }
