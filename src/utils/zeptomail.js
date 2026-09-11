const nodemailer = require('nodemailer');

/**
 * Create Nodemailer SMTP Transporter configured for ZeptoMail
 * Host: smtp.zeptomail.in
 * Port: 587
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.zeptomail.in',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER || 'emailapikey',
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Generic Mail Sender Helper
 */
const sendMail = async ({ to, subject, html }) => {
  const fromEmail = process.env.SMTP_FROM || 'no-reply@lurnstack.com';
  const fromName = process.env.SMTP_FROM_NAME || 'Tridin Software Private Limited';

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ ZeptoMail SMTP sent successfully to ${to} (MessageID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ ZeptoMail SMTP Error for ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Contact Request Alert to HR Team
 */
const sendContactNotification = async (contactData) => {
  const hrEmail = process.env.HR_NOTIFICATION_EMAIL || 'hr@tridinsoftware.com';
  const subject = `📩 New Contact Request: ${contactData.name} - ${contactData.subject}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #0284c7;">New Contact Inquiry Received</h2>
      <p><strong>Name:</strong> ${contactData.name}</p>
      <p><strong>Email:</strong> ${contactData.email}</p>
      <p><strong>Service Requested:</strong> ${contactData.service}</p>
      <p><strong>Subject:</strong> ${contactData.subject}</p>
      <div style="background-color: #f1f5f9; padding: 15px; border-left: 4px solid #0284c7; margin-top: 10px;">
        <p style="margin: 0;"><strong>Message:</strong></p>
        <p style="margin-top: 5px;">${contactData.message}</p>
      </div>
      <br/>
      <p style="font-size: 12px; color: #64748b;">Tridin Software Automated Contact System</p>
    </div>
  `;

  return await sendMail({ to: hrEmail, subject, html });
};

/**
 * Send Job Application Alert to HR Team
 */
const sendJobApplicationNotification = async (appData) => {
  const hrEmail = process.env.HR_NOTIFICATION_EMAIL || 'hr@tridinsoftware.com';
  const subject = `🚀 New Job Application: ${appData.applicantName} for ${appData.roleTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #10b981;">New Candidate Application Submitted</h2>
      <p><strong>Role Applied:</strong> ${appData.roleTitle} (${appData.department})</p>
      <p><strong>Applicant Name:</strong> ${appData.applicantName}</p>
      <p><strong>Email:</strong> ${appData.applicantEmail}</p>
      <p><strong>Phone:</strong> ${appData.applicantPhone}</p>
      <p><strong>Portfolio / GitHub / LinkedIn:</strong> <a href="${appData.portfolioUrl}">${appData.portfolioUrl}</a></p>
      ${
        appData.coverNote
          ? `<div style="background-color: #ecfdf5; padding: 15px; border-left: 4px solid #10b981; margin-top: 10px;">
              <p style="margin: 0;"><strong>Cover Note:</strong></p>
              <p style="margin-top: 5px;">${appData.coverNote}</p>
             </div>`
          : ''
      }
      <br/>
      <p style="font-size: 12px; color: #64748b;">Tridin Careers Recruitment Portal</p>
    </div>
  `;

  return await sendMail({ to: hrEmail, subject, html });
};

/**
 * Send Candidate Confirmation Email
 */
const sendCandidateConfirmation = async (appData) => {
  const subject = `Application Received for ${appData.roleTitle} - Tridin Software`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #0284c7;">Thank you for applying to Tridin Software!</h2>
      <p>Dear ${appData.applicantName},</p>
      <p>We have successfully received your application for the position of <strong>${appData.roleTitle}</strong>.</p>
      <p>Our recruitment team is currently reviewing your profile and credentials. If your qualifications match our requirement, we will reach out to schedule an interview round.</p>
      <br/>
      <p>Best regards,</p>
      <p><strong>Technical Recruitment Team</strong><br/>Tridin Software Private Limited<br/>TECCI Park, Sholinganallur, Chennai</p>
    </div>
  `;

  return await sendMail({ to: appData.applicantEmail, subject, html });
};

module.exports = {
  sendMail,
  sendContactNotification,
  sendJobApplicationNotification,
  sendCandidateConfirmation,
};
