import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getSheetsClient } from '@/lib/googleSheets';
import { auth } from '@/auth';
import { logAudit } from '@/lib/audit';

const SHEET_NAME = 'Members';
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const familyMemberSchema = z.object({
  name: z.string().min(1).max(100),
  relation: z.string().min(1).max(50),
});

const memberSchema = z.object({
  name: z.string().min(1).max(100),
  flatNumber: z.string().min(1).max(20),
  phone: z.string().min(10).max(15),
  email: z.string().email(),
  familyMembers: z.array(familyMemberSchema).max(20).default([]),
});

function sanitize(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:H`,
    });

    const rows = res.data.values || [];
    const members = rows
      .map((row) => ({
        id: row[0] || '',
        name: row[1] || '',
        flatNumber: row[2] || '',
        familyMembers: row[3] ? JSON.parse(row[3]) : [],
        phone: row[4] || '',
        email: row[5] || '',
        joinDate: row[6] || '',
        status: row[7] || 'active',
      }))
      .filter((m) => m.id && m.status !== 'inactive');

    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error('Failed to fetch members:', error);
    return NextResponse.json({ success: false, error: 'Could not load members' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = memberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const id = randomUUID();
    const joinDate = new Date().toISOString().split('T')[0];

    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:H`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          id,
          sanitize(data.name),
          sanitize(data.flatNumber),
          JSON.stringify(data.familyMembers),
          sanitize(data.phone),
          sanitize(data.email),
          joinDate,
          'active',
        ]],
      },
    });

    await logAudit({
      user: session.user?.name || 'Unknown',
      role: (session.user as any)?.role || 'unknown',
      action: 'Added member',
      details: `${data.name} — Flat ${data.flatNumber}`,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to add member:', error);
    return NextResponse.json({ success: false, error: 'Could not add member' }, { status: 500 });
  }
}