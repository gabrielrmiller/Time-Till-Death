import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { EstimateResult } from "./QuestionnaireWizard";

interface LocationState {
  result?: EstimateResult;
  profile?: {
    age: number;
    sex: string;
    height_cm: number;
    weight_kg: number;
    health: string;
    smoking: string;
    birthdate?: string;
  };
}

export const ResultView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;
  const result = state.result;
   const profile = state.profile;

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

      <span className="badge-warning">Toy calculation only</span>

      <p className="muted">
        This is a highly simplified numerical experiment using a Makeham-style
        hazard function. It is not calibrated to real-world data and is not
        suitable for any serious use.
      </p>

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

