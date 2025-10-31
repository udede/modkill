/**
 * Scoring weights and formulas for module prioritization
 */

export const SCORING_WEIGHTS = {
  AGE: 0.5,
  SIZE: 0.4,
  ORPHAN: 0.1,
} as const;

export const ORPHAN_BONUS_POINTS = 10;

export const INTERACTIVE_SCORE_EXPONENTS = {
  SIZE: 0.7,
  AGE: 0.3,
} as const;
