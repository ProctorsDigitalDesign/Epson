"use client";
import { useState, useMemo } from "react";
import Header from "./components/Header";
import SimulatorSetup from "./components/SimulatorSetup";
import InteractiveMap from "./components/InteractiveMap";
import POVViewer from "./components/POVViewer";
import InsightsDashboard from "./components/InsightsDashboard";


import { getProjectorById } from "./data/projectors";
import { ROOM_PRESETS } from "./data/rooms";
import { SCORING_BENCHMARKS } from "./data/benchmarks";
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
  projectorId: "eb-l690u-series",
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
  const furthestSeat = seats.find((s) => s.isFurthestSeat);

  const flatPanelDisplaySize = 86;
  const { width: fpScreenW, height: fpScreenH } = screenDiagToMetres(flatPanelDisplaySize, "16:9");
  
  const fpGridCalc = calculateOptimalGrid(targetSeats, effectiveRoom.width, effectiveRoom.depth, config.seatingLayout);
  const fpSeats = useMemo(
    () => generateSeats(effectiveRoom, { cols: fpGridCalc.cols, rows: fpGridCalc.rows }, fpScreenH, config.seatingLayout, targetSeats),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveRoom.width, effectiveRoom.depth, fpScreenH, config.seatingLayout, fpGridCalc.cols, fpGridCalc.rows, targetSeats]
  );
  const fpMetrics = useMemo(() => calculateMetrics(fpSeats), [fpSeats]);
  
  const fpBestSeat = fpSeats.find((s) => s.isBestSeat);
  const fpFurthestSeat = fpSeats.find((s) => s.isFurthestSeat);
  const fpZones = getZoneDistances(fpScreenH);

  const [isEditingConfig, setIsEditingConfig] = useState(false);

  const [activePov, setActivePov] = useState(null); // { type: 'projector' | 'flatpanel', title: string, seat: object, room: object }

  const [hoveredZone, setHoveredZone] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);

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
                Classroom projector planner
              </div>

              <h1 className={styles.heroTitle}>
                Help every student see clearly
              </h1>

              <div className={styles.heroTextGroup}>
                <p className={styles.heroSubtitle}>
                  See how your projector choice and classroom layout shape learning.
                </p>

                <p className={styles.heroDesc}>
                  This tool helps you understand the relationship between the projectors and seating layout you choose, and your students' ability to see, read and engage with learning materials, as well as how easily a teacher can move around the room.
                </p>

                <ul className={styles.heroList}>
                  <li>Compare how projector choice and screen size change what students see.</li>
                  <li>Explore how desk arrangements affect visibility and teacher mobility.</li>
                  <li>Get an instant visual check on the suitability of your classroom design.</li>
                </ul>
              </div>

              <button
                id="start-simulator"
                className={styles.heroBtn}
                onClick={() => setStep(2)}
              >
                Start planning
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
                  See your classroom view
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
            <div className={styles.mapComparison}>
              {[
                {
                  id: "projector",
                  title: projector?.name || "Epson Projector",
                  subtitle: `(${config.screenSize}" Screen)`,
                  screenW: screenW,
                  screenH: screenH,
                  displaySizeInches: config.screenSize,
                  seats: seats,
                  metrics: metrics,
                  zones: zones,

                },
                {
                  id: "flatpanel",
                  title: "Standard Flat Panel",
                  subtitle: `(86" Screen)`,
                  screenW: fpScreenW,
                  screenH: fpScreenH,
                  displaySizeInches: 86,
                  seats: fpSeats,
                  metrics: fpMetrics,
                  zones: fpZones,

                }
              ].map((res) => (
                <div key={res.id} className={styles.resultsMainRow}>
                  {/* Classroom Maps */}
                  <div className={styles.mapCard}>
                    <div className={styles.cardLabel}>{res.title} {res.subtitle}</div>
                    <InteractiveMap
                      seats={res.seats}
                      room={effectiveRoom}
                      zones={res.zones}
                      screenWidthM={res.screenW}
                      screenHeightM={res.screenH}
                      displaySizeInches={res.displaySizeInches}
                      selectedSeatId={activePov?.type === res.id ? activePov?.seat?.id : null}
                      onSelectSeat={(id) => setActivePov({
                        type: res.id,
                        title: res.title,
                        seat: res.seats.find(s => s.id === id),
                        room: effectiveRoom,
                        totalRows: res.seats.length > 0 ? Math.max(...res.seats.map(s => s.row)) + 1 : 1
                      })}
                    />
                  </div>

                  {/* Key Metrics */}
                  <div className={styles.statsColumn}>
                    <div className={styles.visibilityHeader}>
                      <div className={styles.cardLabel} style={{ marginBottom: 4 }}>Visibility analysis</div>
                      <div className={styles.cardSublabel}>{res.title}</div>
                    </div>
                    <div className={styles.statsList}>
                      {[
                        {
                          label: "Visibility Coverage",
                          desc: "Seats with a clear or basic view of the screen",
                          value: res.metrics.visibilityCoverage ?? 0,
                          suffix: "%",
                          inverse: false,
                          tooltip: `${res.metrics.breakdown.analytical + res.metrics.breakdown.basic} out of ${res.metrics.breakdown.total} seats covered`,
                        },
                        {
                          label: "Engagement Risk",
                          desc: "Seats where learning may be compromised",
                          value: res.metrics.engagementRisk ?? 0,
                          suffix: "%",
                          inverse: true,
                          tooltip: `${res.metrics.breakdown.passive + res.metrics.breakdown.unviewable} out of ${res.metrics.breakdown.total} seats at risk`,
                        },
                        {
                          label: "Inclusion index",
                          desc: "Fairness of seat quality across the room",
                          value: res.metrics.equityIndex ?? 0,
                          suffix: "",
                          inverse: false,
                          tooltip: "Score out of 100 based on seating distribution",
                        },
                      ].map(({ label, desc, value, suffix, inverse, tooltip }) => {
                        const adjusted = inverse ? 100 - value : value;
                        let status = "poor";
                        let statusLabel = "Poor";
                        if (adjusted >= SCORING_BENCHMARKS.excellent) {
                          status = "excellent";
                          statusLabel = "Excellent";
                        } else if (adjusted >= SCORING_BENCHMARKS.good) {
                          status = "good";
                          statusLabel = "Good";
                        } else if (adjusted >= SCORING_BENCHMARKS.medium) {
                          status = "medium";
                          statusLabel = "Medium";
                        }
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
                            <div 
                              className={styles.statBar} 
                              style={{ position: "relative", overflow: "visible" }}
                              onMouseEnter={() => setHoveredStat(`${res.id}-${label}`)}
                              onMouseLeave={() => setHoveredStat(null)}
                            >
                              <div
                                className={`${styles.statBarFill} ${styles[`fill_${status}`]}`}
                                style={{ width: `${value}%` }}
                              />
                              {hoveredStat === `${res.id}-${label}` && (
                                <div className={styles.barTooltip} style={{ bottom: "100%", zIndex: 10, left: `${value}%`, transform: "translateX(-50%)", marginBottom: "8px" }}>
                                  {tooltip}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Zone breakdown */}
                    {res.metrics.breakdown && (
                      <div className={styles.zoneBreakdown}>
                        <div className={styles.cardLabel} style={{ marginBottom: 12 }}>Seat Zone Breakdown</div>
                        <div className={styles.zoneBar}>
                          {["analytical", "basic", "passive", "unviewable"].map((zone) => {
                            const count = res.metrics.breakdown[zone] ?? 0;
                            const pct = res.metrics.breakdown.total > 0
                              ? (count / res.metrics.breakdown.total) * 100
                              : 0;
                            const colors = {
                              analytical: "#22c55e",
                              basic: "#f59e0b",
                              passive: "#ef4444",
                              unviewable: "#9ca3af",
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
                                onMouseEnter={() => setHoveredZone(`${res.id}-${zone}`)}
                                onMouseLeave={() => setHoveredZone(null)}
                              >
                                {hoveredZone === `${res.id}-${zone}` && (
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
                            { key: "unviewable", label: "Out of range", color: "#9ca3af" },
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
              ))}
            </div>

            {/* ── SECTION 3: Final CTA ── */}
            <div style={{ marginTop: "40px", padding: "32px 0", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px", color: "var(--text-primary)" }}>Discuss your classroom options with Epson</h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>Contact us today to speak to our education team.</p>
                <a href="#" style={{ fontSize: "14px", fontWeight: "600", color: "var(--epson-blue)", textDecoration: "underline" }}>Contact Epson</a>
              </div>
            </div>

          </div>
        </main>
      )}

      {/* ── POV MODAL OVERLAY ── */}
      {activePov && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.75)",
          zIndex: 9999,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px"
        }} onClick={() => setActivePov(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setActivePov(null)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "rgba(0,0,0,0.1)",
                border: "none",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M1 13L13 1" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <div style={{ textAlign: "center", fontWeight: "700", fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "1.5rem" }}>
              {activePov.title}
            </div>
            <POVViewer
              selectedSeat={activePov.seat}
              room={activePov.room}
              totalRows={activePov.totalRows}
            />
          </div>
        </div>
      )}

    </div>
  );
}
