import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { EstimateResult } from "./QuestionnaireWizard";
import { SurvivalChart } from "./SurvivalChart";
import type { PersonProfile, Sex, HealthStatus, SmokingStatus } from "./mortalityModel";

interface LocationState {
  result?: EstimateResult;
  profile?: {
    age: number;
    sex: Sex;
    height_cm: number;
    weight_kg: number;
    health: HealthStatus;
    smoking: SmokingStatus;
    birthdate?: string;
  };
}

export const ResultView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;
  const result = state.result;
  const profile = state.profile;
  const chartProfile: PersonProfile | null = profile
    ? {
        age: profile.age,
        sex: profile.sex,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        health: profile.health,
        smoking: profile.smoking,
      }
    : null;

  const estimatedDeathAge =
    profile && result && result.remaining_years > 0 ? profile.age + result.remaining_years : null;
  const estimatedDeathYear = (() => {
    if (!result || result.remaining_years <= 0) return null;
    if (result.death_date) {
      const y = Number(result.death_date.slice(0, 4));
      return Number.isFinite(y) ? y : null;
    }
    return new Date().getFullYear() + Math.round(result.remaining_years);
  })();

  if (!result) {
    return (
      <div className="result-summary">
        <h2>No result yet</h2>
        <p className="muted">
          To see an estimate, please complete the questionnaire first.
        </p>
        <button
          className="primary-btn"
          onClick={() => navigate("/questionnaire")}
        >
          Go to questionnaire
        </button>
      </div>
    );
  }

  return (
    <div className="result-summary">
      <h2>Your toy-model estimate</h2>
      {result.remaining_years <= 0 ? (
        <>
          <p className="danger-text">
            According to this crude model, you have already exceeded the modeled
            maximum age, so no remaining life expectancy is computed.
          </p>
        </>
      ) : (
        <>
          <div>
            <div className="field-label">Estimated remaining life expectancy</div>
            <div className="result-number">
              {result.remaining_years.toFixed(1)} years
            </div>
          </div>
          {profile && (
            <div>
              <div className="field-label">Estimated total lifespan</div>
              <div>
                {(profile.age + result.remaining_years).toFixed(1)} years
              </div>
            </div>
          )}
          <div>
            <div className="field-label">Estimated date of death</div>
            <div>{result.death_date ?? "Not available"}</div>
          </div>
        </>
      )}

      <span className="badge-warning">Not real medical or actuarial advice.</span>

      <p className="muted">
        This is a highly simplified numerical experiment using a Makeham-style
        hazard function. It is not calibrated to real-world data and is not
        suitable for any serious use.
      </p>

      <div className="sidebar-chart">
        <div className="sidebar-label">Survival curve</div>
        <SurvivalChart
          profile={chartProfile}
          placeholder="Survival curve unavailable (missing profile)."
          highlightAge={estimatedDeathAge}
          highlightLabel={estimatedDeathYear ? `Death year ${estimatedDeathYear}` : undefined}
        />
      </div>

      <div className="result-actions">
        <button
          className="primary-btn"
          onClick={() =>
            navigate("/questionnaire", {
              state: { profile },
            })
          }
        >
          Edit answers
        </button>
        <button
          className="primary-btn primary-btn-neutral"
          onClick={() => navigate("/")}
        >
          Back to home
        </button>
      </div>
    </div>
  );
};

