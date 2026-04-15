const nodemailer = require('nodemailer');

console.log('📧 [EMAIL] Initializing Email Service...');
console.log('📧 [EMAIL] EMAIL_USER:', process.env.EMAIL_USER);
console.log('📧 [EMAIL] EMAIL_PASS:', process.env.EMAIL_PASS ? '***SET***' : '***NOT SET***');

// Validate environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  const errorMsg = '❌ [EMAIL] CRITICAL: EMAIL_USER or EMAIL_PASS not set in environment variables!';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

// Create transporter with production-optimized configuration
// Using port 587 with STARTTLS to avoid IPv6/firewall issues on Render
// CRITICAL: Do NOT use 'service' option as it overrides port to 465
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS instead of SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false, // Bypass proxy/firewall TLS issues
    minVersion: 'TLSv1.2' // Ensure modern TLS
  },
  connectionTimeout: 30000, // 30 seconds for Render cold starts
  greetingTimeout: 30000, // 30 seconds for slow SMTP handshake
  socketTimeout: 30000, // 30 seconds for socket operations
  family: 4 // Force IPv4 to avoid IPv6 ENETUNREACH errors on Render
});

console.log('📧 [EMAIL] Transporter created with production-optimized config');
console.log('📧 [EMAIL] Host: smtp.gmail.com | Port: 587 | Secure: false (STARTTLS)');

// Verify transporter configuration on startup with retry logic
const verifyTransporter = async (retries = 2) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📧 [EMAIL] Verification attempt ${attempt}/${retries}...`);
      await transporter.verify();
      console.log('✅ [EMAIL] Transporter verification SUCCESS!');
      console.log('✅ [EMAIL] Ready to send emails from:', process.env.EMAIL_USER);
      return true;
    } catch (error) {
      console.error(`❌ [EMAIL] Verification attempt ${attempt}/${retries} FAILED!`);
      console.error('❌ [EMAIL] Error:', error.message);
      console.error('❌ [EMAIL] Error Code:', error.code);

      if (attempt < retries) {
        console.log(`⏳ [EMAIL] Retrying in 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.error('❌ [EMAIL] All verification attempts failed!');
        console.error('❌ [EMAIL] Check EMAIL_USER and EMAIL_PASS in environment variables');
      }
    }
  }
  return false;
};

// Run verification asynchronously (non-blocking)
verifyTransporter().catch(err => {
  console.error('❌ [EMAIL] Transporter verification error:', err.message);
});

/**
 * Send email with retry logic for production resilience
 * @param {Object} mailOptions - Email options (from, to, subject, text, html)
 * @param {number} retries - Number of retry attempts (default: 2)
 * @returns {Promise<Object>} - Email send result
 */
const sendEmail = async (mailOptions, retries = 2) => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         EMAIL SEND ATTEMPT - START                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('🚀 [EMAIL] Starting SMTP Transporter...');
  console.log('📧 [EMAIL] Target Email:', mailOptions.to);
  console.log('📧 [EMAIL] Subject:', mailOptions.subject);
  console.log('📧 [EMAIL] From:', mailOptions.from);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`⏳ [EMAIL] Attempt ${attempt}/${retries} - Sending via Gmail SMTP (Port 587)...`);
      const info = await transporter.sendMail(mailOptions);

      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║         EMAIL SEND SUCCESS ✅                              ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('✅ [EMAIL] Message ID:', info.messageId);
      console.log('✅ [EMAIL] Response:', info.response);
      console.log('✅ [EMAIL] Accepted:', info.accepted);
      console.log('✅ [EMAIL] Rejected:', info.rejected);

      return info;
    } catch (error) {
      console.error('╔════════════════════════════════════════════════════════════╗');
      console.error(`║         EMAIL SEND ATTEMPT ${attempt}/${retries} FAILED ❌              ║`);
      console.error('╚════════════════════════════════════════════════════════════╝');
      console.error('❌ [EMAIL] SMTP ERROR DETAIL:', error.message);
      console.error('❌ [EMAIL] Error Code:', error.code);
      console.error('❌ [EMAIL] Error Command:', error.command);
      console.error('❌ [EMAIL] Error Response:', error.response);
      console.error('❌ [EMAIL] Error Response Code:', error.responseCode);

      // Check if error is retryable (network/timeout issues)
      const isRetryable = error.code === 'ETIMEDOUT' ||
        error.code === 'ENETUNREACH' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ESOCKET';

      if (attempt < retries && isRetryable) {
        console.log(`⏳ [EMAIL] Retryable error detected. Waiting 3 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.error('❌ [EMAIL] CRITICAL: All retry attempts exhausted or non-retryable error');
        console.error('❌ [EMAIL] Full Error Stack:', error.stack);
        throw error;
      }
    }
  }
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
