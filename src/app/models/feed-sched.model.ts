export interface FeedSchedDTO {
  feedTime: string;       // Enum (MORNING, NOON, EVENING)
  description: string;
  horseIds: number[];
  itemIds: number[];
}
