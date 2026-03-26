export interface TreatmentDTO {
  treatmentId?: number;
  treatmentName: string;
  description: string;
  frequencyValue?: number | null;
  frequencyUnit?: string | null;
  date: string;
  horseIds?: number[];
}
