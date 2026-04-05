# Resume Telling

An AI-powered career prep tool that tailors resumes, matches skills intelligently, and transforms your experiences into interview-ready behavioral stories.

## What it does

- **Resume Versions** — Upload multiple resume versions (PDF, DOCX, or plain text) and tag them by role type (SWE, FAANG, startup, fintech, ML/AI, etc.)
- **AI Tailoring** — Paste a job description and get tailored resume bullets, a smart skill-fit explanation, and a cover letter draft
- **Experiences** — Maintain a master list of your work experiences that feeds into story generation
- **BQ Prep** — Build a behavioral story bank mapped to STAR format and Amazon Leadership Principles; get coaching on specific interview questions

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | [Jaclang (JAC)](https://docs.jaseci.org) 0.9.0 + jac-cloud 0.2.11 |
| AI | Claude AI (Anthropic) via jac-cloud integration |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS v4 |
| Auth | JWT via jac-cloud built-in auth |

## Project structure

```
jachacks/
├── backend/
│   ├── main.jac          # JAC agent definitions and API walkers
│   ├── resume_utils.py   # PDF/DOCX parsing utilities
│   └── jac.toml          # JAC project config
├── frontend/
│   ├── src/
│   │   ├── pages/        # AuthPage, DashboardPage, ResumePage, ExperiencesPage, BQPage
│   │   ├── components/   # Layout, UploadModal, SaveTailoredModal
│   │   └── api/          # API client (axios)
│   └── package.json
├── start.sh              # Start backend server
└── README.md
```

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 18+
- JAC CLI: `pip install jaclang jac-cloud`

### Backend

```bash
cd backend
jac serve main.jac
```

Or use the helper script from the repo root:

```bash
./start.sh
```

The backend runs on `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Usage

1. Create an account or sign in at the login page
2. Upload one or more resume versions from the Dashboard
3. Open a resume and paste a job description to tailor it with AI
4. Add your work experiences in the Experiences tab
5. Use BQ Prep to build STAR stories and practice behavioral questions

## Built at JacHacks
