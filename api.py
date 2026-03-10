from __future__ import annotations

from datetime import date
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ttd_counter.mortality_model import (
    PersonProfile,
    Sex,
    HealthStatus,
    SmokingStatus,
    expected_remaining_life_years,
)
from ttd_counter.utils import estimate_death_date


class PersonProfileRequest(BaseModel):
    age: float = Field(ge=0.0, le=120.0)
    sex: Sex
    height_cm: float = Field(ge=80.0, le=250.0)
    weight_kg: float = Field(ge=20.0, le=300.0)
    health: HealthStatus
    smoking: SmokingStatus


class EstimateResponse(BaseModel):
    remaining_years: float
    death_date: date | None
    message: str


app = FastAPI(
    title="Time Till Death API",
    description=(
        "Toy Makeham-style mortality model. "
        "Not medical or actuarial advice; purely for fun."
    ),
)


@app.get("/")
def read_root() -> dict[str, str]:
    return {
        "message": "Time Till Death API is running. Use POST /api/estimate for calculations."
    }


# Allow local frontend during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/estimate", response_model=EstimateResponse)
def estimate(profile_req: PersonProfileRequest) -> EstimateResponse:
    profile = PersonProfile(
        age=profile_req.age,
        sex=profile_req.sex,
        height_cm=profile_req.height_cm,
        weight_kg=profile_req.weight_kg,
        health=profile_req.health,
        smoking=profile_req.smoking,
    )

    remaining_years = expected_remaining_life_years(profile)

    if remaining_years <= 0:
        return EstimateResponse(
            remaining_years=0.0,
            death_date=None,
            message=(
                "According to this crude model, you've already exceeded the modeled "
                "maximum age. No remaining life expectancy is computed."
            ),
        )

    death_date = estimate_death_date(remaining_years)

    return EstimateResponse(
        remaining_years=round(remaining_years, 1),
        death_date=death_date,
        message=(
            "This is a toy calculation only and not medical or actuarial advice. "
            "Do not use it for real decisions."
        ),
    )

