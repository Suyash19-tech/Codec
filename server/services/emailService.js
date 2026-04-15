const nodemailer = require('nodemailer');

// Create transporter with Gmail service
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ [EMAIL] Transporter verification failed:', error);
        console.error('❌ [EMAIL] Check EMAIL_USER and EMAIL_PASS in environment variables');
    } else {
        console.log('✅ [EMAIL] Transporter is ready to send emails');
        console.log(`📧 [EMAIL] Configured with: ${process.env.EMAIL_USER}`);
    }
});

/**
 * Send email asynchronously (non-blocking)
 * @param {Object} mailOptions - Email options (from, to, subject, text, html)
 * @returns {Promise<void>}
 */
const sendEmail = async (mailOptions) => {
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [EMAIL] Email sent successfully:', {
            messageId: info.messageId,
            to: mailOptions.to,
            subject: mailOptions.subject
        });
        return info;
    } catch (error) {
        console.error('❌ [EMAIL] Failed to send email');
        console.error('❌ [EMAIL] Full SMTP Error:', error);
        console.error('❌ [EMAIL] Error Details:', {
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode
        });
        throw error;
    }
};

/**
 * Send OTP email for signup
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP code
 */
const sendSignupOTP = (email, otp) => {
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

    // Send asynchronously without blocking
    sendEmail(mailOptions).catch(err => {
        console.error('[EMAIL] Signup OTP send error:', err.message);
    });
};

/**
 * Send OTP email for password reset
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP code
 */
const sendPasswordResetOTP = (email, otp) => {
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

    // Send asynchronously without blocking
    sendEmail(mailOptions).catch(err => {
        console.error('[EMAIL] Password reset OTP send error:', err.message);
    });
};

module.exports = {
    transporter,
    sendEmail,
    sendSignupOTP,
    sendPasswordResetOTP
};
