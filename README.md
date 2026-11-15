# InnovateWeekly — Weekly Emerging-Tech Evaluation & Status Check-In

A small internal full-stack web app for employees to submit weekly status check-ins and log AI tools / emerging tech they evaluated.

- **Backend:** Python + FastAPI, file-based JSON persistence (`backend/data/submissions.json`)
- **Frontend:** React (CRA, JavaScript), plain CSS, fetch-based API client, browser-side CSV export

```
InnovateWeekly/
├── backend/
│   ├── main.py              # FastAPI app + routes + CORS
│   ├── schemas.py           # Pydantic models
│   ├── storage.py           # JSON read/write helpers
│   ├── requirements.txt
│   └── data/submissions.json
└── frontend/
    ├── package.json
    ├── public/index.html
    └── src/
        ├── index.js
        ├── App.jsx
        ├── api.js
        ├── csv.js
        ├── config.js
        ├── styles.css
        └── components/
            ├── Header.jsx
            ├── SubmissionForm.jsx
            └── SubmissionsTable.jsx
```

## Backend — run locally

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

### Endpoints

| Method | Path                       | Purpose                          |
| ------ | -------------------------- | -------------------------------- |
| GET    | `/submissions/`            | List all submissions (newest first) |
| POST   | `/submissions/`            | Create a new weekly check-in     |
| GET    | `/submissions/{id}`        | Fetch a single submission        |
| PUT    | `/submissions/{id}`        | Replace a submission             |
| DELETE | `/submissions/{id}`        | Delete a submission              |

## Frontend — run locally

```powershell
cd frontend
npm install
npm start
```

The frontend is built with [Vite](https://vite.dev). The dev server runs at http://localhost:3000 and calls the FastAPI service at http://localhost:8000 (allowed by the backend's CORS config).

To override the API base URL (e.g. in production), set this at build time:

```
VITE_API_BASE_URL=https://your-api.example.com
```

## CSV export

The "Export CSV" button on the dashboard generates a CSV from the **currently filtered** submissions client-side and triggers a browser download — no backend route needed. Tools are flattened into a single column as `Name (rating★) <link> | …`.

## Deployment notes (free options)

- **Backend:** Render or Railway — point to `backend/` with start command `uvicorn main:app --host 0.0.0.0 --port $PORT`. Mount a persistent disk so `data/submissions.json` survives restarts.
- **Frontend:** Netlify or Vercel — build command `npm run build`, publish `build/`. Set `VITE_API_BASE_URL` to the deployed backend URL.
- On the backend, set `FRONTEND_ORIGINS` to your deployed frontend's exact origin (comma-separated if more than one), e.g. `FRONTEND_ORIGINS=https://innovate-weekly.vercel.app`. Only those origins, plus localhost for development, are allowed by CORS.
