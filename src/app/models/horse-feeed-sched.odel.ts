import { ItemDTO } from './item.model';

export interface HorseFeedSchedDTO {
  horseId: number;
  feedSchedId: number;
  horseName: string;
  feedDescription: string;
  items: ItemDTO[];
}
