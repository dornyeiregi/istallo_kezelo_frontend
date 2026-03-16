export interface FeedSchedDTO {
  feedSchedId?: number;
  feedMorning?: boolean;
  feedNoon?: boolean;
  feedEvening?: boolean;
  description: string;
  horseIds: number[];
  itemIds: number[];
  items?: FeedSchedItemAmountDTO[];
  itemNames?: string[];
}

export interface FeedSchedItemAmountDTO {
  itemId: number;
  amount: number;
}
