"""File-based JSON persistence helpers.

Storage strategy: read-modify-write the full JSON file on each mutation.
This is intentionally simple per the assignment; not suitable for high
concurrency, but adequate for an internal tool.
"""

from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_FILE = DATA_DIR / "submissions.json"

# A process-local lock to avoid interleaved writes from concurrent requests
# served by the same uvicorn worker.
_LOCK = threading.Lock()


def _ensure_file() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        DATA_FILE.write_text("[]", encoding="utf-8")


def read_submissions() -> list[dict[str, Any]]:
    """Return all submissions; empty list if file is missing or empty."""
    _ensure_file()
    raw = DATA_FILE.read_text(encoding="utf-8").strip()
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Corrupt file — reset to empty rather than crashing the whole API.
        return []
    return data if isinstance(data, list) else []


def write_submissions(submissions: list[dict[str, Any]]) -> None:
    """Overwrite the JSON file with the given list of submissions."""
    _ensure_file()
    DATA_FILE.write_text(
        json.dumps(submissions, indent=2, default=str, ensure_ascii=False),
        encoding="utf-8",
    )


def add_submission(submission: dict[str, Any]) -> dict[str, Any]:
    """Append a single submission and persist the updated list."""
    with _LOCK:
        items = read_submissions()
        items.append(submission)
        write_submissions(items)
    return submission


def find_submission(submission_id: str) -> dict[str, Any] | None:
    return next((s for s in read_submissions() if s.get("id") == submission_id), None)


def update_submission(submission_id: str, updated: dict[str, Any]) -> dict[str, Any] | None:
    with _LOCK:
        items = read_submissions()
        for idx, item in enumerate(items):
            if item.get("id") == submission_id:
                # Preserve the immutable server-generated fields.
                updated["id"] = item["id"]
                updated["created_at"] = item["created_at"]
                items[idx] = updated
                write_submissions(items)
                return updated
    return None


def delete_submission(submission_id: str) -> bool:
    with _LOCK:
        items = read_submissions()
        new_items = [s for s in items if s.get("id") != submission_id]
        if len(new_items) == len(items):
            return False
        write_submissions(new_items)
        return True
