import PDFDocument from 'pdfkit';

export function generateReceiptPdf({
  buildingName, memberName, flatNumber, month, year, amount, paidDate,
}: {
  buildingName: string;
  memberName: string;
  flatNumber: string;
  month: string;
  year: number;
  amount: number;
  paidDate: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const formattedDate = new Date(paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    // Header
    doc.fontSize(20).fillColor('#1e293b').font('Helvetica-Bold').text(buildingName);
    doc.fontSize(12).fillColor('#64748b').font('Helvetica').text('Maintenance Receipt');
    doc.moveDown(1.5);

    // Table geometry
    const labelColX = 50;
    const valueColX = 300;
    const tableWidth = 495; // A4 width (595) minus 50pt margins on each side
    const rowHeight = 32;
    let y = doc.y;

    const rows: [string, string][] = [
      ['Name', memberName],
      ['Flat number', flatNumber],
      ['Month', `${month} ${year}`],
      ['Date received', formattedDate],
    ];

    rows.forEach(([label, value]) => {
      // Row border (box outline + vertical divider between the two columns)
      doc.rect(labelColX, y, tableWidth, rowHeight).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.moveTo(valueColX, y).lineTo(valueColX, y + rowHeight).strokeColor('#e2e8f0').stroke();

      doc.fontSize(11).fillColor('#64748b').font('Helvetica')
        .text(label, labelColX + 12, y + 10, { width: valueColX - labelColX - 24 });
      doc.fontSize(11).fillColor('#0f172a').font('Helvetica-Bold')
        .text(value, valueColX + 12, y + 10, { width: tableWidth - (valueColX - labelColX) - 24 });

      y += rowHeight;
    });

    // Highlighted "amount" row as the final table row, visually distinct
    const amountRowHeight = 40;
    doc.rect(labelColX, y, tableWidth, amountRowHeight).fillAndStroke('#f0fdf4', '#bbf7d0');
    doc.moveTo(valueColX, y).lineTo(valueColX, y + amountRowHeight).strokeColor('#bbf7d0').stroke();

    doc.fontSize(12).fillColor('#166534').font('Helvetica-Bold')
      .text('Amount received', labelColX + 12, y + 14, { width: valueColX - labelColX - 24 });
    // Note: "Rs." not the ₹ symbol — PDFKit's built-in fonts don't include the Rupee glyph
    doc.fontSize(16).fillColor('#15803d').font('Helvetica-Bold')
      .text(`Rs. ${amount.toLocaleString('en-IN')}`, valueColX + 12, y + 10, { width: tableWidth - (valueColX - labelColX) - 24 });

    y += amountRowHeight + 30;

    doc.fontSize(9).fillColor('#94a3b8').font('Helvetica')
      .text('This is an automated receipt. Please retain it for your records.', labelColX, y);

    doc.end();
  });
}