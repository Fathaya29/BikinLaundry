import { JWT } from 'google-auth-library';

const SPREADSHEET_ID = '1UdCtPX-xdLB0atQ1e-pAasCNGqb75RwN8cB7CZ63p98';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

async function getAuthToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY?.trim();
  const privateKey = rawPrivateKey
    ?.replace(/^['"]|['"]$/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '')
    .trim();

  if (!email || !privateKey) {
    throw new Error('Google Sheets credentials are not configured in environment variables.');
  }
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
    throw new Error('GOOGLE_PRIVATE_KEY harus berupa PEM lengkap dengan BEGIN PRIVATE KEY dan END PRIVATE KEY.');
  }

  const auth = new JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  try {
    const token = await auth.authorize();
    if (!token.access_token) throw new Error('Google tidak mengembalikan access token.')
    return token.access_token;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Credential Google tidak valid.';
    throw new Error(`Autentikasi Google Sheets gagal: ${message}. Periksa private key baru, email service account, dan waktu server.`);
  }
}

const BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;
const OUTLET_HEADERS = ['Waktu Sinkronisasi', 'Project ID', 'Nama Outlet', 'Owner', 'Email', 'Telepon', 'Alamat Outlet', 'Paket', 'Status', 'Progress', 'Task Selesai', 'Barang Terverifikasi', 'Kendala', 'Dokumentasi', 'Dibuat', 'Update Terakhir'];

export type SheetHyperlink = { row: number; column: number; url: string; text: string };

function sheetTitle(name: string) {
  const cleaned = name.replace(/[\\/?*\[\]:]/g, ' ').replace(/\s+/g, ' ').trim() || 'Outlet Tanpa Nama';
  return cleaned.slice(0, 100);
}

function safeSheetValue(value: string | number | boolean) {
  if (typeof value !== 'string') return value;
  return /^[=+\-@]/.test(value.trimStart()) ? `'${value}` : value;
}

/**
 * Ensures a sheet tab exists. Creates it if missing.
 */
async function ensureSheet(token: string, title: string) {
  // Get spreadsheet metadata to check existing sheets
  const metaRes = await fetch(`${BASE}?fields=sheets.properties.title`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) throw new Error(`Failed to read spreadsheet metadata: ${await metaRes.text()}`);

  const meta = await metaRes.json();
  const exists = meta.sheets?.some((s: any) => s.properties?.title === title);
  if (exists) return;

  // Create the sheet tab
  const createRes = await fetch(`${BASE}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title } } }],
    }),
  });
  if (!createRes.ok) throw new Error(`Failed to create sheet "${title}": ${await createRes.text()}`);
}

async function ensureOutletHeaders(token: string, title: string) {
  const range = `'${title}'!A1:P1`;
  const response = await fetch(`${BASE}/values/${encodeURIComponent(range)}?majorDimension=ROWS`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Failed to read Outlet Data headers: ${await response.text()}`);
  const current = await response.json();
  if (current.values?.length) return;
  const write = await fetch(`${BASE}/values/${encodeURIComponent(range)}?valueInputOption=RAW`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [OUTLET_HEADERS] }),
  });
  if (!write.ok) throw new Error(`Failed to write Outlet Data headers: ${await write.text()}`);
}

