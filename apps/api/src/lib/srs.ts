import type { CardRating, SrsQuality } from "@teklin/shared";

export interface SrsState {
  /** Days until next review */
  interval: number;
  /** SM-2 ease factor (min 1.3) */
  easeFactor: number;
  /** Consecutive correct answers */
  repetitions: number;
  /** Unix epoch ms */
  nextReview: number;
}

const MIN_EASE_FACTOR = 1.3;
const MS_PER_DAY = 86400000;

/**
 * Maps a UI-facing CardRating to an SM-2 quality score.
 * "again" → 1, "hard" → 2, "good" → 3, "easy" → 5
 */
export function ratingToQuality(rating: CardRating): SrsQuality {
  switch (rating) {
    case "again":
      return 1;
    case "hard":
      return 2;
    case "good":
      return 3;
    case "easy":
      return 5;
  }
}

/**
 * Computes the next SRS state from the current state and user rating.
 * Pass null for `current` on first review of a new card.
 */
export function calculateSrs(
  current: SrsState | null,
  rating: CardRating
): SrsState {
  const quality = ratingToQuality(rating);

  const prevInterval = current?.interval ?? 1;
  const prevEaseFactor = current?.easeFactor ?? 2.5;
  const prevRepetitions = current?.repetitions ?? 0;

  // Update ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  const efDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const easeFactor = Math.max(MIN_EASE_FACTOR, prevEaseFactor + efDelta);

  let interval: number;
  let repetitions: number;

  if (quality < 3) {
    // again or hard: reset
    repetitions = 0;
    interval = 1;
  } else {
    // good or easy: advance
    repetitions = prevRepetitions + 1;
    if (prevRepetitions === 0) {
      interval = 1;
    } else if (prevRepetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * easeFactor);
    }
  }

  const nextReview = Date.now() + interval * MS_PER_DAY;

  return { interval, easeFactor, repetitions, nextReview };
}
