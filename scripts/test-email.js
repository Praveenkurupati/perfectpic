#!/usr/bin/env node
/**
 * PerfectPic SMTP Verification & Diagnostic Utility
 * Usage:
 *   node scripts/test-email.js [recipient_email]
 * Example:
 *   node scripts/test-email.js testpraveen70@gmail.com
 */

const path = require('path');
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, 'apps/backend/.env');

try {
  require(path.join(rootDir, 'apps/backend/node_modules/dotenv')).config({ path: envPath });
} catch (e) {
  require('dotenv').config({ path: envPath });
}

let nodemailer;
try {
  nodemailer = require(path.join(rootDir, 'apps/backend/node_modules/nodemailer'));
} catch (e) {
  nodemailer = require('nodemailer');
}

const targetEmail = process.argv[2] || 'testpraveen70@gmail.com';

const host = process.env.SMTP_HOST || 'smtppro.zoho.in';
const port = Number(process.env.SMTP_PORT) || 465;
const secure = Number(port) === 465 || process.env.SMTP_SECURE === 'true';
const user = process.env.SMTP_USER || 'noreply@perfectpic.in';
const pass = process.env.SMTP_PASS || '';
const from = process.env.SMTP_FROM || `"PerfectPic Security" <${user}>`;

const maskedPass = !pass
  ? '(UNSET)'
  : pass === 'password' || pass === 'your_zoho_smtp_password'
  ? `"${pass}" (PLACEHOLDER WARNING)`
  : pass.length <= 4
  ? '****'
  : `${pass.slice(0, 2)}${'*'.repeat(pass.length - 4)}${pass.slice(-2)}`;

console.log('======================================================');
console.log('📧 PerfectPic SMTP Diagnostics & Functional Mailer');
console.log('======================================================');
console.log(`Config file : ${envPath}`);
console.log(`Target Email: ${targetEmail}`);
console.log(`SMTP Host   : ${host}`);
console.log(`SMTP Port   : ${port} (Secure: ${secure})`);
console.log(`SMTP User   : ${user}`);
console.log(`SMTP Pass   : ${maskedPass}`);
console.log(`From Header : ${from}`);
console.log('------------------------------------------------------');

if (!pass || pass === 'password' || pass === 'your_zoho_smtp_password') {
  console.log('\n❌ ERROR: SMTP_PASS is unset or set to a placeholder ("password") in apps/backend/.env.');
  console.log('To send real emails to Gmail, you must configure a valid App Password:');
  console.log('\nOption 1: If using Zoho Mail (e.g. noreply@perfectpic.in)');
  console.log('  1. Log into your Zoho account (https://accounts.zoho.in or https://accounts.zoho.com).');
  console.log('  2. Go to Security -> Application-Specific Passwords.');
  console.log('  3. Generate a new App Password for "PerfectPic Backend".');
  console.log('  4. Set SMTP_PASS=<generated_app_password> in apps/backend/.env and re-run this script.');
  console.log('\nOption 2: If using Google / Gmail');
  console.log('  1. Go to Google Account -> Security -> 2-Step Verification -> App Passwords.');
  console.log('  2. Generate a 16-character App Password.');
  console.log('  3. In apps/backend/.env:');
  console.log('     SMTP_HOST=smtp.gmail.com');
  console.log('     SMTP_PORT=465');
  console.log('     SMTP_USER=your_email@gmail.com');
  console.log('     SMTP_PASS=your_16_char_google_app_password');
  console.log('======================================================\n');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
  tls: { rejectUnauthorized: false },
});

async function runTest() {
  try {
    console.log('\n⏳ Step 1: Testing SMTP Server Handshake & Authentication...');
    await transporter.verify();
    console.log('✅ SMTP Connection & Authentication Successful!\n');

    console.log(`⏳ Step 2: Dispatching Functional Test Email to [${targetEmail}]...`);
    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const info = await transporter.sendMail({
      from,
      to: targetEmail,
      subject: `Your Test Verification Code: ${testOtp} - PerfectPic`,
      text: `Your PerfectPic verification code is: ${testOtp}. This is a functional test email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e5e5; border-radius: 8px;">
          <h2 style="color: #1a1a1a; margin-top: 0;">PerfectPic Verification Test</h2>
          <p style="color: #555; font-size: 15px;">This is a functional test email sent from the PerfectPic platform.</p>
          <div style="background-color: #f7f5f0; padding: 18px; border-radius: 6px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1a1a1a;">${testOtp}</span>
          </div>
          <p style="color: #777; font-size: 13px;">If you received this email, your SMTP configuration is 100% verified and operational!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 11px; text-align: center;">© 2026 PerfectPic · Archival Photobook Keepsakes</p>
        </div>
      `,
    });

    console.log('🎉 SUCCESS: Test email successfully dispatched!');
    console.log(`📬 Message ID : ${info.messageId}`);
    console.log(`📨 Response   : ${info.response}`);
    console.log(`🎯 Recipient  : ${targetEmail}`);
    console.log('\nPlease check your Gmail inbox (and Spam/Promotions folder) to confirm receipt.');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ SMTP Dispatch Failed:');
    console.error(`Error Code    : ${error.code || 'UNKNOWN'}`);
    console.error(`Error Message : ${error.message}`);
    if (error.response) console.error(`Server Response: ${error.response}`);

    if (error.message.includes('535') || error.responseCode === 535) {
      console.log('\n💡 DIAGNOSIS: 535 Authentication Failed.');
      console.log('   The username or password provided to the SMTP server was rejected.');
      console.log('   Note: Zoho Mail and Gmail REQUIRE Application-Specific Passwords when 2FA is active.');
    }
    console.log('======================================================\n');
    process.exit(1);
  }
}

runTest();
