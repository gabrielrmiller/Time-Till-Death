/**
 * Makeham-style mortality model (toy). Ported from Python for frontend-only use.
 * Not calibrated to real data; not medical or actuarial advice.
 */

export type Sex = "male" | "female" | "other";
export type HealthStatus = "excellent" | "good" | "average" | "poor";
export type SmokingStatus = "never" | "former" | "current";

export interface PersonProfile {
  age: number;
  sex: Sex;
  height_cm: number;
  weight_kg: number;
  health: HealthStatus;
  smoking: SmokingStatus;
}

interface MakehamParams {
  A: number;
  B: number;
  c: number;
}

function bmi(profile: PersonProfile): number {
  const hM = profile.height_cm / 100;
  if (hM <= 0) return 0;
  return profile.weight_kg / (hM * hM);
}

function baseParamsForSex(sex: Sex): MakehamParams {
  if (sex === "female") {
    return { A: 0.00024, B: 0.0000027, c: 1.124 };
  }
  return { A: 0.00027, B: 0.000003, c: 1.124 };
}

function riskMultiplier(profile: PersonProfile): number {
  let mult = 1.0;

  const baseHealthMult =
    profile.health === "excellent"
      ? 0.8
      : profile.health === "good"
        ? 0.9
        : profile.health === "average"
          ? 1.0
          : 1.3;
  // Progressive system: starting at age 65, increase the health effect
  // slightly every 5 years (65–69, 70–74, ...).
  let ageSteps = 0;
  if (profile.age >= 65) {
    ageSteps = Math.floor((profile.age - 65) / 5) + 1; // 65–69 => 1, 70–74 => 2, etc.
  }
  const healthEffectScale = 1 + 0.1 * ageSteps; // +10% effect per 5-year step
  const healthMult = 1 + (baseHealthMult - 1) * healthEffectScale;
  mult *= healthMult;

  if (profile.smoking === "never") mult *= 1.0;
  else if (profile.smoking === "former") mult *= 1.15;
  else if (profile.smoking === "current") mult *= 1.6;

  const b = bmi(profile);
  if (b <= 0) {
    // no change
  } else if (b < 18.5) mult *= 1.1;
  else if (b <= 27) mult *= 0.95;
  else if (b <= 32) mult *= 1.2;
  else mult *= 1.4;

  return mult;
}

function makehamMu(x: number, params: MakehamParams): number {
  return params.A + params.B * Math.pow(params.c, x);
}

/**
 * Expected remaining life years (numerical integration).
 */
export function expectedRemainingLifeYears(
  profile: PersonProfile,
  maxAge: number = 110,
  stepYears: number = 0.25
): number {
  if (profile.age >= maxAge) return 0;

  const params = baseParamsForSex(profile.sex);
  const riskMult = riskMultiplier(profile);

  let age = profile.age;
  let S = 1.0;
  let t = 0;
  let eRemaining = 0;

  while (age + t < maxAge && S > 1e-6) {
    const mu = makehamMu(age + t, params) * riskMult;
    eRemaining += S * stepYears;
    S *= Math.exp(-mu * stepYears);
    t += stepYears;
  }

  return eRemaining;
}

/**
 * Estimated date of death from remaining years (365.25 days/year).
 */
export function estimateDeathDate(remainingYears: number): string {
  const now = new Date();
  const days = Math.floor(remainingYears * 365.25);
  const d = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

const MAX_AGE = 110;
const STEP_YEARS = 0.25;

/**
 * Survival curve S(t) = P(alive at current age + t | alive at current age).
 * Returns points for plotting: t (years from now), S (probability).
 */
export function getSurvivalCurve(
  profile: PersonProfile,
  maxYears: number = 60
): { t: number; S: number }[] {
  if (profile.age >= MAX_AGE) return [{ t: 0, S: 1 }, { t: maxYears, S: 0 }];

  const params = baseParamsForSex(profile.sex);
  const riskMult = riskMultiplier(profile);

  const points: { t: number; S: number }[] = [{ t: 0, S: 1 }];
  let age = profile.age;
  let S = 1.0;
  let t = STEP_YEARS;

  while (t <= maxYears && age + t < MAX_AGE && S > 1e-6) {
    const mu = makehamMu(age + t, params) * riskMult;
    S *= Math.exp(-mu * STEP_YEARS);
    points.push({ t, S });
    t += STEP_YEARS;
  }

  return points;
}
