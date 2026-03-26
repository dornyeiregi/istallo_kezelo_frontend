export type CalendarEventType =
  | 'SHOT'
  | 'SHOT_DUE'
  | 'TREATMENT'
  | 'TREATMENT_DUE'
  | 'FARRIER_APP'
  | 'FARRIER_APP_DUE'
  | 'CUSTOM';

export interface CalendarEventDTO {
  id?: number;
  horseId: number;
  horseName?: string;
  stableId?: number;
  eventType: CalendarEventType | string;
  eventDate: string;
  relatedEntityId?: number;
  description?: string | null;
}
