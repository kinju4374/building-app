import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/googleSheets';
import { auth } from '@/auth';

const SHEET_NAME = 'AuditLog';
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:F`,
    });
    const rows = res.data.values || [];
    const logs = rows
      .filter((row) => row[0])
      .map((row) => ({
        id: row[0],
        timestamp: row[1],
        user: row[2],
        role: row[3],
        action: row[4],
        details: row[5] || '',
      }));
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('Failed to fetch audit log:', error);
    return NextResponse.json({ success: false, error: 'Could not load audit log' }, { status: 500 });
  }
}