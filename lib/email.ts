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
  const buildingName = process.env.BUILDING_NAME || 'Our Building';
  const transporter = getTransporter();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e5e5; border-radius: 8px;">
      <h2 style="margin-top:0;">${buildingName}</h2>
      <p>Maintenance receipt</p>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding:6px 0; color:#555;">Name</td><td style="padding:6px 0; text-align:right;">${memberName}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Flat number</td><td style="padding:6px 0; text-align:right;">${flatNumber}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Month</td><td style="padding:6px 0; text-align:right;">${month} ${year}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Amount</td><td style="padding:6px 0; text-align:right;">₹${amount}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Date received</td><td style="padding:6px 0; text-align:right;">${paidDate}</td></tr>
      </table>
      <p style="color:#888; font-size:12px;">This is an automated receipt. Please keep it for your records.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"${buildingName}" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Maintenance receipt — ${month} ${year}`,
    html,
  });
}