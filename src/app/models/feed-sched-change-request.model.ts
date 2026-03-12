export interface FeedSchedChangeRequestDTO {
  id: number;
  feedSchedId: number;
  feedTime?: string;
  description?: string;
  requestedByName?: string;
  requestedAt?: string;
  horseIds?: number[];
  itemIds?: number[];
}
