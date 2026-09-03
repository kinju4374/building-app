import nodemailer from 'nodemailer';

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export async function sendMaintenanceEmail({
  to, memberName, flatNumber, month, year, amount, paidDate,
}: {
  to: string;
  memberName: string;
  flatNumber: string;
  month: string;
  year: number;
  amount: number;
  paidDate: string;
}) {
  const buildingName = escapeHtml(process.env.BUILDING_NAME || 'Our Building');
  const safeName = escapeHtml(memberName);
  const safeFlat = escapeHtml(flatNumber);
  const formattedDate = new Date(paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const transporter = getTransporter();

  const html = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:32px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; font-family:Arial, Helvetica, sans-serif;">
        <tr>
          <td style="background-color:#1e293b; padding:24px 32px;">
            <p style="margin:0; color:#ffffff; font-size:18px; font-weight:bold;">${buildingName}</p>
            <p style="margin:4px 0 0; color:#94a3b8; font-size:13px;">Maintenance Receipt</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #e5e7eb; color:#64748b; font-size:14px;">Name</td>
                <td style="padding:10px 0; border-bottom:1px solid #e5e7eb; color:#0f172a; font-size:14px; text-align:right; font-weight:bold;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #e5e7eb; color:#64748b; font-size:14px;">Flat number</td>
                <td style="padding:10px 0; border-bottom:1px solid #e5e7eb; color:#0f172a; font-size:14px; text-align:right; font-weight:bold;">${safeFlat}</td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #e5e7eb; color:#64748b; font-size:14px;">Month</td>
                <td style="padding:10px 0; border-bottom:1px solid #e5e7eb; color:#0f172a; font-size:14px; text-align:right; font-weight:bold;">${month} ${year}</td>
              </tr>
              <tr>
                <td style="padding:10px 0; border-bottom:1px solid #e5e7eb; color:#64748b; font-size:14px;">Date received</td>
                <td style="padding:10px 0; border-bottom:1px solid #e5e7eb; color:#0f172a; font-size:14px; text-align:right; font-weight:bold;">${formattedDate}</td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px; background-color:#f0fdf4; border-radius:8px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0; color:#166534; font-size:13px;">Amount received</p>
                  <p style="margin:4px 0 0; color:#15803d; font-size:26px; font-weight:bold;">${formatCurrency(amount)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px;">
            <p style="margin:0; color:#94a3b8; font-size:12px; line-height:1.5;">
              This is an automated receipt generated on payment. Please retain it for your records. If you believe this is incorrect, contact your building committee.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
  `;

  await transporter.sendMail({
    from: `"${process.env.BUILDING_NAME || 'Building App'}" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Maintenance receipt — ${month} ${year}`,
    html,
  });
}