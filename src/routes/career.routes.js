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
      experience,
      qualification,
      noticePeriod,
      currentLocation,
      relocateConsent,
      keySkills,
      expectedSalary,
      portfolioUrl,
      resumeFileName,
      resumeBase64,
      coverNote,
    } = req.body;

    if (!roleTitle || !applicantName || !applicantEmail || !applicantPhone) {
      return res.status(400).json({
        success: false,
        error: 'Role title, name, email, and phone number are required.',
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
        experience: experience || 'Fresher (0-1 Yrs)',
        qualification: qualification || 'B.E / B.Tech',
        noticePeriod: noticePeriod || 'Immediate Joiner',
        currentLocation: currentLocation || 'Chennai',
        relocateConsent: relocateConsent || 'Yes',
        keySkills: keySkills || '',
        expectedSalary: expectedSalary || 'As per company norms',
        portfolioUrl: portfolioUrl || '',
        resumeUrl: resumeFileName || '',
        resumeBase64: resumeBase64 || '',
        coverNote: coverNote || null,
      },
    });

    // 2. Trigger ZeptoMail HR Notification with Attached Resume File
    sendJobApplicationNotification({
      ...application,
      resumeFileName,
      resumeBase64,
    }).catch((err) =>
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

// GET /api/careers/jobs - Fetch active dynamic jobs for website
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    console.error('Error fetching dynamic jobs for website:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch active jobs.',
    });
  }
});

module.exports = router;
