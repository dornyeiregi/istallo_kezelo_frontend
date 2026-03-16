export interface FeedSchedChangeRequestDTO {
  id: number;
  feedSchedId: number;
  requestedMorning?: boolean;
  requestedNoon?: boolean;
  requestedEvening?: boolean;
  description?: string;
  requestedByName?: string;
  requestedAt?: string;
  horseIds?: number[];
  itemIds?: number[];
}
