"use client";
import { useState, useMemo } from "react";
import Header from "./components/Header";
import SimulatorSetup from "./components/SimulatorSetup";
import InteractiveMap from "./components/InteractiveMap";
import POVViewer from "./components/POVViewer";
import InsightsDashboard from "./components/InsightsDashboard";


import { getProjectorById } from "./data/projectors";
import { ROOM_PRESETS } from "./data/rooms";
import {
  generateSeats,
  calculateMetrics,
  getZoneDistances,
  screenDiagToMetres,
  calculateOptimalGrid,
} from "./utils/calculations";
import styles from "./page.module.css";

const DEFAULT_CONFIG = {
  roomId: "medium",
  projectorId: "eb-992f",
  screenSize: 100,
  schoolName: "",
  customWidth: null,
  customDepth: null,
  seatingLayout: "rows",
};

const STEPS = [
  { number: 1, label: "Introduction" },
  { number: 2, label: "Configuration" },
  { number: 3, label: "Results" },
];

function StepProgress({ current }) {
  return (
    <div className={styles.stepProgress}>
      {STEPS.map((step, i) => (
        <div key={step.number} className={styles.stepProgressItem}>
          <div
            className={`${styles.stepDot} ${
              current === step.number
                ? styles.stepDotActive
                : current > step.number
                ? styles.stepDotDone
                : ""
            }`}
          >
            {current > step.number ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              step.number
            )}
          </div>
          <span
            className={`${styles.stepLabel} ${
              current === step.number ? styles.stepLabelActive : ""
            }`}
          >
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`${styles.stepConnector} ${current > step.number ? styles.stepConnectorDone : ""}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const handleChange = (patch) => setConfig((prev) => ({ ...prev, ...patch }));

  // Derived state (always computed so step 3 is instant)
  const room = ROOM_PRESETS[config.roomId];
  // Use custom dimensions if provided, else fall back to preset
  const effectiveRoom = {
    ...room,
    width: config.customWidth ?? room?.width,
    depth: config.customDepth ?? room?.depth,
  };
  const projector = getProjectorById(config.projectorId);
  const { width: screenW, height: screenH } = screenDiagToMetres(
    config.screenSize,
    projector?.aspectRatio ?? "16:9"
  );
  const zones = getZoneDistances(screenH);

  const targetSeats = parseInt(config.targetSeats, 10) || (effectiveRoom.defaultSeats.cols * effectiveRoom.defaultSeats.rows);

  const gridCalc = useMemo(
    () => calculateOptimalGrid(targetSeats, effectiveRoom.width, effectiveRoom.depth, config.seatingLayout || "rows"),
    [targetSeats, effectiveRoom.width, effectiveRoom.depth, config.seatingLayout]
  );

  const seats = useMemo(
    () => generateSeats(effectiveRoom, { cols: gridCalc.cols, rows: gridCalc.rows }, screenH, config.seatingLayout, targetSeats),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveRoom.width, effectiveRoom.depth, screenH, config.seatingLayout, gridCalc.cols, gridCalc.rows, targetSeats]
  );
  const metrics = useMemo(() => calculateMetrics(seats), [seats]);


  const bestSeat = seats.find((s) => s.isBestSeat);
  const worstSeat = seats.find((s) => s.isWorstSeat);

  const [isEditingConfig, setIsEditingConfig] = useState(false);

  const [selectedSeatId, setSelectedSeatId] = useState("best");
  const selectedSeat = useMemo(() => {
    if (selectedSeatId === "best") return bestSeat;
    if (selectedSeatId === "worst") return worstSeat;
    return seats.find((s) => s.id === selectedSeatId) || bestSeat;
  }, [selectedSeatId, bestSeat, worstSeat, seats]);

  const [hoveredZone, setHoveredZone] = useState(null);

  return (
    <div className={styles.appShell}>
      <Header step={step} />

      {/* ── STEP PROGRESS BAR ─────────────────────────────── */}
      {step > 1 && (
        <div className={styles.progressBar}>
          <div className="container">
            <StepProgress current={step} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 1 — INTRODUCTION
      ══════════════════════════════════════════════════════ */}
      {step === 1 && (
        <main className={`${styles.heroScreen} animate-fade-in-up`}>
          {/* Left: Content */}
          <div className={styles.heroLeft}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <span className={styles.heroBadgePulse} />
                Interactive Simulation Tool
              </div>

              <h1 className={styles.heroTitle}>
                See every seat clearly
              </h1>

              <div className={styles.heroTextGroup}>
                <p className={styles.heroSubtitle}>
                  See how your projector choice and classroom layout shape learning.
                </p>

                <p className={styles.heroDesc}>
                  This tool helps you understand how the projector and seating layout you choose affect students' ability to see, read and engage with learning materials, as well as how easily a teacher can move around the room.
                </p>

                <p className={styles.heroDesc}>
                  Use it to visualise viewing comfort and classroom interaction from any seat, giving you an instant picture of how effective your projector and layout will be.
                </p>

                <ul className={styles.heroList}>
                  <li>Compare how projector choice and screen size change what students see.</li>
                  <li>Explore how desk arrangements affect visibility and teacher mobility.</li>
                  <li>Get an instant visual check on the effectiveness of your classroom design.</li>
                </ul>
              </div>

              <button
                id="start-simulator"
                className={styles.heroBtn}
                onClick={() => setStep(2)}
              >
                Start simulator
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right: Classroom Image */}
          <div className={styles.heroRight}>
            <img src="/classroom-context.png" alt="Classroom Context" className={styles.heroImage} />
            <div className={styles.heroGrid} />
          </div>
        </main>
      )}


      {/* ══════════════════════════════════════════════════════
          STEP 2 — CONFIGURATION
      ══════════════════════════════════════════════════════ */}
      {step === 2 && (
        <main className={`${styles.configScreen} animate-fade-in-up`}>
          <div className="container">
            <div className={styles.configCard}>
              <div className={styles.configHeader}>
                <h1 className={styles.configTitle}>Configuration</h1>
                <p className={styles.configDesc}>
                  Define your classroom parameters to generate a visibility analysis.
                </p>
              </div>

              <div className={styles.configBody}>
                <SimulatorSetup config={config} onChange={handleChange} />
              </div>

              {/* Navigation */}
              <div className={styles.configNav}>
                <button
                  id="back-to-intro"
                  className="btn btn-ghost"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  id="view-results"
                  className={`btn btn-primary ${styles.nextBtn}`}
                  onClick={() => setStep(3)}
                >
                  Generate Analysis
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 3 — RESULTS
      ══════════════════════════════════════════════════════ */}
      {step === 3 && (
        <main className={`${styles.resultsScreen} animate-fade-in-up`} id="results">
          <div className="container">
            <div className={`${styles.warningWrapper} ${gridCalc.isMaxedOut ? styles.show : ''}`}>
              <div className={styles.warningInner}>
                <div className={styles.warningBanner}>
                  <svg className={styles.warningIcon} width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>
                    Not enough space for <strong>{targetSeats}</strong> seats. Room dimensions limit this layout to a maximum of <strong>{gridCalc.actualSeats}</strong> seats.
                  </span>
                </div>
              </div>
            </div>

            <div style={{ padding: "0 0 24px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px", color: "var(--text-primary)" }}>Your results</h2>
              <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.6", maxWidth: "800px" }}>
                The diagram and data below show how effective your projector, screen and classroom layout choices are in promoting an inclusive education experience for all pupils.
              </p>
            </div>

            {/* ── TOP BAR: Config summary + Edit button ── */}
            <div className={`${styles.resultsMeta} ${isEditingConfig ? styles.resultsMetaEditing : ''}`}>
              <div className={styles.metaSummary}>
                {config.schoolName && (
                  <span className={styles.metaSchool}>{config.schoolName}</span>
                )}
                <span className={styles.metaChip}>{effectiveRoom?.width}m × {effectiveRoom?.depth}m</span>
                <span className={styles.metaChip}>{projector?.name}</span>
                <span className={styles.metaChip}>{config.screenSize}" Screen</span>
              </div>
              <button
                id="toggle-config"
                className={`btn ${isEditingConfig ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setIsEditingConfig(!isEditingConfig)}
                style={{ fontSize: 13, padding: "8px 18px" }}
              >
                {isEditingConfig ? 'Close Configuration' : 'Edit Configuration'}
              </button>
            </div>

            <div className={`${styles.inlineConfigWrapper} ${isEditingConfig ? styles.open : ''}`}>
              <div className={styles.inlineConfigInner}>
                <div className={styles.inlineConfig}>
                  <SimulatorSetup config={config} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* ── SECTION 1: Map + Key Stats side-by-side ── */}
            <div className={styles.resultsMainRow}>
              {/* Classroom Maps */}
              <div className={styles.mapCard}>
                <div className={styles.cardLabel}>{projector?.name} ({config.screenSize}" Screen)</div>
                <InteractiveMap
                  seats={seats}
                  room={effectiveRoom}
                  zones={zones}
                  screenWidthM={screenW}
                  screenHeightM={screenH}
                  selectedSeatId={selectedSeatId}
                  onSelectSeat={setSelectedSeatId}
                />
              </div>

              {/* Key Metrics */}
              <div className={styles.statsColumn}>
                <div className={styles.cardLabel}>
                  Visibility Analysis — {projector ? projector.name : "Epson Projector"}
                </div>
                <div className={styles.statsList}>
                  {[
                    {
                      label: "Visibility Coverage",
                      desc: "Seats with clear view of screen",
                      value: metrics.visibilityCoverage ?? 0,
                      suffix: "%",
                      inverse: false,
                    },
                    {
                      label: "Engagement Risk",
                      desc: "Seats where learning may be compromised",
                      value: metrics.engagementRisk ?? 0,
                      suffix: "%",
                      inverse: true,
                    },
                    {
                      label: "Inclusion index",
                      desc: "Fairness of seat quality across the room",
                      value: metrics.equityIndex ?? 0,
                      suffix: "",
                      inverse: false,
                    },
                  ].map(({ label, desc, value, suffix, inverse }) => {
                    const adjusted = inverse ? 100 - value : value;
                    const status =
                      adjusted >= 80 ? "good" : adjusted >= 55 ? "fair" : "poor";
                    const statusLabel =
                      adjusted >= 80 ? "Excellent" : adjusted >= 55 ? "Fair" : "Poor";
                    return (
                      <div key={label} className={styles.statRow}>
                        <div className={styles.statMeta}>
                          <span className={styles.statLabel}>{label}</span>
                        </div>
                        <div className={styles.statRight}>
                          <span className={styles.statValue}>{value}{suffix}</span>
                          <span className={`${styles.statBadge} ${styles[`badge_${status}`]}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <div className={styles.statBar}>
                          <div
                            className={`${styles.statBarFill} ${styles[`fill_${status}`]}`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Zone breakdown */}
                {metrics.breakdown && (
                  <div className={styles.zoneBreakdown}>
                    <div className={styles.cardLabel} style={{ marginBottom: 12 }}>Seat Zone Breakdown</div>
                    <div className={styles.zoneBar}>
                      {["analytical", "basic", "passive", "unviewable"].map((zone) => {
                        const count = metrics.breakdown[zone] ?? 0;
                        const pct = metrics.breakdown.total > 0
                          ? (count / metrics.breakdown.total) * 100
                          : 0;
                        const colors = {
                          analytical: "#22c55e",
                          basic: "#f59e0b",
                          passive: "#ef4444",
                          unviewable: "#e5e7eb",
                        };
                        if (pct === 0) return null;
                        const label = zone === "analytical" ? "Clear viewing" :
                                      zone === "basic" ? "Basic viewing" :
                                      zone === "passive" ? "Passive/limited viewing" :
                                      "Out of range";
                        return (
                          <div
                            key={zone}
                            style={{ 
                              width: `${pct}%`, 
                              background: colors[zone], 
                              height: "100%", 
                              borderRadius: 2,
                              position: "relative",
                              cursor: "pointer"
                            }}
                            onMouseEnter={() => setHoveredZone(zone)}
                            onMouseLeave={() => setHoveredZone(null)}
                          >
                            {hoveredZone === zone && (
                              <div className={styles.barTooltip}>
                                <strong>{label}</strong>: {count} seats ({Math.round(pct)}%)
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className={styles.zoneLegend}>
                      {[
                        { key: "analytical", label: "Clear viewing", color: "#22c55e" },
                        { key: "basic", label: "Basic viewing", color: "#f59e0b" },
                        { key: "passive", label: "Passive/limited viewing", color: "#ef4444" },
                        { key: "unviewable", label: "Out of range", color: "#e5e7eb" },
                      ].map(({ key, label, color }) => {
                        return (
                          <div key={key} className={styles.zoneLegendItem}>
                            <div className={styles.zoneDot} style={{ background: color }} />
                            <span className={styles.zoneName}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION 2: Student POV ── */}
            <div className={styles.povSection}>
              <div className={styles.cardLabel}>Student Point of View</div>
              <div className={styles.povDesc}>
                Simulated view from the best and worst seats in your classroom configuration.
              </div>
              <POVViewer
                selectedSeat={selectedSeat}
                selectedSeatId={selectedSeatId}
                onSelectSeat={setSelectedSeatId}
                bestSeat={bestSeat}
                worstSeat={worstSeat}
                room={effectiveRoom}
                screenWidthM={screenW}
                screenHeightM={screenH}
              />
            </div>

            {/* ── SECTION 3: Final CTA ── */}
            <div style={{ marginTop: "40px", padding: "32px 0", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px", color: "var(--text-primary)" }}>Discuss your classroom options with Epson</h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>Contact us today to speak to our education team.</p>
                <a href="#" style={{ fontSize: "14px", fontWeight: "600", color: "var(--epson-blue)", textDecoration: "underline" }}>Contact Epson</a>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => setStep(1)}
                style={{ whiteSpace: "nowrap" }}
              >
                Take another assessment
              </button>
            </div>

          </div>
        </main>
      )}

    </div>
  );
}
