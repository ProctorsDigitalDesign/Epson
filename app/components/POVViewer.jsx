"use client";
import React from 'react';
import styles from "./POVViewer.module.css";

const zoneColors = {
  analytical: "#22c55e",
  basic: "#f59e0b",
  passive: "#ef4444",
  unviewable: "#e5e7eb"
};

const zoneLabels = {
  analytical: "Clear viewing",
  basic: "Basic viewing",
  passive: "Passive/limited viewing",
  unviewable: "Out of range"
};

export default function POVViewer({ bestSeat, worstSeat }) {
  if (!bestSeat || !worstSeat) return null;

  const zoneImageMap = {
    analytical: "detailed.png",
    basic: "general.png",
    passive: "passive.png",
    unviewable: "out-of-range.png"
  };

  const renderViewColumn = (title, seat) => {
    const color = zoneColors[seat.zone] || "#000";
    const label = zoneLabels[seat.zone] || "Unknown Zone";
    const povImageSrc = `/pov/${zoneImageMap[seat.zone] ?? "general.png"}`;

    return (
      <div className={styles.viewColumn}>
        <div className={styles.viewHeader}>
          <div>
            <div className={styles.viewTitle}>{title}</div>
            <div className={styles.viewZoneInfo} style={{ color }}>
              <div className={styles.zoneDot} style={{ background: color }} />
              {label}
            </div>
          </div>
          <div className={styles.distanceBadge}>
            {seat.distanceFromScreen.toFixed(1)}m
          </div>
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
    <div className={styles.wrapper}>
      <div className={styles.compareContainer}>
        {renderViewColumn("Best View (Front Centre)", bestSeat)}
        {renderViewColumn("Worst View (Back Corner)", worstSeat)}
      </div>
    </div>
  );
}

