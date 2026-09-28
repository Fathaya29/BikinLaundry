import { id, jsonData, jsonError, packageNames, packageTemplates, readJson, validateText } from '@/lib/domain'
import { requireUser } from '@/lib/supabase/server'

type PackageItem = { name: string; qty: number }
type PackageRecord = { id: string; name: string; description: string; items: PackageItem[] }

const metadataKey = 'master_packages'
const goodsKey = 'master_goods'

const defaultPackages: PackageRecord[] = packageNames.map((name) => ({
  id: `default-${name.toLowerCase()}`,
  name,
  description: `Template barang outlet paket ${name}.`,
  items: packageTemplates[name].map((item) => {
    const match = item.match(/^(\d+)\s*(.*)$/)
    return { name: match?.[2] || item, qty: Number(match?.[1] || 1) }
  }),
}))

function readMetadata(user: { user_metadata?: unknown }) {
  const metadata = user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata as Record<string, unknown> : {}
  const packages = Array.isArray(metadata[metadataKey]) ? metadata[metadataKey] as PackageRecord[] : defaultPackages
  const customGoods = Array.isArray(metadata[goodsKey]) ? metadata[goodsKey].filter((item): item is string => typeof item === 'string') : []
  return { metadata, packages, customGoods }
}

export async function GET() {
  try {
    const { user } = await requireUser()
    const { packages, customGoods } = readMetadata(user)
    return jsonData({ packages, customGoods })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Gagal memuat master paket.', 401)
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser()
    const input = await readJson(request)
    const rawPackage = input.package && typeof input.package === 'object' ? input.package as Record<string, unknown> : {}
    const packageName = validateText(rawPackage.name, 'Nama paket')
    const rawItems = Array.isArray(rawPackage.items) ? rawPackage.items : []
    const items = rawItems.map((item) => {
      const row = item as Record<string, unknown>
      return { name: validateText(row.name, 'Nama barang'), qty: typeof row.qty === 'number' && Number.isInteger(row.qty) && row.qty > 0 ? row.qty : 1 }
    })
    if (!items.length) throw new Error('Paket wajib memiliki minimal satu barang.')
    const { metadata, packages, customGoods } = readMetadata(user)
    const packageId = typeof rawPackage.id === 'string' && rawPackage.id ? rawPackage.id : id('package')
    const nextPackage: PackageRecord = { id: packageId, name: packageName, description: typeof rawPackage.description === 'string' ? rawPackage.description.trim() : '', items }
    const nextPackages = packages.some((item) => item.id === packageId)
      ? packages.map((item) => item.id === packageId ? nextPackage : item)
      : [...packages, nextPackage]
    const nextCustomGoods = typeof input.customGoods === 'string' && input.customGoods.trim() && !customGoods.includes(input.customGoods.trim())
      ? [...customGoods, input.customGoods.trim()]
      : customGoods
    const { data, error } = await supabase.auth.updateUser({ data: { ...metadata, [metadataKey]: nextPackages, [goodsKey]: nextCustomGoods } })
    if (error) throw error
    const saved = readMetadata(data.user || user)
    return jsonData({ package: saved.packages.find((item) => item.id === packageId), packages: saved.packages, customGoods: saved.customGoods })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Gagal menyimpan master paket.', 400)
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, user } = await requireUser()
    const input = await readJson(request)
    const packageId = typeof input.id === 'string' ? input.id : ''
    if (!packageId) throw new Error('ID paket tidak valid.')
    const { metadata, packages, customGoods } = readMetadata(user)
    const nextPackages = packages.filter((item) => item.id !== packageId)
    const { data, error } = await supabase.auth.updateUser({ data: { ...metadata, [metadataKey]: nextPackages, [goodsKey]: customGoods } })
    if (error) throw error
    const saved = readMetadata(data.user || user)
    return jsonData({ packages: saved.packages, customGoods: saved.customGoods })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Gagal menghapus master paket.', 400)
  }
}
