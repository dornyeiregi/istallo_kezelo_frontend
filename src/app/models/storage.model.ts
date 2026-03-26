export interface StorageDTO {
  storageId?: number;
  amountInUse: number;
  amountStored: number;
  itemId: number;
  itemName?: string;
  daysRemaining?: number | null;
  warningLevel?: 'NONE' | 'YELLOW' | 'RED';
  lastChecked?: string;
}
