"use client";
import { useMemo, useState } from "react";
import styles from "./InteractiveMap.module.css";
import { ZONE_META } from "../utils/calculations";

const ZONE_COLORS = {
  analytical: { fill: "rgba(34,197,94,0.15)", stroke: "#22c55e" },
  basic:      { fill: "rgba(245,158,11,0.15)", stroke: "#f59e0b" },
  passive:    { fill: "rgba(239,68,68,0.15)", stroke: "#ef4444" },
  unviewable: { fill: "transparent", stroke: "#9ca3af" },
};

const SEAT_ZONE_COLORS = {
  analytical: "#22c55e",  // Green
  basic:      "#f59e0b",  // Amber
  passive:    "#ef4444",  // Red
  unviewable: "#9ca3af",  // Uncoloured (light grey)
};

export default function InteractiveMap({ seats, room, zones, screenWidthM, screenHeightM, displaySizeInches, selectedSeatId, onSelectSeat }) {
  const [hoveredSeatId, setHoveredSeatId] = useState(null);
  const SVG_W = 600;
  const SVG_H = 450;
  const PADDING = { top: 32, left: 32, right: 32, bottom: 24 };
  const MAP_W = SVG_W - PADDING.left - PADDING.right;
  const MAP_H = SVG_H - PADDING.top - PADDING.bottom;

  // Scale real-world metres to SVG pixels
  const scaleX = (x) => PADDING.left + (x / room.width) * MAP_W;
  const scaleY = (y) => PADDING.top + (y / room.depth) * MAP_H;

  // Screen horizontal centre
  const screenCX = SVG_W / 2;
  const screenCY = PADDING.top;

  const ARCH_COLORS = {
    analytical: { fill: "rgba(34,197,94,0.15)", stroke: "#22c55e" },
    basic:      { fill: "rgba(245,158,11,0.15)", stroke: "#f59e0b" },
    passive:    { fill: "rgba(239,68,68,0.15)", stroke: "#ef4444" },
    unviewable: { fill: "transparent", stroke: "#9ca3af" },
  };

  const renderTooltip = () => {
    if (!hoveredSeatId) return null;
    const selectedSeat = seats.find(s => s.id === hoveredSeatId);
    if (!selectedSeat) return null;
    
    const sx = scaleX(selectedSeat.x * room.width);
    const sy = scaleY(selectedSeat.y * room.depth);
    const leftPct = (sx / SVG_W) * 100;
    const topPct = (sy / SVG_H) * 100;

    const zoneDescriptions = {
      analytical: "Student can easily read fine text, spreadsheets, and detailed equations.",
      basic: "Student can comfortably read standard presentation slides and large text.",
      passive: "Student can watch videos and images, but reading text will cause eye strain.",
      unviewable: "Student cannot effectively see the screen. High risk of disengagement."
    };
    const zoneLabels = {
      analytical: "Clear viewing",
      basic: "Basic viewing",
      passive: "Passive/limited viewing",
      unviewable: "Out of range"
    };
    const zoneColors = {
      analytical: "#22c55e",
      basic:      "#f59e0b",
      passive:    "#ef4444",
      unviewable: "#9ca3af"
    };

    return (
      <div 
        className={styles.tooltip} 
        style={{ left: `${leftPct}%`, top: `${topPct}%` }}
      >
        <div className={styles.tooltipHeader}>
          <div className={styles.tooltipSeatInfo}>Row {selectedSeat.row + 1}, Seat {selectedSeat.col + 1}</div>
          <div className={styles.tooltipDistance}>{selectedSeat.distanceFromScreen.toFixed(1)}m from screen</div>
        </div>
        <div className={styles.tooltipZoneBadge} style={{ color: zoneColors[selectedSeat.zone] }}>
          <div className={styles.tooltipZoneDot} style={{ background: zoneColors[selectedSeat.zone] }} />
          {zoneLabels[selectedSeat.zone]}
        </div>
        <div className={styles.tooltipDesc}>
          {zoneDescriptions[selectedSeat.zone]}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      {/* SVG Map */}
      <div className={styles.mapContainer}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className={styles.svg}
          role="img"
          aria-label="Classroom blueprint map with viewing zones"
        >
          <defs>
            {/* Architectural Wood Floor Pattern */}
            <pattern id="woodPlanks" width="16" height="16" patternUnits="userSpaceOnUse">
              <rect width="16" height="16" fill="#F9F6EA" />
              <line x1="16" y1="0" x2="16" y2="16" stroke="#EDE8D4" strokeWidth="1" />
            </pattern>
            {/* Map Area Clip */}
            <clipPath id="mapClip">
              <rect x={PADDING.left} y={PADDING.top} width={MAP_W} height={MAP_H} rx="4" />
            </clipPath>
          </defs>

          {/* Background Card Area Removed */}

          {/* Room floor with wood plank pattern */}
          <rect
            x={PADDING.left} y={PADDING.top}
            width={MAP_W} height={MAP_H}
            fill="url(#woodPlanks)"
            stroke="#D0C9B2"
            strokeWidth="1.5"
            rx="4"
          />

          {/* Zone fills (drawn back-to-front as arches) */}
          {zones && (() => {
            const zoneKeys = ["passive", "basic", "analytical"];
            return zoneKeys.map((key) => {
              const dist = zones[key];
              if (!dist) return null;
              
              // Map physical radius (dist) to SVG coordinates
              const rx = (dist / room.width) * MAP_W;
              const ry = (dist / room.depth) * MAP_H;
              
              return (
                <ellipse
                  key={key}
                  cx={screenCX}
                  cy={screenCY}
                  rx={rx}
                  ry={ry}
                  fill={ARCH_COLORS[key].fill}
                  stroke={ARCH_COLORS[key].stroke}
                  strokeWidth="1.2"
                  clipPath="url(#mapClip)"
                />
              );
            });
          })()}

          {/* Screen wall (solid dark bar sitting on top edge of floor) */}
          <rect
            x={screenCX - (screenWidthM / room.width) * MAP_W * 0.5}
            y={PADDING.top - 6}
            width={(screenWidthM / room.width) * MAP_W}
            height={6}
            fill="#3d5243"
            rx="1.5"
          />
          {/* SCREEN TEXT OUTSIDE ROOM */}
          <text x={screenCX} y={PADDING.top - 12} textAnchor="middle"
            fontSize="9" fill="#4A6050" fontFamily="var(--font-display)" fontWeight="700" letterSpacing="0.05em">
            Screen ({displaySizeInches}")
          </text>

          {/* Seats */}
          {seats.map((seat) => {
            const sx = scaleX(seat.x * room.width);
            const sy = scaleY(seat.y * room.depth);
            const isSelected = selectedSeatId === seat.id;

              return (
              <g
                key={seat.id}
                transform={`translate(${sx},${sy})`}
                onClick={() => onSelectSeat && onSelectSeat(seat.id)}
                onMouseEnter={() => setHoveredSeatId(seat.id)}
                onMouseLeave={() => setHoveredSeatId(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Selection ring */}
                {isSelected && (
                  <rect
                    x="-15"
                    y="-11"
                    width="30"
                    height="24"
                    fill="none"
                    stroke="#2c3b30"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                    rx="3"
                  />
                )}
                {/* Minimalist Architectural Desk — coloured by zone */}
                <rect x="-9" y="-6" width="18" height="10" rx="1"
                  fill={SEAT_ZONE_COLORS[seat.zone] ?? "#3d5243"}
                  fillOpacity="0.75"
                />
                {/* Minimalist Chair Curve */}
                <path d="M -6,8 A 6,6 0 0,0 6,8" fill="none" stroke={SEAT_ZONE_COLORS[seat.zone] ?? "#3d5243"} strokeWidth="1.5" strokeLinecap="round" />
              </g>
            );
          })}

          {/* Dimension labels outside room floor boundary without any wrapping capsules */}
          {/* Bottom width label */}
          <text x={screenCX} y={SVG_H - 8} textAnchor="middle"
            fontSize="9" fill="#8A826B" fontFamily="var(--font-body)" fontWeight="600">
            {room.width}m wide
          </text>
          {/* Left depth label */}
          <text
            transform={`translate(${PADDING.left - 10}, ${PADDING.top + MAP_H / 2}) rotate(-90)`}
            textAnchor="middle"
            fontSize="9" fill="#8A826B" fontFamily="var(--font-body)" fontWeight="600">
            {room.depth}m deep
          </text>
        </svg>
        
        {renderTooltip()}
      </div>

      {/* Zone legend */}
      <div className={styles.legend}>
        {Object.entries(ZONE_META).map(([key]) => {
          const colors = {
            analytical: "#22c55e",
            basic:      "#f59e0b",
            passive:    "#ef4444",
            unviewable: "#9ca3af",
          };
          const labels = {
            analytical: "Clear viewing",
            basic:      "Basic viewing",
            passive:    "Passive/limited viewing",
            unviewable: "Out of range",
          };
          return (
            <div key={key} className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: colors[key] }} />
              <span className={styles.legendLabel}>{labels[key]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
