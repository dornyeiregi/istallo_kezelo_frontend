export interface HorseDTO {
  horseName: string;
  dob: string;
  sex: 'M' | 'F' | 'G';   // Enum
  ownerName: string;
  ownerId: number;
  stableName: string;
  stableId: number;
  microchipNum: string;
  passportNum: string;
  additional: string;
}
