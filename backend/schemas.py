"""Pydantic models for the Weekly Check-In application."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, field_validator


RatingType = Annotated[int, Field(ge=1, le=5, description="Rating from 1 (poor) to 5 (excellent)")]


class ToolEvaluatedBase(BaseModel):
    tool_name: str = Field(..., min_length=1, max_length=200)
    tool_description: str = Field(..., min_length=1)
    tool_link: str | None = Field(default=None, max_length=2000)
    tool_rating: RatingType

    @field_validator("tool_link", mode="before")
    @classmethod
    def _empty_string_to_none(cls, value: str | None) -> str | None:
        # Free-form link field: accept any non-empty string, normalize blanks to None.
        if value is None:
            return None
        value = value.strip()
        return value or None


class SubmissionCreate(BaseModel):
    """Payload accepted from the client when creating a new check-in."""

    employee_name: str = Field(..., min_length=1, max_length=120)
    team_or_department: str = Field(..., min_length=1, max_length=120)
    week_of: str | None = Field(default=None, description="Optional ISO date for the week, e.g. 2026-05-04")
    weekly_accomplishments: str = Field(..., min_length=1)
    goals_next_week: str = Field(..., min_length=1)
    challenges_blockers: str = Field(default="")
    tools_evaluated: list[ToolEvaluatedBase] = Field(default_factory=list)


class Submission(SubmissionCreate):
    """Stored / returned model — adds server-generated id and timestamp."""

    id: str
    created_at: datetime
