import nodemailer from 'nodemailer';
import dns from 'node:dns';

// Fix for Node 17+ preferring IPv6 (::1) over IPv4 (127.0.0.1) which can break SMTP
dns.setDefaultResultOrder('ipv4first');

export const sendOtpEmail = async (email: string, otp: string) => {
  console.log('Attempting to send email to:', email);
  console.log('SMTP Config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Cashward Support" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Your Cashward Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #2563EB; text-align: center;">Cashward Login</h2>
        <p>Hello,</p>
        <p>Your verification code is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #1D4ED8; letter-spacing: 5px; background: #EFF6FF; padding: 10px 20px; border-radius: 8px;">${otp}</span>
        </div>
        <p>This code will expire in 5 minutes. Please do not share this code with anyone.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #6B7280; text-align: center;">&copy; 2026 Cashward. All rights reserved.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
