"use client";
import { useMemo, useState } from "react";
import styles from "./InteractiveMap.module.css";
import { ZONE_META } from "../utils/calculations";

const ZONE_COLORS = {
  analytical: { fill: "rgba(26,122,74,0.45)", stroke: "rgba(26,122,74,0.9)" },
  basic:      { fill: "rgba(37,99,181,0.35)", stroke: "rgba(37,99,181,0.8)" },
  passive:    { fill: "rgba(196,124,18,0.25)", stroke: "rgba(196,124,18,0.7)" },
  unviewable: { fill: "rgba(100,20,20,0.2)", stroke: "rgba(139,26,26,0.5)" },
};

const SEAT_ZONE_COLORS = {
  analytical: "#3A5A40",  // dark green
  basic:      "#A3B18A",  // light green
  passive:    "#DDA15E",  // orange
  unviewable: "#9E9E9E",  // grey
};

export default function InteractiveMap({ seats, room, zones, screenWidthM, screenHeightM, selectedSeatId, onSelectSeat }) {
  const [hoveredSeatId, setHoveredSeatId] = useState(null);
  const SVG_W = 600;
  const SVG_H = 450;
  const PADDING = { top: 48, left: 32, right: 32, bottom: 24 };
  const MAP_W = SVG_W - PADDING.left - PADDING.right;
  const MAP_H = SVG_H - PADDING.top - PADDING.bottom;

  // Scale real-world metres to SVG pixels
  const scaleX = (x) => PADDING.left + (x / room.width) * MAP_W;
  const scaleY = (y) => PADDING.top + (y / room.depth) * MAP_H;

  // Screen horizontal centre
  const screenCX = SVG_W / 2;
  const screenCY = PADDING.top - 4;

  const zoneOrder = ["passive", "basic", "analytical"];

  // Organic Architectural Colors
  const ARCH_COLORS = {
    analytical: { fill: "rgba(58, 90, 64, 0.45)", stroke: "#3A5A40" },
    basic:      { fill: "rgba(163, 177, 138, 0.45)", stroke: "#A3B18A" },
    passive:    { fill: "rgba(221, 161, 94, 0.45)", stroke: "#DDA15E" },
    unviewable: { fill: "rgba(158, 158, 158, 0.25)", stroke: "#9E9E9E" },
  };

  const depthToRadius = (depthM) => (depthM / room.depth) * MAP_H;

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
      analytical: "Analytical Viewing",
      basic: "Basic Viewing",
      passive: "Passive Viewing",
      unviewable: "Out of Range"
    };
    const zoneColors = {
      analytical: "#3A5A40",
      basic:      "#A3B18A",
      passive:    "#DDA15E",
      unviewable: "#9E9E9E"
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

          {/* Background Card Area */}
          <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="#FAF8F2" rx="4" />

          {/* Room floor with wood plank pattern */}
          <rect
            x={PADDING.left} y={PADDING.top}
            width={MAP_W} height={MAP_H}
            fill="url(#woodPlanks)"
            stroke="#D0C9B2"
            strokeWidth="1.5"
            rx="4"
          />

          {/* Zone fills (drawn back-to-front) */}
          {zones && zoneOrder.map((key) => {
            const dist = zones[key];
            if (!dist) return null;
            const r = depthToRadius(dist);
            return (
              <ellipse
                key={key}
                cx={screenCX}
                cy={screenCY}
                rx={Math.min(r * 1.4, MAP_W * 0.9)}
                ry={r}
                fill={ARCH_COLORS[key].fill}
                stroke={ARCH_COLORS[key].stroke}
                strokeWidth="1.2"
                clipPath="url(#mapClip)"
              />
            );
          })}

          {/* Zone distance labels */}
          {zones && Object.entries(zones).map(([key, dist]) => {
            const r = depthToRadius(dist);
            if (r > MAP_H) return null;
            const labelY = screenCY + r;
            if (labelY > PADDING.top + MAP_H - 10) return null;
            return (
              <text
                key={`label-${key}`}
                x={PADDING.left + 8}
                y={labelY - 4}
                fontSize="9"
                fill="#8A826B"
                fontFamily="var(--font-body)"
                fontWeight="500"
              >
                {dist.toFixed(1)}m
              </text>
            );
          })}

          {/* Screen wall (solid dark bar) */}
          <rect
            x={screenCX - (screenWidthM / room.width) * MAP_W * 0.5}
            y={PADDING.top - 5}
            width={(screenWidthM / room.width) * MAP_W}
            height={5}
            fill="#3d5243"
            rx="1.5"
          />
          <text x={screenCX} y={PADDING.top - 12} textAnchor="middle"
            fontSize="10" fill="#4A6050" fontFamily="var(--font-display)" fontWeight="700" letterSpacing="0.05em">
            SCREEN ({Math.round(screenWidthM * 100)}cm wide)
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

          {/* Dimension labels */}
          <text x={screenCX} y={SVG_H - 8} textAnchor="middle"
            fontSize="10" fill="#8A826B" fontFamily="var(--font-body)">
            {room.width}m wide
          </text>
          <text
            transform={`translate(${PADDING.left - 10}, ${PADDING.top + MAP_H / 2}) rotate(-90)`}
            textAnchor="middle"
            fontSize="10" fill="#8A826B" fontFamily="var(--font-body)">
            {room.depth}m deep
          </text>
        </svg>
        
        {renderTooltip()}
      </div>

      {/* Zone legend */}
      <div className={styles.legend}>
        {Object.entries(ZONE_META).map(([key]) => {
          const colors = {
            analytical: "#3A5A40",
            basic:      "#A3B18A",
            passive:    "#DDA15E",
            unviewable: "#9E9E9E",
          };
          const labels = {
            analytical: "Analytical Viewing",
            basic:      "Basic Viewing",
            passive:    "Passive Viewing",
            unviewable: "Out of Range",
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
