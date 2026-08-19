export type FaceRating = 1 | 2 | 3 | 4 | 5;

export interface FaceOption {
  value: FaceRating;
  label: string;
  face: string;
}

export const FACE_OPTIONS: FaceOption[] = [
  {
    value: 1,
    label: "Very bad",
    face: "😞",
  },
  {
    value: 2,
    label: "Bad",
    face: "🙁",
  },
  {
    value: 3,
    label: "Neutral",
    face: "😐",
  },
  {
    value: 4,
    label: "Good",
    face: "🙂",
  },
  {
    value: 5,
    label: "Very good",
    face: "😄",
  },
];

export function normalizeFaceRating(
  value: unknown,
): FaceRating {
  const numericValue =
    typeof value === "number"
      ? value
      : Number(value);

  const rounded =
    Math.round(numericValue);

  return Math.min(
    5,
    Math.max(1, rounded),
  ) as FaceRating;
}

export function getFaceOption(
  value: unknown,
): FaceOption {
  const normalized =
    normalizeFaceRating(value);

  return (
    FACE_OPTIONS.find(
      (option) =>
        option.value === normalized,
    ) ?? FACE_OPTIONS[2]
  );
}
