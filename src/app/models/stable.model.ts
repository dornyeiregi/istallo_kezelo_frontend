import { HorseDTO } from './horse.model';

export interface StableDTO {
  stableName: string;
  horses: HorseDTO[];
}