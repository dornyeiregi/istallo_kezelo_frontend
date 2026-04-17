export interface HorseDTO {
  id?: number;
  horseName: string;
  dob: string;
  sex: string;

  ownerId?: number;
  ownerName?: string;
  ownerPhone?: string;

  stableId?: number;
  stableName?: string;

  microchipNum: string;
  passportNum: string;
  additional: string;
  isActive?: boolean;
  isPending?: boolean;
  feedSchedId?: number;
}
