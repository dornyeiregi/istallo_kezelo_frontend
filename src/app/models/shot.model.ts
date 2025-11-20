export interface ShotDTO {
  shotId?: number;
  shotName: string;
  frequencyValue?: number | null;
  frequencyUnit?: string | null;
  date: string;
  horseIds?: number[];
}
