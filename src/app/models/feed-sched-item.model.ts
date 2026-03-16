export interface FeedSchedItemDTO {
  feedSchedId: number;
  itemId: number;
  itemName: string;
  feedDescription: string;
  amount?: number | null;
}
