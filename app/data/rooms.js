// Room preset data for the Epson Classroom Simulator
// All dimensions in metres

export const ROOM_PRESETS = {
  small: {
    id: "small",
    label: "Small",
    description: "Primary / tutorial rooms",
    width: 6,    // metres (left-right, perpendicular to screen)
    depth: 7,    // metres (front-to-back, parallel to viewing axis)
    defaultSeats: { cols: 4, rows: 4 },
    icon: "🏫",
    color: "#6DC066",
  },
  medium: {
    id: "medium",
    label: "Medium",
    description: "Standard secondary classroom",
    width: 8,
    depth: 9,
    defaultSeats: { cols: 6, rows: 5 },
    icon: "🏫",
    color: "#00A3E0",
  },
  large: {
    id: "large",
    label: "Large",
    description: "Lecture hall / assembly room",
    width: 12,
    depth: 14,
    defaultSeats: { cols: 8, rows: 7 },
    icon: "🏛️",
    color: "#6C3483",
  },
};

// Seat spacing in metres (centre to centre)
export const SEAT_SPACING_H = 0.9; // horizontal
export const SEAT_SPACING_V = 0.9; // vertical (depth)
export const FRONT_MARGIN = 1.5;   // distance from screen to first row of seats

export const ROOM_PRESET_LIST = Object.values(ROOM_PRESETS);
