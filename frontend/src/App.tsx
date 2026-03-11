import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { QuestionnaireWizard } from "./QuestionnaireWizard";
import { ResultView } from "./ResultView";

export const App: React.FC = () => {
  return (
    <div className="app-root">
      <header className="app-header">
        <Link to="/" className="app-brand">
          Time Till Death
        </Link>
        <nav>
          <Link to="/">Home</Link>
        </nav>
      </header>
      <main className="app-main">
        <div className="card">
          <Routes>
            <Route
              path="/"
              element={
                <div className="landing">
                  <h1>Time Till Death (Toy Model)</h1>
                  <p>
                    This site uses a very simplified Makeham-style mortality model
                    to estimate remaining lifetime. It is{" "}
                    <strong>purely for fun and education</strong>.
                  </p>
                  <p className="disclaimer">
                    It is <strong>not</strong> medical or actuarial advice and should
                    not be used for real-world decisions.
                  </p>
                  <Link className="primary-btn" to="/questionnaire">
                    Start questionnaire
                  </Link>
                </div>
              }
            />
            <Route path="/questionnaire" element={<QuestionnaireWizard />} />
            <Route path="/result" element={<ResultView />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

