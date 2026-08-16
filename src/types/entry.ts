export type ActivityType = "work" | "workout" | "light-movement" | "break";

export interface DaywardenEntry {
  id: string;
  createdAt: string;

  note: string;
  activities: ActivityType[];

  pain: number;
  painLocation: string;

  motivation: number;
  intensity: number;

  tags: string[];
  bookmarked: boolean;
}
