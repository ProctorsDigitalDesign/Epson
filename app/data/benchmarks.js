// Grading benchmarks for metric scores (0-100 scale)
// You can adjust these values manually to change the scoring thresholds across the application.

export const SCORING_BENCHMARKS = {
  excellent: 90, // Scores >= this value will be rated "Excellent"
  good: 75,      // Scores >= this value (but < excellent) will be rated "Good"
  medium: 50,    // Scores >= this value (but < good) will be rated "Medium"
                 // Scores below medium will automatically be rated "Poor"
};
