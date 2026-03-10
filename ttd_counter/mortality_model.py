from __future__ import annotations

from dataclasses import dataclass
from typing import Literal
import math


Sex = Literal["male", "female", "other"]
HealthStatus = Literal["excellent", "good", "average", "poor"]
SmokingStatus = Literal["never", "former", "current"]


@dataclass
class PersonProfile:
    age: float  # years
    sex: Sex
    height_cm: float
    weight_kg: float
    health: HealthStatus
    smoking: SmokingStatus

    @property
    def bmi(self) -> float:
        h_m = self.height_cm / 100.0
        if h_m <= 0:
            return 0.0
        return self.weight_kg / (h_m * h_m)


@dataclass
class MakehamParameters:
    """
    Parameters for a very simplified Makeham-style force of mortality:

        mu(x) = A + B * c**x

    Units are per-year hazards. These are NOT calibrated to real data and are
    intentionally rough.
    """

    A: float = 0.00027
    B: float = 0.000003
    c: float = 1.124


def base_parameters_for_sex(sex: Sex) -> MakehamParameters:
    """
    Very rough sex-based baseline.
    """
    if sex == "female":
        return MakehamParameters(A=0.00024, B=0.0000027, c=1.124)
    if sex == "male":
        pass
    return MakehamParameters()


def risk_multiplier_for_profile(profile: PersonProfile) -> float:
    """
    Crude risk multiplier based on health, BMI, and smoking.
    """
    multiplier = 1.0

    # Overall self-reported health
    if profile.health == "excellent":
        multiplier *= 0.8
    elif profile.health == "good":
        multiplier *= 0.9
    elif profile.health == "average":
        multiplier *= 1.0
    elif profile.health == "poor":
        multiplier *= 1.3

    # Smoking status
    if profile.smoking == "never":
        multiplier *= 1.0
    elif profile.smoking == "former":
        multiplier *= 1.15
    elif profile.smoking == "current":
        multiplier *= 1.6

    bmi = profile.bmi
    if bmi <= 0:
        pass
    elif bmi < 18.5:  # underweight
        multiplier *= 1.1
    elif 18.5 <= bmi <= 27:  # roughly normal / slightly overweight
        multiplier *= 0.95
    elif 27 < bmi <= 32:
        multiplier *= 1.2
    else:  # > 32 obese
        multiplier *= 1.4

    return multiplier


def makeham_mu(x: float, params: MakehamParameters) -> float:
    """
    Force of mortality at age x.
    """
    return params.A + params.B * (params.c ** x)


def expected_remaining_life_years(
    profile: PersonProfile,
    max_age: int = 110,
    step_years: float = 0.25,
) -> float:
    """
    Numerically approximate the expected remaining lifetime (in years) from
    current age using a Makeham-style hazard.

    We compute:
        E[T] ~ ∫_0^{max_age-age} S(age + t) dt
    with S approximated using small time steps and an exponential survival
    approximation S(t+dt) ~ S(t) * exp(-mu * dt).
    """
    if profile.age >= max_age:
        return 0.0

    params = base_parameters_for_sex(profile.sex)
    risk_mult = risk_multiplier_for_profile(profile)

    age = profile.age
    S = 1.0  # survival at t = 0 (conditioning on being alive now)
    t = 0.0
    e_remaining = 0.0

    while age + t < max_age and S > 1e-6:
        # Hazard at current age
        mu = makeham_mu(age + t, params) * risk_mult
        # Add contribution to expectation over this small interval
        e_remaining += S * step_years
        # Update survival over the step
        S *= math.exp(-mu * step_years)
        t += step_years

    return e_remaining

