const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const axios = require('axios');

console.log('📧 [EMAIL] Initializing Email Service...');
console.log('📧 [EMAIL] EMAIL_USER:', process.env.EMAIL_USER);
console.log('📧 [EMAIL] EMAIL_PASS:', process.env.EMAIL_PASS ? '***SET***' : '***NOT SET***');
console.log('📧 [EMAIL] RESEND_API_KEY:', process.env.RESEND_API_KEY ? '***SET***' : '***NOT SET***');
console.log('📧 [EMAIL] BREVO_API_KEY:', process.env.BREVO_API_KEY ? '***SET***' : '***NOT SET***');

// Initialize Brevo (300 emails/day, no audience restrictions)
let brevoApiKey = null;
if (process.env.BREVO_API_KEY) {
  brevoApiKey = process.env.BREVO_API_KEY;
  console.log('✅ [EMAIL] Brevo initialized (300 emails/day, no restrictions)');
}

// Initialize Resend (HTTP-based, works on Render)
let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✅ [EMAIL] Resend initialized (HTTP-based email service)');
}

// Validate environment variables
if (!process.env.BREVO_API_KEY && !process.env.RESEND_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
  const errorMsg = '❌ [EMAIL] CRITICAL: No email service configured!';
  console.error(errorMsg);
  console.error('❌ [EMAIL] Set BREVO_API_KEY (recommended) or RESEND_API_KEY or EMAIL_USER/EMAIL_PASS');
  console.error('❌ [EMAIL] Get Brevo API key at: https://app.brevo.com/settings/keys/api');
}

// Create nodemailer transporter as fallback (for local development)
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    family: 4
  });

  console.log('📧 [EMAIL] Nodemailer transporter created (fallback for local dev)');

  // Verify transporter only in development
  if (process.env.NODE_ENV !== 'production') {
    transporter.verify((error) => {
      if (error) {
        console.error('❌ [EMAIL] Nodemailer verification failed:', error.message);
      } else {
        console.log('✅ [EMAIL] Nodemailer ready');
      }
    });
  }
}

/**
 * Send email with Brevo (primary), Resend, or Nodemailer (fallback)
 * @param {Object} mailOptions - Email options (from, to, subject, text, html)
 * @returns {Promise<Object>} - Email send result
 */
const sendEmail = async (mailOptions) => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EMAIL SEND ATTEMPT - START                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('📧 [EMAIL] Target:', mailOptions.to);
  console.log('📧 [EMAIL] Subject:', mailOptions.subject);

  // Try Brevo first (300 emails/day, no audience restrictions)
  if (brevoApiKey) {
    try {
      console.log('⏳ [EMAIL] Sending via Brevo (HTTP API)...');

      const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { name: 'Codec', email: process.env.EMAIL_USER || 'noreply@codec.com' },
        to: [{ email: mailOptions.to }],
        subject: mailOptions.subject,
        htmlContent: mailOptions.html || mailOptions.text
      }, {
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json'
        }
      });

      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║         EMAIL SEND SUCCESS ✅ (Brevo)                      ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('✅ [EMAIL] Message ID:', response.data.messageId);

      return response.data;
    } catch (error) {
      console.error('❌ [EMAIL] Brevo failed:', error.message);
      console.error('❌ [EMAIL] Trying Resend...');
    }
  }

  // Try Resend second (works on Render but has audience restrictions)
  if (resend) {
    try {
      console.log('⏳ [EMAIL] Sending via Resend (HTTP API)...');

      const result = await resend.emails.send({
        from: 'Codec <onboarding@resend.dev>',
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html || mailOptions.text
      });

      if (result.error) {
        console.error('❌ [EMAIL] Resend Error:', result.error.message);
        throw new Error(`Resend API Error: ${result.error.message}`);
      }

      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║         EMAIL SEND SUCCESS ✅ (Resend)                     ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('✅ [EMAIL] Message ID:', result.data?.id || result.id);

      return result;
    } catch (error) {
      console.error('❌ [EMAIL] Resend failed:', error.message);
      console.error('❌ [EMAIL] Falling back to Nodemailer...');
    }
  }

  // Fallback to Nodemailer (for local development)
  if (transporter) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`⏳ [EMAIL] Attempt ${attempt}/2 - Sending via Nodemailer...`);
        const info = await transporter.sendMail(mailOptions);

        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║         EMAIL SEND SUCCESS ✅ (Nodemailer)                 ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log('✅ [EMAIL] Message ID:', info.messageId);

        return info;
      } catch (error) {
        console.error(`❌ [EMAIL] Nodemailer attempt ${attempt}/2 failed:`, error.message);

        const isRetryable = error.code === 'ETIMEDOUT' ||
          error.code === 'ENETUNREACH' ||
          error.code === 'ECONNREFUSED' ||
          error.code === 'ESOCKET';

        if (attempt < 2 && isRetryable) {
          console.log('⏳ [EMAIL] Retrying in 3 seconds...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          throw error;
        }
      }
    }
  }

  throw new Error('No email service available. Set BREVO_API_KEY, RESEND_API_KEY, or EMAIL_USER/EMAIL_PASS');
};

/**
 * Send OTP email for signup (SYNCHRONOUS)
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<Object>}
 */
const sendSignupOTP = async (email, otp) => {
  console.log('[EMAIL] sendSignupOTP called for:', email);

  const mailOptions = {
    from: `"Codec Admin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Codec Signup Verification Code',
    text: `Your Codec Signup Code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Codec Signup Verification</h2>
        <p>Your verification code is:</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #1F2937; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #6B7280; font-size: 14px;">This code expires in 10 minutes.</p>
        <p style="color: #6B7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `
  };

  return await sendEmail(mailOptions);
};

/**
 * Send OTP email for password reset (SYNCHRONOUS)
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<Object>}
 */
const sendPasswordResetOTP = async (email, otp) => {
  console.log('[EMAIL] sendPasswordResetOTP called for:', email);

  const mailOptions = {
    from: `"Codec Admin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Codec Password Reset Code',
    text: `Your Codec Password Reset Code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, please ignore this email and your password will remain unchanged.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #EF4444;">Codec Password Reset</h2>
        <p>Your password reset code is:</p>
        <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #991B1B; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #6B7280; font-size: 14px;">This code expires in 10 minutes.</p>
        <p style="color: #6B7280; font-size: 14px;">If you didn't request this code, please ignore this email and your password will remain unchanged.</p>
      </div>
    `
  };

  return await sendEmail(mailOptions);
};

module.exports = {
  transporter,
  sendEmail,
  sendSignupOTP,
  sendPasswordResetOTP
};
