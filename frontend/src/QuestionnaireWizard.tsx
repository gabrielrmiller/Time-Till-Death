import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  expectedRemainingLifeYears,
  estimateDeathDate,
  type Sex,
  type HealthStatus,
  type SmokingStatus,
} from "./mortalityModel";
import { SurvivalChart } from "./SurvivalChart";

export type { Sex, HealthStatus, SmokingStatus };

type HeightUnit = "cm" | "ft";
type WeightUnit = "kg" | "lb";

type ProfileFromResult = {
  age: number;
  sex: Sex;
  height_cm: number;
  weight_kg: number;
  health: HealthStatus;
  smoking: SmokingStatus;
  birthdate?: string;
};

export interface ProfileFormState {
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  sex: Sex | "";
  height_cm: string;
  weight_kg: string;
  heightUnit: HeightUnit;
  height_feet: string;
  height_inches: string;
  weightUnit: WeightUnit;
  health: HealthStatus | "";
  smoking: SmokingStatus | "";
}

export interface EstimateResult {
  remaining_years: number;
  death_date: string | null;
  message: string;
}

export const QuestionnaireWizard: React.FC = () => {
  const [form, setForm] = useState<ProfileFormState>({
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    sex: "",
    height_cm: "",
    weight_kg: "",
    heightUnit: "ft",
    height_feet: "",
    height_inches: "",
    weightUnit: "lb",
    health: "",
    smoking: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state || {}) as { profile?: ProfileFromResult };
  const incomingProfile = locationState.profile;
  const [initializedFromProfile, setInitializedFromProfile] = useState(false);

  useEffect(() => {
    if (!incomingProfile || initializedFromProfile) {
      return;
    }
    const birthdate = incomingProfile.birthdate;
    const [y, m, d] = birthdate ? birthdate.split("-") : ["", "", ""];
    const totalInches = incomingProfile.height_cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    const pounds = Math.round(incomingProfile.weight_kg * 2.20462);
    setForm((prev) => ({
      ...prev,
      birthYear: y || "",
      birthMonth: m || "",
      birthDay: d || "",
      sex: incomingProfile.sex,
      heightUnit: "ft",
      height_cm: "",
      height_feet: feet ? String(feet) : "",
      height_inches: inches ? String(inches) : "",
      weightUnit: "lb",
      weight_kg: pounds ? String(pounds) : "",
      health: incomingProfile.health,
      smoking: incomingProfile.smoking,
    }));
    setInitializedFromProfile(true);
  }, [incomingProfile, initializedFromProfile]);

  const updateField = (field: keyof ProfileFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const toCentimeters = (): number => {
    if (form.heightUnit === "cm") {
      return Number(form.height_cm);
    }
    const feet = Number(form.height_feet || "0");
    const inches = Number(form.height_inches || "0");
    const totalInches = feet * 12 + inches;
    return totalInches * 2.54;
  };

  const toKilograms = (): number => {
    if (form.weightUnit === "kg") {
      return Number(form.weight_kg);
    }
    const pounds = Number(form.weight_kg || "0");
    return pounds / 2.20462;
  };

  const ageFromBirthdate = (birthdate: string): number | null => {
    if (!birthdate) return null;
    const dob = new Date(birthdate);
    if (Number.isNaN(dob.getTime())) return null;
    const now = new Date();
    const diffMs = now.getTime() - dob.getTime();
    if (diffMs < 0) return null;
    const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    return years;
  };

  // Base-12 style age preview: years.M where M is the month index (0–11)
  // within the current age year (0 = just after birthday, 11 = one month before next).
  // A would-be ".12" rolls over to the next age as ".0".
  const agePreviewBase12 = (birthdate: string): string | null => {
    const exactYears = ageFromBirthdate(birthdate);
    if (exactYears === null || exactYears < 0 || exactYears > 120) return null;

    const wholeYears = Math.floor(exactYears);
    let frac = exactYears - wholeYears;
    if (frac < 0) frac = 0;

    let displayYears = wholeYears;
    let monthIndex = Math.floor(frac * 12 + 1e-6); // 0–11 normally

    if (monthIndex >= 12) {
      // Edge case: roll over to next age at ".0"
      displayYears += 1;
      if (displayYears > 120) return null;
      monthIndex = 0;
    }

    return `${displayYears}.${monthIndex}`;
  };

  const currentYear = new Date().getFullYear();

  const buildBirthdate = (): string => {
    if (!form.birthYear || !form.birthMonth || !form.birthDay) {
      return "";
    }
    // Prevent partial years like "11" from being parsed as a valid date.
    if (form.birthYear.length !== 4) {
      return "";
    }
    return `${form.birthYear}-${form.birthMonth}-${form.birthDay}`;
  };

  const handleBirthYearChange = (value: string) => updateField("birthYear", value);
  const handleBirthMonthChange = (value: string) => updateField("birthMonth", value);
  const handleBirthDayChange = (value: string) => updateField("birthDay", value);

  /** Build profile from form for graph; null if form incomplete or invalid. */
  const profileForGraph = (): {
    age: number;
    sex: Sex;
    height_cm: number;
    weight_kg: number;
    health: HealthStatus;
    smoking: SmokingStatus;
  } | null => {
    const birthdate = buildBirthdate();
    const ageYears = ageFromBirthdate(birthdate);
    if (!birthdate || ageYears === null || ageYears < 0 || ageYears > 120) return null;
    if (!form.sex || !form.health || !form.smoking) return null;
    const h = toCentimeters();
    const w = toKilograms();
    if (h < 80 || h > 250 || w < 20 || w > 300) return null;
    return {
      age: ageYears,
      sex: form.sex as Sex,
      height_cm: h,
      weight_kg: w,
      health: form.health as HealthStatus,
      smoking: form.smoking as SmokingStatus,
    };
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};

    const birthdate = buildBirthdate();
    const ageYears = ageFromBirthdate(birthdate);
    if (!birthdate) {
      newErrors.birthdate = "Date of birth is required.";
    } else if (ageYears === null) {
      newErrors.birthdate = "Please enter a valid date of birth.";
    } else if (ageYears < 0 || ageYears > 120) {
      newErrors.birthdate = "Age must be between 0 and 120 years.";
    }
    if (!form.sex) newErrors.sex = "Please select a sex.";

    if (form.heightUnit === "cm") {
      const height = Number(form.height_cm);
      if (!form.height_cm) newErrors.height_cm = "Height is required.";
      else if (Number.isNaN(height)) newErrors.height_cm = "Height must be a number.";
      else if (height < 80 || height > 250) newErrors.height_cm = "Height must be between 80 and 250 cm.";
    } else {
      const feet = Number(form.height_feet);
      const inches = Number(form.height_inches || "0");
      if (!form.height_feet && !form.height_inches) newErrors.height_feet = "Height is required.";
      else if (Number.isNaN(feet) || Number.isNaN(inches)) newErrors.height_feet = "Height must be numeric feet and inches.";
      else if (inches < 0 || inches >= 12) newErrors.height_inches = "Inches must be between 0 and 11.";
      else {
        const totalInches = feet * 12 + inches;
        if (totalInches < 36 || totalInches > 96) newErrors.height_feet = "Height must be between about 3 and 8 feet.";
      }
    }

    if (form.weightUnit === "kg") {
      const weight = Number(form.weight_kg);
      if (!form.weight_kg) newErrors.weight_kg = "Weight is required.";
      else if (Number.isNaN(weight)) newErrors.weight_kg = "Weight must be a number.";
      else if (weight < 20 || weight > 300) newErrors.weight_kg = "Weight must be between 20 and 300 kg.";
    } else {
      const pounds = Number(form.weight_kg);
      if (!form.weight_kg) newErrors.weight_kg = "Weight is required.";
      else if (Number.isNaN(pounds)) newErrors.weight_kg = "Weight must be a number.";
      else if (pounds < 50 || pounds > 660) newErrors.weight_kg = "Weight must be between 50 and 660 lb.";
    }

    if (!form.health) newErrors.health = "Please choose your overall health.";
    if (!form.smoking) newErrors.smoking = "Please choose your smoking status.";

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateAll()) return;

    setSubmitting(true);

    const birthdate = buildBirthdate();
    const ageYears = ageFromBirthdate(birthdate);
    if (!birthdate || ageYears === null) {
      setErrors((prev) => ({ ...prev, birthdate: "Please enter a valid date of birth." }));
      setSubmitting(false);
      return;
    }

    const profile = {
      age: ageYears,
      sex: form.sex as Sex,
      height_cm: toCentimeters(),
      weight_kg: toKilograms(),
      health: form.health as HealthStatus,
      smoking: form.smoking as SmokingStatus,
    };

    const remainingYears = expectedRemainingLifeYears(profile);

    if (remainingYears <= 0) {
      navigate("/result", {
        state: {
          result: {
            remaining_years: 0,
            death_date: null,
            message:
              "According to this crude model, you've already exceeded the modeled maximum age. No remaining life expectancy is computed.",
          },
          profile: { ...profile, birthdate },
        },
      });
    } else {
      const deathDate = estimateDeathDate(remainingYears);
      navigate("/result", {
        state: {
          result: {
            remaining_years: Math.round(remainingYears * 10) / 10,
            death_date: deathDate,
            message:
              "This is a toy calculation only and not medical or actuarial advice. Do not use it for real decisions.",
          },
          profile: { ...profile, birthdate },
        },
      });
    }
    setSubmitting(false);
  };

  const profile = profileForGraph();
  const agePreviewLabel = agePreviewBase12(buildBirthdate() || "");

  return (
    <div className="form-section calculator-page">
      <div className="step-header">
        <h2>Time Till Death Calculator</h2>
        <p className="muted">
          Toy model only. Not medical or actuarial advice.
        </p>
      </div>

      <div className="calculator-fields">
        <div className="field-group">
          <label className="field-label">
            Date of birth
            {agePreviewLabel ? <span className="age-inline"> (Age: {agePreviewLabel})</span> : null}
          </label>
          <div className="unit-row">
            <select
              className="select input-small"
              value={form.birthDay}
              onChange={(e) => handleBirthDayChange(e.target.value)}
            >
              <option value="" disabled hidden>Day</option>
              {[...Array(31)].map((_, i) => {
                const d = String(i + 1).padStart(2, "0");
                return <option key={d} value={d}>{d}</option>;
              })}
            </select>
            <select
              className="select input-small"
              value={form.birthMonth}
              onChange={(e) => handleBirthMonthChange(e.target.value)}
            >
              <option value="" disabled hidden>Month</option>
              <option value="01">Jan</option>
              <option value="02">Feb</option>
              <option value="03">Mar</option>
              <option value="04">Apr</option>
              <option value="05">May</option>
              <option value="06">Jun</option>
              <option value="07">Jul</option>
              <option value="08">Aug</option>
              <option value="09">Sep</option>
              <option value="10">Oct</option>
              <option value="11">Nov</option>
              <option value="12">Dec</option>
            </select>
            <select
              className="select input-small"
              value={form.birthYear}
              onChange={(e) => handleBirthYearChange(e.target.value)}
            >
              <option value="" disabled hidden>
                Year
              </option>
              {Array.from({ length: 110 }, (_, i) => String(currentYear - i)).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          {errors.birthdate && <div className="error-text">{errors.birthdate}</div>}
        </div>

        <div className="field-group">
          <label className="field-label">Sex</label>
          <select
            className="select"
            value={form.sex}
            onChange={(e) => updateField("sex", e.target.value)}
          >
            <option value="" disabled hidden>
              Sex
            </option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other / prefer not to say</option>
          </select>
          {errors.sex && <div className="error-text">{errors.sex}</div>}
        </div>

        <div className="field-group">
          <label className="field-label">Height</label>
          <div className="unit-row">
            {form.heightUnit === "cm" ? (
              <>
                <button
                  type="button"
                  className="unit-toggle"
                  onClick={() => setForm((prev) => ({ ...prev, heightUnit: "ft", height_feet: "", height_inches: "" }))}
                >
                  ft/in
                </button>
                <input
                  id="height_cm"
                  className="input"
                  type="number"
                  min={80}
                  max={250}
                  placeholder="cm"
                  value={form.height_cm}
                  onChange={(e) => updateField("height_cm", e.target.value)}
                />
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="unit-toggle"
                  onClick={() => setForm((prev) => ({ ...prev, heightUnit: "cm", height_cm: "" }))}
                >
                  cm
                </button>
                <input
                  className="input input-small"
                  type="number"
                  min={0}
                  placeholder="Feet"
                  value={form.height_feet}
                  onChange={(e) => updateField("height_feet", e.target.value)}
                />
                <input
                  className="input input-small"
                  type="number"
                  min={0}
                  max={11}
                  placeholder="Inches"
                  value={form.height_inches}
                  onChange={(e) => updateField("height_inches", e.target.value)}
                />
              </>
            )}
          </div>
          {errors.height_cm && <div className="error-text">{errors.height_cm}</div>}
          {errors.height_feet && <div className="error-text">{errors.height_feet}</div>}
          {errors.height_inches && <div className="error-text">{errors.height_inches}</div>}
        </div>

        <div className="field-group">
          <label className="field-label">Weight</label>
          <div className="unit-row">
            <button
              type="button"
              className="unit-toggle"
              onClick={() =>
                setForm((prev) =>
                  prev.weightUnit === "kg"
                    ? { ...prev, weightUnit: "lb", weight_kg: "" }
                    : { ...prev, weightUnit: "kg", weight_kg: "" }
                )
              }
            >
              {form.weightUnit === "kg" ? "lb" : "kg"}
            </button>
            <input
              id="weight"
              className="input"
              type="number"
              min={form.weightUnit === "kg" ? 20 : 50}
              max={form.weightUnit === "kg" ? 300 : 660}
              placeholder={form.weightUnit === "kg" ? "kg" : "lb"}
              value={form.weight_kg}
              onChange={(e) => updateField("weight_kg", e.target.value)}
            />
          </div>
          {errors.weight_kg && <div className="error-text">{errors.weight_kg}</div>}
        </div>

        <div className="field-group">
          <label className="field-label">Overall health</label>
          <select
            className="select"
            value={form.health}
            onChange={(e) => updateField("health", e.target.value)}
          >
            <option value="" disabled hidden>
              Health
            </option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="average">Average</option>
            <option value="poor">Poor</option>
          </select>
          {errors.health && <div className="error-text">{errors.health}</div>}
        </div>

        <div className="field-group">
          <label className="field-label">Smoking status</label>
          <select
            className="select"
            value={form.smoking}
            onChange={(e) => updateField("smoking", e.target.value)}
          >
            <option value="" disabled hidden>
              Smoking
            </option>
            <option value="never">Never smoked</option>
            <option value="former">Former smoker</option>
            <option value="current">Current smoker</option>
          </select>
          {errors.smoking && <div className="error-text">{errors.smoking}</div>}
        </div>
      </div>

      <div className="calculator-actions">
        <button
          className="primary-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Calculating..." : "Calculate"}
        </button>
      </div>

      <div className="sidebar-chart">
        <div className="sidebar-label">Survival curve</div>
        <SurvivalChart profile={profile} />
      </div>
    </div>
  );
};
