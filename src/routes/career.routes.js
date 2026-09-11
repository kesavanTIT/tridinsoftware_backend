const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const {
  sendJobApplicationNotification,
  sendCandidateConfirmation,
} = require('../utils/zeptomail');

// POST /api/careers/apply - Candidate Job Application Submission
router.post('/apply', async (req, res) => {
  try {
    const {
      roleTitle,
      department,
      applicantName,
      applicantEmail,
      applicantPhone,
      portfolioUrl,
      coverNote,
    } = req.body;

    if (!roleTitle || !applicantName || !applicantEmail || !applicantPhone || !portfolioUrl) {
      return res.status(400).json({
        success: false,
        error: 'Role title, name, email, phone, and portfolio URL are required.',
      });
    }

    // 1. Save Candidate Application in Database via Prisma
    const application = await prisma.jobApplication.create({
      data: {
        roleTitle,
        department: department || 'Engineering',
        applicantName,
        applicantEmail,
        applicantPhone,
        portfolioUrl,
        coverNote: coverNote || null,
      },
    });

    // 2. Trigger ZeptoMail HR Notification
    sendJobApplicationNotification(application).catch((err) =>
      console.error('ZeptoMail HR notification error:', err)
    );

    // 3. Trigger ZeptoMail Candidate Confirmation Email
    sendCandidateConfirmation(application).catch((err) =>
      console.error('ZeptoMail candidate confirmation error:', err)
    );

    return res.status(201).json({
      success: true,
      message: 'Job application submitted successfully!',
      data: application,
    });
  } catch (error) {
    console.error('Error submitting job application:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit application. Internal server error.',
    });
  }
});

// GET /api/careers/applications - Fetch all candidate applications for HR Dashboard
router.get('/applications', async (req, res) => {
  try {
    const applications = await prisma.jobApplication.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error('Error fetching job applications:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch job applications.',
    });
  }
});

module.exports = router;
