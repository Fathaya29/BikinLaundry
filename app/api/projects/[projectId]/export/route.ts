import { jsonData, jsonError, readJson } from '@/lib/domain';
import { buildMasterData } from '@/lib/master-data';
import { appendRowsToSheet, fileAccessUrl, type SheetHyperlink } from '@/lib/sheets';
import { requireUser } from '@/lib/supabase/server';

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> | { projectId: string } }) {
  try {
    const { projectId } = await context.params;
    const { supabase, user } = await requireUser();
    const body = await readJson(request);
    
    const { project, packageItems = [], customItems = [], files = [] } = body as any;

    if (!project) {
      return jsonError('Data proyek tidak disertakan dalam request.', 400);
    }
    const { data: ownedProject } = await supabase.from('projects').select('id').eq('id', projectId).eq('user_id', user.id).single();
    if (!ownedProject) return jsonError('Proyek tidak ditemukan atau bukan milik akun ini.', 404);

    const rows: (string | number)[][] = [];
    const documentLinks: SheetHyperlink[] = [];
    
    // 1. Data Proyek
    rows.push(['=== DATA PROYEK ===']);
    rows.push(['Nama Outlet', project.name || '-']);
    rows.push(['Owner', project.owner?.name || '-']);
    rows.push(['Telepon', project.owner?.phone || '-']);
    rows.push(['Email', project.owner?.email || '-']);
    rows.push(['No. KTP', project.owner?.ktpNumber || '-']);
    rows.push(['Alamat Owner', project.owner?.address || '-']);
    rows.push(['Alamat Outlet', project.locationData?.address || project.location || '-']);
    rows.push(['Kota', project.locationData?.city || '-']);
    rows.push(['Provinsi', project.locationData?.province || '-']);
    rows.push(['Paket Pilihan', project.owner?.packageName || '-']);
    rows.push(['Tanggal Export', new Date().toLocaleString('id-ID')]);
    rows.push([]);

    // 2. Dokumentasi / File
    const fileList = Array.isArray(files) ? files : [];
    if (fileList.length > 0) {
      rows.push(['=== DOKUMENTASI ===']);
      rows.push(['Kategori', 'Nama File', 'Tipe', 'Link']);

      const kindLabels: Record<string, string> = {
        'owner-photo': 'Foto Owner',
        'purchase-proof': 'Bukti Pembelian',
        'setup-fee-proof': 'Bukti Setup Fee',
        'lease-agreement': 'Perjanjian Sewa',
        'location-document': 'Dokumen Lokasi',
        'kickoff-mom': 'MOM Kickoff',
        'timeline-document': 'Dokumen Timeline',
        'timeline-photo': 'Foto Timeline',
        'legal-document': 'Dokumen Legal',
      };

      for (const file of fileList) {
        const fileUrl = file.id ? fileAccessUrl(file.id) : file.thumbnailUrl || file.storageKey || '';
        const canLink = /^https?:\/\//i.test(fileUrl);
        const rowIndex = rows.length;
        rows.push([
          kindLabels[file.kind] || file.kind || '-',
          file.name || '-',
          file.type || '-',
          canLink ? 'Buka dokumen' : '-',
        ]);
        if (canLink) documentLinks.push({ row: rowIndex, column: 3, url: fileUrl, text: 'Buka dokumen' });
      }
      rows.push([]);
    }

    // 3. Vendor proyek
    const assignments = Array.isArray(project.assignments) ? project.assignments : [];
    if (assignments.length > 0) {
      rows.push(['=== DATA VENDOR ===']);
      rows.push(['Kategori', 'Nama Vendor', 'Kontak', 'Telepon', 'Email', 'Catatan']);

      for (const assignment of assignments) {
        const vendor = assignment.vendors || assignment.vendor || {};
        const contact = typeof vendor.contact === 'object' && vendor.contact !== null ? vendor.contact : {};
        rows.push([
          assignment.category || vendor.category || '-',
          vendor.name || '-',
          contact.name || (typeof vendor.contact === 'string' ? vendor.contact : '-') || '-',
          contact.phone || vendor.phone || '-',
          contact.email || '-',
          contact.notes || '-',
        ]);
      }
      rows.push([]);
    }

    // 4. Barang paket dan status verifikasi
    rows.push([`=== PAKET: ${project.owner?.packageName || 'Tidak dipilih'} SETUP & LOADING ===`]);
    rows.push(['Kode Barang (SKU)', 'Nama Barang', 'Qty', 'Kendala', 'Verifikasi']);

    const verifiedItems = project.sections?.verifiedItems || {};
    const issues = project.sections?.issues || {};

    for (const item of packageItems) {
      rows.push([
        'STANDARD',
        item.name,
        String(item.qty || 1),
        issues[item.name] || '-',
        verifiedItems[item.name] ? 'Terverifikasi' : 'Belum diverifikasi',
      ]);
    }

    for (const item of customItems) {
      rows.push([item.sku || '-', item.name, '1', '-', '-']);
    }

    // 5. Master data
    rows.push([]);
    const resolvedMasterData = buildMasterData(packageItems);
    for (const row of resolvedMasterData) {
      rows.push(row);
    }

    rows.push([]);
    rows.push([]);

    await appendRowsToSheet(project.name || `Project ${projectId}`, rows, { hyperlinks: documentLinks });

    return jsonData({ success: true, count: packageItems.length + customItems.length + resolvedMasterData.length });
  } catch (error) {
    console.error('Error exporting to sheets:', error);
    return jsonError(error instanceof Error ? error.message : 'Gagal mengekspor data ke Google Sheets.', 500);
  }
}
