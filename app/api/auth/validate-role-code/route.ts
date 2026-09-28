import { NextResponse } from 'next/server'

const roleCodes = {
  'project-manager': process.env.PROJECT_MANAGER_ROLE_CODE,
  'laundry-biz': process.env.LAUNDRY_BIZ_ROLE_CODE,
} as const

export async function POST(request: Request) {
  try {
    const body = await request.json() as { code?: string }
    const code = typeof body.code === 'string' ? body.code.trim() : ''
    const role = (Object.entries(roleCodes).find(([, expectedCode]) => expectedCode && code === expectedCode)?.[0] || '') as keyof typeof roleCodes

    if (!role || !code) {
      return NextResponse.json({ error: 'Kode role tidak valid.' }, { status: 403 })
    }

    return NextResponse.json({ role })
  } catch {
    return NextResponse.json({ error: 'Data kode role tidak valid.' }, { status: 400 })
  }
}
