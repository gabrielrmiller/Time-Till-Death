from __future__ import annotations

from datetime import date, timedelta


def estimate_death_date(remaining_years: float) -> date:
    """
    Convert remaining life expectancy in years into an estimated date of death,
    using a simple 365.25 days/year factor.
    """
    today = date.today()
    days = int(remaining_years * 365.25)
    return today + timedelta(days=days)

