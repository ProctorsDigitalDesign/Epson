// Epson Classroom Simulator — Core calculation utilities
// Based on the industry-standard 4/6/8 Rule for display sizing

/**
 * 4/6/8 Rule:
 *   ANALYTICAL zone  (reading fine text) : distance ≤ 4  × screen height
 *   BASIC zone       (presentations)      : distance ≤ 6  × screen height
 *   PASSIVE zone     (video/movies)       : distance ≤ 8  × screen height
 *   UNVIEWABLE       : distance  > 8  × screen height
 */

export const ZONE_MULTIPLIERS = {
  analytical: 4,
  basic: 6,
  passive: 8,
};

export const ZONE_META = {
  analytical: {
    label: "Analytical Zone",
    sublabel: "For text & detailed info",
    multiplier: 4,
    color: "var(--zone-analytical)",
    textColor: "#fff",
  },
  basic: {
    label: "Basic Zone",
    sublabel: "For presentations",
    multiplier: 6,
    color: "var(--zone-basic)",
    textColor: "#fff",
  },
  passive: {
    label: "Passive Zone",
    sublabel: "For video & movies",
    multiplier: 8,
    color: "var(--zone-passive)",
    textColor: "#1a1a2e",
  },
  unviewable: {
    label: "Unviewable",
    sublabel: "Too far from screen",
    multiplier: Infinity,
    color: "var(--zone-unviewable)",
    textColor: "#fff",
  },
};

/**
 * Convert diagonal screen size (inches) to width and height (metres).
 * aspectRatio should be a string like "16:9" or "4:3"
 */
export function screenDiagToMetres(diagonalInches, aspectRatio = "16:9") {
  const [w, h] = aspectRatio.split(":").map(Number);
  const aspectDecimal = w / h;
  const diagMetres = diagonalInches * 0.0254;
  const height = diagMetres / Math.sqrt(1 + aspectDecimal * aspectDecimal);
  const width = height * aspectDecimal;
  return { width, height };
}

/**
 * Given a screen height (metres), return the max distances for each zone.
 */
export function getZoneDistances(screenHeightM, multiplier = 1.0) {
  return {
    analytical: screenHeightM * ZONE_MULTIPLIERS.analytical * multiplier,
    basic: screenHeightM * ZONE_MULTIPLIERS.basic * multiplier,
    passive: screenHeightM * ZONE_MULTIPLIERS.passive * multiplier,
  };
}

/**
 * Classify a viewing distance (metres) into a zone string.
 */
export function classifyDistance(distanceM, screenHeightM, multiplier = 1.0) {
  const zones = getZoneDistances(screenHeightM, multiplier);
  if (distanceM <= zones.analytical) return "analytical";
  if (distanceM <= zones.basic) return "basic";
  if (distanceM <= zones.passive) return "passive";
  return "unviewable";
}

/**
 * Generate seat positions for the top-down map.
 * Returns an array of { col, row, x, y (relative, 0-1 normalised), distanceFromScreen, zone }
 *
 * @param {object} room       - Room preset object { width, depth }
 * @param {object} seats      - { cols, rows }
 * @param {number} screenH    - Screen height in metres
 * @param {string} layoutId   - The seating layout type (rows, ushape, clusters, theatre)
 * @param {number} frontMargin - Metres from screen wall to first row
 * @param {number} multiplier - Coverage multiplier for standard monitor penalty
 */
export function generateSeats(room, seats, screenH, layoutId = "rows", targetSeats = null, frontMargin = 1.5, multiplier = 1.0) {
  const { width, depth } = room;
  const { cols, rows } = seats;

  const result = [];

  outerLoop:
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (targetSeats !== null && result.length >= targetSeats) {
        break outerLoop;
      }

      // Apply layout exclusions
      if (layoutId === "ushape") {
        const wingSize = Math.floor(cols / 3) || 1;
        const isMiddleCol = c >= wingSize && c <= cols - 1 - wingSize;
        const isFrontOrMiddleRow = r < rows - 1;
        if (isMiddleCol && isFrontOrMiddleRow) continue;
      } else if (layoutId === "clusters") {
        const isAisleCol = c % 3 === 2;
        const isAisleRow = r % 3 === 2;
        if (isAisleCol || isAisleRow) continue;
      } else if (layoutId === "theatre") {
        const isCenterAisle = cols % 2 === 0 ? (c === cols/2 || c === cols/2 - 1) : (c === Math.floor(cols/2));
        if (isCenterAisle) continue;
      }

      const x = c * 0.9; // temp un-centered x
      const y = frontMargin + r * 0.9; // metres from screen wall

      const distanceFromScreen = y;

      result.push({
        id: `seat-${r}-${c}`,
        col: c,
        row: r,
        x,
        y,
        distanceFromScreen,
      });
    }
  }

  // Dynamically center the grid based on actual bounds
  if (result.length > 0) {
    const minX = Math.min(...result.map(s => s.x));
    const maxX = Math.max(...result.map(s => s.x));
    const actualGridWidth = maxX - minX;
    const startX = (width - actualGridWidth) / 2;

    result.forEach(s => {
      s.x = startX + (s.x - minX);
      
      const normalX = s.x / width;
      const normalY = s.y / depth;
      
      s.x = normalX;
      s.y = normalY;
      s.zone = classifyDistance(s.distanceFromScreen, screenH, multiplier);
      s.isWorstSeat = false;
      s.isBestSeat = false;
    });

    // Recompute worst seats (back corners)
    const maxRow = Math.max(...result.map(s => s.row));
    const backRowSeats = result.filter(s => s.row === maxRow);
    if (backRowSeats.length > 0) {
      const minCol = Math.min(...backRowSeats.map(s => s.col));
      const maxCol = Math.max(...backRowSeats.map(s => s.col));
      backRowSeats.forEach(s => {
        if (s.col === minCol || s.col === maxCol) s.isWorstSeat = true;
      });
    }

    // Recompute best seats (front centre)
    const minRow = Math.min(...result.map(s => s.row));
    const frontRowSeats = result.filter(s => s.row === minRow);
    if (frontRowSeats.length > 0) {
      const sortedCols = [...new Set(frontRowSeats.map(s => s.col))].sort((a,b)=>a-b);
      const midIdx = Math.floor(sortedCols.length / 2);
      const centerCols = sortedCols.length % 2 === 0 
        ? [sortedCols[midIdx - 1], sortedCols[midIdx]] 
        : [sortedCols[midIdx]];
        
      frontRowSeats.forEach(s => {
        if (centerCols.includes(s.col)) s.isBestSeat = true;
      });
    }
  }

  return result;
}

