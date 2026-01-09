export type CalendarEventType = 'SHOT' | 'TREATMENT' | 'FARRIER_APP';

export interface CalendarEventDTO {
  id?: number;
  horseId: number;
  horseName?: string;
  stableId?: number;
  eventType: CalendarEventType | string;
  eventDate: string;
  relatedEntityId?: number;
}
