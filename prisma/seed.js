const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INITIAL_JOBS = [
  {
    title: 'Gen AI / ML Engineer',
    department: 'AI & Data',
    location: 'Chennai, India',
    type: 'Full-Time',
    experience: '0-3 Years',
    vacancies: 25,
    badge: 'Hot Role',
    curriculum: [
      'LangChain & LlamaIndex',
      'RAG Pipelines & Embeddings',
      'Pinecone / ChromaDB / FAISS',
      'OpenAI / Claude / Gemini APIs',
      'Multi-Agent System Design',
    ],
    description:
      'Architect and build agentic AI workflows, Generative AI models, vector retrieval systems, and production RAG pipelines for enterprise applications.',
    requirements: [
      'Proficiency in Python programming and AI/ML concepts',
      'Strong understanding of Generative AI, Prompt Engineering, and RAG architectures',
      'Experience with vector databases and LLM orchestration frameworks',
      'Bachelor degree in CS, IT, Data Science, or related engineering discipline',
    ],
  },
  {
    title: 'Python Developer',
    department: 'Development',
    location: 'Chennai, India',
    type: 'Full-Time',
    experience: '0-3 Years',
    vacancies: 20,
    badge: 'Hiring',
    curriculum: [
      'Python 3.12+',
      'FastAPI & AsyncIO',
      'Django / Flask Frameworks',
      'RESTful APIs & Microservices',
      'PostgreSQL & Redis Caching',
    ],
    description:
      'Design high-performance Python microservices, REST APIs, automated data processing pipelines, and scalable backend infrastructure.',
    requirements: [
      'Solid foundational knowledge of Python, Object-Oriented Programming, and REST APIs',
      'Experience with FastAPI, Flask, or Django web frameworks',
      'Familiarity with SQL databases, JSON parsing, Git, and Docker basics',
    ],
  },
  {
    title: 'Java Developer',
    department: 'Development',
    location: 'Chennai, India',
    type: 'Full-Time',
    experience: '0-3 Years',
    vacancies: 20,
    badge: 'Hiring',
    curriculum: [
      'Java 17 / 21',
      'Spring Boot 3 & Spring Cloud',
      'REST Microservices Architecture',
      'Hibernate / JPA & PostgreSQL',
      'Kafka & Redis Messaging',
    ],
    description:
      'Develop robust, enterprise-grade backend services and microservices using Java and Spring Boot for high-throughput client platforms.',
    requirements: [
      'Strong core Java (OOPs, Collections, Multithreading, Streams) and Spring Boot expertise',
      'Experience designing REST APIs and working with relational databases (MySQL/PostgreSQL)',
      'Understanding of microservices design patterns, Maven/Gradle, and Git version control',
    ],
  },
  {
    title: 'PLSQL Developer',
    department: 'Database',
    location: 'Chennai, India',
    type: 'Full-Time',
    experience: '0-3 Years',
    vacancies: 15,
    badge: 'Hiring',
    curriculum: [
      'Oracle PL/SQL Programming',
      'Stored Procedures & Functions',
      'Query Performance Tuning',
      'Triggers, Packages & Views',
      'Database Schema Design',
    ],
    description:
      'Architect, optimize, and maintain complex Oracle PL/SQL database packages, stored procedures, triggers, and high-performance relational database logic.',
    requirements: [
      'Deep understanding of Oracle SQL, PL/SQL blocks, cursors, collections, and exception handling',
      'Proven skills in query execution plan analysis, index optimization, and performance tuning',
      'Experience with database migrations, data modeling, and ETL procedures',
    ],
  },
  {
    title: 'Network Engineer',
    department: 'Infrastructure & Testing',
    location: 'Chennai, India',
    type: 'Full-Time',
    experience: '0-3 Years',
    vacancies: 15,
    badge: 'Hiring',
    curriculum: [
      'Cisco CCNA / CCNP Concepts',
      'TCP/IP, Switching & Routing (OSPF/BGP)',
      'Firewall & VPN Configuration',
      'Network Monitoring & Troubleshooting',
      'LAN / WAN / Cloud Networking',
    ],
    description:
      'Design, configure, and maintain enterprise network infrastructure, switches, routers, firewalls, and VPN tunnels ensuring 99.99% network uptime.',
    requirements: [
      'Strong grasp of OSI model, TCP/IP networking, subnetting, VLANs, and routing protocols',
      'Hands-on experience or certification in Cisco routers/switches or Fortinet/Palo Alto firewalls',
      'Proactive network troubleshooting skills and ability to manage network security policies',
    ],
  },
  {
    title: 'Software Testing (QA Engineer)',
    department: 'Infrastructure & Testing',
    location: 'Chennai, India',
    type: 'Full-Time',
    experience: '0-3 Years',
    vacancies: 20,
    badge: 'Hiring',
    curriculum: [
      'Manual & Automation Testing',
      'Selenium / Playwright Automation',
      'API Testing (Postman & REST Assured)',
      'Test Case Design & Execution',
      'Jira & Bug Life Cycle Management',
    ],
    description:
      'Perform end-to-end web, API, and mobile software quality assurance, automated test script creation, and defect management to guarantee high product quality.',
    requirements: [
      'Strong knowledge of Software Development Life Cycle (SDLC) and Software Testing Life Cycle (STLC)',
      'Proficiency in manual test execution, test case drafting, and bug reporting in Jira',
      'Experience or willingness to write automated test scripts in Selenium, Cypress, or Playwright',
    ],
  },
  {
    title: 'DevOps Engineer',
    department: 'Infrastructure & Testing',
    location: 'Chennai, India',
    type: 'Full-Time',
    experience: '0-3 Years',
    vacancies: 15,
    badge: 'Hiring',
    curriculum: [
      'Docker & Kubernetes',
      'CI/CD (GitHub Actions / Jenkins)',
      'AWS / GCP Cloud Architecture',
      'Infrastructure as Code (Terraform)',
      'Linux Admin & Nginx Reverse Proxy',
    ],
    description:
      'Build and manage automated cloud deployment pipelines, container orchestration, infrastructure-as-code, and server management for zero-downtime releases.',
    requirements: [
      'Strong Linux administration, shell scripting, and Git workflow knowledge',
      'Hands-on experience with Docker containerization and CI/CD automation',
      'Understanding of cloud providers (AWS, Azure, or GCP) and Nginx/Apache web server config',
    ],
  },
  {
    title: 'Cybersecurity Engineer',
    department: 'Infrastructure & Testing',
    location: 'Chennai, India',
    type: 'Full-Time',
    experience: '0-3 Years',
    vacancies: 12,
    badge: 'Hiring',
    curriculum: [
      'Vulnerability Assessment (VAPT)',
      'OWASP Top 10 Web Security',
      'SIEM & Log Security Analysis',
      'Network Penetration Testing',
      'Identity & Access Management (IAM)',
    ],
    description:
      'Implement robust cybersecurity defense mechanisms, conduct vulnerability scans, analyze security threats, and safeguard enterprise infrastructure.',
    requirements: [
      'Knowledge of cybersecurity protocols, encryption, ethical hacking concepts, and OWASP Top 10 vulnerabilities',
      'Familiarity with security tools such as Wireshark, Burp Suite, Nmap, and SIEM platforms',
      'Degree in Computer Science, Cybersecurity, or relevant certifications (CEH, Security+)',
    ],
  },
  {
    title: 'Data Analyst',
    department: 'AI & Data',
    location: 'Chennai, India',
    type: 'Full-Time',
    experience: '0-3 Years',
    vacancies: 18,
    badge: 'Hiring',
    curriculum: [
      'SQL & Complex Data Queries',
      'Power BI / Tableau Dashboards',
      'Python Data Libraries (Pandas/NumPy)',
      'Data Visualization & Insights',
      'Excel Advanced Modeling',
    ],
    description:
      'Analyze enterprise business datasets, construct interactive dashboards, identify market trends, and deliver data-driven insights to executive stakeholders.',
    requirements: [
      'Strong SQL skills for querying, joining, aggregating, and filtering relational databases',
      'Proficiency in building dashboards using Power BI, Tableau, or Metabase',
      'Solid analytical mindset with hands-on Python data manipulation skills',
    ],
  },
  {
    title: 'UI/UX Designer',
    department: 'Design',
    location: 'Chennai, India',
    type: 'Full-Time',
    experience: '0-3 Years',
    vacancies: 15,
    badge: 'Hiring',
    curriculum: [
      'Figma & Adobe XD Prototyping',
      'User Research & Wireframing',
      'Design Systems & UI Components',
      'Responsive Web & Mobile Layouts',
      'Usability Testing & Micro-Interactions',
    ],
    description:
      'Craft intuitive, aesthetic, and human-centric user experiences, high-fidelity prototypes, and cohesive design systems for enterprise software.',
    requirements: [
      'Proficiency in Figma, wireframing, component-driven design, and interactive prototyping',
      'Solid understanding of user research methodologies, typography, color theory, and accessibility (WCAG)',
      'Portfolio demonstrating strong UI/UX design process and problem-solving skills',
    ],
  },
];

async function main() {
  console.log('🌱 Seeding 10 default dynamic jobs into PostgreSQL...');
  for (const jobData of INITIAL_JOBS) {
    const existing = await prisma.job.findFirst({
      where: { title: jobData.title },
    });
    if (!existing) {
      await prisma.job.create({ data: jobData });
      console.log(`✅ Created job: ${jobData.title}`);
    } else {
      console.log(`ℹ️ Job already exists: ${jobData.title}`);
    }
  }
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
