import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-crud-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './crud-menu.html',
  styleUrls: ['./crud-menu.css'],
})
/**
 * Renders a reusable floating CRUD action menu.
 */
export class CrudMenuComponent {
  /**
   * Menu actions displayed in order with their label, icon, and callback.
   */
  @Input() actions: { label: string; icon: string; onClick: () => void }[] = [];

  menuOpen = false;

  /**
   * Opens or closes the action list.
   */
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  /**
   * Runs the selected action and closes the menu afterward.
   */
  execute(action: { label: string; icon: string; onClick: () => void }) {
    action.onClick();
    this.menuOpen = false;
  }
}
