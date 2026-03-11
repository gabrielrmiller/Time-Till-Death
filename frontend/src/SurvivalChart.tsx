import React, { useId } from "react";
import { getSurvivalCurve, type PersonProfile } from "./mortalityModel";

export function SurvivalChart({
  profile,
  maxYears = 120,
  placeholder = "Fill in the form to see your survival curve.",
  highlightAge,
  highlightLabel,
}: {
  profile: PersonProfile | null | undefined;
  maxYears?: number;
  placeholder?: string;
  highlightAge?: number | null;
  highlightLabel?: string;
}) {
  const gradId = useId();
  const ageNow = profile?.age ?? 0;
  const yearsTo110 = Math.max(0, 110 - ageNow);
  // Chart always starts at current year and ends at age 110, capped to 120 years.
  const horizonYears = Math.min(120, Math.min(maxYears, yearsTo110));
  const baseCurve = profile ? getSurvivalCurve(profile, horizonYears) : [];

  const chartW = 520;
  const chartH = 140;
  const pad = { t: 14, r: 8, b: 24, l: 36 };
  const maxY = 1;
  const maxX = Math.max(1, horizonYears);
  const toX = (t: number) => pad.l + (t / maxX) * (chartW - pad.l - pad.r);
  const toY = (S: number) => chartH - pad.b - (S / maxY) * (chartH - pad.t - pad.b);

  const survivalCurve = (() => {
    if (baseCurve.length === 0) return [];
    const last = baseCurve[baseCurve.length - 1];
    if (last.t >= horizonYears) return baseCurve;
    // Ensure the curve visually trends all the way to 0 at the right edge.
    return [...baseCurve, { t: horizonYears, S: last.S }, { t: horizonYears, S: 0 }];
  })();

  const pathD =
    survivalCurve.length > 0
      ? survivalCurve
          .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.t)} ${toY(p.S)}`)
          .join(" ")
      : "";

  const startAge = ageNow;
  const endAge = ageNow + maxX;

  // Use "nice" steps, but never show overly dense ticks.
  const niceAgeStep = (spanYears: number) => {
    if (spanYears <= 12) return 1;
    if (spanYears <= 25) return 2;
    if (spanYears <= 60) return 5;
    return 10;
  };
  const ageStep = niceAgeStep(endAge - startAge);
  const firstTickAge = Math.ceil(startAge / ageStep) * ageStep;
  const ageTicks: number[] = [];
  for (let a = firstTickAge; a <= endAge; a += ageStep) ageTicks.push(Math.round(a));

  const yTicks = Array.from({ length: 11 }, (_, i) => 1 - i * 0.1); // 1.0 ... 0.0

  const highlightT =
    typeof highlightAge === "number" && Number.isFinite(highlightAge) ? highlightAge - ageNow : null;
  const showHighlight = highlightT !== null && highlightT >= 0 && highlightT <= maxX;
  const highlightX = showHighlight ? toX(highlightT as number) : null;

  return (
    <div className="survival-chart-frame">
      {survivalCurve.length === 0 ? (
        <p className="chart-placeholder">{placeholder}</p>
      ) : (
        <div className="survival-chart-stack">
          <div className="chart-title chart-title-top">Survival probability</div>
          <svg
            className="survival-chart"
            viewBox={`0 0 ${chartW} ${chartH}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ overflow: "visible" }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(56, 189, 248, 0.3)" />
                <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
              </linearGradient>
            </defs>
            {yTicks.map((s) => {
              const y = toY(s);
              return (
                <line
                  key={s}
                  x1={pad.l}
                  y1={y}
                  x2={chartW - pad.r}
                  y2={y}
                  stroke="rgba(148,163,184,0.18)"
                  strokeWidth="0.5"
                />
              );
            })}
            <path
              d={pathD + (pathD ? ` L ${toX(maxX)} ${toY(0)} L ${pad.l} ${toY(0)} Z` : "")}
              fill={`url(#${gradId})`}
            />
            <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="1.5" />
            {showHighlight && highlightX !== null && (
              <g>
                <line
                  x1={highlightX}
                  y1={pad.t}
                  x2={highlightX}
                  y2={chartH - pad.b}
                  stroke="#fbbf24"
                  strokeWidth="2"
                />
                {highlightLabel ? (
                  <text
                    x={highlightX}
                    y={pad.t - 2}
                    className="chart-ax"
                    textAnchor="middle"
                    style={{ fill: "#fbbf24" }}
                  >
                    {highlightLabel}
                  </text>
                ) : null}
              </g>
            )}
            <line
              x1={pad.l}
              y1={chartH - pad.b}
              x2={chartW - pad.r}
              y2={chartH - pad.b}
              stroke="rgba(148,163,184,0.5)"
              strokeWidth="0.5"
            />
            <line
              x1={pad.l}
              y1={chartH - pad.b}
              x2={pad.l}
              y2={pad.t}
              stroke="rgba(148,163,184,0.5)"
              strokeWidth="0.5"
            />
            {yTicks.map((s) => {
              const y = toY(s);
              return (
                <g key={`ylab-${s}`}>
                  <line
                    x1={pad.l - 3}
                    y1={y}
                    x2={pad.l}
                    y2={y}
                    stroke="rgba(148,163,184,0.5)"
                    strokeWidth="0.5"
                  />
                  <text x={pad.l - 6} y={y + 3} className="chart-ax" textAnchor="end">
                    {Math.round(s * 100)}%
                  </text>
                </g>
              );
            })}
            {ageTicks.map((age) => {
              const t = age - ageNow;
              const x = toX(t);
              return (
                <g key={age}>
                  <line
                    x1={x}
                    y1={pad.t}
                    x2={x}
                    y2={chartH - pad.b}
                    stroke="rgba(148,163,184,0.12)"
                    strokeWidth="0.5"
                  />
                  <line
                    x1={x}
                    y1={chartH - pad.b}
                    x2={x}
                    y2={chartH - pad.b + 3}
                    stroke="rgba(148,163,184,0.5)"
                    strokeWidth="0.5"
                  />
                  <text x={x} y={chartH - 14} className="chart-ax" textAnchor="middle">
                    {age}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="chart-title chart-title-bottom">Age</div>
        </div>
      )}
    </div>
  );
}

