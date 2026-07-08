"use client";
import styles from "./SimulatorSetup.module.css";
import { PROJECTORS } from "../data/projectors";
import { ROOM_PRESETS } from "../data/rooms";

const SEATING_LAYOUTS = [
  { id: "rows", label: "Rows" },
  { id: "clusters", label: "Clusters (Groups of 4)" },
  { id: "ushape", label: "U-Shape" },
  { id: "theatre", label: "Theatre Style" },
];


export default function SimulatorSetup({ config, onChange }) {
  const room = ROOM_PRESETS[config.roomId];
  const activeProjector = PROJECTORS.find(p => p.id === config.projectorId);

  const handleSeatsChange = (e) => {
    const val = e.target.value;
    if (val === "") {
      onChange({ targetSeats: "" });
    } else {
      onChange({ targetSeats: parseInt(val, 10) });
    }
  };

  const handleSeatsStep = (step) => {
    const current = parseInt(config.targetSeats, 10) || room?.defaultSeats?.cols * room?.defaultSeats?.rows || 30;
    const next = Math.max(1, current + step);
    onChange({ targetSeats: next });
  };

  const handleRoomChange = (e) => {
    const id = e.target.value;
    onChange({
      roomId: id,
      customWidth: null, // Reset to preset defaults
      customDepth: null,
    });
  };

  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>

      {/* Classroom Size & School Name */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="schoolName">
            School Name (for report)
          </label>
          <input
            id="schoolName"
            type="text"
            className={styles.input}
            placeholder="Enter school name"
            value={config.schoolName ?? ""}
            onChange={(e) => onChange({ schoolName: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="classroomSize">
            Classroom Size
          </label>
          <div className={styles.selectWrapper}>
            <select
              id="classroomSize"
              className={styles.select}
              value={config.roomId}
              onChange={handleRoomChange}
            >
              {Object.keys(ROOM_PRESETS).map((id) => (
                <option key={id} value={id}>
                  {ROOM_PRESETS[id].label} - {ROOM_PRESETS[id].description}
                </option>
              ))}
            </select>
            <div className={styles.selectChevron}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Projector Model + Screen Size */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="projectorModel">
            Projector Model
          </label>
          <div className={styles.selectWrapper}>
            <select
              id="projectorModel"
              className={styles.select}
              value={config.projectorId}
              onChange={(e) => {
                const newProjId = e.target.value;
                const newProj = PROJECTORS.find(p => p.id === newProjId);
                const max = newProj ? newProj.screenSizeRange[1] : 300;
                let newSize = config.screenSize;
                if (newSize > max) newSize = max;
                onChange({ projectorId: newProjId, screenSize: newSize });
              }}
            >
              {PROJECTORS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.subtitle})
                </option>
              ))}
            </select>
            <div className={styles.selectChevron}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          {activeProjector && (
            <div className={styles.projectorSpecs}>
              <div className={styles.specBadge}>
                Lumens: <strong>{activeProjector.lumens}</strong>
              </div>
              <div className={styles.specBadge}>
                Res: <strong>{activeProjector.resolution}</strong>
              </div>
              <div className={styles.specBadge}>
                Max: <strong>{activeProjector.screenSizeRange[1]}"</strong>
              </div>
            </div>
          )}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="screenSize">
            Screen / Display Size (inches)
          </label>
          <input
            id="screenSize"
            type="number"
            className={styles.input}
            min={40}
            max={activeProjector?.screenSizeRange[1] ?? 300}
            step={10}
            value={config.screenSize}
            onChange={(e) => {
              let val = parseInt(e.target.value, 10);
              const max = activeProjector?.screenSizeRange[1] ?? 300;
              if (val > max) val = max;
              onChange({ screenSize: val });
            }}
          />
        </div>
      </div>


      {/* Seating Layout & Target Seats */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="seatingLayout">
            Seating Layout
          </label>
          <div className={styles.selectWrapper}>
            <select
              id="seatingLayout"
              className={styles.select}
              value={config.seatingLayout ?? "rows"}
              onChange={(e) => onChange({ seatingLayout: e.target.value })}
            >
              {SEATING_LAYOUTS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <div className={styles.selectChevron}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="targetSeats">
            Target Number of Seats
          </label>
          <div className={styles.numberInputWrapper}>
            <input
              id="targetSeats"
              type="number"
              className={styles.numberInput}
              min={1}
              max={300}
              step={1}
              value={config.targetSeats !== undefined ? config.targetSeats : (room?.defaultSeats?.cols * room?.defaultSeats?.rows ?? 30)}
              onChange={handleSeatsChange}
            />
            <div className={styles.numberControls}>
              <button type="button" className={styles.numBtn} onClick={() => handleSeatsStep(-1)}>−</button>
              <button type="button" className={styles.numBtn} onClick={() => handleSeatsStep(1)}>+</button>
            </div>
          </div>
        </div>
      </div>

    </form>
  );
}
