export interface FarrierAppDTO {
  farrierAppId?: number;
  farrierName: string;
  farrierPhone: string;
  appointmentDate: string;
  frequencyValue?: number | null;
  frequencyUnit?: string | null;
  shoes?: boolean | null;
  horseIds: number[];
  horseDetails?: FarrierHorseDetailDTO[];
}

export interface FarrierHorseDetailDTO {
  horseId: number;
  horseName?: string;
  shoeCount: number;
  note?: string | null;
}
