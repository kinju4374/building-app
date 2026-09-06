import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getSheetsClient } from '@/lib/googleSheets';
import { auth } from '@/auth';

const SHEET_NAME = 'Expenses';
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const expenseSchema = z.object({
  date: z.string().min(1),
  category: z.string().min(1).max(50),
  description: z.string().min(1).max(200),
  amount: z.number().positive(),
  paidTo: z.string().min(1).max(100),
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
    const expenses = rows
      .map((row) => ({
        id: row[0] || '',
        date: row[1] || '',
        category: row[2] || '',
        description: row[3] || '',
        amount: Number(row[4] || 0),
        paidTo: row[5] || '',
        addedBy: row[6] || '',
        status: row[7] || 'active',
      }))
      .filter((e) => e.id && e.status !== 'inactive');

    return NextResponse.json({ success: true, expenses });
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    return NextResponse.json({ success: false, error: 'Could not load expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const id = randomUUID();
    const addedBy = session.user?.name || 'Unknown';

    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:H`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          id, data.date, sanitize(data.category), sanitize(data.description),
          data.amount, sanitize(data.paidTo), addedBy, 'active',
        ]],
      },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to add expense:', error);
    return NextResponse.json({ success: false, error: 'Could not add expense' }, { status: 500 });
  }
}