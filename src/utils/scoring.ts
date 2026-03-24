// Calculate star rating (1-5) based on accuracy percentage
// Stars are accuracy-based only per PRD
export function calculateStars(accuracy: number): number {
  if (accuracy >= 98) return 5;
  if (accuracy >= 90) return 4;
  if (accuracy >= 80) return 3;
  if (accuracy >= 65) return 2;
  return 1;
}

// Minimum stars required to unlock next lesson (client confirmed: 4)
export const MIN_STARS_TO_UNLOCK = 4;

// Calculate words per minute
export function calculateWPM(charCount: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  const minutes = durationMs / 60000;
  const words = charCount / 5; // standard: 5 chars = 1 word
  return Math.round(words / minutes);
}

// Calculate accuracy percentage
export function calculateAccuracy(correctCount: number, totalAttempts: number): number {
  if (totalAttempts === 0) return 0;
  return Math.round((correctCount / totalAttempts) * 100);
}
