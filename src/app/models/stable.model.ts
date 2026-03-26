import { HorseDTO } from './horse.model';

export interface StableItemDTO {
  itemId: number;
  usageKg: number;
  itemName?: string;
}

export interface StableDTO {
  stableId?: number;
  stableName: string;
  strawUsageKg?: number | null;
  stableItems?: StableItemDTO[];
  horses: HorseDTO[];
}
