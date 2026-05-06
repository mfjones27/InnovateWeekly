"""FastAPI app for the Weekly Emerging-Tech Evaluation & Status Check-In tool.

Run locally:
    python -m venv .venv
    .venv\\Scripts\\activate            # Windows PowerShell
    # source .venv/bin/activate        # macOS / Linux
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

Interactive docs at http://localhost:8000/docs
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from schemas import Submission, SubmissionCreate
from storage import (
    add_submission,
    delete_submission,
    find_submission,
    read_submissions,
    update_submission,
)

app = FastAPI(
    title="Weekly Emerging-Tech Check-In API",
    version="1.0.0",
    description="Internal tool for weekly status check-ins and emerging-tech evaluations.",
)

# CORS — allow the local React dev server plus typical deployed origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",  # Vite default, in case the frontend is migrated
    ],
    allow_origin_regex=r"https?://.*\.(vercel|netlify|onrender)\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["health"])
def root() -> dict[str, str]:
    return {"status": "ok", "service": "weekly-checkin-api"}


@app.get("/submissions/", response_model=list[Submission], tags=["submissions"])
def list_submissions() -> list[dict]:
    # Return newest-first so the dashboard reads chronologically.
    items = read_submissions()
    return sorted(items, key=lambda s: s.get("created_at", ""), reverse=True)


@app.post(
    "/submissions/",
    response_model=Submission,
    status_code=status.HTTP_201_CREATED,
    tags=["submissions"],
)
def create_submission(payload: SubmissionCreate) -> dict:
    submission = Submission(
        id=str(uuid4()),
        created_at=datetime.now(timezone.utc),
        **payload.model_dump(),
    )
    # model_dump(mode="json") -> serializes datetime to ISO string for JSON file.
    return add_submission(submission.model_dump(mode="json"))


@app.get("/submissions/{submission_id}", response_model=Submission, tags=["submissions"])
def get_submission(submission_id: str) -> dict:
    item = find_submission(submission_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    return item


@app.put("/submissions/{submission_id}", response_model=Submission, tags=["submissions"])
def replace_submission(submission_id: str, payload: SubmissionCreate) -> dict:
    existing = find_submission(submission_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    merged = {
        **payload.model_dump(),
        "id": existing["id"],
        "created_at": existing["created_at"],
    }
    updated = update_submission(submission_id, merged)
    assert updated is not None  # safe: we just confirmed it exists
    return updated


@app.delete(
    "/submissions/{submission_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["submissions"],
)
def remove_submission(submission_id: str) -> None:
    if not delete_submission(submission_id):
        raise HTTPException(status_code=404, detail="Submission not found")
