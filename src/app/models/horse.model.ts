export interface HorseDTO {
  horseId?: number;
  horseName: string;
  dob: string;
  sex: string;

  ownerId?: number;
  ownerName?: string;

  stableId?: number;
  stableName?: string;

  microchipNum: string;
  passportNum: string;
  additional: string;
}