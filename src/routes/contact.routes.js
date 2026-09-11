const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { sendContactNotification } = require('../utils/zeptomail');

// POST /api/contact - Submit new contact form request
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, service, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, subject, and message are required fields.',
      });
    }

    // 1. Save to Database via Prisma
    const submission = await prisma.contactSubmission.create({
      data: {
        name,
        email,
        subject,
        service: service || 'Full-Stack Web App',
        message,
      },
    });

    // 2. Trigger ZeptoMail Email Notification to HR
    sendContactNotification(submission).catch((err) =>
      console.error('Async ZeptoMail notification error:', err)
    );

    return res.status(201).json({
      success: true,
      message: 'Contact message submitted successfully!',
      data: submission,
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit contact message. Internal server error.',
    });
  }
});

// GET /api/contact - Fetch all contact submissions for Dashboard
router.get('/', async (req, res) => {
  try {
    const submissions = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch contact submissions.',
    });
  }
});

module.exports = router;
