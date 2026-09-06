import { randomUUID } from 'crypto';
import { getSheetsClient } from './googleSheets';

const SHEET_NAME = 'AuditLog';
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export async function logAudit({
  user, role, action, details,
}: {
  user: string;
  role: string;
  action: string;
  details: string;
}) {
  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:F`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[randomUUID(), new Date().toISOString(), user, role, action, details]],
      },
    });
  } catch (error) {
    // Audit logging failing should never break the actual action it's describing
    console.error('Failed to write audit log:', error);
  }
}