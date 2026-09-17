const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'tridin_jwt_super_secret_key_2026';

// Middleware to verify JWT Token
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access Denied: No JWT Token Provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or Expired JWT Token' });
  }
};

// Admin Login - Issues JWT Token
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check credentials (Default: admin / adminpassword123 or from DB)
    if (
      (username === 'admin' || username === 'admin@tridinsoftware.com') &&
      password === 'adminpassword123'
    ) {
      const token = jwt.sign(
        { id: 'default_admin_id', username: 'admin', email: 'admin@tridinsoftware.com', role: 'ADMIN' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          username: 'admin',
          email: 'admin@tridinsoftware.com',
          name: 'Tridin Super Admin',
          role: 'ADMIN',
        },
        token,
      });
    }

    // Check if user exists in DB
    const adminUser = await prisma.adminUser.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    });

    if (adminUser) {
      // Check password (bcrypt or plain)
      const validPassword =
        adminUser.password.startsWith('$2a$') || adminUser.password.startsWith('$2b$')
          ? await bcrypt.compare(password, adminUser.password)
          : adminUser.password === password;

      if (validPassword) {
        const token = jwt.sign(
          { id: adminUser.id, username: adminUser.username, email: adminUser.email, role: 'ADMIN' },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.status(200).json({
          success: true,
          message: 'Login successful',
          user: {
            id: adminUser.id,
            username: adminUser.username,
            email: adminUser.email,
            name: adminUser.name,
            role: 'ADMIN',
          },
          token,
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid Username or Password',
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Verify Current Token Endpoint
router.get('/verify-token', authenticateJWT, (req, res) => {
  res.status(200).json({ success: true, valid: true, user: req.user });
});

// Admin Dashboard Overview Stats
router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    const [totalContacts, newContacts, totalApplications, totalJobs, totalOnboardings, pendingOnboardings] = await Promise.all([
      prisma.contactSubmission.count(),
      prisma.contactSubmission.count({ where: { status: 'NEW' } }),
      prisma.jobApplication.count(),
      prisma.job.count({ where: { isActive: true } }),
      prisma.onboardingCandidate.count(),
      prisma.onboardingCandidate.count({ where: { status: 'Pending' } }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalContacts,
        newContacts,
        totalApplications,
        totalJobs,
        totalOnboardings,
        pendingOnboardings,
      },
    });
  } catch (error) {
    console.error('Fetch Stats Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
});

// --- CONTACT SUBMISSIONS ---

// Get All Contact Submissions (JWT Protected)
router.get('/contacts', authenticateJWT, async (req, res) => {
  try {
    const contacts = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, count: contacts.length, contacts });
  } catch (error) {
    console.error('Fetch Contacts Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch contact submissions' });
  }
});

// Update Contact Submission Status (JWT Protected)
router.patch('/contacts/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await prisma.contactSubmission.update({
      where: { id },
      data: { status },
    });
    res.status(200).json({ success: true, contact: updated });
  } catch (error) {
    console.error('Update Contact Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update contact status' });
  }
});

// Delete Contact Submission (JWT Protected)
router.delete('/contacts/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.contactSubmission.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete Contact Error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete contact' });
  }
});

// --- JOB APPLICATIONS ---

// Get All Job Applications (JWT Protected)
router.get('/applications', authenticateJWT, async (req, res) => {
  try {
    const applications = await prisma.jobApplication.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, count: applications.length, applications });
  } catch (error) {
    console.error('Fetch Applications Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch job applications' });
  }
});

// Update Application Status (JWT Protected)
router.patch('/applications/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await prisma.jobApplication.update({
      where: { id },
      data: { status },
    });
    res.status(200).json({ success: true, application: updated });
  } catch (error) {
    console.error('Update Application Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update application status' });
  }
});

// Delete Job Application (JWT Protected)
router.delete('/applications/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.jobApplication.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete Application Error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete application' });
  }
});

// --- DYNAMIC JOBS MANAGEMENT ---

// Get All Jobs (Admin - JWT Protected)
router.get('/jobs', authenticateJWT, async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    console.error('Fetch Jobs Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch jobs' });
  }
});

// Create Job Posting (JWT Protected)
router.post('/jobs', authenticateJWT, async (req, res) => {
  try {
    const {
      title,
      department,
      location,
      type,
      experience,
      vacancies,
      badge,
      description,
      curriculum,
      requirements,
    } = req.body;

    const newJob = await prisma.job.create({
      data: {
        title,
        department,
        location: location || 'Chennai, India',
        type: type || 'Full-Time',
        experience: experience || '0-3 Years',
        vacancies: parseInt(vacancies) || 10,
        badge: badge || 'Hiring',
        description,
        curriculum: Array.isArray(curriculum) ? curriculum : curriculum ? curriculum.split(',').map(s => s.trim()) : [],
        requirements: Array.isArray(requirements) ? requirements : requirements ? requirements.split(',').map(s => s.trim()) : [],
      },
    });

    res.status(201).json({ success: true, job: newJob });
  } catch (error) {
    console.error('Create Job Error:', error);
    res.status(500).json({ success: false, error: 'Failed to create job posting' });
  }
});

// Update Job Posting (JWT Protected)
router.put('/jobs/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      department,
      location,
      type,
      experience,
      vacancies,
      badge,
      description,
      curriculum,
      requirements,
      isActive,
    } = req.body;

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        title,
        department,
        location,
        type,
        experience,
        vacancies: vacancies ? parseInt(vacancies) : undefined,
        badge,
        description,
        curriculum: Array.isArray(curriculum) ? curriculum : curriculum ? curriculum.split(',').map(s => s.trim()) : undefined,
        requirements: Array.isArray(requirements) ? requirements : requirements ? requirements.split(',').map(s => s.trim()) : undefined,
        isActive,
      },
    });

    res.status(200).json({ success: true, job: updatedJob });
  } catch (error) {
    console.error('Update Job Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update job posting' });
  }
});

// Delete Job Posting (JWT Protected)
router.delete('/jobs/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.job.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete Job Error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete job posting' });
  }
});

module.exports = router;

