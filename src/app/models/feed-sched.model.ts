export interface FeedSchedDTO {
  feedSchedId?: number;
  feedTime: string;       // Enum (MORNING, NOON, EVENING)
  description: string;
  horseIds: number[];
  itemIds: number[];
  itemNames?: string[];
}