/**
 * Calculate the three key metrics shown in the insights dashboard.
 *
 * @returns { visibilityCoverage, engagementRisk, equityIndex }
 */
export function calculateMetrics(seats) {
  const total = seats.length;
  if (total === 0) return { visibilityCoverage: 0, engagementRisk: 0, equityIndex: 0 };

  const analytical = seats.filter((s) => s.zone === "analytical").length;
  const basic = seats.filter((s) => s.zone === "basic").length;
  const passive = seats.filter((s) => s.zone === "passive").length;
  const unviewable = seats.filter((s) => s.zone === "unviewable").length;

  // Visibility Coverage: % of seats that are at least "basic" (can see a presentation)
  const visibilityCoverage = Math.round(((total - unviewable) / total) * 100);

  // Engagement Risk: % of seats where students struggle (passive + unviewable)
  const engagementRisk = Math.round(((passive + unviewable) / total) * 100);

  // Equity Index: weighted score 0-100, based on how well distributed the good seats are
  // Perfect = all analytical (100), worst = all unviewable (0)
  const weighted = analytical * 100 + basic * 75 + passive * 35 + unviewable * 0;
  const equityIndex = Math.round(weighted / total);

  return {
    visibilityCoverage,
    engagementRisk,
    equityIndex,
    breakdown: { analytical, basic, passive, unviewable, total },
  };
}

/**
 * Given a projector throw ratio and screen width, calculate the minimum
 * throw distance (i.e. how far from the screen the projector must sit).
 */
export function calcThrowDistance(throwRatio, screenWidthM) {
  return throwRatio * screenWidthM;
}

/**
 * For a given projector's throw ratio, calculate the screen width achievable
 * at a specific throw distance.
 */
export function calcScreenWidthAtDistance(throwRatio, throwDistanceM) {
  return throwDistanceM / throwRatio;
}

/**
 * Calculates the optimal grid size (cols, rows) to fit a target number of seats
 * within the physical dimensions of the room.
 */
export function calculateOptimalGrid(targetSeats, roomWidth, roomDepth, layoutId, frontMargin = 1.5) {
  const SPACING = 0.9;
  const SIDE_MARGIN = 0.8;
  const BACK_MARGIN = 1.0;

  const maxCols = Math.max(1, Math.floor((roomWidth - 2 * SIDE_MARGIN) / SPACING) + 1);
  const maxRows = Math.max(1, Math.floor((roomDepth - frontMargin - BACK_MARGIN) / SPACING) + 1);

  const countSeats = (cols, rows) => {
    let count = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (layoutId === "ushape") {
          const wingSize = Math.floor(cols / 3) || 1;
          const isMiddleCol = c >= wingSize && c <= cols - 1 - wingSize;
          const isFrontOrMiddleRow = r < rows - 1;
          if (isMiddleCol && isFrontOrMiddleRow) continue;
        } else if (layoutId === "clusters") {
          const isAisleCol = c % 3 === 2;
          const isAisleRow = r % 3 === 2;
          if (isAisleCol || isAisleRow) continue;
        } else if (layoutId === "theatre") {
          const isCenterAisle = cols % 2 === 0 ? (c === cols/2 || c === cols/2 - 1) : (c === Math.floor(cols/2));
          if (isCenterAisle) continue;
        }
        count++;
      }
    }
    return count;
  };

  let bestGrid = null;
  const maxPossibleSeats = countSeats(maxCols, maxRows);

  if (targetSeats > maxPossibleSeats) {
    return { cols: maxCols, rows: maxRows, actualSeats: maxPossibleSeats, isMaxedOut: true };
  }

  const targetRatio = roomWidth / roomDepth;
  
  for (let r = 1; r <= maxRows; r++) {
    for (let c = 1; c <= maxCols; c++) {
      const seats = countSeats(c, r);
      if (seats >= targetSeats) {
        const diff = seats - targetSeats;
        const ratio = c / r;
        const ratioDiff = Math.abs(ratio - targetRatio);
        const score = diff * 100 + ratioDiff;
        
        if (!bestGrid || score < bestGrid.score) {
          bestGrid = { cols: c, rows: r, actualSeats: seats, isMaxedOut: false, score };
        }
      }
    }
  }

  return bestGrid || { cols: maxCols, rows: maxRows, actualSeats: maxPossibleSeats, isMaxedOut: true };
}
