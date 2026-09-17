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

// Seed Initial Default Jobs (JWT Protected or Admin Trigger)
router.post('/seed-jobs', authenticateJWT, async (req, res) => {
  try {
    const INITIAL_JOBS = [
      {
        title: 'Gen AI / ML Engineer',
        department: 'AI & Data',
        location: 'Chennai, India',
        type: 'Full-Time',
        experience: '0-3 Years',
        vacancies: 25,
        badge: 'Hot Role',
        curriculum: ['LangChain & LlamaIndex', 'RAG Pipelines & Embeddings', 'Pinecone / ChromaDB / FAISS', 'OpenAI / Claude / Gemini APIs', 'Multi-Agent System Design'],
        description: 'Architect and build agentic AI workflows, Generative AI models, vector retrieval systems, and production RAG pipelines for enterprise applications.',
        requirements: ['Proficiency in Python programming and AI/ML concepts', 'Strong understanding of Generative AI, Prompt Engineering, and RAG architectures', 'Experience with vector databases and LLM orchestration frameworks', 'Bachelor degree in CS, IT, Data Science, or related engineering discipline'],
      },
      {
        title: 'Python Developer',
        department: 'Development',
        location: 'Chennai, India',
        type: 'Full-Time',
        experience: '0-3 Years',
        vacancies: 20,
        badge: 'Hiring',
        curriculum: ['Python 3.12+', 'FastAPI & AsyncIO', 'Django / Flask Frameworks', 'RESTful APIs & Microservices', 'PostgreSQL & Redis Caching'],
        description: 'Design high-performance Python microservices, REST APIs, automated data processing pipelines, and scalable backend infrastructure.',
        requirements: ['Solid foundational knowledge of Python, Object-Oriented Programming, and REST APIs', 'Experience with FastAPI, Flask, or Django web frameworks', 'Familiarity with SQL databases, JSON parsing, Git, and Docker basics'],
      },
      {
        title: 'Java Developer',
        department: 'Development',
        location: 'Chennai, India',
        type: 'Full-Time',
        experience: '0-3 Years',
        vacancies: 20,
        badge: 'Hiring',
        curriculum: ['Java 17 / 21', 'Spring Boot 3 & Spring Cloud', 'REST Microservices Architecture', 'Hibernate / JPA & PostgreSQL', 'Kafka & Redis Messaging'],
        description: 'Develop robust, enterprise-grade backend services and microservices using Java and Spring Boot for high-throughput client platforms.',
        requirements: ['Strong core Java (OOPs, Collections, Multithreading, Streams) and Spring Boot expertise', 'Experience designing REST APIs and working with relational databases (MySQL/PostgreSQL)', 'Understanding of microservices design patterns, Maven/Gradle, and Git version control'],
      },
      {
        title: 'PLSQL Developer',
        department: 'Database',
        location: 'Chennai, India',
        type: 'Full-Time',
        experience: '0-3 Years',
        vacancies: 15,
        badge: 'Hiring',
        curriculum: ['Oracle PL/SQL Programming', 'Stored Procedures & Functions', 'Query Performance Tuning', 'Triggers, Packages & Views', 'Database Schema Design'],
        description: 'Architect, optimize, and maintain complex Oracle PL/SQL database packages, stored procedures, triggers, and high-performance relational database logic.',
        requirements: ['Deep understanding of Oracle SQL, PL/SQL blocks, cursors, collections, and exception handling', 'Proven skills in query execution plan analysis, index optimization, and performance tuning', 'Experience with database migrations, data modeling, and ETL procedures'],
      },
      {
        title: 'Network Engineer',
        department: 'Infrastructure & Testing',
        location: 'Chennai, India',
        type: 'Full-Time',
        experience: '0-3 Years',
        vacancies: 15,
        badge: 'Hiring',
        curriculum: ['Cisco CCNA / CCNP Concepts', 'TCP/IP, Switching & Routing (OSPF/BGP)', 'Firewall & VPN Configuration', 'Network Monitoring & Troubleshooting', 'LAN / WAN / Cloud Networking'],
        description: 'Design, configure, and maintain enterprise network infrastructure, switches, routers, firewalls, and VPN tunnels ensuring 99.99% network uptime.',
        requirements: ['Strong grasp of OSI model, TCP/IP networking, subnetting, VLANs, and routing protocols', 'Hands-on experience or certification in Cisco routers/switches or Fortinet/Palo Alto firewalls', 'Proactive network troubleshooting skills and ability to manage network security policies'],
      },
      {
        title: 'Software Testing (QA Engineer)',
        department: 'Infrastructure & Testing',
        location: 'Chennai, India',
        type: 'Full-Time',
        experience: '0-3 Years',
        vacancies: 20,
        badge: 'Hiring',
        curriculum: ['Manual & Automation Testing', 'Selenium / Playwright Automation', 'API Testing (Postman & REST Assured)', 'Test Case Design & Execution', 'Jira & Bug Life Cycle Management'],
        description: 'Perform end-to-end web, API, and mobile software quality assurance, automated test script creation, and defect management to guarantee high product quality.',
        requirements: ['Strong knowledge of Software Development Life Cycle (SDLC) and Software Testing Life Cycle (STLC)', 'Proficiency in manual test execution, test case drafting, and bug reporting in Jira', 'Experience or willingness to write automated test scripts in Selenium, Cypress, or Playwright'],
      },
      {
        title: 'DevOps Engineer',
        department: 'Infrastructure & Testing',
        location: 'Chennai, India',
        type: 'Full-Time',
        experience: '0-3 Years',
        vacancies: 15,
        badge: 'Hiring',
        curriculum: ['Docker & Kubernetes', 'CI/CD (GitHub Actions / Jenkins)', 'AWS / GCP Cloud Architecture', 'Infrastructure as Code (Terraform)', 'Linux Admin & Nginx Reverse Proxy'],
        description: 'Build and manage automated cloud deployment pipelines, container orchestration, infrastructure-as-code, and server management for zero-downtime releases.',
        requirements: ['Strong Linux administration, shell scripting, and Git workflow knowledge', 'Hands-on experience with Docker containerization and CI/CD automation', 'Understanding of cloud providers (AWS, Azure, or GCP) and Nginx/Apache web server config'],
      },
      {
        title: 'Cybersecurity Engineer',
        department: 'Infrastructure & Testing',
        location: 'Chennai, India',
        type: 'Full-Time',
        experience: '0-3 Years',
        vacancies: 12,
        badge: 'Hiring',
        curriculum: ['Vulnerability Assessment (VAPT)', 'OWASP Top 10 Web Security', 'SIEM & Log Security Analysis', 'Network Penetration Testing', 'Identity & Access Management (IAM)'],
        description: 'Implement robust cybersecurity defense mechanisms, conduct vulnerability scans, analyze security threats, and safeguard enterprise infrastructure.',
        requirements: ['Knowledge of cybersecurity protocols, encryption, ethical hacking concepts, and OWASP Top 10 vulnerabilities', 'Familiarity with security tools such as Wireshark, Burp Suite, Nmap, and SIEM platforms', 'Degree in Computer Science, Cybersecurity, or relevant certifications (CEH, Security+)'],
      },
      {
        title: 'Data Analyst',
        department: 'AI & Data',
        location: 'Chennai, India',
        type: 'Full-Time',
        experience: '0-3 Years',
        vacancies: 18,
        badge: 'Hiring',
        curriculum: ['SQL & Complex Data Queries', 'Power BI / Tableau Dashboards', 'Python Data Libraries (Pandas/NumPy)', 'Data Visualization & Insights', 'Excel Advanced Modeling'],
        description: 'Analyze enterprise business datasets, construct interactive dashboards, identify market trends, and deliver data-driven insights to executive stakeholders.',
        requirements: ['Strong SQL skills for querying, joining, aggregating, and filtering relational databases', 'Proficiency in building dashboards using Power BI, Tableau, or Metabase', 'Solid analytical mindset with hands-on Python data manipulation skills'],
      },
      {
        title: 'UI/UX Designer',
        department: 'Design',
        location: 'Chennai, India',
        type: 'Full-Time',
        experience: '0-3 Years',
        vacancies: 15,
        badge: 'Hiring',
        curriculum: ['Figma & Adobe XD Prototyping', 'User Research & Wireframing', 'Design Systems & UI Components', 'Responsive Web & Mobile Layouts', 'Usability Testing & Micro-Interactions'],
        description: 'Craft intuitive, aesthetic, and human-centric user experiences, high-fidelity prototypes, and cohesive design systems for enterprise software.',
        requirements: ['Proficiency in Figma, wireframing, component-driven design, and interactive prototyping', 'Solid understanding of user research methodologies, typography, color theory, and accessibility (WCAG)', 'Portfolio demonstrating strong UI/UX design process and problem-solving skills'],
      },
    ];

    const createdJobs = [];
    for (const jobData of INITIAL_JOBS) {
      const existing = await prisma.job.findFirst({
        where: { title: jobData.title },
      });
      if (!existing) {
        const newJ = await prisma.job.create({ data: jobData });
        createdJobs.push(newJ);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully seeded ${createdJobs.length} jobs into database!`,
      jobs: createdJobs,
    });
  } catch (error) {
    console.error('Seed Jobs Error:', error);
    res.status(500).json({ success: false, error: 'Failed to seed jobs' });
  }
});

module.exports = router;
