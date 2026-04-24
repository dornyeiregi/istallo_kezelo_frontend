/**
 * Inventory item metadata used by storage-related pages.
 */
export interface ItemDTO {
  itemId?: number;
  name: string;
  /**
   * Backend item type enum.
   */
  itemType: string;
  /**
   * Backend item category enum.
   */
  itemCategory: string;
  feedUnitAmount?: number | null;
}
