import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSheetsClient } from '@/lib/googleSheets';
import { auth } from '@/auth';
import { logAudit } from '@/lib/audit';

const SHEET_NAME = 'Members';
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const familyMemberSchema = z.object({
  name: z.string().min(1).max(100),
  relation: z.string().min(1).max(50),
});

const memberUpdateSchema = z.object({
  name: z.string().min(1).max(100),
  flatNumber: z.string().min(1).max(20),
  phone: z.string().min(10).max(15),
  email: z.string().email(),
  familyMembers: z.array(familyMemberSchema).max(20).default([]),
});

function sanitize(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

async function findRowNumberById(sheets: any, id: string): Promise<number | null> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:A`,
  });
  const rows = res.data.values || [];
  const index = rows.findIndex((row: string[]) => row[0] === id);
  return index === -1 ? null : index + 1;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = memberUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    const sheets = getSheetsClient();
    const rowNumber = await findRowNumberById(sheets, id);
    if (!rowNumber) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    const existingRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A${rowNumber}:H${rowNumber}`,
    });
    const existing = existingRes.data.values?.[0] || [];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A${rowNumber}:H${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          id,
          sanitize(data.name),
          sanitize(data.flatNumber),
          JSON.stringify(data.familyMembers),
          sanitize(data.phone),
          sanitize(data.email),
          existing[6] || new Date().toISOString().split('T')[0],
          existing[7] || 'active',
        ]],
      },
    });

    await logAudit({
      user: session.user?.name || 'Unknown',
      role: (session.user as any)?.role || 'unknown',
      action: 'Edited member',
      details: `${data.name} — Flat ${data.flatNumber}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update member:', error);
    return NextResponse.json({ success: false, error: 'Could not update member' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const sheets = getSheetsClient();
    const rowNumber = await findRowNumberById(sheets, id);
    if (!rowNumber) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    const existingRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A${rowNumber}:H${rowNumber}`,
    });
    const existing = existingRes.data.values?.[0] || [];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!H${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: { values: [['inactive']] },
    });

    await logAudit({
      user: session.user?.name || 'Unknown',
      role: (session.user as any)?.role || 'unknown',
      action: 'Removed member',
      details: `${existing[1] || 'Unknown'} — Flat ${existing[2] || ''}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove member:', error);
    return NextResponse.json({ success: false, error: 'Could not remove member' }, { status: 500 });
  }
}