# Tridin Backend Server (Node.js + Express + Prisma + ZeptoMail)

Production-ready backend API service for **Tridin Software Private Limited**.

---

## 🛠️ Tech Stack & Features

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **ORM & Database**: Prisma ORM with PostgreSQL (or Supabase / Neon / CockroachDB)
- **Transactional Email**: ZeptoMail REST API (`https://api.zeptomail.com/v1.1/email`)
- **Cors & Middleware**: Enables secure cross-origin requests from React Frontend (`http://localhost:5173`)

---

## 📁 Directory Structure

```
d:\tridin-backend/
├── prisma/
│   └── schema.prisma       # Prisma Models (ContactSubmission, JobApplication)
├── src/
│   ├── config/
│   │   └── prisma.js       # Shared Prisma Client Instance
│   ├── routes/
│   │   ├── contact.routes.js # POST /api/contact, GET /api/contact
│   │   └── career.routes.js  # POST /api/careers/apply, GET /api/careers/applications
│   ├── utils/
│   │   └── zeptomail.js    # ZeptoMail API Helper Functions
│   └── index.js            # Express App Entrypoint
├── .env                    # Environment Config (API Keys & DB URL)
├── .env.example            # Environment Config Template
├── package.json
└── README.md
```

---

## ⚡ Quick Start Instructions

### 1. Install Dependencies
```bash
cd D:\tridin-backend
npm install
```

### 2. Configure Environment Variables
Edit `.env` file and set your ZeptoMail API Key and Database connection string:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/tridindb?schema=public"

ZEPTOMAIL_API_KEY="Zoho-encz-YOUR_ZEPTOMAIL_SENDMAIL_TOKEN"
ZEPTOMAIL_FROM_EMAIL="career@tridinsoftware.com"
ZEPTOMAIL_FROM_NAME="Tridin Software HR"
HR_NOTIFICATION_EMAIL="career@tridinsoftware.com"
```

### 3. Run Prisma Database Migrations
```bash
npx prisma migrate dev --name init
```

### 4. Start Development Server
```bash
npm run dev
```
Server runs on **http://localhost:5000**

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description | Payload Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Server status health check | N/A |
| `POST` | `/api/contact` | Submit contact form request | `{ name, email, subject, service, message }` |
| `GET` | `/api/contact` | Fetch all contact submissions | N/A (For Admin Dashboard) |
| `POST` | `/api/careers/apply` | Submit job application | `{ roleTitle, department, applicantName, applicantEmail, applicantPhone, portfolioUrl, coverNote }` |
| `GET` | `/api/careers/applications` | Fetch all job applications | N/A (For HR Dashboard) |

---

## 🔍 Database Visualizer (Prisma Studio)
To view and manage stored candidates & contact messages visually:
```bash
npm run prisma:studio
```
Opens visual database GUI at **http://localhost:5555**
