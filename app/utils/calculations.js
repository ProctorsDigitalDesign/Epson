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

export const LAYOUT_CONFIG = {
  SPACING: 1.2,          // 1.2m center-to-center desk spacing
  SIDE_MARGIN: 0.8,      // Room side margin
  BACK_MARGIN: 1.0,      // Room back margin
  THEATRE_AISLE: 0.8,    // Central aisle width for theatre style
  PAIRS_AISLE: 0.6       // Aisle width for pairs style
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
 * Reverse-calculate the diagonal size (inches) from a given physical width (metres).
 * aspectRatio should be a string like "16:9" or "4:3"
 */
export function screenMetresToDiagInches(widthMetres, aspectRatio = "16:9") {
  const [w, h] = aspectRatio.split(":").map(Number);
  const aspectDecimal = w / h;
  const height = widthMetres / aspectDecimal;
  const diagMetres = Math.sqrt(widthMetres * widthMetres + height * height);
  return Math.floor(diagMetres / 0.0254);
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

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let x = c * LAYOUT_CONFIG.SPACING; // un-centered base x
      let y = frontMargin + r * LAYOUT_CONFIG.SPACING; // metres from screen wall
      let skip = false;

      // Apply layout exclusions and gap injections
      if (layoutId === "ushape") {
        const wingSize = Math.floor(cols / 3) || 1;
        const isMiddleCol = c >= wingSize && c <= cols - 1 - wingSize;
        const isFrontOrMiddleRow = r < rows - 1;
        if (isMiddleCol && isFrontOrMiddleRow) skip = true;
      } else if (layoutId === "pairs") {
        const pairIndex = Math.floor(c / 2);
        x += pairIndex * LAYOUT_CONFIG.PAIRS_AISLE;
      } else if (layoutId === "theatre") {
        const half = Math.floor(cols / 2);
        if (cols > 1 && c >= half) {
          x += LAYOUT_CONFIG.THEATRE_AISLE;
        }
      }

      if (skip) continue;

      result.push({
        id: `seat-${r}-${c}`,
        col: c,
        row: r,
        x,
        y,
      });
    }
  }

  // Symmetrically prune excess seats from the back rows
  if (targetSeats !== null && result.length > targetSeats) {
    const centerCol = (cols - 1) / 2;
    while (result.length > targetSeats) {
      // Find the back-most row that still has seats
      const maxRow = Math.max(...result.map(s => s.row));
      const backRowIndices = result
        .map((s, idx) => ({ s, idx }))
        .filter(item => item.s.row === maxRow);

      // Sort back-row seats by distance from the center column descending (outermost first)
      backRowIndices.sort((a, b) => {
        const distA = Math.abs(a.s.col - centerCol);
        const distB = Math.abs(b.s.col - centerCol);
        return distB - distA; // Descending
      });

      // Remove the outermost seat from result
      const targetIndex = backRowIndices[0].idx;
      result.splice(targetIndex, 1);
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
      // Calculate radial distance from screen center (width/2, 0)
      s.distanceFromScreen = Math.sqrt(
        Math.pow(s.x - width / 2, 2) + Math.pow(s.y, 2)
      );

      const normalX = s.x / width;
      const normalY = s.y / depth;
      
      s.x = normalX;
      s.y = normalY;
      s.zone = classifyDistance(s.distanceFromScreen, screenH, multiplier);
      s.isBestSeat = false;
      s.isFurthestSeat = false;
    });

    // Recompute furthest seats (back corners)
    const maxRow = Math.max(...result.map(s => s.row));
    const backRowSeats = result.filter(s => s.row === maxRow);
    if (backRowSeats.length > 0) {
      const minCol = Math.min(...backRowSeats.map(s => s.col));
      const maxCol = Math.max(...backRowSeats.map(s => s.col));
      backRowSeats.forEach(s => {
        if (s.col === minCol || s.col === maxCol) s.isFurthestSeat = true;
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
  const visibilityCoverage = Math.round(((analytical + basic) / total) * 100);

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
  const { SPACING, SIDE_MARGIN, BACK_MARGIN, THEATRE_AISLE, PAIRS_AISLE } = LAYOUT_CONFIG;

  // Iteratively determine how many columns can physically fit given real aisle widths
  let maxCols = 1;
  while(true) {
    const testCols = maxCols + 1;
    let max_x = (testCols - 1) * SPACING;
    
    if (layoutId === "theatre" && testCols > 1) {
      max_x += THEATRE_AISLE;
    } else if (layoutId === "pairs") {
      const pairIndex = Math.floor((testCols - 1) / 2);
      max_x += pairIndex * PAIRS_AISLE;
    }

    if (max_x > roomWidth - 2 * SIDE_MARGIN) {
      break; // Doesn't fit
    }
    maxCols = testCols;
  }

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
        }
        count++;
      }
    }
    return count;
  };

  const maxPossibleSeats = countSeats(maxCols, maxRows);

  if (targetSeats > maxPossibleSeats) {
    return { cols: maxCols, rows: maxRows, actualSeats: maxPossibleSeats, isMaxedOut: true };
  }

  // Fill column-first: real classrooms are wide & shallow. 
  // We iterate rows (outer) and cols (inner) but we SCORE grids that
  // maximise cols relative to rows — i.e. fill the width of the room before
  // adding depth. We also want minimal wastage (extra seats beyond target).
  let bestGrid = null;

  for (let r = 1; r <= maxRows; r++) {
    for (let c = 1; c <= maxCols; c++) {
      const seats = countSeats(c, r);
      if (seats >= targetSeats) {
        const overshoot = seats - targetSeats;
        // Prefer grids where cols >= rows (wide, shallow — realistic classroom)
        // Give a heavy bonus for wide grids (more columns per row)
        const widthBias = Math.max(0, r - c) * 200; // penalise tall grids
        let symmetryPenalty = 0;
        if (layoutId === "pairs") {
          if (c % 3 !== 2) symmetryPenalty += 200;
        }
        const score = overshoot * 80 + widthBias + symmetryPenalty;
        if (!bestGrid || score < bestGrid.score) {
          bestGrid = { cols: c, rows: r, actualSeats: seats, isMaxedOut: false, score };
        }
      }
    }
  }

  return bestGrid || { cols: maxCols, rows: maxRows, actualSeats: maxPossibleSeats, isMaxedOut: true };
}
