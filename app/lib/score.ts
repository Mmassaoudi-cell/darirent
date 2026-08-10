export type ScoreBreakdown = {
  priceValue: number;
  conditionScore: number;
  trustScore: number;
  locationFit: number;
  composite: number;
  modelVersion: "weighted-v1";
};

export const SCORE_WEIGHTS = {
  priceValue: 0.3,
  conditionScore: 0.25,
  trustScore: 0.25,
  locationFit: 0.2,
} as const;

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateCompositeScore(
  components: Omit<ScoreBreakdown, "composite" | "modelVersion">,
): ScoreBreakdown {
  const priceValue = clampScore(components.priceValue);
  const conditionScore = clampScore(components.conditionScore);
  const trustScore = clampScore(components.trustScore);
  const locationFit = clampScore(components.locationFit);

  return {
    priceValue,
    conditionScore,
    trustScore,
    locationFit,
    composite: clampScore(
      priceValue * SCORE_WEIGHTS.priceValue +
        conditionScore * SCORE_WEIGHTS.conditionScore +
        trustScore * SCORE_WEIGHTS.trustScore +
        locationFit * SCORE_WEIGHTS.locationFit,
    ),
    modelVersion: "weighted-v1",
  };
}

export function scoreNewProperty(input: {
  priceDt: number;
  sizeM2: number;
  furnished: boolean;
  parking: boolean;
  elevator: boolean;
  identityVerified: boolean;
}) {
  const pricePerM2 = input.priceDt / Math.max(input.sizeM2, 1);
  const priceValue = 92 - Math.abs(pricePerM2 - 14) * 4;
  const conditionScore =
    62 + (input.furnished ? 6 : 0) + (input.parking ? 5 : 0) + (input.elevator ? 4 : 0);
  const trustScore = input.identityVerified ? 90 : 62;

  return calculateCompositeScore({
    priceValue,
    conditionScore,
    trustScore,
    locationFit: 75,
  });
}

export function scoreLabel(score: number) {
  if (score >= 90) return "Exceptional match";
  if (score >= 80) return "Strong opportunity";
  if (score >= 70) return "Worth considering";
  if (score >= 60) return "Review carefully";
  if (score >= 40) return "Weak opportunity";
  return "High caution";
}
