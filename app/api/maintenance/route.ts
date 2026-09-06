import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getSheetsClient } from '@/lib/googleSheets';
import { sendMaintenanceEmail } from '@/lib/email';
import { auth } from '@/auth';
import { logAudit } from '@/lib/audit';

const SHEET_NAME = 'MaintenanceRecords';
const MEMBERS_SHEET = 'Members';
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const recordSchema = z.object({
  memberId: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  amount: z.number().positive(),
  paidDate: z.string().min(1),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:G`,
    });
    const rows = res.data.values || [];
    const records = rows
      .filter((row) => row[0])
      .map((row) => ({
        id: row[0],
        memberId: row[1],
        month: Number(row[2]),
        year: Number(row[3]),
        amount: Number(row[4]),
        paidDate: row[5] || '',
        emailSentAt: row[6] || '',
      }));
    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error('Failed to fetch maintenance records:', error);
    return NextResponse.json({ success: false, error: 'Could not load records' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = recordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const sheets = getSheetsClient();

    const membersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${MEMBERS_SHEET}!A2:H`,
    });
    const memberRow = (membersRes.data.values || []).find((row) => row[0] === data.memberId);
    if (!memberRow) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }
    const memberName = memberRow[1];
    const flatNumber = memberRow[2];
    const memberEmail = memberRow[5];

    const existingRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:D`,
    });
    const duplicate = (existingRes.data.values || []).find(
      (row) => row[1] === data.memberId && Number(row[2]) === data.month && Number(row[3]) === data.year
    );
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: 'A record for this member and month already exists' },
        { status: 409 }
      );
    }

    const id = randomUUID();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:G`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[id, data.memberId, data.month, data.year, data.amount, data.paidDate, '']],
      },
    });

    let emailSent = false;
    try {
      await sendMaintenanceEmail({
        to: memberEmail,
        memberName,
        flatNumber,
        month: MONTH_NAMES[data.month - 1],
        year: data.year,
        amount: data.amount,
        paidDate: data.paidDate,
      });
      emailSent = true;

      const allRows = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A:A`,
      });
      const rowIndex = (allRows.data.values || []).findIndex((row) => row[0] === id);
      if (rowIndex !== -1) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${SHEET_NAME}!G${rowIndex + 1}`,
          valueInputOption: 'RAW',
          requestBody: { values: [[new Date().toISOString()]] },
        });
      }
    } catch (emailError) {
      console.error('Record saved but email failed:', emailError);
    }

    await logAudit({
      user: session.user?.name || 'Unknown',
      role: (session.user as any)?.role || 'unknown',
      action: 'Recorded maintenance',
      details: `${memberName} (Flat ${flatNumber}) — ${MONTH_NAMES[data.month - 1]} ${data.year} — ₹${data.amount} (${emailSent ? 'emailed' : 'email failed'})`,
    });

    return NextResponse.json({ success: true, id, emailSent });
  } catch (error) {
    console.error('Failed to add maintenance record:', error);
    return NextResponse.json({ success: false, error: 'Could not add record' }, { status: 500 });
  }
}