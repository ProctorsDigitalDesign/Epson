"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./InsightsDashboard.module.css";

function AnimatedNumber({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = display;
    const end = value;
    const duration = 700;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={styles.animNum}>
      {display}
      {suffix}
    </span>
  );
}

function ProgressRing({ value, color, size = 100, strokeWidth = 8 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <svg width={size} height={size} className={styles.ring}>
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      {/* Progress */}
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

const METRIC_CONFIG = {
  visibilityCoverage: {
    label: "Visibility Coverage",
    desc: "Seats where the screen is clearly viewable",
    icon: "👁️",
    goodThreshold: 80,
    color: (v) => v >= 80 ? "#3A5A40" : v >= 60 ? "#DDA15E" : "#9E9E9E",
    suffix: "%",
    inverse: false,
  },
  engagementRisk: {
    label: "Engagement Risk",
    desc: "Seats where learning may be compromised",
    icon: "⚠️",
    goodThreshold: 20,
    color: (v) => v <= 20 ? "#3A5A40" : v <= 40 ? "#DDA15E" : "#9E9E9E",
    suffix: "%",
    inverse: true,
  },
  equityIndex: {
    label: "Equity Index",
    desc: "Overall fairness of seat quality across the room",
    icon: "⚖️",
    goodThreshold: 75,
    color: (v) => v >= 75 ? "#3A5A40" : v >= 50 ? "#DDA15E" : "#9E9E9E",
    suffix: "",
    inverse: false,
  },
};

function getGrade(v, inverse) {
  const val = inverse ? 100 - v : v;
  if (val >= 80) return { label: "Excellent", color: "#3A5A40" };
  if (val >= 65) return { label: "Good", color: "#A3B18A" };
  if (val >= 45) return { label: "Fair", color: "#DDA15E" };
  return { label: "Poor", color: "#9E9E9E" };
}

export default function InsightsDashboard({ metrics, breakdown }) {
  if (!metrics) return null;

  return (
    <div className={styles.dashboard} id="insights">
      <div className={styles.metricsRow}>
        {Object.entries(METRIC_CONFIG).map(([key, cfg]) => {
          const value = metrics[key] ?? 0;
          const color = cfg.color(value);
          const grade = getGrade(value, cfg.inverse);

          return (
            <div key={key} className={`glass-card ${styles.metricCard}`} id={`metric-${key}`}>
              <div className={styles.metricHeader}>
                <span className={styles.metricIcon}>{cfg.icon}</span>
                <span className={styles.metricLabel}>{cfg.label}</span>
              </div>

              <div className={styles.metricBody}>
                <div className={styles.ringWrap}>
                  <ProgressRing value={value} color={color} size={100} strokeWidth={8} />
                  <div className={styles.ringInner}>
                    <AnimatedNumber value={value} suffix={cfg.suffix} />
                  </div>
                </div>
                <div className={styles.metricRight}>
                  <div className={styles.grade} style={{ color: grade.color }}>
                    {grade.label}
                  </div>
                  <div className={styles.metricDesc}>{cfg.desc}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Breakdown bar */}
      {breakdown && (
        <div className={`glass-card ${styles.breakdown}`}>
          <div className={styles.breakdownTitle}>Seat Zone Breakdown</div>
          <div className={styles.breakdownBar}>
            {["analytical", "basic", "passive", "unviewable"].map((zone) => {
              const count = breakdown[zone] ?? 0;
              const pct = breakdown.total > 0 ? (count / breakdown.total) * 100 : 0;
              const zoneColors = {
                analytical: { bg: "#3A5A40", label: "Analytical Viewing" },
                basic: { bg: "#A3B18A", label: "Basic Viewing" },
                passive: { bg: "#DDA15E", label: "Passive Viewing" },
                unviewable: { bg: "#9E9E9E", label: "Out of Range" },
              };
              if (pct === 0) return null;
              return (
                <div
                  key={zone}
                  className={styles.barSegment}
                  style={{ width: `${pct}%`, background: zoneColors[zone].bg }}
                  data-tooltip={`${zoneColors[zone].label}: ${count} seats (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>
          <div className={styles.breakdownLegend}>
            {["analytical", "basic", "passive", "unviewable"].map((zone) => {
              const count = breakdown[zone] ?? 0;
              const pct = breakdown.total > 0 ? Math.round((count / breakdown.total) * 100) : 0;
              const zoneColors = {
                analytical: { bg: "#3A5A40", label: "Analytical Viewing" },
                basic: { bg: "#A3B18A", label: "Basic Viewing" },
                passive: { bg: "#DDA15E", label: "Passive Viewing" },
                unviewable: { bg: "#9E9E9E", label: "Out of Range" },
              };
              return (
                <div key={zone} className={styles.breakdownLegendItem}>
                  <div className={styles.breakdownDot} style={{ background: zoneColors[zone].bg }} />
                  <span className={styles.breakdownZone}>{zoneColors[zone].label}</span>
                  <span className={styles.breakdownCount}>{count} seats</span>
                  <span className={styles.breakdownPct}>({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
