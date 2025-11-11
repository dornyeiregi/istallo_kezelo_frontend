import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-crud-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './crud-menu.html',
  styleUrls: ['./crud-menu.css']
})
export class CrudMenuComponent {
  @Input() actions: { label: string; icon: string; onClick: () => void }[] = [];

  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  execute(action: { label: string; icon: string; onClick: () => void }) {
    action.onClick();
    this.menuOpen = false;
  }
}
