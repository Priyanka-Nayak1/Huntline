# Huntline — AI Job Search Agent

Single-user web app that finds, filters, and ranks jobs against your resume, then writes a daily Excel report with application links. **It does not apply to jobs for you.**

```text
frontend (React + Vite)  →  backend (Express)  →  MongoDB
                                 ↓
                    Remotive / Adzuna / Greenhouse / Lever / CSE
                                 ↓
                         AI match + Excel report
```

## What you need

- Node.js 20+
- MongoDB running locally (or a MongoDB URI)
- A Google Gemini API key for resume extraction and job matching
- Optional: Adzuna and/or Google Programmable Search credentials for extra job sources

Without `GEMINI_API_KEY` the agent still searches public sources and scores jobs with a heuristic matcher. It never invents job listings.

## Install

From the repo root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Configure environment

```bash
copy .env.example backend\.env
```

On macOS/Linux:

```bash
cp .env.example backend/.env
```

Minimum working config:

```text
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/job_search_agent
CLIENT_ORIGIN=http://localhost:5173
```

Set `GEMINI_API_KEY` in `backend/.env` for LLM extraction and matching. Change `GEMINI_MODEL` if you want a different Gemini model (default: `gemini-3.6-flash`).

Adzuna, Google CSE, Greenhouse board lists, and Lever site lists are optional. Sources without credentials are skipped; a failing source never stops the whole search.

## Run MongoDB

Local example:

```bash
mongod
```

Or use Docker:

```bash
docker run -d --name job-search-mongo -p 27017:27017 mongo:7
```

## Run the backend

```bash
cd backend
npm run dev
```

API: `http://localhost:4000`

Health check: `http://localhost:4000/api/health`

## Run the frontend

```bash
cd frontend
npm run dev
```

UI: `http://localhost:5173`

Vite proxies `/api` to the backend.

## Run scheduled jobs

1. Open **Preferences**
2. Turn **Daily search on**
3. Set a time (server local time)
4. Save

The backend process must stay running. `node-cron` fires inside the API server; there is no separate worker process in this MVP.

## How to test the flow

1. Start MongoDB, backend, and frontend.
2. Open the app and upload a PDF or DOCX resume.
3. Review/edit the extracted profile.
4. Confirm job titles, skills, locations, experience range, and minimum match score.
5. Click **Run Search Now** on the dashboard. The HTTP request returns immediately; poll the latest run until it completes.
6. Download the Excel report (`Top Jobs`, `Search Summary`, `Excluded Jobs`).
7. Open a job, then **Open Application** — it only opens the original URL in a new tab.

Remotive is the default source that works without extra keys. Greenhouse and Lever query public company boards. LinkedIn/Naukri are not scraped and credentials for those sites are not stored.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Status, enabled sources, AI provider |
| POST | `/api/profile/resume` | Upload PDF/DOCX |
| GET/PUT | `/api/profile` | Read/update profile |
| GET/PUT | `/api/preferences` | Job preferences + scheduler |
| POST | `/api/search/run` | Start a background search |
| GET | `/api/search/runs` | Recent runs |
| GET | `/api/jobs` | Latest ranked jobs |
| GET | `/api/jobs/:id` | Job + match breakdown |
| GET | `/api/reports` | Report list |
| GET | `/api/reports/:id/download` | Excel file |

## Agent limits

To keep cost and runtime bounded, each run caps queries, discovered jobs, AI calls, source timeouts, and total execution time. If fewer than the daily target of suitable jobs are found, the agent searches additional queries/sources until a limit is hit, then ranks whatever it has.

## Project layout

```text
job-search-agent/
├── frontend/          React + Vite + JavaScript + Tailwind
├── backend/           Express + JavaScript + MongoDB
├── .env.example
└── README.md
```
