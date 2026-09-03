import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/googleSheets';

export async function GET() {
  console.log('1. Starting request');
  try {
    console.log('2. Getting sheets client');
    const sheets = getSheetsClient();
    console.log('3. Client created, fetching data');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Members!A1:G5',
    });
    console.log('4. Data fetched successfully');
    return NextResponse.json({
      success: true,
      rows: response.data.values || [],
    });
    
  } catch (error) {
    console.log('ERROR CAUGHT:', error);
    return NextResponse.json(
      { success: false, error: 'Could not read sheet' },
      { status: 500 }
    );
  }
}