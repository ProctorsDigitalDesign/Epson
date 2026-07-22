"use client";
import React from 'react';
import styles from "./POVViewer.module.css";

const zoneColors = {
  analytical: "#22c55e",
  basic: "#f59e0b",
  passive: "#ef4444",
  unviewable: "#9ca3af"
};

const zoneLabels = {
  analytical: "Clear viewing",
  basic: "Basic viewing",
  passive: "Passive/limited viewing",
  unviewable: "Out of range"
};

const zoneDescriptions = {
  analytical: "Student can easily read fine text, spreadsheets, and detailed equations.",
  basic: "Student can comfortably read standard presentation slides and large text.",
  passive: "Student can watch videos and images, but reading text will cause eye strain.",
  unviewable: "Student cannot effectively see the screen. High risk of disengagement."
};

export default function POVViewer({ selectedSeat, room, totalRows = 1 }) {
  if (!selectedSeat) {
    return (
      <div className={styles.wrapper} style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
        Click a seat on the map to see the student's point of view.
      </div>
    );
  }

  const zoneImageMap = {
    analytical: "detailed.png",
    basic: "general.png",
    passive: "passive.png",
    unviewable: "out-of-range.png"
  };

  const isFrontHalf = selectedSeat.row < (totalRows / 2);
  const title = isFrontHalf ? "Front row view" : "Back row view";

  const renderViewColumn = (title, seat) => {
    const color = zoneColors[seat.zone] || "#000";
    const label = zoneLabels[seat.zone] || "Unknown Zone";
    const povImageSrc = `/pov/${zoneImageMap[seat.zone] ?? "general.png"}`;

    return (
      <div className={styles.viewColumn} style={{ width: "100%" }}>
        <div className={styles.viewHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div className={styles.viewTitle} style={{ margin: 0 }}>{title}</div>
          <div className={styles.viewZoneInfo} style={{ color }}>
            <div className={styles.zoneDot} style={{ background: color }} />
            {label}
          </div>
        </div>
        
        <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px", marginTop: "4px" }}>
          {zoneDescriptions[seat.zone]}
        </div>

        <div className={styles.viewport}>
          <img
            src={povImageSrc}
            alt={`Point of view from ${label}`}
            className={styles.povImage}
          />
          <div
            className={styles.zoneOverlay}
            style={{
              background: `radial-gradient(ellipse at 50% 40%, ${color}1A 0%, transparent 70%)`,
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={styles.wrapper} style={{ gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        {renderViewColumn(title, selectedSeat)}
      </div>
      <div style={{ marginTop: "0", fontSize: "11px", color: "var(--text-muted)", textAlign: "left", fontStyle: "italic", width: "100%", lineHeight: "1.4" }}>
        Disclaimer: The classroom images shown are illustrative visualisations generated from your selected room and projector settings. They're only intended as a guide and may not represent the exact installation conditions or projector performance.
      </div>
    </div>
  );
}

