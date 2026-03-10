from __future__ import annotations

from typing import Tuple

from .mortality_model import (
    PersonProfile,
    expected_remaining_life_years,
    Sex,
    HealthStatus,
    SmokingStatus,
)
from .utils import estimate_death_date


def _prompt_float(prompt: str, min_value: float, max_value: float) -> float:
    while True:
        raw = input(prompt + " ").strip()
        try:
            value = float(raw)
        except ValueError:
            print("Please enter a number.")
            continue
        if not (min_value <= value <= max_value):
            print(f"Please enter a value between {min_value} and {max_value}.")
            continue
        return value


def _prompt_choice(prompt: str, options: Tuple[str, ...]) -> str:
    options_str = ", ".join(f"{i+1}) {opt}" for i, opt in enumerate(options))
    while True:
        print(f"{prompt} ({options_str})")
        raw = input("Enter choice number: ").strip()
        try:
            idx = int(raw) - 1
        except ValueError:
            print("Please enter a number corresponding to the options.")
            continue
        if 0 <= idx < len(options):
            return options[idx]
        print("Invalid choice, try again.")


def run_interactive() -> None:
    print("=" * 60)
    print("   Time-to-Death Counter (Makeham-style, purely for fun)")
    print("=" * 60)
    print(
        "This is a toy model based on a very simplified mortality formula.\n"
        "It is NOT medical or actuarial advice and is not accurate.\n"
    )

    age = _prompt_float("Enter your age in years (e.g., 34.5):", 0.0, 100.0)

    sex_choice = _prompt_choice(
        "Select your sex",
        ("male", "female", "other"),
    )  # type: ignore[assignment]
    sex: Sex = sex_choice  # narrow type

    height_cm = _prompt_float("Enter your height in cm (e.g., 178):", 100.0, 220.0)
    weight_kg = _prompt_float("Enter your weight in kg (e.g., 75):", 35.0, 250.0)

    health_choice = _prompt_choice(
        "How would you rate your overall health?",
        ("excellent", "good", "average", "poor"),
    )  # type: ignore[assignment]
    health: HealthStatus = health_choice

    smoking_choice = _prompt_choice(
        "What is your smoking status?",
        ("never", "former", "current"),
    )  # type: ignore[assignment]
    smoking: SmokingStatus = smoking_choice

    profile = PersonProfile(
        age=age,
        sex=sex,
        height_cm=height_cm,
        weight_kg=weight_kg,
        health=health,
        smoking=smoking,
    )

    remaining_years = expected_remaining_life_years(profile)
    if remaining_years <= 0:
        print(
            "\nAccording to this crude model, you've already exceeded the modeled "
            "maximum age. No remaining life expectancy is computed."
        )
        return

    est_death_date = estimate_death_date(remaining_years)

    print("\n--- Result (do not take seriously) ---")
    print(f"Estimated remaining life expectancy: {remaining_years:0.1f} years")
    print(f"Estimated date of death: {est_death_date.isoformat()}")
    print("\nThis is a toy calculation only. Don't use it for real decisions.")

