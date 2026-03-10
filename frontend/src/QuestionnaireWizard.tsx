import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export type Sex = "male" | "female" | "other";
export type HealthStatus = "excellent" | "good" | "average" | "poor";
export type SmokingStatus = "never" | "former" | "current";

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

type Step = 1 | 2 | 3 | 4;

export const QuestionnaireWizard: React.FC = () => {
  const [step, setStep] = useState<Step>(1);
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
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    setForm((prev) => ({
      ...prev,
      birthYear: y || "",
      birthMonth: m || "",
      birthDay: d || "",
      sex: incomingProfile.sex,
      heightUnit: "cm",
      height_cm: Math.round(incomingProfile.height_cm).toString(),
      height_feet: "",
      height_inches: "",
      weightUnit: "kg",
      weight_kg: Math.round(incomingProfile.weight_kg).toString(),
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

  const now = new Date();
  const currentYear = now.getFullYear();

  const buildBirthdate = (): string => {
    if (!form.birthYear || !form.birthMonth || !form.birthDay) {
      return "";
    }
    return `${form.birthYear}-${form.birthMonth}-${form.birthDay}`;
  };

  const handleBirthYearChange = (value: string) => {
    updateField("birthYear", value);
  };

  const handleBirthMonthChange = (value: string) => {
    updateField("birthMonth", value);
  };

  const handleBirthDayChange = (value: string) => {
    updateField("birthDay", value);
  };

  const validateStep = (s: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (s === 1) {
      const birthdate = buildBirthdate();
      const ageYears = ageFromBirthdate(birthdate);
      if (!birthdate) {
        newErrors.birthdate = "Date of birth is required.";
      } else if (ageYears === null) {
        newErrors.birthdate = "Please enter a valid date of birth.";
      } else if (ageYears < 0 || ageYears > 120) {
        newErrors.birthdate = "Age must be between 0 and 120 years.";
      }
      if (!form.sex) {
        newErrors.sex = "Please select a sex.";
      }
    } else if (s === 2) {
      if (form.heightUnit === "cm") {
        const height = Number(form.height_cm);
        if (!form.height_cm) {
          newErrors.height_cm = "Height is required.";
        } else if (Number.isNaN(height)) {
          newErrors.height_cm = "Height must be a number.";
        } else if (height < 80 || height > 250) {
          newErrors.height_cm = "Height must be between 80 and 250 cm.";
        }
      } else {
        const feet = Number(form.height_feet);
        const inches = Number(form.height_inches || "0");
        if (!form.height_feet && !form.height_inches) {
          newErrors.height_feet = "Height is required.";
        } else if (Number.isNaN(feet) || Number.isNaN(inches)) {
          newErrors.height_feet = "Height must be numeric feet and inches.";
        } else if (inches < 0 || inches >= 12) {
          newErrors.height_inches = "Inches must be between 0 and 11.";
        } else {
          const totalInches = feet * 12 + inches;
          if (totalInches < 36 || totalInches > 96) {
            newErrors.height_feet = "Height must be between about 3 and 8 feet.";
          }
        }
      }

      if (form.weightUnit === "kg") {
        const weight = Number(form.weight_kg);
        if (!form.weight_kg) {
          newErrors.weight_kg = "Weight is required.";
        } else if (Number.isNaN(weight)) {
          newErrors.weight_kg = "Weight must be a number.";
        } else if (weight < 20 || weight > 300) {
          newErrors.weight_kg = "Weight must be between 20 and 300 kg.";
        }
      } else {
        const pounds = Number(form.weight_kg);
        if (!form.weight_kg) {
          newErrors.weight_kg = "Weight is required.";
        } else if (Number.isNaN(pounds)) {
          newErrors.weight_kg = "Weight must be a number.";
        } else if (pounds < 50 || pounds > 660) {
          newErrors.weight_kg = "Weight must be between 50 and 660 lb.";
        }
      }
    } else if (s === 3) {
      if (!form.health) {
        newErrors.health = "Please choose your overall health.";
      }
      if (!form.smoking) {
        newErrors.smoking = "Please choose your smoking status.";
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((prev) => (prev < 4 ? ((prev + 1) as Step) : prev));
  };

  const goBack = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      setStep(3);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const birthdate = buildBirthdate();
      const ageYears = ageFromBirthdate(birthdate);
      if (!birthdate || ageYears === null) {
        setErrors((prev) => ({
          ...prev,
          birthdate: "Please enter a valid date of birth.",
        }));
        setStep(1);
        return;
      }

      const payload = {
        age: ageYears,
        sex: form.sex,
        height_cm: toCentimeters(),
        weight_kg: toKilograms(),
        health: form.health,
        smoking: form.smoking,
      };

      const res = await fetch("http://localhost:8000/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data: EstimateResult = await res.json();
      navigate("/result", {
        state: {
          result: data,
          profile: { ...payload, birthdate },
        },
      });
    } catch (err) {
      setSubmitError(
        "Something went wrong talking to the server. Please ensure the backend is running and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-section">
      <div className="step-header">
        <h2>
          {step === 1 && "Step 1: Basics"}
          {step === 2 && "Step 2: Body metrics"}
          {step === 3 && "Step 3: Health & smoking"}
          {step === 4 && "Step 4: Review & confirm"}
        </h2>
        <p>
          This tool is a toy model only. It is not medical or actuarial advice and
          should not be used for real-world decisions.
        </p>
      </div>

      {step === 1 && (
        <>
          <div className="field-group">
            <label className="field-label">Date of birth</label>
            <div className="field-description">
              Pick your birth day, month, and year. We derive your age from this.
            </div>
            <div className="unit-row">
              <select
                className="select input-small"
                value={form.birthDay}
                onChange={(e) => handleBirthDayChange(e.target.value)}
              >
                <option value="" disabled hidden>
                  Day
                </option>
                {[...Array(31)].map((_, i) => {
                  const d = String(i + 1).padStart(2, "0");
                  return (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  );
                })}
              </select>
              <select
                className="select input-small"
                value={form.birthMonth}
                onChange={(e) => handleBirthMonthChange(e.target.value)}
              >
                <option value="" disabled hidden>
                  Month
                </option>
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
              <input
                className="input input-small"
                type="text"
                maxLength={4}
                placeholder="YYYY"
                value={form.birthYear}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, "");
                  handleBirthYearChange(next);
                }}
              />
            </div>
            {errors.birthdate && (
              <div className="error-text">{errors.birthdate}</div>
            )}
          </div>

          <div className="field-group">
            <div className="field-label">Sex</div>
            <select
              className="select"
              value={form.sex}
              onChange={(e) => updateField("sex", e.target.value)}
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other / prefer not to say</option>
            </select>
            {errors.sex && <div className="error-text">{errors.sex}</div>}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="field-group">
            <div className="field-label">Height</div>
            <div className="field-description">
              Choose either centimeters or feet/inches.
            </div>
            <div className="unit-row">
              {form.heightUnit === "cm" ? (
                <>
                  <button
                    type="button"
                    className="unit-toggle"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        heightUnit: "ft",
                        height_feet: "",
                        height_inches: "",
                      }))
                    }
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
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        heightUnit: "cm",
                        height_cm: "",
                      }))
                    }
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
            {errors.height_cm && (
              <div className="error-text">{errors.height_cm}</div>
            )}
            {errors.height_feet && (
              <div className="error-text">{errors.height_feet}</div>
            )}
            {errors.height_inches && (
              <div className="error-text">{errors.height_inches}</div>
            )}
          </div>

          <div className="field-group">
            <div className="field-label">Weight</div>
            <div className="field-description">
              You can enter weight in kilograms or pounds.
            </div>
            <div className="unit-row">
              <button
                type="button"
                className="unit-toggle"
                onClick={() =>
                  setForm((prev) => {
                    if (prev.weightUnit === "kg") {
                      return {
                        ...prev,
                        weightUnit: "lb",
                        weight_kg: "",
                      };
                    }
                    return {
                      ...prev,
                      weightUnit: "kg",
                      weight_kg: "",
                    };
                  })
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
            {errors.weight_kg && (
              <div className="error-text">{errors.weight_kg}</div>
            )}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="field-group">
            <div className="field-label">Overall health</div>
            <select
              className="select"
              value={form.health}
              onChange={(e) => updateField("health", e.target.value)}
            >
              <option value="">Select...</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="poor">Poor</option>
            </select>
            <div className="field-description">
              A self-assessment of your general health right now.
            </div>
            {errors.health && <div className="error-text">{errors.health}</div>}
          </div>

          <div className="field-group">
            <div className="field-label">Smoking status</div>
            <select
              className="select"
              value={form.smoking}
              onChange={(e) => updateField("smoking", e.target.value)}
            >
              <option value="">Select...</option>
              <option value="never">Never smoked</option>
              <option value="former">Former smoker</option>
              <option value="current">Current smoker</option>
            </select>
            {errors.smoking && <div className="error-text">{errors.smoking}</div>}
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <div className="field-group">
            <div className="field-label">Review your answers</div>
            <div className="field-description">
              Make sure everything looks right before calculating.
            </div>
            <ul className="muted">
              <li>
                Age:{" "}
                {(() => {
                  const ageYears = ageFromBirthdate(buildBirthdate());
                  return ageYears !== null
                    ? `${ageYears.toFixed(1)} years`
                    : "—";
                })()}
              </li>
              <li>Sex: {form.sex || "—"}</li>
              <li>
                Height:{" "}
                {form.heightUnit === "cm"
                  ? form.height_cm
                    ? `${form.height_cm} cm`
                    : "—"
                  : form.height_feet || form.height_inches
                  ? `${form.height_feet || 0} ft ${form.height_inches || 0} in`
                  : "—"}
              </li>
              <li>
                Weight:{" "}
                {form.weight_kg
                  ? form.weightUnit === "kg"
                    ? `${form.weight_kg} kg`
                    : `${form.weight_kg} lb`
                  : "—"}
              </li>
              <li>Health: {form.health || "—"}</li>
              <li>Smoking: {form.smoking || "—"}</li>
            </ul>
            <p className="disclaimer">
              This model is crude and intentionally not realistic. Do not use it to
              make any health or financial decisions.
            </p>
          </div>
          {submitError && <div className="error-text">{submitError}</div>}
        </>
      )}

      <div className="step-footer">
        <button className="secondary-btn" onClick={goBack} disabled={step === 1}>
          Back
        </button>
        <div className="step-indicator">
          Step {step} of 4
        </div>
        {step < 4 ? (
          <button className="primary-btn" onClick={goNext}>
            Next
          </button>
        ) : (
          <button
            className="primary-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Calculating..." : "Calculate"}
          </button>
        )}
      </div>
    </div>
  );
};

