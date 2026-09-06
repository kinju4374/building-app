import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSheetsClient } from '@/lib/googleSheets';
import { auth } from '@/auth';

const SHEET_NAME = 'Expenses';
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const expenseUpdateSchema = z.object({
  date: z.string().min(1),
  category: z.string().min(1).max(50),
  description: z.string().min(1).max(200),
  amount: z.number().positive(),
  paidTo: z.string().min(1).max(100),
});

function sanitize(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

async function findRowNumberById(sheets: any, id: string): Promise<number | null> {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${SHEET_NAME}!A:A` });
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
    const parsed = expenseUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    const sheets = getSheetsClient();
    const rowNumber = await findRowNumberById(sheets, id);
    if (!rowNumber) return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });

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
          id, data.date, sanitize(data.category), sanitize(data.description),
          data.amount, sanitize(data.paidTo), existing[6] || '', existing[7] || 'active',
        ]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update expense:', error);
    return NextResponse.json({ success: false, error: 'Could not update expense' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const sheets = getSheetsClient();
    const rowNumber = await findRowNumberById(sheets, id);
    if (!rowNumber) return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!H${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: { values: [['inactive']] },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove expense:', error);
    return NextResponse.json({ success: false, error: 'Could not remove expense' }, { status: 500 });
  }
}