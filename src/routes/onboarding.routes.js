const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');

// Initialize ZeptoMail Transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.zeptomail.in',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'emailapikey',
      pass: process.env.SMTP_PASS,
    },
  });
};

// Helper: Send ZeptoMail Notification to HR & Candidate
const sendOnboardingEmailNotification = async (candidate, docsCount) => {
  try {
    const transporter = createTransporter();
    const fromAddress = process.env.SMTP_FROM || 'career@tridinsoftware.com';
    const fromName = process.env.SMTP_FROM_NAME || 'Tridin Software Careers';

    // 1. Send Confirmation Email to Candidate
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: candidate.email,
      replyTo: fromAddress,
      subject: `Onboarding Documents Received - ${candidate.fullName} [${candidate.onboardingId}]`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 25px; color: #0f172a;">
          <div style="max-w: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 30px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            <h2 style="color: #0062E6; margin-top: 0;">Tridin Software Private Limited</h2>
            <h3 style="color: #0f172a;">Onboarding Documents Successfully Received!</h3>
            <p>Dear <strong>${candidate.fullName}</strong>,</p>
            <p>We have successfully received your onboarding profile and <strong>${docsCount} verification documents</strong> for the position of <strong>${candidate.role}</strong>.</p>
            
            <div style="background: #0f172a; color: #ffffff; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <span style="font-size: 12px; color: #94a3b8; display: block;">YOUR ONBOARDING REFERENCE TRACKING ID</span>
              <strong style="font-size: 24px; color: #00C6FF; letter-spacing: 2px;">${candidate.onboardingId}</strong>
            </div>

            <p>Our HR compliance team will review your submitted documents and verify your credentials. You will be notified once the verification process is completed.</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
            <p style="font-size: 12px; color: #64748b;">Best regards,<br/><strong>HR Compliance & Recruitment Team</strong><br/>Tridin Software Private Limited</p>
          </div>
        </div>
      `,
    });

    // 2. Send Notification Email to HR Notification Recipient
    const hrRecipient = process.env.HR_NOTIFICATION_EMAIL || 'career@tridinsoftware.com';
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: hrRecipient,
      subject: `🚀 New Employee Onboarding Documents Submitted: ${candidate.fullName} (${candidate.role})`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #ffffff;">
          <h2 style="color: #00C6FF;">New Onboarding Record Created!</h2>
          <p><strong>Candidate Name:</strong> ${candidate.fullName}</p>
          <p><strong>Reference ID:</strong> ${candidate.onboardingId}</p>
          <p><strong>Email:</strong> ${candidate.email}</p>
          <p><strong>Phone:</strong> ${candidate.phone}</p>
          <p><strong>Role:</strong> ${candidate.role}</p>
          <p><strong>PAN:</strong> ${candidate.panNumber}</p>
          <p><strong>Aadhar:</strong> ${candidate.aadharNumber}</p>
          <p><strong>Uploaded Files Count:</strong> ${docsCount}</p>
          <p style="color: #10b981;">Log in to the HR Onboarding Portal to inspect and verify candidate documents.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('ZeptoMail Onboarding Notification Error:', err.message);
  }
};

// 1. Submit New Onboarding Candidate Profile & Documents
router.post('/submit', async (req, res) => {
  try {
    const { personalInfo, documents } = req.body;

    if (!personalInfo || !personalInfo.fullName || !personalInfo.email || !personalInfo.phone || !personalInfo.panNumber || !personalInfo.aadharNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required personal details (Full Name, Email, Phone, PAN, Aadhar).',
      });
    }

    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const onboardingId = `TRD-ONB-${year}-${randomNum}`;

    // Upsert or create candidate record
    const candidate = await prisma.onboardingCandidate.create({
      data: {
        onboardingId,
        fullName: personalInfo.fullName,
        email: personalInfo.email,
        phone: personalInfo.phone,
        role: personalInfo.role || 'Software Engineer',
        department: 'Engineering',
        joiningDate: personalInfo.joiningDate || '',
        dob: personalInfo.dob || '',
        gender: personalInfo.gender || 'Male',
        bloodGroup: personalInfo.bloodGroup || 'O+',
        currentAddress: personalInfo.currentAddress || '',
        permanentAddress: personalInfo.permanentAddress || '',
        emergencyContactName: personalInfo.emergencyContactName || '',
        emergencyContactPhone: personalInfo.emergencyContactPhone || '',
        bankName: personalInfo.bankName || '',
        accountNumber: personalInfo.accountNumber || '',
        ifscCode: personalInfo.ifscCode || '',
        panNumber: personalInfo.panNumber,
        aadharNumber: personalInfo.aadharNumber,
        status: 'Pending',
        documents: {
          create: (documents || []).map((doc) => ({
            category: doc.category,
            type: doc.type,
            name: doc.name,
            size: doc.size || '1.0 MB',
            fileUrl: doc.fileUrl || '',
            fileBase64: doc.fileBase64 || '',
            status: 'Pending',
          })),
        },
      },
      include: {
        documents: true,
      },
    });

    // Send Async Email Notification
    sendOnboardingEmailNotification(candidate, candidate.documents.length);

    res.status(201).json({
      success: true,
      message: 'Onboarding profile & documents successfully submitted!',
      data: candidate,
    });
  } catch (err) {
    console.error('Error submitting onboarding data:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to submit onboarding data.',
    });
  }
});

// 2. Track Candidate Status by Onboarding ID or Email
router.get('/track/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const cleanQuery = query.trim().toLowerCase();

    const candidate = await prisma.onboardingCandidate.findFirst({
      where: {
        OR: [
          { onboardingId: { equals: query, mode: 'insensitive' } },
          { email: { equals: cleanQuery, mode: 'insensitive' } },
          { fullName: { contains: cleanQuery, mode: 'insensitive' } },
        ],
      },
      include: {
        documents: true,
      },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'No onboarding record found matching query.',
      });
    }

    res.status(200).json({
      success: true,
      data: candidate,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to query onboarding record.',
    });
  }
});

// 3. Get All Onboarding Records for HR Admin
router.get('/all', async (req, res) => {
  try {
    const candidates = await prisma.onboardingCandidate.findMany({
      orderBy: { createdAt: 'desc' },
      include: { documents: true },
    });

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch onboarding records.',
    });
  }
});

// 4. Update Document Verification Status (Approve / Reject)
router.post('/verify-doc', async (req, res) => {
  try {
    const { docId, status, remark } = req.body;

    if (!docId || !status) {
      return res.status(400).json({ success: false, error: 'docId and status are required' });
    }

    const updatedDoc = await prisma.onboardingDocument.update({
      where: { id: docId },
      data: {
        status,
        remark: remark || null,
      },
    });

    // Recalculate parent candidate status
    const allCandidateDocs = await prisma.onboardingDocument.findMany({
      where: { candidateId: updatedDoc.candidateId },
    });

    const allApproved = allCandidateDocs.every((d) => d.status === 'Approved');
    const hasRejected = allCandidateDocs.some((d) => d.status === 'Rejected');

    let newCandidateStatus = 'Pending';
    if (allApproved) newCandidateStatus = 'Verified';
    else if (hasRejected) newCandidateStatus = 'Action Required';

    await prisma.onboardingCandidate.update({
      where: { id: updatedDoc.candidateId },
      data: { status: newCandidateStatus },
    });

    res.status(200).json({
      success: true,
      message: `Document status updated to ${status}`,
      data: updatedDoc,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to update document status.',
    });
  }
});

module.exports = router;
