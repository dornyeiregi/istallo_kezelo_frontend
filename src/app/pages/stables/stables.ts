import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StableService } from '../../services/stable.service';
import { StableDTO } from '../../models/stable.model';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';

@Component({
  selector: 'app-stables',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudMenuComponent, RouterLink],
  templateUrl: './stables.html',
  styleUrls: ['./stables.css']
})
export class StablesPage implements OnInit {
  stables: StableDTO[] = [];
  loading = true;
  error = '';
  editMode = false;
  editedNames: { [name: string]: string } = {};
  readonly averageHayPerHorseKg = 10;

  deleteMode = false;
  confirmDeleteStable: StableDTO | null = null;

  toastMessage = '';
  toastVisible = false;

  constructor(
    private stableService: StableService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStables();
  }

  loadStables(): void {
    this.loading = true;

    this.stableService.getAll().subscribe({
      next: (data) => {
        this.stables = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az istállókat.';
        this.loading = false;
      }
    });
  }

  addStable(): void {
    this.router.navigate(['/stables/new']);
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;

    if (this.editMode) {
      this.editedNames = this.stables.reduce((acc, s) => {
        acc[s.stableName] = s.stableName;
        return acc;
      }, {} as { [name: string]: string });
    }
  }

  saveName(stable: StableDTO): void {
    const newName = this.editedNames[stable.stableName];

    if (!newName || newName.trim() === '') return;

    if (!stable.stableId) {
      this.error = 'Hiányzik az istálló azonosítója (id)';
      return;
    }

    const dto: Partial<StableDTO> = { stableName: newName };

    this.stableService.update(stable.stableId, dto).subscribe({
      next: () => {
        stable.stableName = newName;
        this.editMode = false;
      },
      error: () => {
        this.error = 'Nem sikerült módosítani az istálló nevét.';
      }
    });
  }

  cancelEdit(): void {
    this.editMode = false;
  }

  deleteStable(): void {
    this.deleteMode = !this.deleteMode;
    this.confirmDeleteStable = null;
  }

  confirmDelete(stable: StableDTO) {
    this.confirmDeleteStable = stable;
  }

  performDelete() {
    if (!this.confirmDeleteStable) return;

    this.stableService.delete(this.confirmDeleteStable.stableId!).subscribe({
      next: () => {
        this.showToast(`A(z) ${this.confirmDeleteStable!.stableName} sikeresen törölve.`);

        this.loadStables();

        this.confirmDeleteStable = null;
        this.deleteMode = false;
      },
      error: () => {
        this.showToast('Nem sikerült törölni az istállót.');
        this.confirmDeleteStable = null;
        this.deleteMode = false;
      }
    });
  }

  cancelDelete() {
    this.confirmDeleteStable = null;
  }

  showToast(message: string) {
    this.toastMessage = message;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  get totalHorseCount(): number {
    return this.stables.reduce((sum, stable) => {
      return sum + (stable.horses ? stable.horses.length : 0);
    }, 0);
  }

  get totalDailyHayKg(): number {
    return this.stables.reduce((sum, stable) => {
      const horseCount = stable.horses ? stable.horses.length : 0;
      return sum + horseCount * this.averageHayPerHorseKg;
    }, 0);
  }

  get crudActions() {
    return [
      { label: 'Hozzáadás', icon: 'add', onClick: () => this.addStable() },
      { label: 'Szerkesztés', icon: 'edit', onClick: () => this.toggleEditMode() },
      { label: 'Törlés', icon: 'delete', onClick: () => this.deleteStable() }
    ];
  }
}