async function formatAppendedRows(token: string, title: string, rows: (string | number | boolean)[][], startRowIndex: number, hyperlinks: SheetHyperlink[]) {
  const metaRes = await fetch(`${BASE}?fields=sheets.properties(sheetId,title)`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) throw new Error(`Failed to read spreadsheet metadata: ${await metaRes.text()}`);
  const meta = await metaRes.json();
  const sheetId = meta.sheets?.find((sheet: any) => sheet.properties?.title === title)?.properties?.sheetId;
  if (typeof sheetId !== 'number') throw new Error(`Sheet "${title}" was not found.`);

  const columnWidths = [150, 320, 110, 240, 130, 150];
  const requests: any[] = [
    {
      repeatCell: {
        range: { sheetId, startRowIndex, endRowIndex: startRowIndex + rows.length, startColumnIndex: 0, endColumnIndex: columnWidths.length },
        cell: { userEnteredFormat: { verticalAlignment: 'MIDDLE', wrapStrategy: 'WRAP' } },
        fields: 'userEnteredFormat.verticalAlignment,userEnteredFormat.wrapStrategy',
      },
    },
    ...columnWidths.map((pixelSize, index) => ({
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: index, endIndex: index + 1 },
        properties: { pixelSize },
        fields: 'pixelSize',
      },
    })),
    {
      autoResizeDimensions: {
        dimensions: { sheetId, dimension: 'ROWS', startIndex: startRowIndex, endIndex: startRowIndex + rows.length },
      },
    },
  ];

  rows.forEach((row, index) => {
    const firstCell = row[0];
    const rowIndex = startRowIndex + index;
    if (typeof firstCell === 'string' && firstCell.startsWith('===') && row.slice(1).every((value) => value === '' || value === undefined)) {
      const range = { sheetId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 0, endColumnIndex: columnWidths.length };
      requests.push(
        { mergeCells: { range, mergeType: 'MERGE_ALL' } },
        {
          repeatCell: {
            range,
            cell: { userEnteredFormat: { backgroundColor: { red: 0.08, green: 0.31, blue: 0.25 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }, verticalAlignment: 'MIDDLE' } },
            fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat,userEnteredFormat.verticalAlignment',
          },
        },
      );
    }

    if (firstCell === 'Kategori' || firstCell === 'Kode Barang (SKU)' || firstCell === 'Kode Barang') {
      requests.push({
        repeatCell: {
          range: { sheetId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 0, endColumnIndex: Math.max(row.length, 1) },
          cell: { userEnteredFormat: { backgroundColor: { red: 0.88, green: 0.94, blue: 0.91 }, textFormat: { bold: true, foregroundColor: { red: 0.12, green: 0.22, blue: 0.18 } }, verticalAlignment: 'MIDDLE' } },
          fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat,userEnteredFormat.verticalAlignment',
        },
      });
    }
  });

  for (const link of hyperlinks) {
    const rowIndex = startRowIndex + link.row;
    requests.push({
      updateCells: {
        range: { sheetId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: link.column, endColumnIndex: link.column + 1 },
        rows: [{ values: [{ userEnteredValue: { stringValue: link.text }, textFormatRuns: [{ startIndex: 0, format: { link: { uri: link.url }, foregroundColor: { red: 0.12, green: 0.34, blue: 0.72 }, underline: true } }] }] }],
        fields: 'userEnteredValue,textFormatRuns',
      },
    });
  }

  const response = await fetch(`${BASE}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests }),
  });
  if (!response.ok) throw new Error(`Failed to format sheet rows: ${await response.text()}`);
}

/**
 * Appends rows of raw values to a sheet using the Google Sheets API v4 directly.
 * Auto-creates the sheet tab if it doesn't exist.
 *
 * @param sheetTitle - The name of the tab/sheet to append to.
 * @param rows      - 2D array of cell values, e.g. [['A1','B1'],['A2','B2']]
 */
export async function appendRowsToSheet(sheetTitle: string, rows: (string | number | boolean)[][], options?: { hyperlinks?: SheetHyperlink[] }) {
  const token = await getAuthToken();
  const safeTitle = sheetTitle === 'Outlet Data' ? sheetTitle : sheetTitle.replace(/[\\/?*\[\]:]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100) || 'Outlet Tanpa Nama';
  const safeRows = rows.map((row) => row.map(safeSheetValue));

  // Make sure the tab exists first
  await ensureSheet(token, safeTitle);

  const range = `'${safeTitle}'!A1`;

  const url =
    `${BASE}/values/${encodeURIComponent(range)}:append` +
    `?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: safeRows }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Sheets API error (${res.status}): ${body}`);
  }

  const result = await res.json();
  if (options) {
    const firstRow = result.updates?.updatedRange?.split('!').at(-1)?.match(/^[A-Z]+(\d+)/)?.[1];
    if (!firstRow) throw new Error('Could not determine the first appended row in Google Sheets.');
    await formatAppendedRows(token, safeTitle, rows, Number(firstRow) - 1, options.hyperlinks || []);
  }

  return result;
}

export function fileAccessUrl(fileId: string) {
  return `${APP_URL}/api/files/${encodeURIComponent(fileId)}`;
}

export async function appendOutletSnapshotToSheet(project: Record<string, any>, tasks: Record<string, any>[] = [], files: Record<string, any>[] = []) {
  const token = await getAuthToken();
  const title = sheetTitle(project.name || project.id || 'Outlet Tanpa Nama');
  await ensureSheet(token, title);
  await ensureOutletHeaders(token, title);
  const sections = project.sections || {};
  const completedTasks = tasks.filter((task) => task.status === 'Selesai dikerjakan' || task.status === 'Tidak diperlukan').length;
  const issues = Object.entries(sections.issues || {}).map(([item, note]) => `${item}: ${note}`).join(' | ');
  const verifiedItems = Object.entries(sections.verifiedItems || {}).filter(([, verified]) => verified).map(([item]) => item).join(', ');
  await appendRowsToSheet('Outlet Data', [[
    new Date().toISOString(),
    project.id || '',
    project.name || '',
    project.owner?.name || '',
    project.owner?.email || '',
    project.owner?.phone || '',
    project.location_data?.address || project.location || '',
    project.owner?.packageName || project.package_name || '',
    sections.softOpening ? 'Selesai' : project.status || '',
    sections.softOpening ? 100 : tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
    `${completedTasks}/${tasks.length}`,
    verifiedItems,
    issues,
    files.map((file) => {
      const name = file.file_name || file.name || '';
      const type = file.mime_type || file.type || 'file';
      const link = file.id ? `${APP_URL}/api/files/${encodeURIComponent(file.id)}` : file.url || file.thumbnailUrl || file.storage_path || file.storageKey || '';
      return [name, type, link].filter(Boolean).join(' | ');
    }).filter(Boolean).join(' || '),
    project.created_at || '',
    project.updated_at || '',
  ]]);
}
