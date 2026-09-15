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
const sendMail = async ({ to, subject, html, attachments, fromName, replyTo }) => {
  const fromEmail = process.env.SMTP_FROM || 'no-reply@lurnstack.com';
  const senderDisplayName = fromName || process.env.SMTP_FROM_NAME || 'Tridin Software Private Limited';

  try {
    const mailOptions = {
      from: `"${senderDisplayName}" <${fromEmail}>`,
      to,
      subject,
      html,
    };

    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const info = await transporter.sendMail(mailOptions);

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
  const hrEmail = process.env.HR_NOTIFICATION_EMAIL || 'career@tridinsoftware.com';
  const subject = `📩 New Contact Request: ${contactData.name} - ${contactData.subject}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #0284c7;">New Contact Inquiry Received</h2>
      <p><strong>Name:</strong> ${contactData.name}</p>
      <p><strong>Email:</strong> ${contactData.email}</p>
      <p><strong>Phone:</strong> ${contactData.phone || 'Not provided'}</p>
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

  return await sendMail({
    to: hrEmail,
    subject,
    html,
    fromName: `${contactData.name} (via Tridin Contact)`,
    replyTo: contactData.email,
  });
};

/**
 * Send Job Application Alert to HR Team
 */
const sendJobApplicationNotification = async (appData) => {
  const hrEmail = process.env.HR_NOTIFICATION_EMAIL || 'career@tridinsoftware.com';
  const subject = `🚀 New Job Application: ${appData.applicantName} for ${appData.roleTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <h2 style="color: #10b981;">New Candidate Application Received</h2>
      <p><strong>Role Applied:</strong> ${appData.roleTitle} (${appData.department})</p>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 15px;">
        <h3 style="margin-top: 0; color: #0f172a; font-size: 15px;">Candidate Information</h3>
        <p style="margin: 4px 0;"><strong>Applicant Name:</strong> ${appData.applicantName}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${appData.applicantEmail}</p>
        <p style="margin: 4px 0;"><strong>Phone:</strong> ${appData.applicantPhone}</p>
        <p style="margin: 4px 0;"><strong>Current Location:</strong> ${appData.currentLocation || 'N/A'}</p>
        <p style="margin: 4px 0;"><strong>Highest Qualification:</strong> ${appData.qualification || 'N/A'}</p>
        <p style="margin: 4px 0;"><strong>Total Experience:</strong> ${appData.experience || 'N/A'}</p>
        <p style="margin: 4px 0;"><strong>Notice Period:</strong> ${appData.noticePeriod || 'Immediate Joiner'}</p>
        <p style="margin: 4px 0;"><strong>Willing to Work in Chennai:</strong> ${appData.relocateConsent || 'Yes'}</p>
        <p style="margin: 4px 0;"><strong>Expected Salary / CTC:</strong> ${appData.expectedSalary || 'N/A'}</p>
        <p style="margin: 4px 0;"><strong>Key Skills:</strong> ${appData.keySkills || 'N/A'}</p>
      </div>

      <div style="margin-top: 15px;">
        <p style="margin: 4px 0;"><strong>Uploaded Resume File:</strong> ${appData.resumeFileName ? `📎 <strong>${appData.resumeFileName}</strong> (Attached to this email)` : 'Not uploaded'}</p>
        <p style="margin: 4px 0;"><strong>Portfolio / GitHub / LinkedIn:</strong> ${appData.portfolioUrl ? `<a href="${appData.portfolioUrl}">${appData.portfolioUrl}</a>` : 'Not provided'}</p>
      </div>

      ${
        appData.coverNote
          ? `<div style="background-color: #ecfdf5; padding: 15px; border-left: 4px solid #10b981; margin-top: 15px; border-radius: 4px;">
              <p style="margin: 0;"><strong>Cover Note / Background:</strong></p>
              <p style="margin-top: 5px;">${appData.coverNote}</p>
             </div>`
          : ''
      }
      <br/>
      <p style="font-size: 12px; color: #64748b;">Tridin Careers Recruitment Portal</p>
    </div>
  `;

  const attachments = [];
  if (appData.resumeBase64) {
    attachments.push({
      filename: appData.resumeFileName || 'Candidate_Resume.pdf',
      path: appData.resumeBase64,
    });
  }

  return await sendMail({
    to: hrEmail,
    subject,
    html,
    attachments,
    fromName: `${appData.applicantName} (via Tridin Careers)`,
    replyTo: appData.applicantEmail,
  });
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

  const hrEmail = process.env.HR_NOTIFICATION_EMAIL || 'career@tridinsoftware.com';
  return await sendMail({
    to: appData.applicantEmail,
    subject,
    html,
    fromName: 'Tridin Software Careers',
    replyTo: hrEmail,
  });
};

/**
 * Send Contact User Confirmation Email
 */
const sendContactUserConfirmation = async (contactData) => {
  const subject = `Inquiry Received - Tridin Software Private Limited`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <h2 style="color: #0284c7;">We received your message!</h2>
      <p>Dear ${contactData.name},</p>
      <p>Thank you for reaching out to <strong>Tridin Software Private Limited</strong>.</p>
      <p>We have successfully received your inquiry regarding <strong>"${contactData.subject}"</strong> for <strong>${contactData.service}</strong>.</p>
      <p>Our engineering team is reviewing your requirements and will reply to your email within 2 hours.</p>
      <br/>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #0284c7;">
        <p style="margin: 0; font-size: 13px; color: #475569;"><strong>Your Submitted Message:</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 13px; color: #64748b;"><em>${contactData.message}</em></p>
      </div>
      <br/>
      <p>Best regards,</p>
      <p><strong>Customer Success Team</strong><br/>Tridin Software Private Limited<br/>TECCI Park, Sholinganallur, Chennai</p>
    </div>
  `;

  const hrEmail = process.env.HR_NOTIFICATION_EMAIL || 'career@tridinsoftware.com';
  return await sendMail({
    to: contactData.email,
    subject,
    html,
    fromName: 'Tridin Software Support',
    replyTo: hrEmail,
  });
};

module.exports = {
  sendMail,
  sendContactNotification,
  sendContactUserConfirmation,
  sendJobApplicationNotification,
  sendCandidateConfirmation,
};
