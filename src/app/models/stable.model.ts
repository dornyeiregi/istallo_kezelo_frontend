import { HorseDTO } from './horse.model';

export interface StableDTO {
  stableId?: number;
  stableName: string;
  horses: HorseDTO[];
}